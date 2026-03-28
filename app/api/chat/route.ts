import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/utils/supabase/server"
import { callGemini } from "@/lib/chat-gemini"
import {
    enforceRateLimit,
    getRequestIp,
    parseJsonSafely,
    safeJsonResponse,
} from "@/lib/api-security"

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

    if (!process.env.GEMINI_API || !process.env.GEMINI_API_KEY) {
        return safeJsonResponse(500, "AI service is not configured")
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

    // Insert user message (NOW RLS WILL PASS)
    const { error: insertError } = await supabase
        .from("messages")
        .insert([
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

    // Fetch history
    const { data: history } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })

    const safeHistory =
        history && history.length > 0
            ? history
            : [{ role: "user", content: message }]

    // Call Gemini
    const reply = await callGemini(safeHistory)

    if (!reply) {
        return safeJsonResponse(500, "AI returned empty response")
    }

    // Save assistant reply
    await supabase.from("messages").insert([
        {
            conversation_id: conversationId,
            role: "assistant",
            content: reply,
        },
    ])

    return NextResponse.json({ reply })
}