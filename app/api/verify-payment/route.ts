import crypto from "node:crypto"
import Razorpay from "razorpay"
import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import {
  getRazorpayKeyId,
  getRazorpayKeySecret,
  normalizeRazorpayStatus,
  type BillingPlan,
} from "@/lib/billing"
import { parseJsonSafely, safeJsonResponse } from "@/lib/api-security"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type VerifyPaymentPayload = {
  razorpay_order_id?: string
  razorpay_payment_id?: string
  razorpay_signature?: string
}

type RazorpayOrder = {
  id: string
  amount: number
  currency: string
  receipt?: string | null
  notes?: {
    user_id?: string
    plan?: string
  }
}

function createRazorpayClient() {
  return new Razorpay({
    key_id: getRazorpayKeyId(),
    key_secret: getRazorpayKeySecret(),
  })
}

function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string,
) {
  const expectedSignature = crypto
    .createHmac("sha256", getRazorpayKeySecret())
    .update(`${orderId}|${paymentId}`)
    .digest("hex")

  const expectedBuffer = Buffer.from(expectedSignature)
  const providedBuffer = Buffer.from(signature)

  if (expectedBuffer.length !== providedBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer)
}

async function persistPayment(order: RazorpayOrder, paymentId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return safeJsonResponse(401, "Unauthorized")
  }

  const plan = (order.notes?.plan as BillingPlan | undefined) || "pro"
  const orderUserId = order.notes?.user_id || user.id

  if (order.notes?.user_id && order.notes.user_id !== user.id) {
    return safeJsonResponse(403, "Payment does not belong to the current user")
  }

  const now = new Date()
  const currentPeriodEnd = new Date(now)
  currentPeriodEnd.setUTCDate(currentPeriodEnd.getUTCDate() + 30)

  const admin = createAdminClient()
  const { error } = await admin.from("user_subscriptions").upsert(
    {
      user_id: orderUserId,
      plan,
      status: normalizeRazorpayStatus("active"),
      current_period_start: now.toISOString(),
      current_period_end: currentPeriodEnd.toISOString(),
      provider: "razorpay",
      razorpay_customer_id: null,
      razorpay_subscription_id: null,
      razorpay_plan_id: null,
      razorpay_payment_id: paymentId,
      updated_at: now.toISOString(),
    },
    { onConflict: "user_id" },
  )

  if (error) {
    return safeJsonResponse(500, `Failed to persist payment: ${error.message}`)
  }

  return NextResponse.json({ ok: true })
}

async function fetchOrder(orderId: string) {
  const razorpay = createRazorpayClient()
  return (await razorpay.orders.fetch(orderId)) as RazorpayOrder
}

export async function POST(request: Request) {
  try {
    const body = await parseJsonSafely<VerifyPaymentPayload>(request)

    if (!body) {
      return safeJsonResponse(400, "Invalid JSON body")
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return safeJsonResponse(400, "Missing Razorpay verification fields")
    }

    if (!verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      return safeJsonResponse(400, "Invalid Razorpay signature")
    }

    const order = await fetchOrder(razorpay_order_id)
    return await persistPayment(order, razorpay_payment_id)
  } catch (error) {
    return safeJsonResponse(
      500,
      error instanceof Error ? error.message : "Failed to verify payment",
    )
  }
}