export type GeminiHistoryMessage = {
  role: "user" | "assistant"
  content: string
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!
const GEMINI_API = process.env.GEMINI_API!

function cleanAIResponse(text: string) {
  return text
    // Remove random spaces inside words
    .replace(/([a-zA-Z])\s+([a-zA-Z])/g, (match, p1, p2) => {
      if (p1.length === 1 && p2.length === 1) return match
      return p1 + p2
    })

    // Fix headings (ensure blank line after)
    .replace(/(#{1,6} .+)(?!\n\n)/g, "$1\n\n")

    // Normalize separators
    .replace(/-{3,}/g, "\n---\n")

    // Remove excessive spaces
    .replace(/[ \t]+/g, " ")

    // Remove triple newlines
    .replace(/\n{3,}/g, "\n\n")
}

export async function callGemini(history: GeminiHistoryMessage[]) {
  if (!GEMINI_API || !GEMINI_API_KEY) {
    throw new Error("Gemini is not configured")
  }

  const formatted = history.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }))

  const res = await fetch(`${GEMINI_API}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: formatted,
      generationConfig: {
        temperature: 0.3,
      },
      system_instruction: {
        parts: [
          {
            text: `
You are a technical documentation assistant.

Rules:
- Always use proper Markdown formatting.
- Always add a blank line after headings.
- Never split words with spaces.
- Use proper bullet formatting.
- Use proper numbered lists.
- Use triple backticks for code blocks.
- Do NOT insert random spaces inside words.
        `,
          },
        ],
      },
    }),
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Gemini request failed: ${errorText}`)
  }

  const data = await res.json()

  if (!data.candidates || !data.candidates.length) {
    throw new Error("Gemini returned no candidates")
  }

  const raw = data.candidates[0].content.parts[0].text
  return cleanAIResponse(raw)
}
