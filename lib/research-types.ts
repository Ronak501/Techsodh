export type ResearchOutlineSection = {
  heading: string
  description: string
}

export type ResearchOutline = {
  title?: string
  sections: ResearchOutlineSection[]
}

export type ResearchReportBody = {
  executive_summary?: string
  introduction?: string
  main_analysis?: string
  key_insights?: string[]
  real_world_applications?: string[]
  challenges?: string
  future_scope?: string
  conclusion?: string
  references?: ReferenceItem[]
  fact_checks?: FactCheckItem[]
  section_confidence?: SectionConfidence[]
  verdict?: ClaimVerdict
  verdict_confidence?: number
  evidence_strength?: EvidenceStrength
}

export type VerificationTag = "Verified" | "Uncertain" | "Disputed"

export type ClaimVerdict = "True" | "False" | "Misleading" | "Opinion"

export type EvidenceStrengthLevel =
  | "strong"
  | "moderate"
  | "weak"
  | "conflict"

export type SourceSupport = "supports" | "contradicts" | "contextual"

export type ReferenceItem = {
  title: string
  url: string
  publisher?: string
  year?: string
  support: SourceSupport
}

export type FactCheckItem = {
  statement: string
  tag: VerificationTag
  reason: string
  reference_urls: string[]
}

export type SectionConfidence = {
  section: string
  score: number
}

export type EvidenceStrength = {
  overall: EvidenceStrengthLevel
  agreement_count: number
  conflict_count: number
  rationale: string
}

export type ResearchSummaryData = {
  id?: string
  research_topic: string
  research_mode?: "topic" | "claim"
  template?: ResearchTemplate
  settings?: ResearchSettings
  outline: ResearchOutline
  report: ResearchReportBody
}

export type ResearchTemplate =
  | "literature_review"
  | "technical_report"
  | "claim_verification"

export type OutputStyle = "balanced" | "concise" | "detailed"

export type ResearchDepth = "standard" | "deep"

export type ResearchSettings = {
  output_style: OutputStyle
  depth: ResearchDepth
  model_name: string
}

export type ResearchPreferences = ResearchSettings & {
  preferred_template: ResearchTemplate
}
