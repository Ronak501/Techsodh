import Razorpay from "razorpay"
import { NextResponse } from "next/server"
import { createAdminClient } from "@/utils/supabase/admin"
import {
  getRazorpayKeyId,
  getRazorpayKeySecret,
  normalizeRazorpayStatus,
  resolvePlanFromRazorpayPlanId,
  type BillingPlan,
} from "@/lib/billing"
import { parseJsonSafely, safeJsonResponse } from "@/lib/api-security"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type VerifyPayload = {
  plan?: BillingPlan
  razorpay_subscription_id?: string
  razorpay_payment_id?: string
  razorpay_signature?: string
}

function createRazorpayClient() {
  return new Razorpay({
    key_id: getRazorpayKeyId(),
    key_secret: getRazorpayKeySecret(),
  })
}

async function findPendingSubscription(subscriptionId: string) {
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

async function syncSubscription(subscriptionId: string, paymentId: string) {
  const razorpay = createRazorpayClient()
  const subscription = await razorpay.subscriptions.fetch(subscriptionId)
  const pending = await findPendingSubscription(subscriptionId)
  const plan =
    resolvePlanFromRazorpayPlanId(subscription.plan_id) ||
    (subscription.notes?.plan as BillingPlan | undefined) ||
    pending?.plan

  const userId = subscription.notes?.user_id || pending?.user_id

  if (!plan) {
    throw new Error(`Unable to resolve billing plan for subscription ${subscriptionId}`)
  }

  if (!userId) {
    throw new Error(`Unable to resolve user for subscription ${subscriptionId}`)
  }

  const admin = createAdminClient()
  const { error } = await admin.from("user_subscriptions").upsert(
    {
      user_id: userId,
      plan,
      status: normalizeRazorpayStatus(subscription.status),
      current_period_start: subscription.current_start
        ? new Date(subscription.current_start * 1000).toISOString()
        : null,
      current_period_end: subscription.current_end
        ? new Date(subscription.current_end * 1000).toISOString()
        : null,
      provider: "razorpay",
      razorpay_customer_id: subscription.customer_id || null,
      razorpay_subscription_id: subscription.id,
      razorpay_plan_id: subscription.plan_id,
      razorpay_payment_id: paymentId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  )

  if (error) {
    throw new Error(`Failed to persist subscription: ${error.message}`)
  }
}

export async function POST(request: Request) {
  const body = await parseJsonSafely<VerifyPayload>(request)

  if (!body) {
    return safeJsonResponse(400, "Invalid JSON body")
  }

  const { razorpay_subscription_id, razorpay_payment_id, razorpay_signature } = body

  if (!razorpay_subscription_id || !razorpay_payment_id || !razorpay_signature) {
    return safeJsonResponse(400, "Missing Razorpay verification fields")
  }

  const isValid = Razorpay.validatePaymentVerification(
    {
      subscription_id: razorpay_subscription_id,
      payment_id: razorpay_payment_id,
    },
    razorpay_signature,
    getRazorpayKeySecret(),
  )

  if (!isValid) {
    return safeJsonResponse(400, "Invalid Razorpay signature")
  }

  try {
    await syncSubscription(razorpay_subscription_id, razorpay_payment_id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return safeJsonResponse(
      500,
      error instanceof Error ? error.message : "Failed to verify payment",
    )
  }
}