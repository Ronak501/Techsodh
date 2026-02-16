"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"

type Message = {
    role: "user" | "assistant"
    content: string
}

export default function ChatPage() {
    const params = useParams()
    const conversationId = params.id as string

    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)

    const bottomRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    useEffect(() => {
        fetch(`/api/messages?conversationId=${conversationId}`)
            .then(res => res.json())
            .then(data => setMessages(data))
    }, [conversationId])

    const sendMessage = async () => {
        if (!input.trim()) return

        const userMessage: Message = {
            role: "user",
            content: input,
        }

        setMessages((prev) => [...prev, userMessage])
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

            if (!res.ok) {
                const text = await res.text()
                console.error("Server error:", text)
                return
            }

            const data = await res.json()

            if (!data || !data.reply) {
                console.error("Invalid response:", data)
                return
            }

            const assistantMessage: Message = {
                role: "assistant",
                content: data.reply,
            }

            setMessages((prev) => [...prev, assistantMessage])
        } catch (err) {
            console.error("Chat error:", err)
        } finally {
            setLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            sendMessage()
        }
    }

    return (
        <div className="flex flex-col h-screen bg-gray-950 text-white">
            <div className="p-4 border-b border-gray-800 text-lg font-semibold">
                AI Chat
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
                    onKeyDown={handleKeyDown}
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
    )
}
