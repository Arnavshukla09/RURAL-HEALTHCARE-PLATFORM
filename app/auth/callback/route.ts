import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  // Handle upstream OAuth error from Supabase or provider
  if (error || errorDescription) {
    console.error("[OAuth Callback Error]:", error, errorDescription)
    const loginUrl = new URL("/login", origin)
    loginUrl.searchParams.set("error", error || "oauth_failed")
    if (errorDescription) {
      loginUrl.searchParams.set("error_description", errorDescription)
    }
    return NextResponse.redirect(loginUrl)
  }

  if (code) {
    const supabase = await createClient()
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError && data?.user) {
      // Determine user role for direct dashboard redirect
      const { data: patient } = await supabase
        .from("patients")
        .select("role")
        .eq("user_id", data.user.id)
        .single()

      let target = next
      if (next === "/" || next === "/dashboard") {
        if (patient?.role === "admin") target = "/admin/dashboard"
        else if (patient?.role === "doctor") target = "/doctor/dashboard"
        else target = "/dashboard"
      }

      return NextResponse.redirect(`${origin}${target}`)
    }

    if (exchangeError) {
      console.error("[OAuth Exchange Error]:", exchangeError.message)
      const loginUrl = new URL("/login", origin)
      loginUrl.searchParams.set("error", "exchange_failed")
      loginUrl.searchParams.set("error_description", exchangeError.message)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Fallback to login if neither code nor error is present
  return NextResponse.redirect(`${origin}/login`)
}
