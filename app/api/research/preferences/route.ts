import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/utils/supabase/server"
import { parseJsonSafely, safeJsonResponse } from "@/lib/api-security"

const preferencesSchema = z.object({
  preferred_template: z.enum([
    "literature_review",
    "technical_report",
    "claim_verification",
  ]),
  output_style: z.enum(["balanced", "concise", "detailed"]),
  depth: z.enum(["standard", "deep"]),
  model_name: z.string().trim().min(1).max(100),
})

const defaultPreferences = {
  preferred_template: "literature_review",
  output_style: "balanced",
  depth: "standard",
  model_name: "gemini-default",
}

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return safeJsonResponse(401, "Unauthorized")
  }

  const { data, error } = await supabase
    .from("research_user_preferences")
    .select("preferred_template, output_style, depth, model_name")
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) {
    return safeJsonResponse(500, error.message)
  }

  return NextResponse.json(data || defaultPreferences)
}

export async function PATCH(request: Request) {
  const body = await parseJsonSafely<unknown>(request)
  if (!body) {
    return safeJsonResponse(400, "Invalid JSON body")
  }

  const parsed = preferencesSchema.safeParse(body)
  if (!parsed.success) {
    return safeJsonResponse(400, "Invalid preferences payload")
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return safeJsonResponse(401, "Unauthorized")
  }

  const { error } = await supabase
    .from("research_user_preferences")
    .upsert(
      {
        user_id: user.id,
        ...parsed.data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )

  if (error) {
    return safeJsonResponse(500, error.message)
  }

  return NextResponse.json({ success: true })
}
