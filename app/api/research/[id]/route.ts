import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/utils/supabase/server"
import { safeJsonResponse } from "@/lib/api-security"

const paramsSchema = z.object({
  id: z.string().uuid(),
})

export async function GET(
  _request: Request,
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
    .select("id, query, status, research_mode, template, output_style, depth, model_name, prompt_tokens, completion_tokens, estimated_cost_usd, outline, report, humanized_report, humanization_used, source_count, latency_ms, created_at, updated_at")
    .eq("id", parsedParams.data.id)
    .eq("user_id", user.id)
    .single()

  if (error || !data) {
    return safeJsonResponse(404, "Research report not found")
  }

  return NextResponse.json(data)
}
