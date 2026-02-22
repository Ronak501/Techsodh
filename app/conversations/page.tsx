"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { Plus, Pencil } from "lucide-react"
import { toast } from "sonner"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
)

type Conversation = {
    id: string
    title: string
    created_at: string
}

export default function ConversationsPage() {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const router = useRouter()

    useEffect(() => {
        fetchConversations()
    }, [])

    const fetchConversations = async () => {
        const { data, error } = await supabase
            .from("conversations")
            .select("*")
            .order("created_at", { ascending: false })

        if (error) {
            toast.error("Failed to load conversations")
            return
        }

        setConversations(data || [])
    }

    const createNewConversation = async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        const { data, error } = await supabase
            .from("conversations")
            .insert([
                {
                    user_id: user.id,
                    title: "New Chat",
                },
            ])
            .select()
            .single()

        if (error) {
            toast.error("Failed to create conversation")
            return
        }

        router.push(`/chat/${data.id}`)
    }

    const renameConversation = async (id: string, currentTitle: string) => {
        const newTitle = prompt("Enter new title:", currentTitle)
        if (!newTitle || newTitle.trim() === "") return

        const { error } = await supabase
            .from("conversations")
            .update({ title: newTitle })
            .eq("id", id)

        if (error) {
            toast.error("Rename failed: " + error.message)
            return
        }

        toast.success("Conversation renamed")

        fetchConversations()
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">Your Conversations</h1>
                <button
                    onClick={createNewConversation}
                    className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <Plus /> New Chat
                </button>
            </div>

            <div className="space-y-4">
                {conversations.map((conv) => (
                    <div
                        key={conv.id}
                        className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 flex justify-between items-center"
                    >
                        {/* LEFT SIDE */}
                        <div
                            onClick={() => router.push(`/chat/${conv.id}`)}
                            className="cursor-pointer"
                        >
                            <div className="font-semibold">{conv.title}</div>
                            <div className="text-sm text-gray-400">
                                {new Date(conv.created_at).toLocaleString()}
                            </div>
                        </div>

                        {/* RIGHT SIDE */}
                        <button
                            onClick={() => renameConversation(conv.id, conv.title)}
                            className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2"
                        >
                            <Pencil /> Rename
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
