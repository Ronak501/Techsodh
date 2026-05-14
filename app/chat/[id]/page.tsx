"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { MobileNavDrawer } from "@/components/mobile-nav-drawer";
import { chatNavigation } from "@/lib/navigation";
import {
  ArrowRight,
  FilePenLine,
  LayoutDashboard,
  MessageSquareText,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";

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
  const [supabase] = useState(() => createClient());
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
  const quickPrompts = [
    "Summarize the last reply in 3 bullets.",
    "Rewrite this in a more professional tone.",
    "Give me the next best action.",
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
  }, [supabase]);

  const fetchConversations = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load conversations");
      return;
    }

    setConversations(data || []);
  }, [supabase]);

  useEffect(() => {
    void fetchConversations();
  }, [fetchConversations]);

  const filteredConversations = conversations.filter((conversation) =>
    conversation.title.toLowerCase().includes(search.toLowerCase()),
  );

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

    if (error || !data) {
      toast.error("Failed to create conversation");
      return;
    }

    router.push(`/chat/${data.id}`);
  };

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

    if (conversationId === id) {
      router.push("/chat");
    }

    fetchConversations();
  };

  useEffect(() => {
    if (!conversationId) return;

    fetch(`/api/messages?conversationId=${conversationId}`)
      .then((res) => res.json())
      .then((data) => setMessages(data || []));
  }, [conversationId]);

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

      if (!res.ok) {
        const errorMessage =
          typeof data?.error === "string" ? data.error : "Chat request failed";

        if (data?.upgrade_url) {
          toast.error(`${errorMessage} Upgrade at ${data.upgrade_url}`);
        } else {
          toast.error(errorMessage);
        }

        return;
      }

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
    <div className="chat-surface flex h-screen bg-background text-foreground">
      <aside className="glass-panel m-3 hidden w-80 flex-col overflow-hidden rounded-3xl lg:flex">
        <div className="space-y-3 border-b border-border/70 p-4">
          <Link href="/dashboard">
            <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/70 bg-background py-2 transition hover:bg-accent hover:text-accent-foreground">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </button>
          </Link>

          <button
            onClick={createNewConversation}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2 text-primary-foreground transition hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </button>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations"
              className="w-full rounded-xl border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conv) => (
            <div
              key={conv.id}
              className={`flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3 text-sm transition hover:bg-accent/35 ${
                conv.id === conversationId ? "bg-accent/55" : ""
              }`}
            >
              <Link
                href={`/chat/${conv.id}`}
                className="min-w-0 flex-1 truncate"
              >
                {conv.title}
              </Link>

              <div className="flex shrink-0 gap-2">
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

        <div className="flex items-center gap-3 border-t border-border/70 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
            {userName?.charAt(0)}
          </div>
          <div className="text-sm">
            <p className="font-semibold">{userName}</p>
            <p className="text-xs text-muted-foreground">{userEmail}</p>
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col p-3 lg:p-4">
        <div className="glass-panel rise-in flex h-full flex-col rounded-3xl">
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Chat Session
              </p>
              <h1 className="text-lg font-semibold">AI Chat Assistant</h1>
            </div>
            <div className="flex items-center gap-2">
              <MobileNavDrawer title="Chat Navigation" items={chatNavigation} />
              <Button
                asChild
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex gap-2"
              >
                <Link href="/humanizer">
                  <FilePenLine className="h-4 w-4" />
                  Humanizer
                </Link>
              </Button>
              <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs uppercase tracking-[0.16em] text-primary">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                3D mode
              </span>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <article
                  className={`w-full max-w-[92%] rounded-3xl border px-5 py-4 shadow-sm sm:max-w-[84%] ${
                    msg.role === "user"
                      ? "border-primary/20 bg-linear-to-br from-primary to-primary/85 text-primary-foreground"
                      : "glass-panel border-border/70 bg-card/80"
                  }`}
                >
                  <div
                    className={`mb-4 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.16em] ${
                      msg.role === "user"
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold ${
                          msg.role === "user"
                            ? "bg-primary-foreground/15 text-primary-foreground"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {msg.role === "user" ? "You" : "AI"}
                      </span>
                      {msg.role === "user" ? "Message" : "Assistant"}
                    </span>
                    <span>{msg.role === "user" ? "Draft" : "Reply"}</span>
                  </div>

                  <div className="prose max-w-none dark:prose-invert prose-headings:text-foreground prose-headings:break-keep prose-headings:whitespace-normal prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-pre:bg-muted prose-code:text-foreground">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight, rehypeRaw]}
                      components={{
                        h1: ({ ...props }) => (
                          <h1
                            className="mb-4 mt-6 text-3xl font-bold"
                            {...props}
                          />
                        ),
                        h2: ({ ...props }) => (
                          <h2
                            className="mb-3 mt-5 text-2xl font-semibold"
                            {...props}
                          />
                        ),
                        h3: ({ ...props }) => (
                          <h3
                            className="mb-2 mt-4 text-xl font-semibold"
                            {...props}
                          />
                        ),
                        p: ({ ...props }) => (
                          <p
                            className="mb-3 leading-relaxed wrap-break-word"
                            {...props}
                          />
                        ),
                        ul: ({ ...props }) => (
                          <ul className="mb-3 list-disc pl-6" {...props} />
                        ),
                        ol: ({ ...props }) => (
                          <ol className="mb-3 list-decimal pl-6" {...props} />
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
                </article>
              </div>
            ))}

            {loading && (
              <div className="glass-panel max-w-xl rounded-lg border border-border/70 px-4 py-3 text-muted-foreground">
                Thinking...
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="border-t border-border/70 bg-background/75 p-4 backdrop-blur">
            <div className="mb-3 flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <Button
                  key={prompt}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setInput(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>

            <div className="rounded-3xl border border-border/70 bg-card/80 p-3 shadow-sm">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 rounded-2xl border border-input bg-background px-4 py-3 outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
                />
                <button
                  onClick={sendMessage}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
                >
                  Send
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Press Enter to send. Use quick prompts to speed up common
                follow-up questions.
              </p>
            </div>

            <div className="mt-3 lg:hidden">
              <Button asChild size="sm" variant="outline" className="w-full">
                <Link href="/chat" className="gap-2">
                  <MessageSquareText className="h-4 w-4" />
                  Open Conversation List
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
