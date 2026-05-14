import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/utils/supabase/server"
import { parseJsonSafely, safeJsonResponse } from "@/lib/api-security"
import {
  buildReferenceList,
  buildSectionsFromReport,
  generatePaperReview,
  updateWordCounts,
} from "@/lib/research-paper"

const createPaperSchema = z.object({
  report_id: z.string().uuid(),
  title: z.string().trim().min(3).max(500).optional(),
})

export async function GET(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return safeJsonResponse(401, "Unauthorized")
  }

  const url = new URL(request.url)
  const reportId = url.searchParams.get("report_id")

  let query = supabase
    .from("research_papers")
    .select("id, source_report_id, title, status, current_version, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })

  if (reportId) {
    query = query.eq("source_report_id", reportId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ papers: data || [] })
}

export async function POST(request: Request) {
  const body = await parseJsonSafely<unknown>(request)
  if (!body) {
    return safeJsonResponse(400, "Invalid JSON body")
  }

  const parsedBody = createPaperSchema.safeParse(body)
  if (!parsedBody.success) {
    return safeJsonResponse(400, "Invalid paper payload")
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return safeJsonResponse(401, "Unauthorized")
  }

  const reportId = parsedBody.data.report_id

  const { data: existingPaper } = await supabase
    .from("research_papers")
    .select("id")
    .eq("source_report_id", reportId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (existingPaper) {
    return NextResponse.json({ paper_id: existingPaper.id, created: false })
  }

  const { data: report, error: reportError } = await supabase
    .from("research_reports")
    .select("id, query, report")
    .eq("id", reportId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (reportError || !report) {
    return safeJsonResponse(404, "Research report not found")
  }

  const sections = buildSectionsFromReport(report.report || {})
  const normalizedSections = updateWordCounts(sections)
  const references = buildReferenceList(report.report?.references)
  const review = generatePaperReview(normalizedSections)

  const documentJson = {
    paper_id: "",
    title: parsedBody.data.title || `${report.query} - Draft Paper`,
    version: 1,
    status: "draft",
    sections: normalizedSections,
    references,
    review,
  }

  const now = new Date().toISOString()

  const { data: insertedPaper, error: insertError } = await supabase
    .from("research_papers")
    .insert({
      user_id: user.id,
      source_report_id: report.id,
      title: documentJson.title,
      status: "draft",
      current_version: 1,
      document_json: documentJson,
      review_json: review,
      updated_at: now,
    })
    .select("id")
    .single()

  if (insertError || !insertedPaper) {
    return NextResponse.json(
      { error: insertError?.message || "Failed to create paper" },
      { status: 500 }
    )
  }

  documentJson.paper_id = insertedPaper.id

  const { error: patchError } = await supabase
    .from("research_papers")
    .update({
      document_json: documentJson,
      updated_at: now,
    })
    .eq("id", insertedPaper.id)
    .eq("user_id", user.id)

  if (patchError) {
    return NextResponse.json({ error: patchError.message }, { status: 500 })
  }

  const { error: versionError } = await supabase
    .from("research_paper_versions")
    .insert({
      paper_id: insertedPaper.id,
      user_id: user.id,
      version: 1,
      snapshot_json: documentJson,
    })

  if (versionError) {
    return NextResponse.json({ error: versionError.message }, { status: 500 })
  }

  return NextResponse.json({ paper_id: insertedPaper.id, created: true })
}
