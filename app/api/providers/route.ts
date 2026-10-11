import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { z } from "zod"

export async function GET(request: NextRequest) {
  try {
    const rl = await checkRateLimit(request, "public")
    if (!rl.success) return rateLimitResponse(rl)

    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const specializationParam = searchParams.get("specialization")

    // ✅ Validate query param
    const parsed = z
      .string()
      .min(1)
      .optional()
      .safeParse(specializationParam || undefined)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid specialization" },
        { status: 400 }
      )
    }

    const specialization = parsed.data

    let query = supabase
      .from("healthcare_providers")
      .select("*")
      .eq("is_verified", true)
      .limit(50)

    if (specialization) {
      query = query.eq("specialization", specialization)
    }

    const { data: providers, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!providers || providers.length === 0) {
      return NextResponse.json([], {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      })
    }

    // Fetch names and phones from patients table
    const userIds = providers.map((p) => p.user_id)
    const { data: patients } = await supabase
      .from("patients")
      .select("user_id, first_name, last_name, phone")
      .in("user_id", userIds)

    const patientsMap = new Map(patients?.map((p) => [p.user_id, p]) || [])

    const enrichedProviders = providers.map((provider) => {
      const patient = patientsMap.get(provider.user_id)
      return {
        ...provider,
        id: provider.id, // we'll use provider.id for bookings
        name: patient ? `Dr. ${patient.first_name} ${patient.last_name || ""}`.trim() : "Unknown Doctor",
        phone: patient?.phone || "",
        location: provider.clinic_address || "Virtual",
      }
    })

    return NextResponse.json(enrichedProviders, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}