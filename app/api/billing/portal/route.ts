import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { getAppUrl } from "@/lib/billing"
import { safeJsonResponse } from "@/lib/api-security"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const signInUrl = new URL("/signin", getAppUrl(request))
    signInUrl.searchParams.set("next", "/price")
    return NextResponse.redirect(signInUrl)
  }

  const { data: subscription, error } = await supabase
    .from("user_subscriptions")
    .select("provider, status, plan")
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) {
    return safeJsonResponse(500, error.message)
  }

  const returnPath = new URL(request.url).searchParams.get("returnPath") || "/"
  const target = new URL(returnPath, getAppUrl(request))
  target.searchParams.set("billing", subscription?.plan || "free")
  target.searchParams.set("billing_provider", subscription?.provider || "razorpay")
  target.searchParams.set("billing_status", subscription?.status || "inactive")

  return NextResponse.redirect(target)
}

export async function POST(request: Request) {
  return GET(request)
}
