import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/utils/supabase/server"
import { parseJsonSafely, safeJsonResponse } from "@/lib/api-security"
import { generatePaperReview, updateWordCounts } from "@/lib/research-paper"

const paramsSchema = z.object({
  id: z.string().uuid(),
})

const paperSectionSchema = z.object({
  id: z.string().trim().min(1),
  heading: z.string().trim().min(1).max(160),
  content_markdown: z.string(),
  citations: z
    .array(
      z.object({
        ref_id: z.string().trim().min(1),
        label: z.string().trim().min(1).max(32),
      })
    )
    .optional(),
})

const updatePaperSchema = z.object({
  expected_version: z.number().int().min(1),
  title: z.string().trim().min(3).max(500).optional(),
  status: z.enum(["draft", "in_review", "published"]).optional(),
  sections: z.array(paperSectionSchema).min(1).optional(),
})

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const parsedParams = paramsSchema.safeParse(await params)
  if (!parsedParams.success) {
    return safeJsonResponse(400, "Invalid paper id")
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return safeJsonResponse(401, "Unauthorized")
  }

  const { data, error } = await supabase
    .from("research_papers")
    .select("id, source_report_id, title, status, current_version, document_json, review_json, updated_at, created_at")
    .eq("id", parsedParams.data.id)
    .eq("user_id", user.id)
    .single()

  if (error || !data) {
    return safeJsonResponse(404, "Research paper not found")
  }

  return NextResponse.json(data)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const parsedParams = paramsSchema.safeParse(await params)
  if (!parsedParams.success) {
    return safeJsonResponse(400, "Invalid paper id")
  }

  const body = await parseJsonSafely<unknown>(request)
  if (!body) {
    return safeJsonResponse(400, "Invalid JSON body")
  }

  const parsedBody = updatePaperSchema.safeParse(body)
  if (!parsedBody.success) {
    return safeJsonResponse(400, "Invalid update payload")
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return safeJsonResponse(401, "Unauthorized")
  }

  const { data: existing, error: existingError } = await supabase
    .from("research_papers")
    .select("id, title, status, current_version, document_json")
    .eq("id", parsedParams.data.id)
    .eq("user_id", user.id)
    .single()

  if (existingError || !existing) {
    return safeJsonResponse(404, "Research paper not found")
  }

  if (existing.current_version !== parsedBody.data.expected_version) {
    return NextResponse.json(
      {
        error: "Version conflict",
        current_version: existing.current_version,
      },
      { status: 409 }
    )
  }

  const nextVersion = existing.current_version + 1
  const now = new Date().toISOString()

  const previousDocument = (existing.document_json || {}) as {
    paper_id?: string
    title?: string
    sections?: Array<{
      id: string
      heading: string
      content_markdown: string
      citations?: Array<{ ref_id: string; label: string }>
      word_count?: number
      last_edited_at?: string
    }>
    references?: unknown[]
  }

  const updatedSections = updateWordCounts(
    (parsedBody.data.sections || previousDocument.sections || []).map((section) => ({
      ...section,
      last_edited_at: now,
      word_count: 0,
    }))
  )

  const title = parsedBody.data.title || existing.title
  const status = parsedBody.data.status || existing.status
  const review = generatePaperReview(updatedSections)

  const nextDocument = {
    ...previousDocument,
    paper_id: existing.id,
    title,
    status,
    version: nextVersion,
    sections: updatedSections,
    review,
  }

  const { error: updateError } = await supabase
    .from("research_papers")
    .update({
      title,
      status,
      current_version: nextVersion,
      document_json: nextDocument,
      review_json: review,
      updated_at: now,
    })
    .eq("id", existing.id)
    .eq("user_id", user.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  const { error: versionError } = await supabase
    .from("research_paper_versions")
    .insert({
      paper_id: existing.id,
      user_id: user.id,
      version: nextVersion,
      snapshot_json: nextDocument,
    })

  if (versionError) {
    return NextResponse.json({ error: versionError.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    current_version: nextVersion,
    document: nextDocument,
    review,
  })
}
