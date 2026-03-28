import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/utils/supabase/server"
import { parseJsonSafely, safeJsonResponse } from "@/lib/api-security"
import { mergeSettings, resolveTemplate, type ResearchMode } from "@/lib/research-engine"
import type { ResearchSettings, ResearchTemplate } from "@/lib/research-types"

const enqueueSchema = z.object({
  query: z.string().trim().min(5).max(2000),
  mode: z.enum(["topic", "claim"]).default("topic"),
  template: z
    .enum(["literature_review", "technical_report", "claim_verification"])
    .optional(),
  settings: z
    .object({
      output_style: z.enum(["balanced", "concise", "detailed"]),
      depth: z.enum(["standard", "deep"]),
      model_name: z.string().trim().min(1).max(100),
    })
    .optional(),
  max_retries: z.number().int().min(0).max(5).optional(),
})

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return safeJsonResponse(401, "Unauthorized")
  }

  const { data, error } = await supabase
    .from("research_reports")
    .select("id, query, status, retry_count, max_retries, created_at, started_at, finished_at")
    .eq("user_id", user.id)
    .in("status", ["queued", "in_progress", "retrying"])
    .order("created_at", { ascending: false })

  if (error) {
    return safeJsonResponse(500, error.message)
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const body = await parseJsonSafely<unknown>(request)
  if (!body) {
    return safeJsonResponse(400, "Invalid JSON body")
  }

  const parsed = enqueueSchema.safeParse(body)
  if (!parsed.success) {
    return safeJsonResponse(400, "Invalid job payload")
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return safeJsonResponse(401, "Unauthorized")
  }

  const { query, mode, template: explicitTemplate, settings: explicitSettings } = parsed.data

  const { data: pref } = await supabase
    .from("research_user_preferences")
    .select("preferred_template, output_style, depth, model_name")
    .eq("user_id", user.id)
    .maybeSingle()

  const settings: ResearchSettings = mergeSettings(pref, explicitSettings)
  const template: ResearchTemplate = resolveTemplate(
    mode as ResearchMode,
    explicitTemplate,
    pref?.preferred_template as ResearchTemplate | undefined
  )

  const payload = {
    query,
    mode,
    template,
    settings,
  }

  const { data, error } = await supabase
    .from("research_reports")
    .insert([
      {
        user_id: user.id,
        query,
        status: "queued",
        research_mode: mode,
        template,
        output_style: settings.output_style,
        depth: settings.depth,
        model_name: settings.model_name,
        max_retries: parsed.data.max_retries ?? 2,
        job_payload: payload,
      },
    ])
    .select("id, status, created_at")
    .single()

  if (error) {
    return safeJsonResponse(500, error.message)
  }

  return NextResponse.json(data)
}
