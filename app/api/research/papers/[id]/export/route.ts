import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/utils/supabase/server"
import { safeJsonResponse } from "@/lib/api-security"
import { toMarkdownDocument } from "@/lib/research-paper"

const paramsSchema = z.object({
  id: z.string().uuid(),
})

function getSafeFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "research-paper"
}

export async function GET(
  request: Request,
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

  const { data, error } = await supabase
    .from("research_papers")
    .select("id, title, document_json")
    .eq("id", parsedParams.data.id)
    .eq("user_id", user.id)
    .single()

  if (error || !data) {
    return safeJsonResponse(404, "Research paper not found")
  }

  const format = new URL(request.url).searchParams.get("format") || "markdown"
  const document = (data.document_json || {}) as {
    sections?: Array<{ id: string; heading: string; content_markdown: string }>
    references?: Array<{ id: string; title: string; authors?: string[]; year?: number; url?: string }>
  }

  const payload = {
    title: data.title,
    sections: document.sections || [],
    references: document.references || [],
  }

  if (format === "json") {
    return NextResponse.json({
      paper_id: data.id,
      ...payload,
    })
  }

  const markdown = toMarkdownDocument(payload)
  const safeName = getSafeFileName(data.title)

  return new NextResponse(markdown, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeName}.md"`,
    },
  })
}
