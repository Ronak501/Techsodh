"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import Link from "next/link"
import { toast } from "sonner"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import rehypeRaw from "rehype-raw"
import { Plus, MessageSquare, Settings, LogOut, Send, Sparkles, ChevronRight, Trash2, Edit2 } from "lucide-react"

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
            .eq("user_id", user.id)   // VERY IMPORTANT
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

    /* ---------------- DELETE CONVERSATION ---------------- */
    const deleteConversation = async (id: string) => {
        const confirmDelete = confirm("Are you sure you want to delete this conversation?")
        if (!confirmDelete) return

        const { error } = await supabase
            .from("conversations")
            .delete()
            .eq("id", id)

        if (error) {
            toast.error("Failed to delete conversation")
            return
        }

        toast.success("Conversation deleted")

        // If deleted conversation is currently open → redirect
        if (conversationId === id) {
            router.push("/chat")
        }

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

                <div className="p-4 border-b border-gray-800 space-y-3">

                    {/* Dashboard Button */}
                    <Link href="/dashboard">
                        <button className="w-full bg-gray-800 py-2 rounded-lg hover:bg-gray-700">
                            Dashboard
                        </button>
                    </Link>

                    {/* New Chat Button */}
                    <button
                        onClick={createNewConversation}
                        className="mt-2     w-full bg-blue-600 py-2 rounded-lg hover:bg-blue-700"
                    >
                        New Chat
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

                            <div className="flex gap-2">
                                <button
                                    onClick={() => renameConversation(conv.id, conv.title)}
                                    className="text-xs text-blue-400 hover:text-blue-300"
                                >
                                    Rename
                                </button>

                                <button
                                    onClick={() => deleteConversation(conv.id)}
                                    className="text-xs text-red-400 hover:text-red-300"
                                >
                                    Delete
                                </button>
                            </div>
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
                            className={`max-w-3xl rounded-xl px-6 py-4 shadow-md ${msg.role === "user"
                                ? "ml-auto bg-blue-600 text-white"
                                : "bg-gray-800"
                                }`}
                        >
                            <div className="prose prose-invert max-w-none">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[rehypeHighlight, rehypeRaw]}
                                    components={{
                                        h1: ({ node, ...props }) => (
                                            <h1 className="text-3xl font-bold mt-6 mb-4" {...props} />
                                        ),
                                        h2: ({ node, ...props }) => (
                                            <h2 className="text-2xl font-semibold mt-5 mb-3" {...props} />
                                        ),
                                        h3: ({ node, ...props }) => (
                                            <h3 className="text-xl font-semibold mt-4 mb-2" {...props} />
                                        ),
                                        p: ({ node, ...props }) => (
                                            <p className="mb-3 leading-relaxed" {...props} />
                                        ),
                                        ul: ({ node, ...props }) => (
                                            <ul className="list-disc pl-6 mb-3" {...props} />
                                        ),
                                        ol: ({ node, ...props }) => (
                                            <ol className="list-decimal pl-6 mb-3" {...props} />
                                        ),
                                        code(props) {
                                            const { children, className } = props
                                            const isInline = !className

                                            if (isInline) {
                                                return (
                                                    <code className="bg-gray-700 px-1 py-0.5 rounded text-sm">
                                                        {children}
                                                    </code>
                                                )
                                            }

                                            return (
                                                <pre className="bg-black p-4 rounded-lg overflow-x-auto mb-4">
                                                    <code className={className}>
                                                        {children}
                                                    </code>
                                                </pre>
                                            )
                                        }
                                    }}
                                >
                                    {msg.content}
                                </ReactMarkdown>
                            </div>
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