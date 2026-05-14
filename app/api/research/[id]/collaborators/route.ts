import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/utils/supabase/server"
import { safeJsonResponse } from "@/lib/api-security"

const collaboratorUpdateSchema = z.object({
  cursor_position: z.number().int().optional(),
  selected_section: z.string().optional(),
})

// POST - Register collaborator or update presence
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return safeJsonResponse(401, "Unauthorized")
  }

  try {
    const body = await request.json()
    const validation = collaboratorUpdateSchema.safeParse(body)

    if (!validation.success) {
      return safeJsonResponse(400, "Invalid input", validation.error.errors)
    }

    // Verify research exists
    const { data: research } = await supabase
      .from("research_reports")
      .select("id")
      .eq("id", id)
      .single()

    if (!research) {
      return safeJsonResponse(404, "Research not found")
    }

    // Check access - user must own or have edit permission
    const { data: owned } = await supabase
      .from("research_reports")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    const { data: shared } = await supabase
      .from("research_shares")
      .select("permission_level")
      .eq("research_id", id)
      .eq("shared_with_user_id", user.id)
      .in("permission_level", ["edit", "comment"])
      .single()

    if (!owned && !shared) {
      return safeJsonResponse(403, "Access denied")
    }

    // Upsert collaborator record
    const { data: collaborator, error } = await supabase
      .from("research_collaborators")
      .upsert({
        research_id: id,
        user_id: user.id,
        ...validation.data,
        last_active: new Date().toISOString(),
      }, { onConflict: "research_id,user_id" })
      .select()
      .single()

    if (error) {
      return safeJsonResponse(400, "Failed to update collaborator", error.message)
    }

    return NextResponse.json(collaborator)
  } catch (error) {
    return safeJsonResponse(500, "Internal server error", String(error))
  }
}

// GET - Fetch active collaborators
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    const { data: collaborators, error } = await supabase
      .from("research_collaborators")
      .select("*, user:user_id(id, email)")
      .eq("research_id", id)
      .gt("last_active", fiveMinutesAgo)
      .order("last_active", { ascending: false })

    if (error) {
      return safeJsonResponse(400, "Failed to fetch collaborators", error.message)
    }

    return NextResponse.json(collaborators || [])
  } catch (error) {
    return safeJsonResponse(500, "Internal server error", String(error))
  }
}

// DELETE - Remove collaborator (cleanup)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return safeJsonResponse(401, "Unauthorized")
  }

  try {
    const { error } = await supabase
      .from("research_collaborators")
      .delete()
      .eq("research_id", id)
      .eq("user_id", user.id)

    if (error) {
      return safeJsonResponse(400, "Failed to remove collaborator", error.message)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return safeJsonResponse(500, "Internal server error", String(error))
  }
}
