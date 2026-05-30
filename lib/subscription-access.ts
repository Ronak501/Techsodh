import type { SupabaseClient } from "@supabase/supabase-js"

type SubscriptionPlan = "free" | "pro" | "premium"
type SubscriptionStatus = "inactive" | "active" | "canceled" | "past_due"

type UserSubscriptionRow = {
  user_id: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  current_period_start: string | null
  current_period_end: string | null
}

type UsageRow = {
  user_id: string
  usage_month: string
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

export type SubscriptionGuardResult =
  | {
      ok: true
      plan: SubscriptionPlan
      monthlyLimit: number
      currentUsage: number
      remainingTokens: number
      usageMonth: string
    }
  | {
      ok: false
      status: number
      payload: {
        error: string
        code: "SUBSCRIPTION_REQUIRED" | "TOKEN_LIMIT_EXCEEDED"
        upgrade_url: string
        details?: Record<string, unknown>
      }
    }

const PLAN_LIMITS: Record<SubscriptionPlan, number> = {
  free: Number(process.env.SUBSCRIPTION_FREE_MONTHLY_TOKEN_LIMIT || 10000),
  pro: Number(process.env.SUBSCRIPTION_PRO_MONTHLY_TOKEN_LIMIT || 400000),
  premium: Number(process.env.SUBSCRIPTION_PREMIUM_MONTHLY_TOKEN_LIMIT || 1500000),
}

function getUsageMonth(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`
}

async function getSubscription(
  supabase: SupabaseClient,
  userId: string
): Promise<UserSubscriptionRow | null> {
  const { data, error } = await supabase
    .from("user_subscriptions")
    .select("user_id, plan, status, current_period_start, current_period_end")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load subscription: ${error.message}`)
  }

  return (data as UserSubscriptionRow | null) || null
}

async function getMonthlyUsage(
  supabase: SupabaseClient,
  userId: string,
  usageMonth: string
): Promise<UsageRow | null> {
  const { data, error } = await supabase
    .from("user_monthly_token_usage")
    .select("user_id, usage_month, prompt_tokens, completion_tokens, total_tokens")
    .eq("user_id", userId)
    .eq("usage_month", usageMonth)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load token usage: ${error.message}`)
  }

  return (data as UsageRow | null) || null
}

export function estimateTokensFromText(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return 0

  // Approximation: ~4 chars/token + a small floor for short prompts.
  return Math.max(1, Math.ceil(trimmed.length / 4))
}

export async function enforceSubscriptionAndTokenAccess(
  supabase: SupabaseClient,
  params: {
    userId: string
    requestedTokens: number
    feature: "chat" | "research" | "humanize"
  }
): Promise<SubscriptionGuardResult> {
  const upgradeUrl = "/price"
  const usageMonth = getUsageMonth()
  const requestedTokens = Math.max(0, Math.ceil(params.requestedTokens))
  const subscription = await getSubscription(supabase, params.userId)

  const isActivePaidSubscription =
    subscription &&
    subscription.status === "active" &&
    (subscription.plan === "pro" || subscription.plan === "premium")

  // One-time free trial logic:
  // - New users (no subscription row AND no prior usage rows) get a single free request
  // - Trial token limit can be configured via `TRIAL_FREE_TOKENS`
  const TRIAL_TOKENS = Number(process.env.TRIAL_FREE_TOKENS || 4000)

  if (!isActivePaidSubscription) {
    // If there's no subscription record and no prior usage, allow a single trial
    let everUsed = false

    if (!subscription) {
      const { data: anyData, error: anyErr } = await supabase
        .from("user_monthly_token_usage")
        .select("user_id")
        .eq("user_id", params.userId)
        .limit(1)

      if (anyErr) {
        throw new Error(`Failed to check trial usage: ${anyErr.message}`)
      }

      everUsed = Array.isArray(anyData) && anyData.length > 0
    } else {
      // User has a subscription row but it's not an active paid plan — treat as non-new
      everUsed = true
    }

    if (!everUsed) {
      // Allow the one-time trial request (bounded by a token limit)
      if (requestedTokens > TRIAL_TOKENS) {
        return {
          ok: false,
          status: 402,
          payload: {
            error: `Trial allows up to ${TRIAL_TOKENS} tokens. Please purchase a plan to continue.`,
            code: "SUBSCRIPTION_REQUIRED",
            upgrade_url: upgradeUrl,
            details: {
              trial_limit: TRIAL_TOKENS,
              requested_tokens: requestedTokens,
              feature: params.feature,
            },
          },
        }
      }

      const monthlyLimit = TRIAL_TOKENS
      const currentUsage = 0

      return {
        ok: true,
        plan: "free",
        monthlyLimit,
        currentUsage,
        remainingTokens: Math.max(0, monthlyLimit - requestedTokens),
        usageMonth,
      }
    }

    return {
      ok: false,
      status: 402,
      payload: {
        error:
          "Subscription required. Please purchase a plan to continue using AI features.",
        code: "SUBSCRIPTION_REQUIRED",
        upgrade_url: upgradeUrl,
        details: {
          feature: params.feature,
        },
      },
    }
  }

  if (subscription.current_period_end) {
    const periodEnd = Date.parse(subscription.current_period_end)
    if (!Number.isNaN(periodEnd) && periodEnd < Date.now()) {
      return {
        ok: false,
        status: 402,
        payload: {
          error:
            "Your subscription period has ended. Renew your plan to continue.",
          code: "SUBSCRIPTION_REQUIRED",
          upgrade_url: upgradeUrl,
          details: {
            feature: params.feature,
          },
        },
      }
    }
  }

  const monthlyLimit = PLAN_LIMITS[subscription.plan]
  const usage = await getMonthlyUsage(supabase, params.userId, usageMonth)
  const currentUsage = Number(usage?.total_tokens || 0)
  const projectedUsage = currentUsage + requestedTokens

  if (projectedUsage > monthlyLimit) {
    return {
      ok: false,
      status: 429,
      payload: {
        error:
          "Monthly token limit exceeded. Upgrade your subscription for higher limits.",
        code: "TOKEN_LIMIT_EXCEEDED",
        upgrade_url: upgradeUrl,
        details: {
          feature: params.feature,
          plan: subscription.plan,
          monthly_limit: monthlyLimit,
          current_usage: currentUsage,
          requested_tokens: requestedTokens,
          remaining_tokens: Math.max(0, monthlyLimit - currentUsage),
        },
      },
    }
  }

  return {
    ok: true,
    plan: subscription.plan,
    monthlyLimit,
    currentUsage,
    remainingTokens: Math.max(0, monthlyLimit - projectedUsage),
    usageMonth,
  }
}

export async function consumeMonthlyTokens(
  supabase: SupabaseClient,
  params: {
    userId: string
    promptTokens: number
    completionTokens: number
  }
) {
  const usageMonth = getUsageMonth()
  const promptTokens = Math.max(0, Math.ceil(params.promptTokens))
  const completionTokens = Math.max(0, Math.ceil(params.completionTokens))
  const totalTokens = promptTokens + completionTokens

  if (totalTokens <= 0) return

  const existing = await getMonthlyUsage(supabase, params.userId, usageMonth)

  if (existing) {
    const { error } = await supabase
      .from("user_monthly_token_usage")
      .update({
        prompt_tokens: Number(existing.prompt_tokens || 0) + promptTokens,
        completion_tokens:
          Number(existing.completion_tokens || 0) + completionTokens,
        total_tokens: Number(existing.total_tokens || 0) + totalTokens,
      })
      .eq("user_id", params.userId)
      .eq("usage_month", usageMonth)

    if (error) {
      throw new Error(`Failed to update token usage: ${error.message}`)
    }

    return
  }

  const { error } = await supabase.from("user_monthly_token_usage").insert([
    {
      user_id: params.userId,
      usage_month: usageMonth,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
    },
  ])

  if (error) {
    throw new Error(`Failed to insert token usage: ${error.message}`)
  }
}
