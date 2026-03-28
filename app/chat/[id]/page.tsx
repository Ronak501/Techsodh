"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Conversation = {
  id: string;
  title: string;
  created_at: string;
};

export default function ChatPage() {
  const supabase = createClient();
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const bottomRef = useRef<HTMLDivElement | null>(null);

  /* ---------------- SCROLL ---------------- */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ---------------- FETCH USER ---------------- */
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setUserName(user.user_metadata?.full_name || "User");
      setUserEmail(user.email || "");
    };

    getUser();
  }, []);

  const fetchConversations = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", user.id) // VERY IMPORTANT
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load conversations");
      return;
    }

    setConversations(data || []);
  };

  /* ---------------- FETCH CONVERSATIONS ---------------- */
  useEffect(() => {
    fetchConversations();
  }, []);

  const filteredConversations = conversations.filter((conversation) =>
    conversation.title.toLowerCase().includes(search.toLowerCase()),
  );

  /* ---------------- CREATE CONVERSATION ---------------- */
  const createNewConversation = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("conversations")
      .insert([
        {
          user_id: user.id,
          title: "New Chat",
        },
      ])
      .select()
      .single();

    if (error) {
      toast.error("Failed to create conversation");
      return;
    }

    router.push(`/chat/${data.id}`);
  };

  /* ---------------- RENAME CONVERSATION ---------------- */
  const renameConversation = async (id: string, currentTitle: string) => {
    const newTitle = prompt("Enter new title:", currentTitle)?.trim();
    if (!newTitle) return;

    const response = await fetch("/api/conversations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, title: newTitle }),
    });

    if (!response.ok) {
      toast.error("Rename failed");
      return;
    }

    toast.success("Conversation renamed");
    fetchConversations();
  };

  /* ---------------- DELETE CONVERSATION ---------------- */
  const deleteConversation = async (id: string) => {
    const confirmDelete = confirm(
      "Are you sure you want to delete this conversation?",
    );
    if (!confirmDelete) return;

    const response = await fetch("/api/conversations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      toast.error("Failed to delete conversation");
      return;
    }

    toast.success("Conversation deleted");

    // If deleted conversation is currently open → redirect
    if (conversationId === id) {
      router.push("/chat");
    }

    fetchConversations();
  };

  /* ---------------- FETCH MESSAGES ---------------- */
  useEffect(() => {
    if (!conversationId) return;

    fetch(`/api/messages?conversationId=${conversationId}`)
      .then((res) => res.json())
      .then((data) => setMessages(data || []));
  }, [conversationId]);

  /* ---------------- SEND MESSAGE ---------------- */
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          conversationId,
        }),
      });

      const data = await res.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.reply,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* ================= SIDEBAR ================= */}
      <div className="flex w-72 flex-col border-r border-border/70 bg-card/60 backdrop-blur">
        <div className="space-y-3 border-b border-border/70 p-4">
          {/* Dashboard Button */}
          <Link href="/dashboard">
            <button className="w-full rounded-lg border border-border/70 bg-background py-2 transition hover:bg-accent hover:text-accent-foreground">
              Dashboard
            </button>
          </Link>

          {/* New Chat Button */}
          <button
            onClick={createNewConversation}
            className="mt-2 w-full rounded-lg bg-primary py-2 text-primary-foreground transition hover:bg-primary/90"
          >
            New Chat
          </button>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conv) => (
            <div
              key={conv.id}
              className={`flex items-center justify-between border-b border-border/60 px-4 py-3 text-sm transition hover:bg-accent/50 ${
                conv.id === conversationId ? "bg-accent/70" : ""
              }`}
            >
              <Link href={`/chat/${conv.id}`} className="flex-1">
                {conv.title}
              </Link>

              <div className="flex gap-2">
                <button
                  onClick={() => renameConversation(conv.id, conv.title)}
                  className="text-xs text-primary hover:text-primary/80"
                >
                  Rename
                </button>

                <button
                  onClick={() => deleteConversation(conv.id)}
                  className="text-xs text-destructive hover:text-destructive/80"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {filteredConversations.length === 0 ? (
            <div className="px-4 py-6 text-sm text-muted-foreground">
              No matching conversations
            </div>
          ) : null}
        </div>

        {/* USER INFO */}
        <div className="flex items-center gap-3 border-t border-border/70 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
            {userName?.charAt(0)}
          </div>
          <div className="text-sm">
            <p className="font-semibold">{userName}</p>
            <p className="text-xs text-muted-foreground">{userEmail}</p>
          </div>
        </div>
      </div>

      {/* ================= MAIN CHAT ================= */}
      <div className="flex flex-col flex-1">
        <div className="border-b border-border/70 bg-card/60 p-4 font-semibold backdrop-blur">
          AI Chat Assistant
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`max-w-3xl rounded-xl px-6 py-4 shadow-md ${
                msg.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "border border-border/70 bg-card"
              }`}
            >
              <div className="prose max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-pre:bg-muted prose-code:text-foreground">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight, rehypeRaw]}
                  components={{
                    h1: ({ ...props }) => (
                      <h1 className="text-3xl font-bold mt-6 mb-4" {...props} />
                    ),
                    h2: ({ ...props }) => (
                      <h2
                        className="text-2xl font-semibold mt-5 mb-3"
                        {...props}
                      />
                    ),
                    h3: ({ ...props }) => (
                      <h3
                        className="text-xl font-semibold mt-4 mb-2"
                        {...props}
                      />
                    ),
                    p: ({ ...props }) => (
                      <p className="mb-3 leading-relaxed" {...props} />
                    ),
                    ul: ({ ...props }) => (
                      <ul className="list-disc pl-6 mb-3" {...props} />
                    ),
                    ol: ({ ...props }) => (
                      <ol className="list-decimal pl-6 mb-3" {...props} />
                    ),
                    code(props) {
                      const { children, className } = props;
                      const isInline = !className;

                      if (isInline) {
                        return (
                          <code className="rounded bg-muted px-1 py-0.5 text-sm text-foreground">
                            {children}
                          </code>
                        );
                      }

                      return (
                        <pre className="mb-4 overflow-x-auto rounded-lg border border-border/70 bg-muted p-4">
                          <code className={className}>{children}</code>
                        </pre>
                      );
                    },
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}

          {loading && (
            <div className="max-w-xl rounded-lg border border-border/70 bg-card px-4 py-3 text-muted-foreground">
              Thinking...
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="flex gap-2 border-t border-border/70 bg-card/60 p-4 backdrop-blur">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 rounded-lg border border-input bg-background px-4 py-2 outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="rounded-lg bg-primary px-6 py-2 text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
