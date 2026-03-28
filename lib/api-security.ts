import { NextResponse } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"

type RateLimitConfig = {
  supabase: SupabaseClient
  scope: string
  userId: string
  ip: string
  limit: number
  windowMs: number
}

export function getRequestIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown"
  }

  return request.headers.get("x-real-ip") || "unknown"
}

export function safeJsonResponse(status: number, error: string) {
  return NextResponse.json({ error }, { status })
}

export async function parseJsonSafely<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T
  } catch {
    return null
  }
}

export async function enforceRateLimit(config: RateLimitConfig) {
  const windowStart = new Date(
    Math.floor(Date.now() / config.windowMs) * config.windowMs
  ).toISOString()

  const rateKey = `${config.scope}:${config.userId}:${config.ip}`

  const { data, error } = await config.supabase.rpc("consume_rate_limit", {
    p_key: rateKey,
    p_user_id: config.userId,
    p_ip: config.ip,
    p_scope: config.scope,
    p_window_start: windowStart,
    p_window_ms: config.windowMs,
    p_limit: config.limit,
  })

  if (error) {
    console.error("Rate limit RPC failed:", error.message)
    // Fail-open to avoid taking down the app if rate limit storage is unavailable.
    return { ok: true as const, retryAfterSeconds: 0 }
  }

  const row = Array.isArray(data) ? data[0] : null
  if (!row) {
    return { ok: true as const, retryAfterSeconds: 0 }
  }

  return {
    ok: Boolean(row.allowed),
    retryAfterSeconds: Number(row.retry_after_seconds || 0),
  }
}
