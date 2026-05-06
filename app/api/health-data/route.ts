import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"   // ✅ ADD

// ✅ Define schema (adjust fields if your DB differs)
const HealthDataSchema = z.object({
  data_type: z.string().min(1),              // e.g. "heart_rate", "steps"
  value: z.number(),                         // numeric reading
  recorded_at: z.string().datetime().optional(), // ISO datetime
  notes: z.string().max(500).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dataType = searchParams.get("dataType")

    let query = supabase
      .from("health_data")
      .select("*")
      .order("recorded_at", { ascending: false })

    if (dataType) {
      query = query.eq("data_type", dataType)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // ✅ ADD VALIDATION HERE
    const parsed = HealthDataSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // ✅ Use validated data
    const { data, error } = await supabase
      .from("health_data")
      .insert([{ ...parsed.data }])
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}