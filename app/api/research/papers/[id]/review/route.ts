import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/utils/supabase/server"
import { safeJsonResponse } from "@/lib/api-security"
import { generatePaperReview } from "@/lib/research-paper"

const paramsSchema = z.object({
  id: z.string().uuid(),
})

export async function POST(
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

  const { data: paper, error } = await supabase
    .from("research_papers")
    .select("id, user_id, document_json")
    .eq("id", parsedParams.data.id)
    .eq("user_id", user.id)
    .single()

  if (error || !paper) {
    return safeJsonResponse(404, "Research paper not found")
  }

  const document = (paper.document_json || {}) as {
    sections?: Array<{
      id: string
      heading: string
      content_markdown: string
      citations?: Array<{ ref_id: string; label: string }>
      word_count: number
      last_edited_at: string
    }>
  }

  const review = generatePaperReview(document.sections || [])

  const { error: updateError } = await supabase
    .from("research_papers")
    .update({
      review_json: review,
      document_json: {
        ...document,
        review,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", paper.id)
    .eq("user_id", user.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, review })
}
