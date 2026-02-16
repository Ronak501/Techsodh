import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!
const GEMINI_API = process.env.GEMINI_API!

async function callGemini(history: any[]) {
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
            }),
        }
    )

    const data = await res.json()

    console.log("Gemini response:", JSON.stringify(data, null, 2))

    if (!data.candidates || !data.candidates.length) {
        throw new Error("Gemini returned no candidates")
    }

    return data.candidates[0].content.parts[0].text
}


export async function POST(request: Request) {
    const { message, conversationId } = await request.json()

    if (!message || !conversationId) {
        return NextResponse.json({ error: "Missing data" }, { status: 400 })
    }

    const supabase = await createClient()

    // Insert user message
    await supabase.from("messages").insert([
        {
            conversation_id: conversationId,
            role: "user",
            content: message,
        },
    ])

    // Fetch full history
    const { data: history } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })

    // Call Gemini
    const safeHistory = (history && history.length > 0)
        ? history
        : [{ role: "user", content: message }]

    const reply = await callGemini(safeHistory)

    if (!reply) {
        return NextResponse.json({ error: "AI returned empty response" }, { status: 500 })
    }

    // Save assistant message
    await supabase.from("messages").insert([
        {
            conversation_id: conversationId,
            role: "assistant",
            content: reply,
        },
    ])

    return NextResponse.json({ reply })
}
