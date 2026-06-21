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

export type PaperStatus = "draft" | "in_review" | "published"

export type ResearchPaperCitation = {
  ref_id: string
  label: string
}

export type ResearchPaperSection = {
  id: string
  heading: string
  content_markdown: string
  citations?: ResearchPaperCitation[]
  word_count: number
  last_edited_at: string
}

export type ResearchPaperReference = {
  id: string
  title: string
  authors?: string[]
  year?: number
  url?: string
}

export type ResearchPaperReviewSuggestion = {
  section_id: string
  before: string
  after: string
}

export type ResearchPaperReview = {
  readability_score: number
  consistency_flags: string[]
  rewrite_suggestions: ResearchPaperReviewSuggestion[]
}

export type ResearchPaperDocument = {
  paper_id: string
  title: string
  version: number
  status: PaperStatus
  sections: ResearchPaperSection[]
  references: ResearchPaperReference[]
  review: ResearchPaperReview
}

// ============ COLLABORATION & SHARING TYPES ============

export type PermissionLevel = "view" | "comment" | "edit"

export type ResearchShare = {
  id: string
  research_id: string
  owner_id: string
  shared_with_user_id?: string
  shared_with_email?: string
  permission_level: PermissionLevel
  shared_at: string
  expires_at?: string
  created_at: string
  updated_at: string
}

export type ResearchCollaborator = {
  id: string
  research_id: string
  user_id: string
  cursor_position?: number
  selected_section?: string
  last_active: string
  joined_at: string
}

export type ResearchComment = {
  id: string
  research_id: string
  user_id: string
  section: string
  content: string
  resolved: boolean
  parent_comment_id?: string
  created_at: string
  updated_at: string
  author?: {
    id: string
    email: string
    name?: string
  }
}

export type ResearchVersion = {
  id: string
  research_id: string
  user_id: string
  version_number: number
  report_snapshot: ResearchReportBody
  change_summary?: string
  created_at: string
}

// ============ SEARCH & DISCOVERY TYPES ============

export type ResearchSearchResult = {
  id: string
  research_id: string
  title: string
  topic: string
  summary_text?: string
  tags: string[]
  author_id: string
  is_public: boolean
  view_count: number
  citation_count: number
  created_at: string
  updated_at: string
}

export type ResearchCitation = {
  id: string
  citing_research_id: string
  cited_research_id: string
  citation_context?: string
  created_at: string
}

export type ResearchTag = {
  id: string
  name: string
  description?: string
  usage_count: number
  created_at: string
}

// ============ TEMPLATES & WORKFLOWS TYPES ============

export type TemplateCategory =
  | "literature_review"
  | "technical_report"
  | "claim_verification"
  | "market_analysis"
  | "competitor_analysis"
  | "trend_research"
  | "custom"

export type TemplateType = "system" | "user"

export type ResearchTemplateRecord = {
  id: string
  name: string
  description?: string
  category: TemplateCategory
  template_type: TemplateType
  created_by_user_id?: string
  is_public: boolean
  prompt_template: string
  settings: ResearchSettings
  example_usage?: string
  tags: string[]
  usage_count: number
  rating: number
  rating_count: number
  created_at: string
  updated_at: string
}

export type UserTemplateFavorite = {
  id: string
  user_id: string
  template_id: string
  created_at: string
}

export type WorkflowStep = {
  id: string
  name: string
  type: "research" | "condition" | "transform" | "merge"
  config: Record<string, unknown>
  next_step_id?: string
}

export type WorkflowDefinition = {
  id: string
  name: string
  description?: string
  created_by_user_id: string
  is_public: boolean
  steps: WorkflowStep[]
  triggers?: Record<string, unknown>
  conditions?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type WorkflowExecutionStatus = "pending" | "running" | "completed" | "failed"

export type WorkflowExecution = {
  id: string
  workflow_id: string
  user_id: string
  research_id?: string
  status: WorkflowExecutionStatus
  results?: Record<string, unknown>
  error_message?: string
  started_at: string
  completed_at?: string
}

export type WorkflowStepResult = {
  id: string
  execution_id: string
  step_index: number
  step_name: string
  output?: Record<string, unknown>
  tokens_used?: number
  completed_at: string
}
