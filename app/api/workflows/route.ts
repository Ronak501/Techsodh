import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/utils/supabase/server"
import { safeJsonResponse } from "@/lib/api-security"
import type { WorkflowStep } from "@/lib/research-types"

const workflowStepSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  type: z.enum(["research", "condition", "transform", "merge"]),
  config: z.record(z.unknown()),
  next_step_id: z.string().optional(),
})

const workflowSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  steps: z.array(workflowStepSchema),
  is_public: z.boolean().default(false),
})

// GET - Fetch workflows
export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { searchParams } = new URL(request.url)

  try {
    const my_workflows = searchParams.get("my_workflows") === "true"
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)

    let query = supabase
      .from("workflow_definitions")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(limit)

    if (my_workflows && user) {
      query = query.eq("created_by_user_id", user.id)
    } else {
      query = query.eq("is_public", true)
    }

    const { data: workflows, error } = await query

    if (error) {
      return safeJsonResponse(400, "Failed to fetch workflows", error.message)
    }

    return NextResponse.json(workflows || [])
  } catch (error) {
    return safeJsonResponse(500, "Internal server error", String(error))
  }
}

// POST - Create a new workflow
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return safeJsonResponse(401, "Unauthorized")
  }

  try {
    const body = await request.json()
    const validation = workflowSchema.safeParse(body)

    if (!validation.success) {
      return safeJsonResponse(400, "Invalid input", validation.error.errors)
    }

    const { data: workflow, error } = await supabase
      .from("workflow_definitions")
      .insert({
        ...validation.data,
        created_by_user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      return safeJsonResponse(400, "Failed to create workflow", error.message)
    }

    return NextResponse.json(workflow)
  } catch (error) {
    return safeJsonResponse(500, "Internal server error", String(error))
  }
}
