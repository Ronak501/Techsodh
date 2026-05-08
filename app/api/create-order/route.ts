import Razorpay from "razorpay"
import { z } from "zod"
import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import {
  getBillingPlanAmountPaise,
  getBillingPlanConfig,
  getPublicRazorpayKeyId,
  getRazorpayKeyId,
  getRazorpayKeySecret,
} from "@/lib/billing"
import { parseJsonSafely, safeJsonResponse } from "@/lib/api-security"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const createOrderSchema = z.object({
  amount: z.number().int().min(100),
  currency: z.string().trim().min(3).max(3).default("INR"),
  receipt: z.string().trim().min(1).max(100),
  plan: z.enum(["pro", "premium"]).optional(),
})

type CreateOrderPayload = z.infer<typeof createOrderSchema>

type RazorpayApiError = {
  statusCode?: number
  error?: {
    code?: string
    description?: string
  }
  response?: {
    data?: {
      error?: {
        code?: string
        description?: string
      }
      message?: string
    }
  }
}

function createRazorpayClient() {
  return new Razorpay({
    key_id: getRazorpayKeyId(),
    key_secret: getRazorpayKeySecret(),
  })
}

function getRazorpayErrorMessage(error: unknown) {
  if (!error || typeof error !== "object") {
    return "Razorpay order creation failed"
  }

  const razorpayError = error as RazorpayApiError
  return (
    razorpayError.response?.data?.error?.description ||
    razorpayError.response?.data?.message ||
    razorpayError.error?.description ||
    (error instanceof Error ? error.message : "Razorpay order creation failed")
  )
}

async function createOrderResponse(request: Request, body: CreateOrderPayload) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return safeJsonResponse(401, "Unauthorized")
  }

  const planAmount = body.plan ? getBillingPlanAmountPaise(body.plan) : null
  const amount = body.amount

  if (amount < 100) {
    return safeJsonResponse(400, "Amount must be at least 100 paise")
  }

  if (planAmount && amount !== planAmount) {
    return safeJsonResponse(400, "Amount does not match the selected plan")
  }

  const planConfig = body.plan ? getBillingPlanConfig(body.plan) : null

  try {
    const razorpay = createRazorpayClient()
    const order = (await razorpay.orders.create({
      amount,
      currency: body.currency.toUpperCase(),
      receipt: body.receipt,
      notes: {
        user_id: user.id,
        plan: body.plan || "",
        email: user.email || "",
      },
    })) as { id: string; amount: number; currency: string }

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: getPublicRazorpayKeyId(),
      plan: body.plan || null,
      plan_label: planConfig?.label || null,
    })
  } catch (error) {
    const statusCode =
      error && typeof error === "object" && "statusCode" in error
        ? (error as RazorpayApiError).statusCode
        : undefined

    console.error("Razorpay order creation error:", error)

    if (statusCode === 401) {
      return safeJsonResponse(401, getRazorpayErrorMessage(error))
    }

    return safeJsonResponse(500, getRazorpayErrorMessage(error))
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseJsonSafely<CreateOrderPayload>(request)

    if (!body) {
      return safeJsonResponse(400, "Invalid JSON body")
    }

    const parsed = createOrderSchema.safeParse(body)

    if (!parsed.success) {
      return safeJsonResponse(400, "Invalid order request")
    }

    return await createOrderResponse(request, parsed.data)
  } catch (error) {
    return safeJsonResponse(
      500,
      error instanceof Error ? error.message : "Failed to create order",
    )
  }
}