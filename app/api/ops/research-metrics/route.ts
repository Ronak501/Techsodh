import { NextResponse } from "next/server"
import { createAdminClient } from "@/utils/supabase/admin"

const WORKER_TOKEN = process.env.RESEARCH_WORKER_TOKEN

export async function GET(request: Request) {
  const token = request.headers.get("x-worker-token")

  if (!WORKER_TOKEN || token !== WORKER_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createAdminClient()

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from("research_reports")
    .select("status, prompt_tokens, completion_tokens, estimated_cost_usd, latency_ms")
    .gte("created_at", since)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = data || []
  const total = rows.length
  const completed = rows.filter((row) => row.status === "completed").length
  const failed = rows.filter((row) => row.status === "failed").length
  const retrying = rows.filter((row) => row.status === "retrying").length

  const promptTokens = rows.reduce((sum, row) => sum + Number(row.prompt_tokens || 0), 0)
  const completionTokens = rows.reduce(
    (sum, row) => sum + Number(row.completion_tokens || 0),
    0
  )
  const estimatedCostUsd = rows.reduce(
    (sum, row) => sum + Number(row.estimated_cost_usd || 0),
    0
  )

  const latencies = rows
    .map((row) => Number(row.latency_ms || 0))
    .filter((value) => value > 0)
    .sort((a, b) => a - b)

  const p95LatencyMs =
    latencies.length > 0
      ? latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95))]
      : 0

  const failureRate = total > 0 ? failed / total : 0

  const thresholdFailureRate = Number(process.env.RESEARCH_ALERT_FAILURE_RATE || 0.2)
  const thresholdP95Latency = Number(process.env.RESEARCH_ALERT_LATENCY_MS || 20000)
  const thresholdDailyCost = Number(process.env.RESEARCH_ALERT_DAILY_COST_USD || 10)

  return NextResponse.json({
    window_hours: 24,
    total,
    completed,
    failed,
    retrying,
    failure_rate: Number(failureRate.toFixed(4)),
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    estimated_cost_usd: Number(estimatedCostUsd.toFixed(4)),
    p95_latency_ms: p95LatencyMs,
    alerts: {
      failure_rate_exceeded: failureRate > thresholdFailureRate,
      p95_latency_exceeded: p95LatencyMs > thresholdP95Latency,
      daily_cost_exceeded: estimatedCostUsd > thresholdDailyCost,
    },
    thresholds: {
      failure_rate: thresholdFailureRate,
      p95_latency_ms: thresholdP95Latency,
      daily_cost_usd: thresholdDailyCost,
    },
  })
}
