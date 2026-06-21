const GROQ_API_KEY = process.env.GROQ_API_KEY!;
const GROQ_API = process.env.GROQ_API!;

export type HumanizeTone = "natural" | "casual" | "professional" | "concise";

export type HumanizeResult = {
  text: string;
  promptTokens: number;
  completionTokens: number;
};

function normalizeHumanizedText(text: string) {
  return text
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function toneInstruction(tone: HumanizeTone) {
  switch (tone) {
    case "casual":
      return "Use a conversational tone that still sounds thoughtful and clear.";
    case "professional":
      return "Use a polished professional tone without sounding inflated or robotic.";
    case "concise":
      return "Keep it tight and direct. Remove extra words and avoid filler.";
    default:
      return "Make it sound natural, grounded, and human.";
  }
}

export async function humanizeText(
  input: string,
  tone: HumanizeTone = "natural",
): Promise<HumanizeResult> {
  if (!GROQ_API || !GROQ_API_KEY) {
    throw new Error("Groq is not configured");
  }

  const res = await fetch(GROQ_API, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are an expert writing editor that makes text sound human without changing its meaning."
        },
        {
          role: "user",
          content: `Rewrite the text below so it sounds human-written.

Requirements:
- Preserve the original meaning.
- Remove AI tells like inflated praise, repetitive transitions, vague claims, and over-explained summaries.
- Avoid em dash overuse.
- Keep markdown, lists, and code fences only if they already make sense in the source.
- Do not add commentary about what you changed.
- Return only the rewritten text.

Tone: ${toneInstruction(tone)}

Text:
${input}`
        }
      ],
      temperature: 0.4,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Groq request failed: ${errorText}`);
  }

  const data = await res.json();

  if (!data.choices || !data.choices.length) {
    throw new Error("Groq returned no candidates");
  }

  const raw = String(data.choices[0]?.message?.content || "");

  return {
    text: normalizeHumanizedText(raw),
    promptTokens: Number(data.usage?.prompt_tokens || 0),
    completionTokens: Number(data.usage?.completion_tokens || 0),
  };
}