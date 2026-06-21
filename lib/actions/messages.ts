"use server";

import { z } from "zod";
import { createClient } from "@/utils/supabase/server";

const getMessagesQuerySchema = z.object({
  conversationId: z.string().uuid(),
});

const createMessageBodySchema = z.object({
  conversationId: z.string().uuid(),
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(8000),
});

export async function getMessages(conversationId: string) {
  const parsedQuery = getMessagesQuerySchema.safeParse({ conversationId });
  if (!parsedQuery.success) {
    return { success: false, error: "Valid conversationId is required" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (conversationError || !conversation) {
    return { success: false, error: "Forbidden" };
  }

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

export async function createMessage(params: { conversationId: string; role: "user" | "assistant"; content: string }) {
  const parsedBody = createMessageBodySchema.safeParse(params);
  if (!parsedBody.success) {
    return { success: false, error: "Invalid message payload" };
  }

  const { conversationId, role, content } = parsedBody.data;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (conversationError || !conversation) {
    return { success: false, error: "Forbidden" };
  }

  const { data, error } = await supabase
    .from("messages")
    .insert([{ conversation_id: conversationId, role, content }])
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}
