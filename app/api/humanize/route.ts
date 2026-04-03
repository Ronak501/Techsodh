import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import {
  enforceRateLimit,
  getRequestIp,
  parseJsonSafely,
  safeJsonResponse,
} from "@/lib/api-security";
import {
  consumeMonthlyTokens,
  enforceSubscriptionAndTokenAccess,
  estimateTokensFromText,
} from "@/lib/subscription-access";
import { humanizeText, type HumanizeTone } from "@/lib/humanizer";

const humanizeRequestSchema = z.object({
  text: z.string().trim().min(1).max(12000),
  tone: z.enum(["natural", "casual", "professional", "concise"]).optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return safeJsonResponse(401, "Unauthorized");
  }

  const limiter = await enforceRateLimit({
    supabase,
    scope: "humanize",
    userId: user.id,
    ip: getRequestIp(request),
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });

  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(limiter.retryAfterSeconds),
        },
      },
    );
  }

  const body = await parseJsonSafely<unknown>(request);
  if (!body) {
    return safeJsonResponse(400, "Invalid JSON body");
  }

  const parsed = humanizeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return safeJsonResponse(400, "Invalid request payload");
  }

  const { text, tone = "natural" } = parsed.data;
  const projectedTokens = estimateTokensFromText(text) + 1200;

  const access = await enforceSubscriptionAndTokenAccess(supabase, {
    userId: user.id,
    requestedTokens: projectedTokens,
    feature: "humanize",
  });

  if (!access.ok) {
    return NextResponse.json(access.payload, { status: access.status });
  }

  try {
    const result = await humanizeText(text, tone as HumanizeTone);

    try {
      await consumeMonthlyTokens(supabase, {
        userId: user.id,
        promptTokens: result.promptTokens || projectedTokens,
        completionTokens:
          result.completionTokens || estimateTokensFromText(result.text),
      });
    } catch (error) {
      console.error("Failed to record humanizer token usage", error);
    }

    return NextResponse.json({
      text: result.text,
      usage: {
        prompt_tokens: result.promptTokens || projectedTokens,
        completion_tokens:
          result.completionTokens || estimateTokensFromText(result.text),
      },
    });
  } catch (error) {
    console.error("Humanizer error:", error);
    return safeJsonResponse(
      500,
      error instanceof Error ? error.message : "Humanizer failed",
    );
  }
}