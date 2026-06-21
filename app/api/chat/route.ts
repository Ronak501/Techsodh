import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/utils/supabase/server"
import { callGroq } from "@/lib/chat-groq"
import {
    enforceRateLimit,
    getRequestIp,
    parseJsonSafely,
    safeJsonResponse,
} from "@/lib/api-security"
import {
    consumeMonthlyTokens,
    enforceSubscriptionAndTokenAccess,
    estimateTokensFromText,
} from "@/lib/subscription-access"

const chatRequestSchema = z.object({
    message: z.string().trim().min(1).max(4000),
    conversationId: z.string().uuid(),
})

export async function POST(request: Request) {
    const body = await parseJsonSafely<unknown>(request)
    if (!body) {
        return safeJsonResponse(400, "Invalid JSON body")
    }

    const parsed = chatRequestSchema.safeParse(body)
    if (!parsed.success) {
        return safeJsonResponse(400, "Invalid request payload")
    }

    const { message, conversationId } = parsed.data

    const supabase = await createClient()

    if (!process.env.GROQ_API_KEY) {
        return NextResponse.json({ error: "AI not configured" }, { status: 500 })
    }

    // Verify conversation ownership
    const {
        data: { user },
    } = await supabase.auth.getUser()
    // console.log("User:", user)

    if (!user) {
        return safeJsonResponse(401, "Unauthorized")
    }

    const limiter = await enforceRateLimit({
        supabase,
        scope: "chat",
        userId: user.id,
        ip: getRequestIp(request),
        limit: 60,
        windowMs: 5 * 60 * 1000,
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

    // Verify conversation belongs to user
    const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .select("id")
        .eq("id", conversationId)
        .eq("user_id", user.id)   
        .single()

    if (convError || !conversation) {
        return safeJsonResponse(403, "Forbidden")
    }

    const { data: history } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })

    const safeHistory = Array.isArray(history)
        ? history.map((entry) => ({
              role: entry.role as "user" | "assistant",
              content: String(entry.content || ""),
          }))
        : []

    const projectedPromptTokens = estimateTokensFromText(
        [...safeHistory.map((entry) => entry.content), message].join("\n")
    )

    const access = await enforceSubscriptionAndTokenAccess(supabase, {
        userId: user.id,
        requestedTokens: projectedPromptTokens + 800,
        feature: "chat",
    })

    if (!access.ok) {
        return NextResponse.json(access.payload, { status: access.status })
    }

    // Insert user message after subscription and quota access checks.
    const { error: insertError } = await supabase.from("messages").insert([
        {
            conversation_id: conversationId,
            role: "user",
            content: message,
        },
    ])

    if (insertError) {
        console.error("Insert failed:", insertError)
        return safeJsonResponse(500, insertError.message)
    }

    const fullHistory = [...safeHistory, { role: "user" as const, content: message }]

    // Call Groq
    const completion = await callGroq(fullHistory)

    if (!completion.reply) {
        return safeJsonResponse(500, "AI returned empty response")
    }

    // Save assistant reply
    await supabase.from("messages").insert([
        {
            conversation_id: conversationId,
            role: "assistant",
            content: completion.reply,
        },
    ])

    try {
        await consumeMonthlyTokens(supabase, {
            userId: user.id,
            promptTokens: completion.promptTokens || projectedPromptTokens,
            completionTokens: completion.completionTokens || estimateTokensFromText(completion.reply),
        })
    } catch (error) {
        console.error("Failed to record token usage", error)
    }

    return NextResponse.json({
        reply: completion.reply,
        usage: {
            prompt_tokens: completion.promptTokens || projectedPromptTokens,
            completion_tokens:
                completion.completionTokens || estimateTokensFromText(completion.reply),
        },
    })
}