import {
  BILLING_PLANS,
  formatBillingPeriod,
  normalizeRazorpayStatus,
  resolvePlanFromRazorpayPlanId,
} from "@/lib/billing"
import { describe, expect, it, vi } from "vitest"

describe("billing helpers", () => {
  it("exposes paid plan metadata for checkout links", () => {
    expect(BILLING_PLANS.pro.label).toBe("Pro")
    expect(BILLING_PLANS.premium.priceDisplay).toContain("₹1499")
  })

  it("normalizes Razorpay subscription states to app states", () => {
    expect(normalizeRazorpayStatus("authenticated")).toBe("active")
    expect(normalizeRazorpayStatus("halted")).toBe("past_due")
    expect(normalizeRazorpayStatus("cancelled")).toBe("canceled")
  })

  it("resolves a plan from the configured Razorpay plan id", () => {
    const originalPro = process.env.RAZORPAY_PRO_PLAN_ID
    const originalPremium = process.env.RAZORPAY_PREMIUM_PLAN_ID

    process.env.RAZORPAY_PRO_PLAN_ID = "plan_pro_test"
    process.env.RAZORPAY_PREMIUM_PLAN_ID = "plan_premium_test"

    expect(resolvePlanFromRazorpayPlanId("plan_pro_test")).toBe("pro")
    expect(resolvePlanFromRazorpayPlanId("plan_premium_test")).toBe("premium")
    expect(resolvePlanFromRazorpayPlanId("plan_unknown")).toBeNull()

    process.env.RAZORPAY_PRO_PLAN_ID = originalPro
    process.env.RAZORPAY_PREMIUM_PLAN_ID = originalPremium
  })

  it("formats billing periods for display", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-05-08T00:00:00.000Z"))

    expect(formatBillingPeriod("2026-05-08T00:00:00.000Z")).toContain("2026")

    vi.useRealTimers()
  })
})
