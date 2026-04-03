import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/utils/supabase/server"
import { parseJsonSafely, safeJsonResponse } from "@/lib/api-security"

const paramsSchema = z.object({
  id: z.string().uuid(),
})

const feedbackSchema = z.object({
  rating: z.enum(["helpful", "needs_work", "wrong"]),
  note: z.string().trim().max(1000).optional(),
})

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
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
    .from("research_report_feedback")
    .select("id, report_id, rating, note, created_at, updated_at")
    .eq("report_id", parsedParams.data.id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ feedback: data || null })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const parsedParams = paramsSchema.safeParse(await params)
  if (!parsedParams.success) {
    return safeJsonResponse(400, "Invalid research id")
  }

  const body = await parseJsonSafely<unknown>(request)
  if (!body) {
    return safeJsonResponse(400, "Invalid JSON body")
  }

  const parsedBody = feedbackSchema.safeParse(body)
  if (!parsedBody.success) {
    return safeJsonResponse(400, "Invalid feedback payload")
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return safeJsonResponse(401, "Unauthorized")
  }

  const { data: report, error: reportError } = await supabase
    .from("research_reports")
    .select("id")
    .eq("id", parsedParams.data.id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (reportError || !report) {
    return safeJsonResponse(404, "Research report not found")
  }

  const { error } = await supabase.from("research_report_feedback").upsert(
    {
      report_id: parsedParams.data.id,
      user_id: user.id,
      rating: parsedBody.data.rating,
      note: parsedBody.data.note || null,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "report_id,user_id",
    },
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    rating: parsedBody.data.rating,
  })
}