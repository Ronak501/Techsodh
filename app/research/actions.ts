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
    return { success: false, reply: "I'm sorry, I encountered an error connecting to the Groq AI service." };
  }
}
