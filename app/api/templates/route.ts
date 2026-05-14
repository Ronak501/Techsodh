import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/utils/supabase/server"
import { safeJsonResponse } from "@/lib/api-security"
import type { TemplateCategory, ResearchSettings } from "@/lib/research-types"

const templateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.enum([
    "literature_review",
    "technical_report",
    "claim_verification",
    "market_analysis",
    "competitor_analysis",
    "trend_research",
    "custom",
  ]),
  prompt_template: z.string().min(10).max(5000),
  settings: z.object({
    output_style: z.enum(["balanced", "concise", "detailed"]),
    depth: z.enum(["standard", "deep"]),
    model_name: z.string(),
  }),
  tags: z.array(z.string()).max(10).optional(),
  is_public: z.boolean().default(false),
})

// GET - Fetch templates
export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  try {
    const category = searchParams.get("category")
    const is_public = searchParams.get("is_public") === "true"
    const user_created = searchParams.get("user_created") === "true"
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)

    let query = supabase.from("research_templates").select("*")

    if (category) {
      query = query.eq("category", category)
    }

    if (is_public) {
      query = query.eq("is_public", true)
    } else if (user_created) {
      query = query.eq("template_type", "user")
    } else {
      // Default: show system templates
      query = query.eq("template_type", "system")
    }

    query = query
      .order("usage_count", { ascending: false })
      .limit(limit)

    const { data: templates, error } = await query

    if (error) {
      return safeJsonResponse(400, "Failed to fetch templates", error.message)
    }

    return NextResponse.json(templates || [])
  } catch (error) {
    return safeJsonResponse(500, "Internal server error", String(error))
  }
}

// POST - Create a new template
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  try {
    const body = await request.json()
    const validation = templateSchema.safeParse(body)

    if (!validation.success) {
      return safeJsonResponse(400, "Invalid input", validation.error.errors)
    }

    const { data: template, error } = await supabase
      .from("research_templates")
      .insert({
        ...validation.data,
        template_type: "user",
        created_by_user_id: user?.id,
        tags: validation.data.tags || [],
      })
      .select()
      .single()

    if (error) {
      return safeJsonResponse(400, "Failed to create template", error.message)
    }

    return NextResponse.json(template)
  } catch (error) {
    return safeJsonResponse(500, "Internal server error", String(error))
  }
}
