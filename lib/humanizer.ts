const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_API = process.env.GEMINI_API!;

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
  if (!GEMINI_API || !GEMINI_API_KEY) {
    throw new Error("Gemini is not configured");
  }

  const res = await fetch(`${GEMINI_API}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Rewrite the text below so it sounds human-written.

Requirements:
- Preserve the original meaning.
- Remove AI tells like inflated praise, repetitive transitions, vague claims, and over-explained summaries.
- Avoid em dash overuse.
- Keep markdown, lists, and code fences only if they already make sense in the source.
- Do not add commentary about what you changed.
- Return only the rewritten text.

Tone: ${toneInstruction(tone)}

Text:
${input}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.4,
      },
      system_instruction: {
        parts: [
          {
            text: "You are an expert writing editor that makes text sound human without changing its meaning.",
          },
        ],
      },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini request failed: ${errorText}`);
  }

  const data = await res.json();

  if (!data.candidates || !data.candidates.length) {
    throw new Error("Gemini returned no candidates");
  }

  const raw = String(data.candidates[0]?.content?.parts?.[0]?.text || "");

  return {
    text: normalizeHumanizedText(raw),
    promptTokens: Number(data.usageMetadata?.promptTokenCount || 0),
    completionTokens: Number(data.usageMetadata?.candidatesTokenCount || 0),
  };
}