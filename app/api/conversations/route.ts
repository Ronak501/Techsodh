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

const createConversationMessageSchema = z.object({
    message: z.string().trim().min(1).max(4000),
    conversationId: z.string().uuid().optional(),
})

const renameConversationSchema = z.object({
    id: z.string().uuid(),
    title: z.string().trim().min(1).max(120),
})

const deleteConversationSchema = z.object({
    id: z.string().uuid(),
})

export async function GET() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return safeJsonResponse(401, "Unauthorized")
    }

    const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

    if (error) {
        return safeJsonResponse(500, error.message)
    }

    return NextResponse.json(data)
}

export async function POST(request: Request) {
    const supabase = await createClient()

    const body = await parseJsonSafely<unknown>(request)
    if (!body) {
        return safeJsonResponse(400, "Invalid JSON body")
    }

    const parsed = createConversationMessageSchema.safeParse(body)
    if (!parsed.success) {
        return safeJsonResponse(400, "Invalid request payload")
    }

    const { message, conversationId } = parsed.data

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return safeJsonResponse(401, "Unauthorized")
    }

    const limiter = await enforceRateLimit({
        supabase,
        scope: "conversations",
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

    let currentConversationId = conversationId

    // If no conversationId → create new conversation
    if (!currentConversationId) {
        const { data: newConversation, error } = await supabase
            .from("conversations")
            .insert([
                {
                    user_id: user.id,
                },
            ])
            .select()
            .single()

        if (error || !newConversation) {
            return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
        }

        currentConversationId = newConversation.id
    } else {
        const { data: conversation, error: conversationError } = await supabase
            .from("conversations")
            .select("id")
            .eq("id", currentConversationId)
            .eq("user_id", user.id)
            .single()

        if (conversationError || !conversation) {
            return safeJsonResponse(403, "Forbidden")
        }
    }

    // Fetch history
    const { data: history } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", currentConversationId)
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

    // Insert user message
    await supabase.from("messages").insert([
        {
            conversation_id: currentConversationId,
            role: "user",
            content: message,
        },
    ])

    const completion = await callGroq([
        ...safeHistory,
        { role: "user" as const, content: message },
    ])

    // Save assistant reply
    await supabase.from("messages").insert([
        {
            conversation_id: currentConversationId,
            role: "assistant",
            content: completion.reply,
        },
    ])

    try {
        await consumeMonthlyTokens(supabase, {
            userId: user.id,
            promptTokens: completion.promptTokens || projectedPromptTokens,
            completionTokens:
                completion.completionTokens || estimateTokensFromText(completion.reply),
        })
    } catch (error) {
        console.error("Failed to record token usage", error)
    }

    return NextResponse.json({
        reply: completion.reply,
        conversationId: currentConversationId, // 👈 IMPORTANT
    })
}

export async function PATCH(request: Request) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return safeJsonResponse(401, "Unauthorized")
    }

    const body = await parseJsonSafely<unknown>(request)
    if (!body) {
        return safeJsonResponse(400, "Invalid JSON body")
    }

    const parsed = renameConversationSchema.safeParse(body)
    if (!parsed.success) {
        return safeJsonResponse(400, "Invalid request payload")
    }

    const { id, title } = parsed.data

    const { error } = await supabase
        .from("conversations")
        .update({ title })
        .eq("id", id)
        .eq("user_id", user.id) // important security check

    if (error) {
        return safeJsonResponse(500, error.message)
    }

    return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return safeJsonResponse(401, "Unauthorized")
    }

    const body = await parseJsonSafely<unknown>(request)
    if (!body) {
        return safeJsonResponse(400, "Invalid JSON body")
    }

    const parsed = deleteConversationSchema.safeParse(body)
    if (!parsed.success) {
        return safeJsonResponse(400, "Invalid request payload")
    }

    const { id } = parsed.data

    const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)

    if (error) {
        return safeJsonResponse(500, error.message)
    }

    return NextResponse.json({ success: true })
}

