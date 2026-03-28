import { NextResponse } from "next/server"
import { z } from "zod"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import { createClient } from "@/utils/supabase/server"
import { safeJsonResponse } from "@/lib/api-security"

const paramsSchema = z.object({
  id: z.string().uuid(),
})

function toMarkdown(reportData: {
  query: string
  outline: { sections?: Array<{ heading?: string; description?: string }> } | null
  report: {
    executive_summary?: string
    introduction?: string
    main_analysis?: string
    key_insights?: string[]
    real_world_applications?: string[]
    challenges?: string
    future_scope?: string
    conclusion?: string
    references?: Array<{
      title?: string
      url?: string
      publisher?: string
      year?: string
      support?: string
    }>
    fact_checks?: Array<{
      statement?: string
      tag?: string
      reason?: string
      reference_urls?: string[]
    }>
    section_confidence?: Array<{
      section?: string
      score?: number
    }>
    verdict?: string
    verdict_confidence?: number
    evidence_strength?: {
      overall?: string
      agreement_count?: number
      conflict_count?: number
      rationale?: string
    }
  } | null
}) {
  const report = reportData.report || {}
  const outline = reportData.outline || {}

  const keyInsights = (report.key_insights || [])
    .map((item) => `- ${item}`)
    .join("\n")

  const applications = (report.real_world_applications || [])
    .map((item) => `- ${item}`)
    .join("\n")

  const sections = (outline.sections || [])
    .map((section) => `- ${section.heading || "Untitled"}: ${section.description || ""}`)
    .join("\n")

  const references = (report.references || [])
    .map(
      (ref, index) =>
        `${index + 1}. ${ref.title || "Untitled"} (${ref.support || "context"})\n   ${ref.url || "N/A"}`
    )
    .join("\n")

  const factChecks = (report.fact_checks || [])
    .map(
      (fact, index) =>
        `${index + 1}. [${fact.tag || "Uncertain"}] ${fact.statement || "N/A"}\n   Reason: ${fact.reason || "N/A"}`
    )
    .join("\n")

  const sectionConfidence = (report.section_confidence || [])
    .map((section) => `- ${section.section || "Unknown"}: ${section.score ?? 0}%`)
    .join("\n")

  return `# Research Report: ${reportData.query}

## Claim Verdict
${report.verdict || "N/A"}

## Verdict Confidence
${typeof report.verdict_confidence === "number" ? `${report.verdict_confidence}%` : "N/A"}

## Evidence Strength
Overall: ${report.evidence_strength?.overall || "N/A"}
Agreement: ${report.evidence_strength?.agreement_count ?? 0}
Conflict: ${report.evidence_strength?.conflict_count ?? 0}
Rationale: ${report.evidence_strength?.rationale || "N/A"}

## Executive Summary
${report.executive_summary || "N/A"}

## Introduction
${report.introduction || "N/A"}

## Main Analysis
${report.main_analysis || "N/A"}

## Key Insights
${keyInsights || "- N/A"}

## Real World Applications
${applications || "- N/A"}

## Challenges
${report.challenges || "N/A"}

## Future Scope
${report.future_scope || "N/A"}

## Conclusion
${report.conclusion || "N/A"}

## References
${references || "- N/A"}

## Fact Check Layer
${factChecks || "- N/A"}

## Section Confidence
${sectionConfidence || "- N/A"}

## Research Outline
${sections || "- N/A"}
`
}

function getSafeFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "research-report"
}

async function toPdfBytes(title: string, markdownContent: string) {
  const pdf = await PDFDocument.create()
  let page = pdf.addPage([595, 842])
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

  let y = 810

  page.drawText(title, {
    x: 40,
    y,
    size: 16,
    font: bold,
    color: rgb(0.1, 0.1, 0.1),
  })

  y -= 26

  const lines = markdownContent
    .replace(/\r/g, "")
    .split("\n")
    .flatMap((line) => {
      const chunkSize = 95
      if (line.length <= chunkSize) return [line]

      const chunks: string[] = []
      for (let i = 0; i < line.length; i += chunkSize) {
        chunks.push(line.slice(i, i + chunkSize))
      }
      return chunks
    })

  for (const line of lines) {
    if (y < 40) {
      y = 810
      page = pdf.addPage([595, 842])
      page.drawText(line || " ", {
        x: 40,
        y,
        size: 10,
        font,
        color: rgb(0.15, 0.15, 0.15),
      })
      y -= 14
      continue
    }

    page.drawText(line || " ", {
      x: 40,
      y,
      size: 10,
      font,
      color: rgb(0.15, 0.15, 0.15),
    })

    y -= 14
  }

  return await pdf.save()
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const parsedParams = paramsSchema.safeParse(await params)
  if (!parsedParams.success) {
    return safeJsonResponse(400, "Invalid research id")
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return safeJsonResponse(401, "Unauthorized")
  }

  const { data, error } = await supabase
    .from("research_reports")
    .select("id, query, outline, report")
    .eq("id", parsedParams.data.id)
    .eq("user_id", user.id)
    .single()

  if (error || !data) {
    return safeJsonResponse(404, "Research report not found")
  }

  const format = new URL(request.url).searchParams.get("format") || "markdown"

  if (format === "json") {
    return NextResponse.json(data)
  }

  const markdown = toMarkdown(data)
  const safeName = getSafeFileName(data.query)

  if (format === "pdf") {
    const pdfBytes = await toPdfBytes(data.query, markdown)

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}.pdf"`,
      },
    })
  }

  const fileName = `${safeName}.md`

  return new NextResponse(markdown, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  })
}
