import crypto from "node:crypto"
import { NextResponse } from "next/server"
import { createAdminClient } from "@/utils/supabase/admin"
import {
  getRazorpayWebhookSecret,
  normalizeRazorpayStatus,
  resolvePlanFromRazorpayPlanId,
  type BillingPlan,
} from "@/lib/billing"
import { safeJsonResponse } from "@/lib/api-security"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function verifySignature(body: string, signature: string, secret: string) {
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex")
  return expected === signature
}

async function findUserSubscription(subscriptionId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("user_subscriptions")
    .select("user_id, plan")
    .eq("razorpay_subscription_id", subscriptionId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to look up subscription: ${error.message}`)
  }

  return data as { user_id: string; plan: BillingPlan } | null
}

async function upsertSubscription(params: {
  userId: string
  plan: BillingPlan
  status: string
  razorpayCustomerId?: string | null
  razorpaySubscriptionId?: string | null
  razorpayPlanId?: string | null
  razorpayPaymentId?: string | null
  currentPeriodStart?: number | null
  currentPeriodEnd?: number | null
}) {
  const admin = createAdminClient()
  const { error } = await admin.from("user_subscriptions").upsert(
    {
      user_id: params.userId,
      plan: params.plan,
      status: normalizeRazorpayStatus(params.status),
      current_period_start: params.currentPeriodStart
        ? new Date(params.currentPeriodStart * 1000).toISOString()
        : null,
      current_period_end: params.currentPeriodEnd
        ? new Date(params.currentPeriodEnd * 1000).toISOString()
        : null,
      provider: "razorpay",
      razorpay_customer_id: params.razorpayCustomerId ?? null,
      razorpay_subscription_id: params.razorpaySubscriptionId ?? null,
      razorpay_plan_id: params.razorpayPlanId ?? null,
      razorpay_payment_id: params.razorpayPaymentId ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  )

  if (error) {
    throw new Error(`Failed to persist subscription: ${error.message}`)
  }
}

async function handleSubscription(subscription: {
  id: string
  status: string
  customer_id?: string | null
  plan_id?: string | null
  notes?: { user_id?: string; plan?: string }
  current_start?: number | null
  current_end?: number | null
  charge_at?: number | null
}) {
  const existing = await findUserSubscription(subscription.id)
  const plan =
    (subscription.notes?.plan as BillingPlan | undefined) ||
    resolvePlanFromRazorpayPlanId(subscription.plan_id) ||
    existing?.plan
  const userId = subscription.notes?.user_id || existing?.user_id

  if (!plan) {
    throw new Error(`Unable to resolve billing plan for subscription ${subscription.id}`)
  }

  if (!userId) {
    throw new Error(`Unable to resolve user for subscription ${subscription.id}`)
  }

  await upsertSubscription({
    userId,
    plan,
    status: subscription.status,
    razorpayCustomerId: subscription.customer_id || null,
    razorpaySubscriptionId: subscription.id,
    razorpayPlanId: subscription.plan_id || null,
    razorpayPaymentId: subscription.charge_at ? String(subscription.charge_at) : null,
    currentPeriodStart: subscription.current_start || null,
    currentPeriodEnd: subscription.current_end || null,
  })
}

export async function POST(request: Request) {
  const signature = request.headers.get("x-razorpay-signature")

  if (!signature) {
    return safeJsonResponse(400, "Missing Razorpay signature")
  }

  const rawBody = await request.text()
  const isValid = verifySignature(rawBody, signature, getRazorpayWebhookSecret())

  if (!isValid) {
    return safeJsonResponse(400, "Invalid Razorpay signature")
  }

  try {
    const event = JSON.parse(rawBody) as {
      event?: string
      payload?: {
        subscription?: { entity?: Parameters<typeof handleSubscription>[0] }
      }
    }

    const subscription = event.payload?.subscription?.entity

    switch (event.event) {
      case "subscription.authenticated":
      case "subscription.activated":
      case "subscription.charged":
      case "subscription.cancelled":
      case "subscription.completed":
        if (subscription) {
          await handleSubscription(subscription)
        }
        break
      default:
        break
    }
  } catch (error) {
    // Always return 200 after signature verification — non-2xx causes Razorpay to retry.
    console.error("Razorpay webhook handling failed", error)
  }

  return NextResponse.json({ received: true })
}
