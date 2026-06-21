export type GroqHistoryMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type GroqChatResult = {
  reply: string;
  promptTokens: number;
  completionTokens: number;
};

const GROQ_API_KEY = process.env.GROQ_API_KEY!;
const GROQ_API_URL = process.env.GROQ_API!;

function cleanAIResponse(text: string) {
  return text
    // Fix headings (ensure blank line after)
    .replace(/(#{1,6} .+)(?!\n\n)/g, "$1\n\n")
    // Normalize separators
    .replace(/-{3,}/g, "\n---\n")
    // Remove triple newlines
    .replace(/\n{3,}/g, "\n\n");
}

export async function callGroq(
  history: GroqHistoryMessage[]
): Promise<GroqChatResult> {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured in .env");
  }

  const systemPrompt = `You are a technical documentation assistant.

Rules:
- Keep your responses brief and conversational for simple greetings (like "hello", "hi").
- Always use proper Markdown formatting.
- Always add a blank line after headings.
- Use proper bullet formatting and numbered lists.
- Use triple backticks for code blocks.`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...history,
  ];

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: messages,
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Groq request failed: ${errorText}`);
  }

  const data = await res.json();

  if (!data.choices || !data.choices.length) {
    throw new Error("Groq returned no choices");
  }

  const raw = data.choices[0].message.content;
  return {
    reply: cleanAIResponse(raw),
    promptTokens: Number(data.usage?.prompt_tokens || 0),
    completionTokens: Number(data.usage?.completion_tokens || 0),
  };
}
