import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase env vars in middleware");
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      // Stale/invalid refresh token — clear all sb- cookies and send to signin
      if (
        error.message.includes("Refresh Token") ||
        (error as { code?: string }).code === "refresh_token_not_found"
      ) {
        const signinUrl = request.nextUrl.clone();
        signinUrl.pathname = "/signin";
        const clearResponse = NextResponse.redirect(signinUrl);
        request.cookies.getAll().forEach(({ name }) => {
          if (name.startsWith("sb-")) clearResponse.cookies.delete(name);
        });
        return clearResponse;
      }

      // "Auth session missing!" is expected for every unauthenticated visitor — not an error
      if (!error.message.includes("Auth session missing")) {
        console.error("Supabase Auth Error:", error.message);
      }
    }

    const isProtectedRoute =
      request.nextUrl.pathname.startsWith("/dashboard") ||
      request.nextUrl.pathname.startsWith("/research") ||
      request.nextUrl.pathname.startsWith("/chat");

    if (!user && isProtectedRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/signin";
      return NextResponse.redirect(url);
    }
  } catch (err) {
    console.error("Middleware fetch failed:", err);
  }

  return supabaseResponse;
}
