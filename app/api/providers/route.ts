import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limit"
import { z } from "zod"   // ✅ ADD (for query validation)

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1'
    if (!rateLimit(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

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

    if (specialization) {
      query = query.eq("specialization", specialization)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}