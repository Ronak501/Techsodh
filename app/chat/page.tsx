"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { MobileNavDrawer } from "@/components/mobile-nav-drawer";
import {
  ArrowRight,
  LayoutDashboard,
  MessageSquareText,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";

type Conversation = {
  id: string;
  title: string;
  created_at: string;
};

export default function ChatPage() {
  const [supabase] = useState(() => createClient());
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setUserName(user.user_metadata?.full_name || "User");
      setUserEmail(user.email || "");
    };

    void getUser();
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
    const loadConversations = async () => {
      await fetchConversations();
    };

    void loadConversations();
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
    const confirmed = confirm("Delete this conversation permanently?");
    if (!confirmed) return;

    const response = await fetch("/api/conversations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      toast.error("Delete failed");
      return;
    }

    toast.success("Conversation deleted");
    fetchConversations();
  };

  return (
    <div className="chat-surface flex h-screen bg-background text-foreground">
      <aside className="glass-panel m-3 hidden w-80 flex-col overflow-hidden rounded-3xl lg:flex">
        <div className="space-y-3 border-b border-border/60 p-4">
          <div className="flex items-center justify-between gap-2">
            <Link href="/dashboard" className="w-full">
              <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/70 bg-background/80 py-2 text-sm transition hover:bg-accent hover:text-accent-foreground">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </button>
            </Link>
          </div>

          <button
            onClick={createNewConversation}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2 text-sm text-primary-foreground transition hover:bg-primary/90"
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
              className="border-b border-border/60 px-4 py-3 text-sm transition hover:bg-accent/35"
            >
              <div className="flex items-center justify-between gap-2">
                <Link href={`/chat/${conv.id}`} className="flex-1 truncate">
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
                Chat Workspace
              </p>
              <h1 className="text-lg font-semibold">AI Chat Assistant</h1>
            </div>
            <div className="flex items-center gap-2">
              <MobileNavDrawer
                title="Chat Navigation"
                items={[
                  { href: "/", label: "Home" },
                  { href: "/dashboard", label: "Dashboard" },
                  { href: "/research", label: "Research" },
                  { href: "/chat", label: "Chat" },
                ]}
              />
              <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs uppercase tracking-[0.16em] text-primary">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                3D mode
              </span>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
            <div className="w-full max-w-2xl space-y-6 text-center">
              <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-2xl bg-linear-to-br from-primary/20 to-accent/20 text-primary float-soft">
                <MessageSquareText className="h-9 w-9" />
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-balance">
                Start a new conversation with your research assistant
              </h2>
              <p className="mx-auto max-w-xl text-muted-foreground">
                Use chat to validate findings, draft responses, and refine ideas
                before exporting your final report.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  onClick={createNewConversation}
                  className="shadow-lg shadow-primary/25"
                >
                  Start Chat
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button asChild variant="outline">
                  <Link href="/research">Open Research</Link>
                </Button>
              </div>

              <div ref={bottomRef} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
