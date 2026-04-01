import type {
  ClaimVerdict,
  EvidenceStrength,
  FactCheckItem,
  ResearchOutline,
  ResearchPreferences,
  ResearchReportBody,
  ResearchSettings,
  ResearchTemplate,
  ReferenceItem,
  SectionConfidence,
} from "@/lib/research-types"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!
const GEMINI_API = process.env.GEMINI_API!
const GEMINI_FALLBACK_API = process.env.GEMINI_FALLBACK_API

export type ResearchMode = "topic" | "claim"

export type ResearchPipelineInput = {
  query: string
  mode: ResearchMode
  template: ResearchTemplate
  settings: ResearchSettings
}

export type ResearchPipelineUsage = {
  prompt_tokens: number
  completion_tokens: number
  estimated_cost_usd: number
}

export type ResearchPipelineOutput = {
  outline: ResearchOutline
  report: ResearchReportBody
  usage: ResearchPipelineUsage
  cacheKey: string
}

const defaultPreferences: ResearchPreferences = {
  preferred_template: "literature_review",
  output_style: "balanced",
  depth: "standard",
  model_name: "gemini-default",
}

const RETRY_ATTEMPTS = 5
const BASE_RETRY_DELAY_MS = 600
const MAX_RETRY_DELAY_MS = 12_000

type GeminiResult = {
  text: string
  promptTokens: number
  completionTokens: number
  finishReason?: string
}

export function buildCacheKey(query: string) {
  const tokens = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2)

  const uniqueSorted = Array.from(new Set(tokens)).sort()
  return uniqueSorted.slice(0, 30).join("|")
}

export function estimateCostUsd(promptTokens: number, completionTokens: number) {
  const promptCost = promptTokens * 0.00000025
  const completionCost = completionTokens * 0.0000005
  return Number((promptCost + completionCost).toFixed(6))
}

export function mergeSettings(
  pref: Partial<ResearchPreferences> | null,
  explicitSettings?: Partial<ResearchSettings>
): ResearchSettings {
  return {
    output_style:
      explicitSettings?.output_style ||
      pref?.output_style ||
      defaultPreferences.output_style,
    depth: explicitSettings?.depth || pref?.depth || defaultPreferences.depth,
    model_name:
      explicitSettings?.model_name ||
      pref?.model_name ||
      defaultPreferences.model_name,
  }
}

export function resolveTemplate(
  mode: ResearchMode,
  explicitTemplate?: ResearchTemplate,
  prefTemplate?: ResearchTemplate
): ResearchTemplate {
  if (explicitTemplate) return explicitTemplate
  if (mode === "claim") return "claim_verification"
  return prefTemplate || defaultPreferences.preferred_template
}

function extractJSON<T>(text: string): T {
  const trimmed = text.trim().replace(/^\uFEFF/, "")

  // Check for empty or error responses
  if (!trimmed || trimmed.toLowerCase().includes("error") && !trimmed.startsWith("{")) {
    throw new Error(`Invalid response: ${trimmed.substring(0, 100)}`)
  }

  // Fast path when the whole response is already valid JSON.
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return JSON.parse(trimmed) as T
    } catch (e) {
      // Try to find balanced JSON within the text
      const candidate = findBalancedJsonCandidate(trimmed)
      if (candidate) {
        try {
          return JSON.parse(candidate) as T
        } catch {
          throw new Error(`Malformed JSON: ${e instanceof Error ? e.message : "Parse error"}`)
        }
      }
      throw new Error(`Invalid JSON at start: ${e instanceof Error ? e.message : "Parse error"}`)
    }
  }

  const fencedMatch = trimmed.match(/```(?:json|jsonc|javascript|js)?\s*([\s\S]*?)\s*```/i)
  if (fencedMatch?.[1]) {
    try {
      return JSON.parse(fencedMatch[1]) as T
    } catch {
      // Continue with balanced-bracket extraction.
    }
  }

  const labeledJsonMatch = trimmed.match(
    /(?:^|\n)\s*json\s*[:\-]?\s*([\[{][\s\S]*)$/i
  )
  if (labeledJsonMatch?.[1]) {
    const labeledCandidate = findBalancedJsonCandidate(labeledJsonMatch[1])
    if (labeledCandidate) {
      try {
        return JSON.parse(labeledCandidate) as T
      } catch {
        // Continue with generic extraction.
      }
    }
  }

  const candidate = findBalancedJsonCandidate(trimmed)
  if (!candidate) {
    throw new Error(`No JSON found in response. First 200 chars: ${trimmed.substring(0, 200)}`)
  }

  try {
    return JSON.parse(candidate) as T
  } catch (e) {
    throw new Error(`Failed to parse extracted JSON: ${e instanceof Error ? e.message : "Parse error"}`)
  }
}

function findBalancedJsonCandidate(input: string): string | null {
  for (let start = 0; start < input.length; start += 1) {
    const char = input[start]
    if (char !== "{" && char !== "[") continue

    const stack: string[] = [char]
    let inString = false
    let escape = false

    for (let i = start + 1; i < input.length; i += 1) {
      const current = input[i]

      if (inString) {
        if (escape) {
          escape = false
          continue
        }

        if (current === "\\") {
          escape = true
          continue
        }

        if (current === '"') {
          inString = false
        }

        continue
      }

      if (current === '"') {
        inString = true
        continue
      }

      if (current === "{" || current === "[") {
        stack.push(current)
        continue
      }

      if (current === "}" || current === "]") {
        const top = stack[stack.length - 1]
        const matches =
          (top === "{" && current === "}") ||
          (top === "[" && current === "]")

        if (!matches) {
          break
        }

        stack.pop()

        if (stack.length === 0) {
          return input.slice(start, i + 1)
        }
      }
    }
  }

  return null
}

async function callGeminiForJson<T>(
  prompt: string,
  settings: ResearchSettings,
  phase: string
): Promise<{ parsed: T; promptTokens: number; completionTokens: number }> {
  const attempts = 3
  let totalPromptTokens = 0
  let totalCompletionTokens = 0
  let lastError: Error | null = null
  let lastResponse = ""

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const strictPrompt =
      attempt === 1
        ? prompt
        : `${prompt}\n\nIMPORTANT: Return valid RFC8259 JSON only. Do not include markdown fences, code blocks, comments, explanations, or extra prose before/after JSON.`

    const result = await callGemini(strictPrompt, settings, {
      expectJson: true,
    })
    totalPromptTokens += result.promptTokens
    totalCompletionTokens += result.completionTokens
    lastResponse = result.text

    try {
      return {
        parsed: extractJSON<T>(result.text),
        promptTokens: totalPromptTokens,
        completionTokens: totalCompletionTokens,
      }
    } catch (error) {
      lastError =
        error instanceof Error
          ? error
          : new Error(`Failed to parse ${phase} JSON response`)

      // If the generation is truncated or malformed, ask the model to repair only the JSON.
      try {
        const repaired = await repairGeminiJson<T>(result.text, settings)
        totalPromptTokens += repaired.promptTokens
        totalCompletionTokens += repaired.completionTokens

        return {
          parsed: repaired.parsed,
          promptTokens: totalPromptTokens,
          completionTokens: totalCompletionTokens,
        }
      } catch (repairError) {
        const repairMessage =
          repairError instanceof Error
            ? repairError.message
            : "JSON repair attempt failed"
        lastError = new Error(`${lastError.message}; ${repairMessage}`)
      }
      
      const responsePreview = result.text.substring(0, 300)
      if (attempt < attempts) {
        console.warn(`Failed to parse ${phase} JSON response; retrying`, {
          attempt,
          reason: lastError.message,
          responsePreview,
          responseLength: result.text.length,
          finishReason: result.finishReason || "unknown",
        })
      }
    }
  }

  throw new Error(
    `Model returned non-JSON ${phase} response after ${attempts} attempts${
      lastError?.message ? `: ${lastError.message}` : ""
    }\nResponse preview: ${lastResponse.substring(0, 500)}${lastResponse.length > 500 ? "..." : ""}`
  )
}

async function repairGeminiJson<T>(
  brokenJson: string,
  settings: ResearchSettings
): Promise<{ parsed: T; promptTokens: number; completionTokens: number }> {
  const repairPrompt = `
You are a strict JSON repair assistant.
Task: return a corrected RFC8259-valid JSON document from the broken input below.
Rules:
- Return JSON only.
- Keep the same top-level structure and keys.
- Do not add markdown/code fences/comments/explanations.
- If content is truncated, complete the JSON with reasonable placeholders while preserving schema.
Broken JSON:
${brokenJson}
`

  const repaired = await callGemini(repairPrompt, settings, { expectJson: true })

  return {
    parsed: extractJSON<T>(repaired.text),
    promptTokens: repaired.promptTokens,
    completionTokens: repaired.completionTokens,
  }
}

function parseRetryAfterMs(value: string | null): number | null {
  if (!value) return null

  const asSeconds = Number(value)
  if (Number.isFinite(asSeconds) && asSeconds >= 0) {
    return asSeconds * 1000
  }

  const asDate = Date.parse(value)
  if (Number.isNaN(asDate)) return null

  const delta = asDate - Date.now()
  return delta > 0 ? delta : 0
}

function computeRetryDelayMs(attempt: number, retryAfterMs?: number | null) {
  if (typeof retryAfterMs === "number" && retryAfterMs >= 0) {
    return Math.min(retryAfterMs, MAX_RETRY_DELAY_MS)
  }

  const exponential = BASE_RETRY_DELAY_MS * 2 ** (attempt - 1)
  const jitter = Math.floor(Math.random() * 250)
  return Math.min(exponential + jitter, MAX_RETRY_DELAY_MS)
}

async function callGeminiWithRetry(
  prompt: string,
  settings: ResearchSettings,
  endpoint: string,
  options?: {
    expectJson?: boolean
  }
): Promise<GeminiResult> {
  const temperature =
    settings.output_style === "concise"
      ? 0.2
      : settings.output_style === "detailed"
        ? 0.5
        : 0.35
  const maxOutputTokens = settings.depth === "deep" ? 4096 : 2048

  let lastError: Error | null = null

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt += 1) {
    try {
      const res = await fetch(`${endpoint}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature,
            maxOutputTokens,
            ...(options?.expectJson ? { responseMimeType: "application/json" } : {}),
          },
        }),
      })

      if (!res.ok) {
        const retryAfterMs = parseRetryAfterMs(res.headers.get("retry-after"))
        const responseText = await res.text().catch(() => "")
        const detail = responseText
          ? `: ${responseText.substring(0, 400)}`
          : ""
        const error = new Error(
          `Gemini request failed (${res.status})${detail}`
        )

        if (attempt < RETRY_ATTEMPTS) {
          const delayMs = computeRetryDelayMs(attempt, retryAfterMs)
          await new Promise((resolve) => setTimeout(resolve, delayMs))
          continue
        }

        throw error
      }

      const data = await res.json()
      
      // Check for API errors in response
      if (data.error) {
        throw new Error(`Gemini API error: ${data.error.message || JSON.stringify(data.error)}`)
      }
      
      const parts = data.candidates?.[0]?.content?.parts
      const text = Array.isArray(parts)
        ? parts
            .map((part: { text?: string }) => part?.text || "")
            .join("\n")
            .trim()
        : ""

      if (!text) {
        const reason = data.candidates?.[0]?.finishReason || "unknown"
        throw new Error(
          `Empty Gemini response (finish reason: ${reason}). ${
            data.candidates?.[0]?.safetyRatings?.length 
              ? `Safety ratings: ${JSON.stringify(data.candidates[0].safetyRatings)}` 
              : ""
          }`
        )
      }

      return {
        text,
        promptTokens: Number(data.usageMetadata?.promptTokenCount || 0),
        completionTokens: Number(data.usageMetadata?.candidatesTokenCount || 0),
        finishReason: data.candidates?.[0]?.finishReason,
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Model request failed")

      if (attempt < RETRY_ATTEMPTS) {
        const delayMs = computeRetryDelayMs(attempt)
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }
  }

  throw lastError || new Error("Model request failed after retries")
}

async function callGemini(
  prompt: string,
  settings: ResearchSettings,
  options?: {
    expectJson?: boolean
  }
): Promise<GeminiResult> {
  try {
    return await callGeminiWithRetry(prompt, settings, GEMINI_API, options)
  } catch (primaryError) {
    if (!GEMINI_FALLBACK_API) {
      throw primaryError
    }

    console.warn("Primary Gemini endpoint failed, using fallback", {
      reason: primaryError instanceof Error ? primaryError.message : "unknown",
    })

    return await callGeminiWithRetry(
      prompt,
      settings,
      GEMINI_FALLBACK_API,
      options
    )
  }
}

function normalizeReport(report: ResearchReportBody): ResearchReportBody {
  const safeReferences: ReferenceItem[] = (report.references || [])
    .filter((item) => Boolean(item?.title) && Boolean(item?.url))
    .map((item) => ({
      title: item.title,
      url: item.url,
      publisher: item.publisher,
      year: item.year,
      support:
        item.support === "supports" ||
        item.support === "contradicts" ||
        item.support === "contextual"
          ? item.support
          : "contextual",
    }))

  const safeFactChecks: FactCheckItem[] = (report.fact_checks || [])
    .filter((item) => Boolean(item?.statement) && Boolean(item?.tag))
    .map((item) => ({
      statement: item.statement,
      tag:
        item.tag === "Verified" ||
        item.tag === "Uncertain" ||
        item.tag === "Disputed"
          ? item.tag
          : "Uncertain",
      reason: item.reason || "No reasoning provided",
      reference_urls: Array.isArray(item.reference_urls) ? item.reference_urls : [],
    }))

  const safeSectionConfidence: SectionConfidence[] =
    (report.section_confidence || [])
      .filter((item) => Boolean(item?.section))
      .map((item) => ({
        section: item.section,
        score: Math.max(0, Math.min(100, Number(item.score) || 0)),
      }))

  const safeEvidence: EvidenceStrength = {
    overall:
      report.evidence_strength?.overall === "strong" ||
      report.evidence_strength?.overall === "moderate" ||
      report.evidence_strength?.overall === "weak" ||
      report.evidence_strength?.overall === "conflict"
        ? report.evidence_strength.overall
        : "moderate",
    agreement_count: Number(report.evidence_strength?.agreement_count || 0),
    conflict_count: Number(report.evidence_strength?.conflict_count || 0),
    rationale: report.evidence_strength?.rationale || "Evidence profile not provided",
  }

  const safeVerdict: ClaimVerdict | undefined =
    report.verdict === "True" ||
    report.verdict === "False" ||
    report.verdict === "Misleading" ||
    report.verdict === "Opinion"
      ? report.verdict
      : undefined

  return {
    ...report,
    references: safeReferences,
    fact_checks: safeFactChecks,
    section_confidence: safeSectionConfidence,
    evidence_strength: safeEvidence,
    verdict: safeVerdict,
    verdict_confidence:
      typeof report.verdict_confidence === "number"
        ? Math.max(0, Math.min(100, report.verdict_confidence))
        : undefined,
  }
}

export async function runResearchPipeline(
  input: ResearchPipelineInput,
  onProgress?: (step: string, detail: string) => void
): Promise<ResearchPipelineOutput> {
  const { query, mode, template, settings } = input

  const plannerRole =
    mode === "claim" ? "AI Claim Verification Planner" : "AI Research Planner"

  const objective =
    mode === "claim"
      ? "Create a verification-first outline that includes evidence collection, counter-evidence, and verdict criteria."
      : "Create a structured research outline for this topic."

  const outlinePrompt = `
You are an ${plannerRole}.
${objective}
Return JSON only:
{
  "title": string,
  "sections": [
    { "heading": string, "description": string }
  ]
}
Input Type: ${mode}
Input: "${query}"
`

  onProgress?.("outline", "Generating outline")
  const outlineResult = await callGeminiForJson<ResearchOutline>(
    outlinePrompt,
    settings,
    "outline"
  )
  const outline = outlineResult.parsed

  const claimModeInstruction =
    mode === "claim"
      ? "Include verdict + verdict_confidence and explicit support/conflict evidence."
      : "Set verdict and verdict_confidence to null."

  const paperPrompt = `
You are an advanced AI Research Analyst.
Research Input: "${query}"
Research Mode: ${mode}
Template: ${template}
Output Style: ${settings.output_style}
Depth: ${settings.depth}
Model Label: ${settings.model_name}
Research Outline: ${JSON.stringify(outline)}
Output quality requirements:
- Ground findings in references with URLs.
- Add fact-check tags per statement: Verified, Uncertain, Disputed.
- Provide confidence score (0-100) for each section.
- Provide evidence strength and conflict/agreement signal.
${claimModeInstruction}
Return JSON only:
{
  "executive_summary": string,
  "introduction": string,
  "main_analysis": string,
  "key_insights": array,
  "real_world_applications": array,
  "challenges": string,
  "future_scope": string,
  "conclusion": string,
  "references": [{"title": string, "url": string, "publisher": string, "year": string, "support": "supports" | "contradicts" | "contextual"}],
  "fact_checks": [{"statement": string, "tag": "Verified" | "Uncertain" | "Disputed", "reason": string, "reference_urls": [string]}],
  "section_confidence": [{"section": string, "score": number}],
  "evidence_strength": {"overall": "strong" | "moderate" | "weak" | "conflict", "agreement_count": number, "conflict_count": number, "rationale": string},
  "verdict": "True" | "False" | "Misleading" | "Opinion" | null,
  "verdict_confidence": number | null
}
`

  onProgress?.("analysis", "Generating full report")
  const reportResult = await callGeminiForJson<ResearchReportBody>(
    paperPrompt,
    settings,
    "report"
  )
  const report = normalizeReport(reportResult.parsed)

  const promptTokens = outlineResult.promptTokens + reportResult.promptTokens
  const completionTokens =
    outlineResult.completionTokens + reportResult.completionTokens

  return {
    outline,
    report,
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      estimated_cost_usd: estimateCostUsd(promptTokens, completionTokens),
    },
    cacheKey: buildCacheKey(query),
  }
}
