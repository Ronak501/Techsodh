import { NextResponse } from "next/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { runResearchPipeline, type ResearchMode } from "@/lib/research-engine"
import type { ResearchSettings, ResearchTemplate } from "@/lib/research-types"

const WORKER_TOKEN = process.env.RESEARCH_WORKER_TOKEN

export async function POST(request: Request) {
  const token = request.headers.get("x-worker-token")

  if (!WORKER_TOKEN || token !== WORKER_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createAdminClient()

  const nowIso = new Date().toISOString()

  const { data: jobs, error: jobsError } = await supabase
    .from("research_reports")
    .select("id, user_id, query, retry_count, max_retries, job_payload")
    .in("status", ["queued", "retrying"])
    .or(`next_retry_at.is.null,next_retry_at.lte.${nowIso}`)
    .order("created_at", { ascending: true })
    .limit(5)

  if (jobsError) {
    return NextResponse.json({ error: jobsError.message }, { status: 500 })
  }

  const processed: Array<{ id: string; status: string; retry_count: number }> = []

  for (const job of jobs || []) {
    const payload = (job.job_payload || {}) as {
      query?: string
      mode?: ResearchMode
      template?: ResearchTemplate
      settings?: ResearchSettings
    }

    if (!payload.query || !payload.mode || !payload.template || !payload.settings) {
      await supabase
        .from("research_reports")
        .update({
          status: "failed",
          last_error: "Invalid job payload",
          finished_at: new Date().toISOString(),
        })
        .eq("id", job.id)

      processed.push({ id: job.id, status: "failed", retry_count: job.retry_count || 0 })
      continue
    }

    await supabase
      .from("research_reports")
      .update({
        status: "in_progress",
        started_at: new Date().toISOString(),
      })
      .eq("id", job.id)

    try {
      const startedAt = Date.now()
      const pipeline = await runResearchPipeline({
        query: payload.query,
        mode: payload.mode,
        template: payload.template,
        settings: payload.settings,
      })

      await supabase
        .from("research_reports")
        .update({
          status: "completed",
          outline: pipeline.outline,
          report: pipeline.report,
          source_count: Array.isArray(pipeline.report.references)
            ? pipeline.report.references.length
            : 0,
          prompt_tokens: pipeline.usage.prompt_tokens,
          completion_tokens: pipeline.usage.completion_tokens,
          estimated_cost_usd: pipeline.usage.estimated_cost_usd,
          cache_key: pipeline.cacheKey,
          finished_at: new Date().toISOString(),
          latency_ms: Date.now() - startedAt,
        })
        .eq("id", job.id)

      processed.push({ id: job.id, status: "completed", retry_count: job.retry_count || 0 })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Worker execution failed"
      const nextRetryCount = (job.retry_count || 0) + 1
      const canRetry = nextRetryCount <= (job.max_retries || 2)

      await supabase
        .from("research_reports")
        .update({
          status: canRetry ? "retrying" : "failed",
          retry_count: nextRetryCount,
          next_retry_at: canRetry
            ? new Date(Date.now() + nextRetryCount * 60 * 1000).toISOString()
            : null,
          last_error: message,
          error_message: message,
          finished_at: canRetry ? null : new Date().toISOString(),
        })
        .eq("id", job.id)

      console.error(error)
      processed.push({
        id: job.id,
        status: canRetry ? "retrying" : "failed",
        retry_count: nextRetryCount,
      })
    }
  }

  return NextResponse.json({ processed_count: processed.length, processed })
}
