import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const errorParam = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")
  const next = searchParams.get("next") ?? "/dashboard"

  // OAuth provider returned an error (e.g. user denied permissions)
  if (errorParam) {
    console.error("OAuth error:", errorParam, errorDescription)
    const url = new URL(`${origin}/signin`)
    url.searchParams.set("error", "oauth_error")
    url.searchParams.set("message", errorDescription ?? errorParam)
    return NextResponse.redirect(url)
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error("exchangeCodeForSession error:", error.message)
    const url = new URL(`${origin}/signin`)
    url.searchParams.set("error", "auth_callback_failed")
    url.searchParams.set("message", error.message)
    return NextResponse.redirect(url)
  }

  return NextResponse.redirect(`${origin}/signin?error=auth_callback_failed`)
}
