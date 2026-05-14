import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/utils/supabase/server"
import { safeJsonResponse } from "@/lib/api-security"
import type { PermissionLevel } from "@/lib/research-types"

const shareResearchSchema = z.object({
  shared_with_email: z.string().email().optional(),
  shared_with_user_id: z.string().uuid().optional(),
  permission_level: z.enum(["view", "comment", "edit"]),
  expires_in_days: z.number().int().min(1).max(365).optional(),
})

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
    const validation = shareResearchSchema.safeParse(body)

    if (!validation.success) {
      return safeJsonResponse(400, "Invalid input", validation.error.errors)
    }

    const { shared_with_email, shared_with_user_id, permission_level, expires_in_days } = validation.data

    // Verify user owns this research
    const { data: research, error: researchError } = await supabase
      .from("research_reports")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (researchError || !research) {
      return safeJsonResponse(403, "Research not found or access denied")
    }

    // Create share record
    let expires_at: string | null = null
    if (expires_in_days) {
      const expireDate = new Date()
      expireDate.setDate(expireDate.getDate() + expires_in_days)
      expires_at = expireDate.toISOString()
    }

    const { data: share, error: shareError } = await supabase
      .from("research_shares")
      .insert({
        research_id: id,
        owner_id: user.id,
        shared_with_email,
        shared_with_user_id,
        permission_level,
        expires_at,
      })
      .select()
      .single()

    if (shareError) {
      return safeJsonResponse(400, "Failed to create share", shareError.message)
    }

    return NextResponse.json(share)
  } catch (error) {
    return safeJsonResponse(500, "Internal server error", String(error))
  }
}

// GET all shares for a research project
export async function GET(
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
    // Verify user owns this research
    const { data: research } = await supabase
      .from("research_reports")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (!research) {
      return safeJsonResponse(403, "Research not found or access denied")
    }

    // Get all shares
    const { data: shares, error } = await supabase
      .from("research_shares")
      .select("*")
      .eq("research_id", id)
      .order("created_at", { ascending: false })

    if (error) {
      return safeJsonResponse(400, "Failed to fetch shares", error.message)
    }

    return NextResponse.json(shares)
  } catch (error) {
    return safeJsonResponse(500, "Internal server error", String(error))
  }
}

// DELETE a share
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; shareId: string } }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return safeJsonResponse(401, "Unauthorized")
  }

  try {
    // Verify user owns this research
    const { data: research } = await supabase
      .from("research_reports")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single()

    if (!research) {
      return safeJsonResponse(403, "Research not found or access denied")
    }

    // Delete share
    const { error } = await supabase
      .from("research_shares")
      .delete()
      .eq("id", params.shareId)
      .eq("research_id", params.id)

    if (error) {
      return safeJsonResponse(400, "Failed to delete share", error.message)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return safeJsonResponse(500, "Internal server error", String(error))
  }
}
