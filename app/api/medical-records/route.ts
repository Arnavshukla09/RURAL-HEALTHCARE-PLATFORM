import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"   // ✅ ADD
import { rateLimit } from "@/lib/rate-limit"

// ✅ Define schema (adjust fields to match your DB)
const MedicalRecordSchema = z.object({
  patient_id: z.string().uuid(),
  record_type: z.enum(['diagnosis', 'prescription', 'lab_result', 'vaccination', 'other']),
  content: z.string().min(1),
  file_url: z.string().url().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1'
    if (!rateLimit(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")

    let query = supabase.from("medical_records").select("*")

    // ✅ Optional validation for query param
    if (patientId) {
      const isValidUUID = z.string().uuid().safeParse(patientId)
      if (!isValidUUID.success) {
        return NextResponse.json({ error: "Invalid patientId" }, { status: 400 })
      }

      query = query.eq("patient_id", patientId)
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
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1'
    if (!rateLimit(ip)) {
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

    // ✅ VALIDATION
    const parsed = MedicalRecordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // ✅ Use validated data
    const { data, error } = await supabase
      .from("medical_records")
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