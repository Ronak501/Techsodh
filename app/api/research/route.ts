import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/utils/supabase/server"
import {
  enforceRateLimit,
  getRequestIp,
  parseJsonSafely,
  safeJsonResponse,
} from "@/lib/api-security"
import {
  mergeSettings,
  resolveTemplate,
  runResearchPipeline,
  type ResearchMode,
} from "@/lib/research-engine"
import type { ResearchSettings, ResearchTemplate } from "@/lib/research-types"

const researchRequestSchema = z.object({
  query: z.string().trim().min(5).max(2000),
  mode: z.enum(["topic", "claim"]).default("topic"),
  template: z
    .enum(["literature_review", "technical_report", "claim_verification"])
    .optional(),
  stream: z.boolean().optional(),
  settings: z
    .object({
      output_style: z.enum(["balanced", "concise", "detailed"]),
      depth: z.enum(["standard", "deep"]),
      model_name: z.string().trim().min(1).max(100),
    })
    .optional(),
})

type ResearchRequestInput = z.infer<typeof researchRequestSchema>

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000

export async function POST(request: Request) {
  let researchId: string | null = null

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return safeJsonResponse(401, "Unauthorized")
  }

  const limiter = await enforceRateLimit({
    supabase,
    scope: "research",
    userId: user.id,
    ip: getRequestIp(request),
    limit: 20,
    windowMs: 60 * 60 * 1000,
  })

  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(limiter.retryAfterSeconds),
        },
      }
    )
  }

  const body = await parseJsonSafely<unknown>(request)
  if (!body) {
    return safeJsonResponse(400, "Invalid JSON body")
  }

  const parsed = researchRequestSchema.safeParse(body)
  if (!parsed.success) {
    return safeJsonResponse(400, "Invalid query payload")
  }

  const input = parsed.data

  async function executeResearch(
    inputData: ResearchRequestInput,
    onProgress?: (step: string, detail: string, data?: unknown) => void
  ) {
    const { query, mode, template: explicitTemplate, settings: explicitSettings } =
      inputData

    const { data: pref } = await supabase
      .from("research_user_preferences")
      .select("preferred_template, output_style, depth, model_name")
      .eq("user_id", user.id)
      .maybeSingle()

    const settings: ResearchSettings = mergeSettings(
      pref,
      explicitSettings as Partial<ResearchSettings> | undefined
    )

    const template: ResearchTemplate = resolveTemplate(
      mode as ResearchMode,
      explicitTemplate as ResearchTemplate | undefined,
      pref?.preferred_template as ResearchTemplate | undefined
    )

    onProgress?.("start", "Input accepted", {
      mode,
      template,
      settings,
    })

    const cacheKey = [
      query.toLowerCase().replace(/\s+/g, " ").trim(),
      mode,
      template,
      settings.output_style,
      settings.depth,
      settings.model_name,
    ].join("::")

    const nowIso = new Date().toISOString()

    const { data: cached } = await supabase
      .from("research_query_cache")
      .select("report_payload")
      .eq("user_id", user.id)
      .eq("cache_key", cacheKey)
      .eq("mode", mode)
      .eq("template", template)
      .eq("output_style", settings.output_style)
      .eq("depth", settings.depth)
      .eq("model_name", settings.model_name)
      .gt("expires_at", nowIso)
      .maybeSingle()

    if (cached?.report_payload) {
      const payload = cached.report_payload as {
        outline: unknown
        report: unknown
        usage?: {
          prompt_tokens?: number
          completion_tokens?: number
          estimated_cost_usd?: number
        }
      }

      const { data: cachedReport } = await supabase
        .from("research_reports")
        .insert([
          {
            user_id: user.id,
            query,
            status: "completed",
            research_mode: mode,
            template,
            output_style: settings.output_style,
            depth: settings.depth,
            model_name: settings.model_name,
            outline: payload.outline,
            report: payload.report,
            prompt_tokens: Number(payload.usage?.prompt_tokens || 0),
            completion_tokens: Number(payload.usage?.completion_tokens || 0),
            estimated_cost_usd: Number(payload.usage?.estimated_cost_usd || 0),
            source_count: Array.isArray((payload.report as { references?: unknown[] })?.references)
              ? ((payload.report as { references?: unknown[] }).references?.length || 0)
              : 0,
            from_cache: true,
            cache_key: cacheKey,
            started_at: nowIso,
            finished_at: nowIso,
            latency_ms: 0,
          },
        ])
        .select("id")
        .single()

      return {
        id: cachedReport?.id,
        research_topic: query,
        research_mode: mode,
        template,
        settings,
        outline: payload.outline,
        report: payload.report,
        usage: payload.usage || {
          prompt_tokens: 0,
          completion_tokens: 0,
          estimated_cost_usd: 0,
        },
        cached: true,
      }
    }

    const startedAt = Date.now()

    const { data: createdReport, error: createError } = await supabase
      .from("research_reports")
      .insert([
        {
          user_id: user.id,
          query,
          status: "in_progress",
          research_mode: mode,
          template,
          output_style: settings.output_style,
          depth: settings.depth,
          model_name: settings.model_name,
          started_at: new Date(startedAt).toISOString(),
          cache_key: cacheKey,
        },
      ])
      .select("id")
      .single()

    if (createError || !createdReport) {
      throw new Error("Failed to create research job")
    }

    researchId = createdReport.id

    const pipeline = await runResearchPipeline(
      {
        query,
        mode: mode as ResearchMode,
        template,
        settings,
      },
      (step, detail) => onProgress?.(step, detail)
    )

    const latencyMs = Date.now() - startedAt

    const { error: updateError } = await supabase
      .from("research_reports")
      .update({
        status: "completed",
        outline: pipeline.outline,
        report: pipeline.report,
        prompt_tokens: pipeline.usage.prompt_tokens,
        completion_tokens: pipeline.usage.completion_tokens,
        estimated_cost_usd: pipeline.usage.estimated_cost_usd,
        source_count: Array.isArray(pipeline.report.references)
          ? pipeline.report.references.length
          : 0,
        finished_at: new Date().toISOString(),
        latency_ms: latencyMs,
      })
      .eq("id", researchId)
      .eq("user_id", user.id)

    if (updateError) {
      throw new Error("Failed to persist research result")
    }

    await supabase.from("research_query_cache").upsert(
      {
        user_id: user.id,
        cache_key: cacheKey,
        mode,
        template,
        output_style: settings.output_style,
        depth: settings.depth,
        model_name: settings.model_name,
        report_payload: {
          outline: pipeline.outline,
          report: pipeline.report,
          usage: pipeline.usage,
        },
        source_report_id: researchId,
        expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
      },
      {
        onConflict:
          "user_id,cache_key,mode,template,output_style,depth,model_name",
      }
    )

    const thresholdLatencyMs = Number(
      process.env.RESEARCH_ALERT_LATENCY_MS || 20000
    )
    const thresholdCost = Number(process.env.RESEARCH_ALERT_COST_USD || 0.15)

    if (latencyMs > thresholdLatencyMs) {
      console.warn("Research latency threshold exceeded", {
        latencyMs,
        thresholdLatencyMs,
        reportId: researchId,
      })
    }

    if (pipeline.usage.estimated_cost_usd > thresholdCost) {
      console.warn("Research cost threshold exceeded", {
        estimatedCost: pipeline.usage.estimated_cost_usd,
        thresholdCost,
        reportId: researchId,
      })
    }

    return {
      id: researchId,
      research_topic: query,
      research_mode: mode,
      template,
      settings,
      outline: pipeline.outline,
      report: pipeline.report,
      usage: pipeline.usage,
      cached: false,
    }
  }

  if (!input.stream) {
    try {
      return NextResponse.json(await executeResearch(input))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unexpected error"

      if (researchId) {
        await supabase
          .from("research_reports")
          .update({
            status: "failed",
            error_message: message,
            finished_at: new Date().toISOString(),
            last_error: message,
          })
          .eq("id", researchId)
          .eq("user_id", user.id)
      }

      console.error(err)
      return safeJsonResponse(500, message)
    }
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const pushEvent = (event: string, payload: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`)
        )
      }

      try {
        const result = await executeResearch(input, (step, detail, data) => {
          pushEvent("progress", { step, detail, data })
        })

        pushEvent("complete", result)
        controller.close()
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unexpected error"

        if (researchId) {
          await supabase
            .from("research_reports")
            .update({
              status: "failed",
              error_message: message,
              finished_at: new Date().toISOString(),
              last_error: message,
            })
            .eq("id", researchId)
            .eq("user_id", user.id)
        }

        console.error(err)
        pushEvent("error", { message })
        controller.close()
      }
    },
  })

  return new NextResponse(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}