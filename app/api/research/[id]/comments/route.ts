import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/utils/supabase/server"
import { safeJsonResponse, enforceRateLimit, getRequestIp } from "@/lib/api-security"

const commentSchema = z.object({
  section: z.string().min(1).max(100),
  content: z.string().min(1).max(5000),
  parent_comment_id: z.string().uuid().optional(),
})

// POST - Create a new comment
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
    const limiter = await enforceRateLimit({
      supabase,
      scope: "comments",
      userId: user.id,
      ip: getRequestIp(request),
      limit: 100,
      windowMs: 60 * 60 * 1000,
    })

    if (!limiter.ok) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429, headers: { "Retry-After": String(limiter.retryAfterSeconds) } }
      )
    }

    const body = await request.json()
    const validation = commentSchema.safeParse(body)

    if (!validation.success) {
      return safeJsonResponse(400, "Invalid input", validation.error.errors)
    }

    // Check if user has access to this research
    const { data: research } = await supabase
      .from("research_reports")
      .select("id")
      .eq("id", id)
      .single()

    if (!research) {
      return safeJsonResponse(404, "Research not found")
    }

    // Check access permission
    const { data: share } = await supabase
      .from("research_shares")
      .select("permission_level")
      .eq("research_id", id)
      .eq("shared_with_user_id", user.id)
      .single()

    const isOwner = await supabase
      .from("research_reports")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    const canComment =
      !!isOwner.data ||
      share?.permission_level === "comment" ||
      share?.permission_level === "edit"

    if (!canComment) {
      return safeJsonResponse(403, "Access denied")
    }

    // Create comment
    const { data: comment, error } = await supabase
      .from("research_comments")
      .insert({
        research_id: id,
        user_id: user.id,
        ...validation.data,
      })
      .select()
      .single()

    if (error) {
      return safeJsonResponse(400, "Failed to create comment", error.message)
    }

    return NextResponse.json(comment)
  } catch (error) {
    return safeJsonResponse(500, "Internal server error", String(error))
  }
}

// GET - Fetch comments for a research project
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  try {
    const { data: comments, error } = await supabase
      .from("research_comments")
      .select(
        `
        *,
        author:user_id (
          id,
          email
        )
      `
      )
      .eq("research_id", id)
      .is("parent_comment_id", null)
      .order("created_at", { ascending: false })

    if (error) {
      return safeJsonResponse(400, "Failed to fetch comments", error.message)
    }

    // Fetch replies for each comment
    const commentsWithReplies = await Promise.all(
      (comments || []).map(async (comment) => {
        const { data: replies } = await supabase
          .from("research_comments")
          .select(
            `
            *,
            author:user_id (
              id,
              email
            )
          `
          )
          .eq("parent_comment_id", comment.id)
          .order("created_at", { ascending: true })

        return {
          ...comment,
          replies: replies || [],
        }
      })
    )

    return NextResponse.json(commentsWithReplies)
  } catch (error) {
    return safeJsonResponse(500, "Internal server error", String(error))
  }
}

// PUT - Update comment
export async function PUT(
  request: Request,
  { params }: { params: { id: string; commentId: string } }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return safeJsonResponse(401, "Unauthorized")
  }

  try {
    const body = await request.json()

    // Verify user owns the comment
    const { data: comment, error: fetchError } = await supabase
      .from("research_comments")
      .select("user_id")
      .eq("id", params.commentId)
      .eq("research_id", params.id)
      .single()

    if (fetchError || !comment) {
      return safeJsonResponse(404, "Comment not found")
    }

    if (comment.user_id !== user.id) {
      return safeJsonResponse(403, "Access denied")
    }

    // Update comment
    const { data: updated, error } = await supabase
      .from("research_comments")
      .update({
        content: body.content,
        resolved: body.resolved,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.commentId)
      .select()
      .single()

    if (error) {
      return safeJsonResponse(400, "Failed to update comment", error.message)
    }

    return NextResponse.json(updated)
  } catch (error) {
    return safeJsonResponse(500, "Internal server error", String(error))
  }
}

// DELETE - Delete comment
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; commentId: string } }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return safeJsonResponse(401, "Unauthorized")
  }

  try {
    // Verify user owns the comment
    const { data: comment } = await supabase
      .from("research_comments")
      .select("user_id")
      .eq("id", params.commentId)
      .eq("research_id", params.id)
      .single()

    if (!comment || comment.user_id !== user.id) {
      return safeJsonResponse(403, "Access denied")
    }

    // Delete comment and all replies
    await supabase.from("research_comments").delete().eq("parent_comment_id", params.commentId)

    const { error } = await supabase
      .from("research_comments")
      .delete()
      .eq("id", params.commentId)

    if (error) {
      return safeJsonResponse(400, "Failed to delete comment", error.message)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return safeJsonResponse(500, "Internal server error", String(error))
  }
}
