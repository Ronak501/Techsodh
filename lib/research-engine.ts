import type {
  ClaimVerdict,
  EvidenceStrength,
  ResearchOutline,
  ResearchPreferences,
  ResearchReportBody,
  ResearchSettings,
  ResearchTemplate,
  ReferenceItem,
  SectionConfidence,
} from "@/lib/research-types"
import { humanizeText, type HumanizeTone } from "@/lib/humanizer"

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
  humanized_report?: ResearchReportBody
  usage: ResearchPipelineUsage
  cacheKey: string
  humanization_used?: boolean
}

const defaultPreferences: ResearchPreferences = {
  preferred_template: "literature_review",
  output_style: "balanced",
  depth: "standard",
  model_name: "llama-3.3-70b-versatile",
}

const RETRY_ATTEMPTS = 5
const JSON_PARSE_ATTEMPTS = 3
const BASE_RETRY_DELAY_MS = 600
const MAX_RETRY_DELAY_MS = 12_000

type GroqResult = {
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

function cleanText(value: string | undefined | null) {
  return typeof value === "string" ? value.trim() : ""
}

function joinOutlineHeadings(outline: ResearchOutline) {
  return outline.sections
    .map((section) => cleanText(section.heading))
    .filter(Boolean)
    .slice(0, 4)
    .join(", ")
}

function buildFallbackReportText(params: {
  section: "executive_summary" | "introduction" | "main_analysis" | "challenges" | "future_scope" | "conclusion"
  query: string
  mode: ResearchMode
  template: ResearchTemplate
  outline: ResearchOutline
  report: ResearchReportBody
}) {
  const topic = cleanText(params.query) || "the research topic"
  const outlineFocus = joinOutlineHeadings(params.outline)
  const templateLabel = params.template.replace(/_/g, " ")
  const modeLabel = params.mode === "claim" ? "claim verification" : templateLabel
  const verdictLabel = params.report.verdict || "the current evidence"

  switch (params.section) {
    case "executive_summary":
      return `This ${modeLabel} report examines ${topic} and converts the available evidence into a concise summary. ${outlineFocus ? `The outline centers on ${outlineFocus}. ` : ""}The report keeps the conclusion grounded in the sources that were available.`
    case "introduction":
      return `The topic is framed around ${topic}, with the report organized to separate the main evidence, unresolved gaps, and practical implications. ${outlineFocus ? `The planned analysis covers ${outlineFocus}.` : "The analysis is structured to move from evidence to interpretation."}`
    case "main_analysis":
      return `The main analysis on ${topic} connects the outline themes to the source material and explains what the evidence supports, where it is uncertain, and where sources disagree. ${outlineFocus ? `The analysis follows ${outlineFocus}. ` : ""}This gives the reader a clear path from data points to interpretation instead of leaving the argument implied.`
    case "challenges":
      return `The key challenges are source quality, limited coverage, and any contradictions between studies or reports. Those limits matter because they shape how much confidence should be placed in the findings and where additional verification is needed.`
    case "future_scope":
      return `Future work should test the strongest claims with fresh data, broaden the evidence base across more contexts, and resolve the largest disagreements in the current literature. That would turn ${verdictLabel} from a tentative synthesis into a more durable conclusion.`
    case "conclusion":
      return `Overall, the report supports a cautious conclusion rather than an absolute one. ${outlineFocus ? `The strongest thread runs through ${outlineFocus}. ` : ""}The practical next step is to keep the conclusion tied to the evidence and revisit it as stronger sources become available.`
  }
}

function buildFallbackListItems(params: {
  section: "key_insights" | "real_world_applications"
  query: string
  outline: ResearchOutline
}) {
  const topic = cleanText(params.query) || "the topic"
  const outlineHeadings = params.outline.sections
    .map((section) => cleanText(section.heading))
    .filter(Boolean)
    .slice(0, 3)

  if (params.section === "key_insights") {
    return [
      `The report is centered on ${topic} and should be read as a synthesis of the current evidence.`,
      outlineHeadings[0]
        ? `The first analytic lens is ${outlineHeadings[0]}, which helps organize the argument.`
        : `The analysis organizes the evidence into a clear sequence of claims, limits, and implications.`,
      `Confidence should stay linked to the available sources, especially where the evidence is incomplete or conflicting.`,
    ]
  }

  return [
    `Use the findings to inform practical decisions about ${topic} where the evidence is already stable enough to act on.`,
    outlineHeadings[1]
      ? `Apply the analysis from ${outlineHeadings[1]} to the real-world context rather than treating the result as purely theoretical.`
      : `Translate the evidence into operational steps, policy choices, or product decisions depending on the use case.`,
    `Revisit the application as stronger evidence appears so the implementation stays aligned with the latest findings.`,
  ]
}

function fillMissingSectionConfidence(params: {
  report: ResearchReportBody
  outline: ResearchOutline
}) {
  const existing = new Map(
    (params.report.section_confidence || [])
      .filter((item) => Boolean(item?.section))
      .map((item) => [item.section.toLowerCase(), Math.max(0, Math.min(100, Number(item.score) || 0))])
  )

  const orderedSections = [
    "Executive Summary",
    "Introduction",
    "Main Analysis",
    "Key Insights",
    "Real World Applications",
    "Challenges",
    "Future Scope",
    "Conclusion",
  ]

  return orderedSections.map((section) => {
    const existingScore = existing.get(section.toLowerCase())
    if (typeof existingScore === "number") {
      return { section, score: existingScore }
    }

    const sourceText =
      section === "Key Insights"
        ? (params.report.key_insights || []).join(" ")
        : section === "Real World Applications"
          ? (params.report.real_world_applications || []).join(" ")
          : cleanText((params.report as Record<string, string | undefined>)[section.toLowerCase().replace(/\s+/g, "_")])

    return {
      section,
      score: sourceText ? 82 : params.outline.sections.length ? 74 : 68,
    }
  })
}

export function ensureCompleteReportSections(params: {
  report: ResearchReportBody
  outline: ResearchOutline
  query: string
  mode: ResearchMode
  template: ResearchTemplate
}): ResearchReportBody {
  const executiveSummary = cleanText(params.report.executive_summary)
  const introduction = cleanText(params.report.introduction)
  const mainAnalysis = cleanText(params.report.main_analysis)
  const challenges = cleanText(params.report.challenges)
  const futureScope = cleanText(params.report.future_scope)
  const conclusion = cleanText(params.report.conclusion)

  const keyInsights = (params.report.key_insights || []).map(cleanText).filter(Boolean)
  const realWorldApplications = (params.report.real_world_applications || [])
    .map(cleanText)
    .filter(Boolean)

  return {
    ...params.report,
    executive_summary:
      executiveSummary ||
      buildFallbackReportText({ section: "executive_summary", ...params }),
    introduction:
      introduction ||
      buildFallbackReportText({ section: "introduction", ...params }),
    main_analysis:
      mainAnalysis ||
      buildFallbackReportText({ section: "main_analysis", ...params }),
    key_insights:
      keyInsights.length > 0
        ? keyInsights
        : buildFallbackListItems({ section: "key_insights", ...params }),
    real_world_applications:
      realWorldApplications.length > 0
        ? realWorldApplications
        : buildFallbackListItems({ section: "real_world_applications", ...params }),
    challenges:
      challenges ||
      buildFallbackReportText({ section: "challenges", ...params }),
    future_scope:
      futureScope ||
      buildFallbackReportText({ section: "future_scope", ...params }),
    conclusion:
      conclusion ||
      buildFallbackReportText({ section: "conclusion", ...params }),
    section_confidence: fillMissingSectionConfidence({ report: params.report, outline: params.outline }),
    evidence_strength: {
      overall: params.report.evidence_strength?.overall || "moderate",
      agreement_count: Number(params.report.evidence_strength?.agreement_count || 0),
      conflict_count: Number(params.report.evidence_strength?.conflict_count || 0),
      rationale:
        cleanText(params.report.evidence_strength?.rationale) ||
        "The report did not supply an evidence-strength rationale, so this version uses the synthesized section content to keep the conclusion grounded.",
    },
  }
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

async function callGroqForJson<T>(
  prompt: string,
  settings: ResearchSettings,
  phase: string
): Promise<{ parsed: T; promptTokens: number; completionTokens: number }> {
  let totalPromptTokens = 0
  let totalCompletionTokens = 0
  let lastError: Error | null = null
  let lastResponse = ""
  let lastFinishReason: string | undefined = undefined

  for (let attempt = 1; attempt <= JSON_PARSE_ATTEMPTS; attempt += 1) {
    const strictPrompt =
      attempt === 1
        ? prompt
        : `${prompt}\n\nIMPORTANT: Return valid RFC8259 JSON only. Do not include markdown fences, code blocks, comments, explanations, or extra prose before/after JSON.`

    const result = await callGroq(strictPrompt, settings, {
      expectJson: true,
    })
    totalPromptTokens += result.promptTokens
    totalCompletionTokens += result.completionTokens
    lastResponse = result.text
    lastFinishReason = result.finishReason

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
      if (attempt < JSON_PARSE_ATTEMPTS) {
        try {
          const repaired = await repairGroqJson<T>(result.text, settings)
          totalPromptTokens += repaired.promptTokens
          totalCompletionTokens += repaired.completionTokens

          console.info(`Successfully repaired ${phase} JSON on attempt ${attempt}`, {
            finishReason: lastFinishReason,
            responseLength: result.text.length,
            truncated: result.text.endsWith("]") === false && result.text.endsWith("}") === false,
          })

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
          lastError = new Error(`${lastError.message}; repair failed: ${repairMessage}`)
        }
      }
      
      const responsePreview = result.text.substring(0, 300)
      if (attempt < JSON_PARSE_ATTEMPTS) {
        console.warn(`Failed to parse ${phase} JSON response (attempt ${attempt}/${JSON_PARSE_ATTEMPTS})`, {
          attempt,
          phase,
          reason: lastError.message,
          responsePreview,
          responseLength: result.text.length,
          finishReason: lastFinishReason || "unknown",
          isTruncated: lastFinishReason === "STOP" && !result.text.trim().endsWith("}") && !result.text.trim().endsWith("]"),
        })
      }
    }
  }

  throw new Error(
    `Model returned non-JSON ${phase} response after ${JSON_PARSE_ATTEMPTS} parse attempts${
      lastError?.message ? `: ${lastError.message}` : ""
    }\nfinishReason: ${lastFinishReason || "unknown"}\nResponse preview: ${lastResponse.substring(0, 500)}${lastResponse.length > 500 ? "..." : ""}`
  )
}

async function repairGroqJson<T>(
  brokenJson: string,
  settings: ResearchSettings
): Promise<{ parsed: T; promptTokens: number; completionTokens: number }> {
  // Attempt quick fix for common truncation patterns
  const quickFixed = attemptQuickJsonRepair(brokenJson)
  if (quickFixed) {
    try {
      return {
        parsed: JSON.parse(quickFixed) as T,
        promptTokens: 0,
        completionTokens: 0,
      }
    } catch {
      // Continue to full repair
    }
  }

  const repairPrompt = `
You are a strict JSON repair assistant.
Task: return a corrected RFC8259-valid JSON document from the broken input below.
Rules:
- Return ONLY valid JSON with NO explanations, markdown, or extra text.
- Keep the same top-level structure and keys.
- If content is truncated or incomplete, complete the JSON with reasonable defaults (null, empty strings, or empty arrays) while preserving the intended schema.
- Ensure all brackets/braces are properly closed.
Broken JSON:
${brokenJson.substring(0, 2000)}
`

  const repaired = await callGroq(repairPrompt, settings, { expectJson: true })

  try {
    return {
      parsed: extractJSON<T>(repaired.text),
      promptTokens: repaired.promptTokens,
      completionTokens: repaired.completionTokens,
    }
  } catch (e) {
    throw new Error(`JSON repair response was also invalid: ${e instanceof Error ? e.message : "Parse error"}`)
  }
}

function attemptQuickJsonRepair(brokenJson: string): string | null {
  const trimmed = brokenJson.trim()
  
  // If it ends abruptly, try to close the JSON structure
  if (trimmed.startsWith("{")) {
    const openBraces = (trimmed.match(/\{/g) || []).length
    const closeBraces = (trimmed.match(/\}/g) || []).length
    if (openBraces > closeBraces) {
      const missing = "}".repeat(openBraces - closeBraces)
      const repaired = trimmed + missing
      try {
        JSON.parse(repaired)
        return repaired
      } catch {
        // Not a simple fix
      }
    }
  } else if (trimmed.startsWith("[")) {
    const openBrackets = (trimmed.match(/\[/g) || []).length
    const closeBrackets = (trimmed.match(/\]/g) || []).length
    if (openBrackets > closeBrackets) {
      const missing = "]".repeat(openBrackets - closeBrackets)
      const repaired = trimmed + missing
      try {
        JSON.parse(repaired)
        return repaired
      } catch {
        // Not a simple fix
      }
    }
  }
  
  return null
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

function computeRetryDelayMs(attempt: number, retryAfterMs?: number | null, statusCode?: number) {
  // If server specified Retry-After, respect it (also cap to max)
  if (typeof retryAfterMs === "number" && retryAfterMs >= 0) {
    const honoreDelay = Math.min(retryAfterMs, MAX_RETRY_DELAY_MS)
    console.info(`Honoring Retry-After header: ${honoreDelay}ms (status: ${statusCode})`)
    return honoreDelay
  }

  // Exponential backoff: 600ms, 1.2s, 2.4s, 4.8s, 9.6s
  const exponential = BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1)
  const jitter = Math.floor(Math.random() * 1000) // Increase jitter range
  const delayMs = Math.min(exponential + jitter, MAX_RETRY_DELAY_MS)
  
  console.debug(`Retry delay computed: ${delayMs}ms (attempt: ${attempt}, exponential: ${exponential}ms, jitter: ${jitter}ms)`)
  return delayMs
}

async function callGroqWithRetry(
  prompt: string,
  settings: ResearchSettings,
  endpoint: string,
  options?: {
    expectJson?: boolean
  }
): Promise<GroqResult> {
  const temperature =
    settings.output_style === "concise"
      ? 0.2
      : settings.output_style === "detailed"
        ? 0.5
        : 0.35
  const maxOutputTokens = settings.depth === "deep" ? 4096 : 2048

  let lastError: Error | null = null
  let lastStatusCode: number | undefined
  let lastFinishReason: string | undefined

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt += 1) {
    try {
      const res = await fetch(`${endpoint}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: settings.model_name || "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature,
          max_tokens: maxOutputTokens,
          ...(options?.expectJson ? { response_format: { type: "json_object" } } : {}),
        }),
      })

      lastStatusCode = res.status

      if (!res.ok) {
        const retryAfterMs = parseRetryAfterMs(res.headers.get("retry-after"))
        const responseText = await res.text().catch(() => "")
        const isRateLimited = res.status === 429
        const isServerError = res.status >= 500
        const detail = responseText
          ? `: ${responseText.substring(0, 400)}`
          : ""
        const error = new Error(
          `Groq request failed (${res.status}${isRateLimited ? " - RATE LIMITED" : isServerError ? " - SERVER ERROR" : ""})${detail}`
        )

        if (attempt < RETRY_ATTEMPTS) {
          const delayMs = computeRetryDelayMs(attempt, retryAfterMs, res.status)
          const context = {
            attempt,
            totalAttempts: RETRY_ATTEMPTS,
            statusCode: res.status,
            isRateLimited,
            isServerError,
            retryAfter: res.headers.get("retry-after"),
            delayMs,
            nextAttemptIn: `${(delayMs / 1000).toFixed(1)}s`,
          }
          console.warn(`Groq request failed; retrying`, context)
          await new Promise((resolve) => setTimeout(resolve, delayMs))
          continue
        }

        throw error
      }

      const data = await res.json()
      
      // Check for API errors in response
      if (data.error) {
        throw new Error(`Groq API error: ${data.error.message || JSON.stringify(data.error)}`)
      }
      
      const finishReason = data.choices?.[0]?.finish_reason
      lastFinishReason = finishReason
      
      const text = data.choices?.[0]?.message?.content?.trim() || ""

      if (!text) {
        const reason = finishReason || "unknown"
        const errorDetails = {
          finishReason: reason,
          candidateCount: data.choices?.length || 0,
        }
        throw new Error(
          `Empty Groq response (finish reason: ${reason}). Details: ${JSON.stringify(errorDetails)}`
        )
      }

      return {
        text,
        promptTokens: Number(data.usage?.prompt_tokens || 0),
        completionTokens: Number(data.usage?.completion_tokens || 0),
        finishReason,
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Model request failed")

      if (attempt < RETRY_ATTEMPTS) {
        const delayMs = computeRetryDelayMs(attempt, undefined, lastStatusCode)
        console.error(`Attempt ${attempt}/${RETRY_ATTEMPTS} failed:`, {
          error: lastError.message,
          statusCode: lastStatusCode,
          finishReason: lastFinishReason,
          nextRetryIn: `${(delayMs / 1000).toFixed(1)}s`,
        })
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }
  }

  throw new Error(
    `Groq request failed after ${RETRY_ATTEMPTS} transport retries (last status: ${lastStatusCode}, finishReason: ${lastFinishReason || "unknown"}). Final error: ${lastError?.message || "unknown"}`
  )
}

async function callGroq(
  prompt: string,
  settings: ResearchSettings,
  options?: {
    expectJson?: boolean
  }
): Promise<GroqResult> {
  return await callGroqWithRetry(prompt, settings, GROQ_API, options)
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

async function humanizeReport(
  report: ResearchReportBody,
  tone: HumanizeTone = "professional"
): Promise<ResearchReportBody> {
  const sections = {
    executive_summary: report.executive_summary || "",
    introduction: report.introduction || "",
    main_analysis: report.main_analysis || "",
    challenges: report.challenges || "",
    future_scope: report.future_scope || "",
    conclusion: report.conclusion || "",
  }

  const humanizedSections: Record<string, string> = {}
  let humanized = false

  try {
    for (const [key, content] of Object.entries(sections)) {
      if (content.trim().length > 50) {
        try {
          console.info(`Humanizing ${key}...`, { contentLength: content.length })
          const result = await Promise.race([
            humanizeText(content, tone),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error(`Humanization timeout for ${key}`)), 30000)
            ),
          ])
          humanizedSections[key] = result.text
          humanized = true
          console.info(`Successfully humanized ${key}`, {
            originalLength: content.length,
            humanizedLength: result.text.length,
          })
        } catch (error) {
          console.warn(`Failed to humanize ${key}, keeping original`, {
            error: error instanceof Error ? error.message : "unknown",
          })
          humanizedSections[key] = content
        }
      } else {
        humanizedSections[key] = content
      }
    }
  } catch (error) {
    console.error("Humanization process failed, returning original report", {
      error: error instanceof Error ? error.message : "unknown",
    })
    return report
  }

  if (!humanized) {
    console.warn("No sections were humanized")
    return report
  }

  return {
    ...report,
    executive_summary: humanizedSections.executive_summary,
    introduction: humanizedSections.introduction,
    main_analysis: humanizedSections.main_analysis,
    challenges: humanizedSections.challenges,
    future_scope: humanizedSections.future_scope,
    conclusion: humanizedSections.conclusion,
    key_insights: report.key_insights,
    real_world_applications: report.real_world_applications,
    references: report.references,
    fact_checks: report.fact_checks,
    section_confidence: report.section_confidence,
    verdict: report.verdict,
    verdict_confidence: report.verdict_confidence,
    evidence_strength: report.evidence_strength,
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
  const outlineResult = await callGroqForJson<ResearchOutline>(
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
- Never return empty strings, nulls, placeholders, or "N/A" for any required section.
- Each narrative section must contain at least 2 substantive sentences.
- key_insights and real_world_applications must each contain at least 3 concrete items.
- section_confidence must include every section in this exact order: Executive Summary, Introduction, Main Analysis, Key Insights, Real World Applications, Challenges, Future Scope, Conclusion.
- If the evidence is thin, say so clearly, but still write a complete synthesized section using the query, outline, and available sources.
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
  const reportResult = await callGroqForJson<ResearchReportBody>(
    paperPrompt,
    settings,
    "report"
  )
  const report = normalizeReport(
    ensureCompleteReportSections({
      report: reportResult.parsed,
      outline,
      query,
      mode,
      template,
    })
  )

  const promptTokens = outlineResult.promptTokens + reportResult.promptTokens
  const completionTokens =
    outlineResult.completionTokens + reportResult.completionTokens

  let humanizedReport: ResearchReportBody | undefined
  let humanizationUsed = false

  try {
    console.info("Starting humanization of report...")
    const tone = settings.output_style === "concise" ? "concise" : "professional"
    humanizedReport = await humanizeReport(report, tone as HumanizeTone)
    humanizationUsed = humanizedReport !== report
    console.info("Humanization completed", { humanizationUsed })
  } catch (error) {
    console.warn("Humanization failed; using original report", {
      error: error instanceof Error ? error.message : "unknown",
    })
    humanizedReport = report
  }

  return {
    outline,
    report: humanizedReport || report,
    humanized_report: humanizedReport,
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      estimated_cost_usd: estimateCostUsd(promptTokens, completionTokens),
    },
    cacheKey: buildCacheKey(query),
    humanization_used: humanizationUsed,
  }
}
