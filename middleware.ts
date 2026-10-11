import { NextResponse, type NextRequest } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

/**
 * middleware.ts
 *
 * Hardened Edge Middleware (H5, H7):
 * 1. Matcher is strictly narrowed to protected and auth-redirect routes.
 *    Public routes (/, /camps, /directory, /emergency, /health-info, /locations, /symptom-checker)
 *    never run getUser() network calls, saving latency and Supabase Auth quota.
 * 2. Unprotects /camps (public rural camp information).
 * 3. Enforces server-side role gating:
 *    - /admin/* -> requires admin role
 *    - /doctor/* -> requires doctor or admin role
 * 4. Redirects logged-in users away from /login and /auth to their appropriate dashboard.
 */
export async function middleware(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID()
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-request-id", requestId)

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
  response.headers.set("x-request-id", requestId)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options })
          response.cookies.set({ name, value: "", ...options })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // 1. Auth routes redirect: logged-in users visiting /login or /auth go to their role dashboard
  if (user && (pathname === "/login" || pathname === "/auth")) {
    const { data: patient } = await supabase
      .from("patients")
      .select("role")
      .eq("user_id", user.id)
      .single()

    const role = patient?.role || "patient"
    let target = "/dashboard"
    if (role === "admin") target = "/admin/dashboard"
    else if (role === "doctor") target = "/doctor/dashboard"

    return NextResponse.redirect(new URL(target, request.url))
  }

  // 2. Unauthenticated check for all protected routes
  const isAuthRequired =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/consultation") ||
    pathname.startsWith("/records") ||
    pathname.startsWith("/appointments") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/doctor")

  if (isAuthRequired && !user) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 3. Server-side role gates (H5)
  if (user && (pathname.startsWith("/admin") || pathname.startsWith("/doctor"))) {
    const { data: patient } = await supabase
      .from("patients")
      .select("role")
      .eq("user_id", user.id)
      .single()

    const role = patient?.role || "patient"

    // /admin/* requires admin
    if (pathname.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    // /doctor/* requires doctor or admin
    if (pathname.startsWith("/doctor") && role !== "doctor" && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/consultation/:path*",
    "/records/:path*",
    "/appointments/:path*",
    "/admin/:path*",
    "/doctor/:path*",
    "/login",
    "/auth",
  ],
}
