import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // After exchanging, ensure patient row exists
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: existing } = await supabase
          .from("patients")
          .select("id")
          .eq("user_id", user.id)
          .single()

        if (!existing) {
          const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User"
          await supabase.from("patients").insert({
            user_id: user.id,
            first_name: fullName.split(" ")[0],
            last_name: fullName.split(" ").slice(1).join(" ") || "",
            email: user.email,
            role: "patient",
            phone: user.user_metadata?.phone || "",
          })
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If code exchange fails, redirect to home anyway
  return NextResponse.redirect(`${origin}/`)
}
