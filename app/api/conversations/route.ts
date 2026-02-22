import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { callGemini } from "../chat/route"

export async function GET() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .order("created_at", { ascending: false })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
}

export async function POST(request: Request) {
    const supabase = await createClient()
    const { message, conversationId } = await request.json()

    if (!message) {
        return NextResponse.json({ error: "Missing message" }, { status: 400 })
    }

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
    }

    // Insert user message
    await supabase.from("messages").insert([
        {
            conversation_id: currentConversationId,
            role: "user",
            content: message,
        },
    ])

    // Fetch history
    const { data: history } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", currentConversationId)
        .order("created_at", { ascending: true })

    const reply = await callGemini(history || [])

    // Save assistant reply
    await supabase.from("messages").insert([
        {
            conversation_id: currentConversationId,
            role: "assistant",
            content: reply,
        },
    ])

    return NextResponse.json({
        reply,
        conversationId: currentConversationId, // 👈 IMPORTANT
    })
}

export async function PATCH(request: Request) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, title } = await request.json()

    if (!id || !title) {
        return NextResponse.json(
            { error: "Missing id or title" },
            { status: 400 }
        )
    }

    const { error } = await supabase
        .from("conversations")
        .update({ title })
        .eq("id", id)
        .eq("user_id", user.id) // important security check

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}

