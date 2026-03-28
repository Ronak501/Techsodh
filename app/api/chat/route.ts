import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/utils/supabase/server"
import {
    enforceRateLimit,
    getRequestIp,
    parseJsonSafely,
    safeJsonResponse,
} from "@/lib/api-security"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!
const GEMINI_API = process.env.GEMINI_API!

const chatRequestSchema = z.object({
    message: z.string().trim().min(1).max(4000),
    conversationId: z.string().uuid(),
})

type GeminiHistoryMessage = {
    role: "user" | "assistant"
    content: string
}

function cleanAIResponse(text: string) {
    return text
        // Remove random spaces inside words
        .replace(/([a-zA-Z])\s+([a-zA-Z])/g, (match, p1, p2) => {
            if (p1.length === 1 && p2.length === 1) return match
            return p1 + p2
        })

        // Fix headings (ensure blank line after)
        .replace(/(#{1,6} .+)(?!\n\n)/g, "$1\n\n")

        // Normalize separators
        .replace(/-{3,}/g, "\n---\n")

        // Remove excessive spaces
        .replace(/[ \t]+/g, " ")

        // Remove triple newlines
        .replace(/\n{3,}/g, "\n\n")
}

export async function callGemini(history: GeminiHistoryMessage[]) {
    if (!GEMINI_API || !GEMINI_API_KEY) {
        throw new Error("Gemini is not configured")
    }

    const formatted = history.map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
    }))

    const res = await fetch(
        `${GEMINI_API}?key=${GEMINI_API_KEY}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: formatted,
                generationConfig: {
                    temperature: 0.3,
                },
                system_instruction: {
                    parts: [
                        {
                            text: `
You are a technical documentation assistant.

Rules:
- Always use proper Markdown formatting.
- Always add a blank line after headings.
- Never split words with spaces.
- Use proper bullet formatting.
- Use proper numbered lists.
- Use triple backticks for code blocks.
- Do NOT insert random spaces inside words.
        `,
                        },
                    ],
                },
            })
        }
    )

    if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Gemini request failed: ${errorText}`)
    }

    const data = await res.json()

    // console.log("Gemini response:", JSON.stringify(data, null, 2))

    if (!data.candidates || !data.candidates.length) {
        throw new Error("Gemini returned no candidates")
    }

    const raw = data.candidates[0].content.parts[0].text
    return cleanAIResponse(raw)
}

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

    if (!GEMINI_API || !GEMINI_API_KEY) {
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