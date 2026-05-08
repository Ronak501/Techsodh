import { NextResponse } from "next/server"
import { z } from "zod"
import Razorpay from "razorpay"
import { createClient } from "@/utils/supabase/server"
import {
  getAppUrl,
  getBillingPlanConfig,
  getRazorpayKeyId,
  getRazorpayKeySecret,
  getRazorpayPlanId,
  type BillingPlan,
} from "@/lib/billing"
import { safeJsonResponse } from "@/lib/api-security"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const checkoutSchema = z.object({
  plan: z.enum(["pro", "premium"]),
})

function createRazorpayClient() {
  return new Razorpay({
    key_id: getRazorpayKeyId(),
    key_secret: getRazorpayKeySecret(),
  })
}

async function createCheckoutResponse(request: Request, plan: BillingPlan) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    if (request.method === "GET") {
      const nextUrl = new URL("/signin", getAppUrl(request))
      nextUrl.searchParams.set("next", "/price")
      return NextResponse.redirect(nextUrl)
    }

    return safeJsonResponse(401, "Unauthorized")
  }

  const razorpay = createRazorpayClient()
  const planConfig = getBillingPlanConfig(plan)
  const appUrl = getAppUrl(request)
  const razorpayPlanId = getRazorpayPlanId(plan)

  const subscription = await razorpay.subscriptions.create({
    plan_id: razorpayPlanId,
    total_count: 12,
    quantity: 1,
    customer_notify: 1,
    notes: {
      user_id: user.id,
      plan,
      email: user.email || "",
    },
    start_at: Math.floor(Date.now() / 1000) + 60,
  })

  const { error: saveError } = await supabase.from("user_subscriptions").upsert(
    {
      user_id: user.id,
      plan,
      status: "inactive",
      current_period_start: null,
      current_period_end: null,
      provider: "razorpay",
      razorpay_plan_id: razorpayPlanId,
      razorpay_subscription_id: subscription.id,
      razorpay_customer_id: null,
      razorpay_payment_id: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  )

  if (saveError) {
    return safeJsonResponse(500, `Failed to save subscription: ${saveError.message}`)
  }

  return NextResponse.json({
    ok: true,
    keyId: getRazorpayKeyId(),
    subscriptionId: subscription.id,
    plan,
    planLabel: planConfig.label,
    description: planConfig.description,
    amount: plan === "pro" ? 49900 : 149900,
    currency: "INR",
    customerEmail: user.email || undefined,
    customerName: user.user_metadata?.full_name || user.email || "Research Agent user",
    appUrl,
  })
}

export async function GET(request: Request) {
  const planValue = new URL(request.url).searchParams.get("plan")
  const parsed = checkoutSchema.safeParse({ plan: planValue })

  if (!parsed.success) {
    return safeJsonResponse(400, "Choose a valid paid plan first")
  }

  return createCheckoutResponse(request, parsed.data.plan)
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = checkoutSchema.safeParse(body)

  if (!parsed.success) {
    return safeJsonResponse(400, "Invalid checkout request")
  }

  return createCheckoutResponse(request, parsed.data.plan)
}
