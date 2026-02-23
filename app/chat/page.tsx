"use client"

export const dynamic = "force-dynamic"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import Link from "next/link"
import { toast } from "sonner"

type Message = {
    role: "user" | "assistant"
    content: string
}

type Conversation = {
    id: string
    title: string
    created_at: string
}

export default function ChatPage() {
    const supabase = createClient()
    const router = useRouter()

    const conversationId = null // IMPORTANT: No useSearchParams here

    const [messages, setMessages] = useState<Message[]>([])
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [userName, setUserName] = useState<string | null>(null)
    const [userEmail, setUserEmail] = useState<string | null>(null)

    const bottomRef = useRef<HTMLDivElement | null>(null)

    /* ---------------- SCROLL ---------------- */
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    /* ---------------- FETCH USER ---------------- */
    useEffect(() => {
        const getUser = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) return

            setUserName(user.user_metadata?.full_name || "User")
            setUserEmail(user.email || "")
        }

        getUser()
    }, [])

    /* ---------------- FETCH CONVERSATIONS ---------------- */
    useEffect(() => {
        fetchConversations()
    }, [])

    const fetchConversations = async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .from("conversations")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })

        if (error) {
            toast.error("Failed to load conversations")
            return
        }

        setConversations(data || [])
    }

    /* ---------------- CREATE CONVERSATION ---------------- */
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

        if (error || !data) {
            toast.error("Failed to create conversation")
            return
        }

        router.push(`/chat/${data.id}`)
    }

    return (
        <div className="flex h-screen bg-gray-950 text-white">
            {/* ================= SIDEBAR ================= */}
            <div className="w-72 border-r border-gray-800 flex flex-col">
                <div className="p-4 border-b border-gray-800 space-y-3">
                    <Link href="/dashboard">
                        <button className="w-full bg-gray-800 py-2 rounded-lg hover:bg-gray-700">
                            Dashboard
                        </button>
                    </Link>

                    <button
                        onClick={createNewConversation}
                        className="w-full bg-blue-600 py-2 rounded-lg hover:bg-blue-700"
                    >
                        New Chat
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {conversations.map((conv) => (
                        <div
                            key={conv.id}
                            className="px-4 py-3 text-sm border-b border-gray-800 hover:bg-gray-800"
                        >
                            <Link href={`/chat/${conv.id}`} className="flex-1">
                                {conv.title}
                            </Link>
                        </div>
                    ))}
                </div>

                {/* USER INFO */}
                <div className="p-4 border-t border-gray-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
                        {userName?.charAt(0)}
                    </div>
                    <div className="text-sm">
                        <p className="font-semibold">{userName}</p>
                        <p className="text-gray-400 text-xs">{userEmail}</p>
                    </div>
                </div>
            </div>

            {/* ================= MAIN CHAT ================= */}
            <div className="flex flex-col flex-1">
                <div className="p-4 border-b border-gray-800 font-semibold">
                    AI Chat Assistant
                </div>

                {/* Center Start State */}
                <div className="flex flex-1 items-center justify-center">
                    <div className="text-center space-y-6">
                        <h1 className="text-3xl font-bold">Start a New Conversation</h1>
                        <p className="text-gray-400">
                            Click "New Chat" to begin chatting with the AI.
                        </p>

                        <button
                            onClick={createNewConversation}
                            className="bg-blue-600 px-6 py-3 rounded-lg hover:bg-blue-700"
                        >
                            Start Chat
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}