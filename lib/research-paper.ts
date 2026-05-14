import type { ReferenceItem, ResearchReportBody } from "@/lib/research-types"

export type EditableSection = {
  id: string
  heading: string
  content_markdown: string
  citations?: Array<{ ref_id: string; label: string }>
  word_count: number
  last_edited_at: string
}

export type PaperReview = {
  readability_score: number
  consistency_flags: string[]
  rewrite_suggestions: Array<{
    section_id: string
    before: string
    after: string
  }>
}

function sectionWordCount(content: string) {
  const trimmed = content.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).filter(Boolean).length
}

function truncate(text: string, max = 280) {
  const cleaned = text.trim()
  if (cleaned.length <= max) return cleaned
  return `${cleaned.slice(0, max)}...`
}

export function buildSectionsFromReport(report: ResearchReportBody): EditableSection[] {
  const now = new Date().toISOString()

  const sourceSections: Array<{ heading: string; content: string }> = [
    { heading: "Abstract", content: report.executive_summary || "" },
    { heading: "Introduction", content: report.introduction || "" },
    { heading: "Main Analysis", content: report.main_analysis || "" },
    {
      heading: "Key Insights",
      content: (report.key_insights || []).map((entry) => `- ${entry}`).join("\n"),
    },
    {
      heading: "Real World Applications",
      content: (report.real_world_applications || []).map((entry) => `- ${entry}`).join("\n"),
    },
    { heading: "Challenges", content: report.challenges || "" },
    { heading: "Future Scope", content: report.future_scope || "" },
    { heading: "Conclusion", content: report.conclusion || "" },
  ]

  return sourceSections.map((section, index) => ({
    id: `sec-${index + 1}`,
    heading: section.heading,
    content_markdown: section.content,
    word_count: sectionWordCount(section.content),
    last_edited_at: now,
  }))
}

export function buildReferenceList(references: ReferenceItem[] | undefined) {
  return (references || []).map((item, index) => ({
    id: `ref-${index + 1}`,
    title: item.title,
    authors: item.publisher ? [item.publisher] : [],
    year: item.year ? Number(item.year) : undefined,
    url: item.url,
  }))
}

export function updateWordCounts(sections: EditableSection[]): EditableSection[] {
  return sections.map((section) => ({
    ...section,
    word_count: sectionWordCount(section.content_markdown),
  }))
}

export function generatePaperReview(sections: EditableSection[]): PaperReview {
  const totalWords = sections.reduce((sum, section) => sum + section.word_count, 0)
  const text = sections.map((section) => section.content_markdown).join("\n")
  const sentenceCount = Math.max(
    text
      .split(/[.!?]+/)
      .map((item) => item.trim())
      .filter(Boolean).length,
    1
  )

  const avgSentenceLength = totalWords / sentenceCount
  const readability = Math.max(0, Math.min(100, Math.round(100 - (avgSentenceLength - 16) * 2.2)))

  const consistency_flags: string[] = []

  sections.forEach((section) => {
    const hasCitationLike = /\[[0-9]+\]/.test(section.content_markdown)
    const hasStrongClaim = /(proves|always|never|definitive|guarantees)/i.test(section.content_markdown)

    if (hasStrongClaim && !hasCitationLike) {
      consistency_flags.push(`Section \"${section.heading}\" has strong claims without citation markers.`)
    }

    if (section.word_count === 0) {
      consistency_flags.push(`Section \"${section.heading}\" is empty.`)
    }
  })

  const rewrite_suggestions = sections
    .filter((section) => section.word_count > 110)
    .slice(0, 4)
    .map((section) => {
      const before = truncate(section.content_markdown)
      const compressed = section.content_markdown
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 85)
        .join(" ")

      return {
        section_id: section.id,
        before,
        after: truncate(compressed, 260),
      }
    })

  return {
    readability_score: readability,
    consistency_flags,
    rewrite_suggestions,
  }
}

export function toMarkdownDocument(payload: {
  title: string
  sections: EditableSection[]
  references: Array<{ id: string; title: string; authors?: string[]; year?: number; url?: string }>
}) {
  const sectionBody = payload.sections
    .map((section) => `## ${section.heading}\n\n${section.content_markdown || ""}`)
    .join("\n\n")

  const references = payload.references
    .map((reference, index) => {
      const authorText = reference.authors?.length ? reference.authors.join(", ") : "Unknown"
      const year = reference.year || "n.d."
      return `${index + 1}. ${reference.title} (${authorText}, ${year})${reference.url ? `\n   ${reference.url}` : ""}`
    })
    .join("\n")

  return `# ${payload.title}\n\n${sectionBody}\n\n## References\n\n${references || "- None"}\n`
}
