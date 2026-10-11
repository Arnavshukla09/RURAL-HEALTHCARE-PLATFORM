import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"   // ✅ ADD
import { rateLimit } from "@/lib/rate-limit"

// ✅ Define schema (adjust fields if your DB differs)
const HealthDataSchema = z.object({
  data_type: z.string().min(1),              // e.g. "heart_rate", "steps"
  value: z.number(),                         // numeric reading
  recorded_at: z.string().datetime().optional(), // ISO datetime
  notes: z.string().max(500).optional(),
})

import { requireUser, getPatientProfile, authErrorResponse } from "@/lib/auth/guard"
import { parsePaginationParams, paginateResults } from "@/lib/pagination"

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "127.0.0.1"
    if (!(await rateLimit(ip, 30, 60000))) {
      return NextResponse.json({ error: "Too many requests", code: "RATE_LIMITED" }, { status: 429 })
    }

    const { user, supabase } = await requireUser()
    const patient = await getPatientProfile(user.id)
    if (!patient) {
      return NextResponse.json({ error: "Patient record not found", code: "NOT_FOUND" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const dataType = searchParams.get("dataType")
    const { limit, cursor } = parsePaginationParams(searchParams, 20, 100)

    let query = supabase
      .from("health_data")
      .select("id, patient_id, data_type, value, recorded_at, notes, created_at")
      .eq("patient_id", patient.id)
      .order("recorded_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit + 1)

    if (dataType) {
      query = query.eq("data_type", dataType)
    }

    if (cursor) {
      query = query.lt("created_at", cursor.createdAt)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: "Failed to fetch health data", code: "DB_ERROR" }, { status: 500 })
    }

    const paginated = paginateResults((data ?? []) as any, limit)
    return NextResponse.json({
      data: paginated.data,
      nextCursor: paginated.nextCursor,
    })
  } catch (error) {
    return authErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1'
    if (!(await rateLimit(ip))) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

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