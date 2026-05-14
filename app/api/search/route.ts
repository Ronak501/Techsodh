import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/utils/supabase/server"
import { safeJsonResponse } from "@/lib/api-security"

const searchSchema = z.object({
  query: z.string().min(2).max(500),
  tags: z.array(z.string()).optional(),
  author_id: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  sort: z.enum(["relevance", "newest", "most_viewed", "most_cited"]).default("relevance"),
})

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  try {
    // Parse query parameters
    const query = searchParams.get("query")
    const tags = searchParams.getAll("tags")
    const author_id = searchParams.get("author_id")
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100)
    const offset = parseInt(searchParams.get("offset") || "0")
    const sort = (searchParams.get("sort") as "relevance" | "newest" | "most_viewed" | "most_cited") || "relevance"

    if (!query) {
      return safeJsonResponse(400, "Query parameter required")
    }

    // Build search query
    let searchQuery = supabase
      .from("research_search_index")
      .select(
        `
        id,
        research_id,
        title,
        topic,
        summary_text,
        tags,
        author_id,
        is_public,
        view_count,
        citation_count,
        created_at,
        updated_at
      `,
        { count: "exact" }
      )
      .eq("is_public", true)

    // Add full-text search
    if (query) {
      searchQuery = searchQuery.textSearch("full_text_index", query)
    }

    // Filter by tags
    if (tags.length > 0) {
      searchQuery = searchQuery.overlaps("tags", tags)
    }

    // Filter by author if specified
    if (author_id) {
      searchQuery = searchQuery.eq("author_id", author_id)
    }

    // Apply sorting
    switch (sort) {
      case "newest":
        searchQuery = searchQuery.order("created_at", { ascending: false })
        break
      case "most_viewed":
        searchQuery = searchQuery.order("view_count", { ascending: false })
        break
      case "most_cited":
        searchQuery = searchQuery.order("citation_count", { ascending: false })
        break
      case "relevance":
      default:
        // PostgreSQL's text search ranking
        searchQuery = searchQuery.order("created_at", { ascending: false })
    }

    // Apply pagination
    searchQuery = searchQuery.range(offset, offset + limit - 1)

    const { data: results, error, count } = await searchQuery

    if (error) {
      return safeJsonResponse(400, "Search failed", error.message)
    }

    return NextResponse.json({
      results: results || [],
      total: count || 0,
      limit,
      offset,
      hasMore: (offset + limit) < (count || 0),
    })
  } catch (error) {
    return safeJsonResponse(500, "Internal server error", String(error))
  }
}

// Update search index when research is created/updated
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return safeJsonResponse(401, "Unauthorized")
  }

  try {
    const { research_id, is_public } = await request.json()

    // Fetch the research record
    const { data: research, error: fetchError } = await supabase
      .from("research_reports")
      .select("id, query, user_id")
      .eq("id", research_id)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !research) {
      return safeJsonResponse(404, "Research not found")
    }

    // Upsert into search index
    const { error: indexError } = await supabase
      .from("research_search_index")
      .upsert({
        research_id,
        title: research.query || "Untitled Research",
        topic: research.query,
        author_id: user.id,
        is_public: is_public || false,
        updated_at: new Date().toISOString(),
      }, { onConflict: "research_id" })

    if (indexError) {
      return safeJsonResponse(400, "Failed to update search index", indexError.message)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return safeJsonResponse(500, "Internal server error", String(error))
  }
}
