"use server";

import { callGroq, type GroqHistoryMessage } from "@/lib/chat-groq";

export async function askResearchAgent(
  history: { role: "user" | "assistant"; content: string }[],
  context: string,
  topic: string
) {
  try {
    const fullHistory: GroqHistoryMessage[] = [
      {
        role: "user",
        content: `I am researching: ${topic}. \n\nWorkspace Context: ${context}`,
      },
      ...history,
    ];

    const result = await callGroq(fullHistory);
    return { success: true, reply: result.reply };
  } catch (error) {
    console.error("Groq AI Error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    if (message.includes("GROQ_API_KEY")) {
      return { success: false, reply: "The AI service is not configured on this server. Please contact support." };
    }
    if (message.includes("fetch") || message.includes("ECONNREFUSED") || message.includes("network")) {
      return { success: false, reply: "Unable to reach the AI service. Please check your connection and try again." };
    }
    return { success: false, reply: `AI service error: ${message}` };
  }
}
