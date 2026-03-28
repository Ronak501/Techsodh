import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/utils/supabase/server"
import {
    enforceRateLimit,
    getRequestIp,
    parseJsonSafely,
    safeJsonResponse,
} from "@/lib/api-security"

const getMessagesQuerySchema = z.object({
    conversationId: z.string().uuid(),
})

const createMessageBodySchema = z.object({
    conversationId: z.string().uuid(),
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(8000),
})

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const parsedQuery = getMessagesQuerySchema.safeParse({
        conversationId: searchParams.get("conversationId"),
    })

    if (!parsedQuery.success) {
        return safeJsonResponse(400, "Valid conversationId is required")
    }

    const { conversationId } = parsedQuery.data

    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return safeJsonResponse(401, "Unauthorized")
    }

    const limiter = await enforceRateLimit({
        supabase,
        scope: "messages:get",
        userId: user.id,
        ip: getRequestIp(request),
        limit: 120,
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

    const { data: conversation, error: conversationError } = await supabase
        .from("conversations")
        .select("id")
        .eq("id", conversationId)
        .eq("user_id", user.id)
        .single()

    if (conversationError || !conversation) {
        return safeJsonResponse(403, "Forbidden")
    }

    const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })

    if (error) {
        return safeJsonResponse(500, error.message)
    }

    return NextResponse.json(data)
}

export async function POST(request: Request) {
    const body = await parseJsonSafely<unknown>(request)
    if (!body) {
        return safeJsonResponse(400, "Invalid JSON body")
    }

    const parsedBody = createMessageBodySchema.safeParse(body)
    if (!parsedBody.success) {
        return safeJsonResponse(400, "Invalid message payload")
    }

    const { conversationId, role, content } = parsedBody.data

    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return safeJsonResponse(401, "Unauthorized")
    }

    const limiter = await enforceRateLimit({
        supabase,
        scope: "messages:post",
        userId: user.id,
        ip: getRequestIp(request),
        limit: 120,
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

    const { data: conversation, error: conversationError } = await supabase
        .from("conversations")
        .select("id")
        .eq("id", conversationId)
        .eq("user_id", user.id)
        .single()

    if (conversationError || !conversation) {
        return safeJsonResponse(403, "Forbidden")
    }

    const { data, error } = await supabase
        .from("messages")
        .insert([
            {
                conversation_id: conversationId,
                role,
                content,
            },
        ])
        .select()
        .single()

    if (error) {
        return safeJsonResponse(500, error.message)
    }

    return NextResponse.json(data)
}
