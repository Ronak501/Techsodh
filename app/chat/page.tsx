"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { toast } from "sonner";

type Conversation = {
  id: string;
  title: string;
  created_at: string;
};

export default function ChatPage() {
  const supabase = createClient();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

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

  /* ---------------- FETCH CONVERSATIONS ---------------- */
  const fetchConversations = async () => {
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
  };

  const filteredConversations = conversations.filter((conversation) =>
    conversation.title.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    // Initial conversation load for static landing shell.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchConversations();
  }, []);

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
    <div className="flex h-screen bg-background text-foreground">
      {/* ================= SIDEBAR ================= */}
      <div className="flex w-72 flex-col border-r border-border/70 bg-card/60 backdrop-blur">
        <div className="space-y-3 border-b border-border/70 p-4">
          <Link href="/dashboard">
            <button className="w-full rounded-lg border border-border/70 bg-background py-2 transition hover:bg-accent hover:text-accent-foreground">
              Dashboard
            </button>
          </Link>

          <button
            onClick={createNewConversation}
            className="w-full rounded-lg bg-primary py-2 text-primary-foreground transition hover:bg-primary/90"
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
              className="border-b border-border/60 px-4 py-3 text-sm transition hover:bg-accent/50"
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

        {/* Center Start State */}
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center space-y-6">
            <h1 className="text-3xl font-bold">Start a New Conversation</h1>
            <p className="text-muted-foreground">
              Click &quot;New Chat&quot; to begin chatting with the AI.
            </p>

            <button
              onClick={createNewConversation}
              className="rounded-lg bg-primary px-6 py-3 text-primary-foreground transition hover:bg-primary/90"
            >
              Start Chat
            </button>

            <div ref={bottomRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
