import { NextResponse } from "next/server"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!
const GEMINI_API = process.env.GEMINI_API!

export async function POST(request: Request) {

  async function callGemini(prompt: string) {
    const res = await fetch(`${GEMINI_API}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Gemini API Error:", errorText);
      throw new Error("Gemini API failed");
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("Invalid Gemini response");
    }

    return text;
  }

  // STEP 1 — Generate Research Outline
  async function generateOutline(query: string) {
    return await callGemini(`
      You are an AI Research Planner.

      Create a structured research outline for this topic.

      Return JSON only:
      {
        "title": string,
        "sections": [
          { "heading": string, "description": string }
        ]
      }

      Topic:
      "${query}"
      `)
  }

  // STEP 2 — Generate Full Research Paper
  async function generateResearchPaper(query: string, outline: any) {
    return await callGemini(`
      You are an advanced AI Research Analyst.

      Research Topic:
      "${query}"

      Research Outline:
      ${JSON.stringify(outline)}

      Generate a detailed research-style report.

      Return JSON only:
      {
        "executive_summary": string,
        "introduction": string,
        "main_analysis": string,
        "key_insights": array,
        "real_world_applications": array,
        "challenges": string,
        "future_scope": string,
        "conclusion": string
      }
  `)
  }

  try {
    const { query } = await request.json()

    if (!query) {
      return NextResponse.json({ error: "Query required" }, { status: 400 })
    }

    // Generate Outline
    const outlineRaw = await generateOutline(query)
    function extractJSON(text: string) {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON found in Gemini response");
      return JSON.parse(match[0]);
    }

    const outline = extractJSON(outlineRaw);

    // Generate Full Research Report
    const reportRaw = await generateResearchPaper(query, outline)
    const report = extractJSON(reportRaw)

    return NextResponse.json({
      research_topic: query,
      outline,
      report
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
