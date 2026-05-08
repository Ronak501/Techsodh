export type BillingPlan = "pro" | "premium"

export type BillingRouteStatus = "active" | "canceled" | "past_due" | "inactive"

type BillingPlanConfig = {
  label: string
  priceDisplay: string
  razorpayPlanIdEnv: string
  monthlyQueries: string
  description: string
}

export const BILLING_PLANS: Record<BillingPlan, BillingPlanConfig> = {
  pro: {
    label: "Pro",
    priceDisplay: "₹499 / month",
    razorpayPlanIdEnv: "RAZORPAY_PRO_PLAN_ID",
    monthlyQueries: "200 Research Queries / month",
    description: "For serious researchers & creators",
  },
  premium: {
    label: "Premium",
    priceDisplay: "₹1499 / month",
    razorpayPlanIdEnv: "RAZORPAY_PREMIUM_PLAN_ID",
    monthlyQueries: "Unlimited Research",
    description: "For power users & institutions",
  },
} as const

export function getBillingPlanConfig(plan: BillingPlan) {
  return BILLING_PLANS[plan]
}

export function getRazorpayPlanId(plan: BillingPlan) {
  const planId = process.env[BILLING_PLANS[plan].razorpayPlanIdEnv]

  if (!planId) {
    throw new Error(
      `${BILLING_PLANS[plan].razorpayPlanIdEnv} is required for Razorpay subscriptions`,
    )
  }

  return planId
}

export function getRazorpayKeyId() {
  const keyId = process.env.RAZORPAY_KEY_ID

  if (!keyId) {
    throw new Error("RAZORPAY_KEY_ID is required for Razorpay checkout")
  }

  return keyId
}

export function getRazorpayKeySecret() {
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keySecret) {
    throw new Error("RAZORPAY_KEY_SECRET is required for Razorpay checkout")
  }

  return keySecret
}

export function getRazorpayWebhookSecret() {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET

  if (!webhookSecret) {
    throw new Error("RAZORPAY_WEBHOOK_SECRET is required for Razorpay webhooks")
  }

  return webhookSecret
}

export function getAppUrl(request?: Request) {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL

  if (configuredUrl) {
    return configuredUrl.startsWith("http")
      ? configuredUrl
      : `https://${configuredUrl}`
  }

  if (request) {
    return new URL(request.url).origin
  }

  return "http://localhost:3000"
}

export function getCheckoutUrl(plan: BillingPlan) {
  return `/api/billing/checkout?plan=${plan}`
}

export function getBillingPortalUrl(returnPath = "/dashboard") {
  return `/api/billing/portal?returnPath=${encodeURIComponent(returnPath)}`
}

export function normalizeRazorpayStatus(status: string): BillingRouteStatus {
  switch (status) {
    case "active":
    case "authenticated":
      return "active"
    case "pending":
    case "halted":
      return "past_due"
    case "cancelled":
    case "completed":
      return "canceled"
    default:
      return "inactive"
  }
}

export function resolvePlanFromRazorpayPlanId(planId?: string | null) {
  if (!planId) return null

  const proPlanId = process.env.RAZORPAY_PRO_PLAN_ID
  if (proPlanId && planId === proPlanId) return "pro"

  const premiumPlanId = process.env.RAZORPAY_PREMIUM_PLAN_ID
  if (premiumPlanId && planId === premiumPlanId) return "premium"

  return null
}

export function formatBillingPeriod(value?: string | number | null) {
  if (value === null || value === undefined) {
    return null
  }

  const date = typeof value === "number" ? new Date(value * 1000) : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}
