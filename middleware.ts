import { NextResponse, type NextRequest } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

/**
 * middleware.ts
 *
 * Hardened Edge Middleware:
 * 1. HTTP Method Guard: Explicitly rejects unsafe HTTP methods (TRACE, TRACK, CONNECT) with 405 Method Not Allowed.
 * 2. Origin & CORS Security: Handles API preflight (OPTIONS) and validates Origin headers for /api/* routes.
 * 3. Fast-Path Optimization: Public pages (/, /camps, /directory, etc.) and unauthenticated API endpoints
 *    bypass Supabase getUser() network roundtrips, preserving edge latency and Supabase Auth quotas.
 * 4. Server-Side Role Gating:
 *    - /admin/* -> strictly requires admin role
 *    - /doctor/* -> strictly requires doctor or admin role (exempting public /doctor/claim)
 * 5. Auth Redirects: Logged-in users visiting /login or /auth are routed to their role-specific dashboard.
 */

function isOriginAllowed(origin: string, request: NextRequest): boolean {
  try {
    const originUrl = new URL(origin)
    const hostUrl = request.nextUrl

    // 1. Same-origin match
    if (originUrl.origin === hostUrl.origin) return true

    // 2. Allow configured app URL if set
    if (process.env.NEXT_PUBLIC_APP_URL) {
      const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL)
      if (originUrl.origin === appUrl.origin) return true
    }

    // 3. Allow local development hosts
    if (
      process.env.NODE_ENV !== "production" &&
      (originUrl.hostname === "localhost" || originUrl.hostname === "127.0.0.1")
    ) {
      return true
    }

    // 4. Allow official production and vercel preview deployments
    if (
      originUrl.hostname === "rural-healthcare-platform.vercel.app" ||
      originUrl.hostname.endsWith(".vercel.app")
    ) {
      return true
    }

    return false
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  // 1. Method guard: Reject unsafe HTTP methods
  if (["TRACE", "TRACK", "CONNECT"].includes(request.method)) {
    return new NextResponse("Method Not Allowed", {
      status: 405,
      headers: { Allow: "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD" },
    })
  }

  const pathname = request.nextUrl.pathname

  // 2. API CORS & OPTIONS Handling
  if (pathname.startsWith("/api")) {
    const origin = request.headers.get("origin")
    if (request.method === "OPTIONS") {
      if (origin && !isOriginAllowed(origin, request)) {
        return new NextResponse(null, { status: 403 })
      }
      const preflightHeaders = new Headers()
      preflightHeaders.set("Access-Control-Allow-Origin", origin || request.nextUrl.origin)
      preflightHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD")
      preflightHeaders.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, x-request-id, cache-control, pragma"
      )
      preflightHeaders.set("Access-Control-Max-Age", "86400")
      preflightHeaders.set("Vary", "Origin")
      return new NextResponse(null, { status: 204, headers: preflightHeaders })
    }

    if (origin && !isOriginAllowed(origin, request)) {
      return NextResponse.json({ error: "Cross-origin request blocked" }, { status: 403 })
    }
  }

  const requestId = request.headers.get("x-request-id") || crypto.randomUUID()
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-request-id", requestId)

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
  response.headers.set("x-request-id", requestId)

  const origin = request.headers.get("origin")
  if (origin && pathname.startsWith("/api") && isOriginAllowed(origin, request)) {
    response.headers.set("Access-Control-Allow-Origin", origin)
    response.headers.set("Vary", "Origin")
  }

  // 3. Fast-path exemption:
  // Public routes & API routes bypass Supabase getUser() network calls completely
  const isAuthRequired =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/consultation") ||
    pathname.startsWith("/records") ||
    pathname.startsWith("/appointments") ||
    pathname.startsWith("/admin") ||
    (pathname.startsWith("/doctor") && !pathname.startsWith("/doctor/claim"))

  const isAuthRoute = pathname === "/login" || pathname === "/auth"

  if (!isAuthRequired && !isAuthRoute) {
    return response
  }

  // 4. Supabase Auth evaluation (only runs for protected/auth routes)
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

  // 5. Auth routes redirect: logged-in users visiting /login or /auth go to their role dashboard
  if (user && isAuthRoute) {
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

  // 6. Unauthenticated check for all protected routes
  if (isAuthRequired && !user) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 7. Server-side role gates (H5)
  if (user && (pathname.startsWith("/admin") || (pathname.startsWith("/doctor") && !pathname.startsWith("/doctor/claim")))) {
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
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static assets (.svg, .png, .jpg, .jpeg, .gif, .webp, .ico, manifest.json, sw.js)
     */
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
