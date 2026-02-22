"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import Link from "next/link"
import { toast } from "sonner"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
)

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
    const params = useParams()
    const router = useRouter()
    const conversationId = params.id as string

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
            const { data: { user } } = await supabase.auth.getUser()

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
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .from("conversations")
            .select("*")
            .eq("user_id", user.id)   // 🔥 VERY IMPORTANT
            .order("created_at", { ascending: false })

        if (error) {
            toast.error("Failed to load conversations")
            return
        }

        setConversations(data || [])
    }

    /* ---------------- CREATE CONVERSATION ---------------- */
    const createNewConversation = async () => {
        const { data: { user } } = await supabase.auth.getUser()
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

    /* ---------------- RENAME CONVERSATION ---------------- */
    const renameConversation = async (id: string, currentTitle: string) => {
        const newTitle = prompt("Enter new title:", currentTitle)
        if (!newTitle) return

        const { error } = await supabase
            .from("conversations")
            .update({ title: newTitle })
            .eq("id", id)

        if (error) {
            toast.error("Rename failed")
            return
        }

        toast.success("Conversation renamed")
        fetchConversations()
    }

    /* ---------------- FETCH MESSAGES ---------------- */
    useEffect(() => {
        if (!conversationId) return

        fetch(`/api/messages?conversationId=${conversationId}`)
            .then(res => res.json())
            .then(data => setMessages(data || []))
    }, [conversationId])

    /* ---------------- SEND MESSAGE ---------------- */
    const sendMessage = async () => {
        if (!input.trim()) return

        const userMessage: Message = {
            role: "user",
            content: input,
        }

        setMessages(prev => [...prev, userMessage])
        setInput("")
        setLoading(true)

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: input,
                    conversationId,
                }),
            })

            const data = await res.json()

            const assistantMessage: Message = {
                role: "assistant",
                content: data.reply,
            }

            setMessages(prev => [...prev, assistantMessage])
        } catch (err) {
            console.error("Chat error:", err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex h-screen bg-gray-950 text-white">

            {/* ================= SIDEBAR ================= */}
            <div className="w-72 border-r border-gray-800 flex flex-col">

                <div className="p-4 border-b border-gray-800">
                    <button
                        onClick={createNewConversation}
                        className="w-full bg-blue-600 py-2 rounded-lg hover:bg-blue-700"
                    >
                        + New Chat
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {conversations.map((conv) => (
                        <div
                            key={conv.id}
                            className={`px-4 py-3 text-sm border-b border-gray-800 hover:bg-gray-800 flex justify-between items-center ${conv.id === conversationId ? "bg-gray-800" : ""
                                }`}
                        >
                            <Link href={`/chat/${conv.id}`} className="flex-1">
                                {conv.title}
                            </Link>

                            <button
                                onClick={() => renameConversation(conv.id, conv.title)}
                                className="text-xs text-blue-400 hover:text-blue-300"
                            >
                                Rename
                            </button>
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

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`max-w-xl px-4 py-3 rounded-lg ${msg.role === "user"
                                    ? "ml-auto bg-blue-600"
                                    : "bg-gray-800"
                                }`}
                        >
                            {msg.content}
                        </div>
                    ))}

                    {loading && (
                        <div className="bg-gray-800 px-4 py-3 rounded-lg max-w-xl">
                            Thinking...
                        </div>
                    )}

                    <div ref={bottomRef} />
                </div>

                <div className="p-4 border-t border-gray-800 flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        placeholder="Type your message..."
                        className="flex-1 bg-gray-800 px-4 py-2 rounded-lg outline-none"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={loading}
                        className="bg-blue-600 px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    )
}