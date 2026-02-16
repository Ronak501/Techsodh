import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get("conversationId")

    if (!conversationId) {
        return NextResponse.json({ error: "conversationId required" }, { status: 400 })
    }

    const supabase = await createClient();

    const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
}

export async function POST(request: Request) {
    const { conversationId, role, content } = await request.json()

    if (!conversationId || !role || !content) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const supabase = await createClient();

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
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
}
