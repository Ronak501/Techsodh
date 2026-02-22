import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!
const GEMINI_API = process.env.GEMINI_API!

export async function callGemini(history: any[]) {
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
    const supabase = await createClient()

    const { message, conversationId } = await request.json()

    if (!message || !conversationId) {
        return NextResponse.json({ error: "Missing data" }, { status: 400 })
    }

    // Verify conversation ownership
    // Get logged-in user
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify conversation belongs to user
    const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .select("id")
        .eq("id", conversationId)
        .eq("user_id", user.id)   
        .single()

    if (convError || !conversation) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
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
        return NextResponse.json({ error: insertError.message }, { status: 500 })
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
        return NextResponse.json(
            { error: "AI returned empty response" },
            { status: 500 }
        )
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