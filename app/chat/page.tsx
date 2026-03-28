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

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations"
            className="w-full bg-gray-900 px-3 py-2 rounded-lg outline-none text-sm"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conv) => (
            <div
              key={conv.id}
              className="px-4 py-3 text-sm border-b border-gray-800 hover:bg-gray-800"
            >
              <div className="flex items-center justify-between gap-2">
                <Link href={`/chat/${conv.id}`} className="flex-1 truncate">
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
            </div>
          ))}

          {filteredConversations.length === 0 ? (
            <div className="px-4 py-6 text-sm text-gray-400">
              No matching conversations
            </div>
          ) : null}
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
              Click &quot;New Chat&quot; to begin chatting with the AI.
            </p>

            <button
              onClick={createNewConversation}
              className="bg-blue-600 px-6 py-3 rounded-lg hover:bg-blue-700"
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
