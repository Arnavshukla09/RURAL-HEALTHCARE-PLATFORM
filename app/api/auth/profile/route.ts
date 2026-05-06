import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"   // ✅ ADD

// ✅ Schema for profile update
const ProfileSchema = z.object({
  profileType: z.enum(["patient", "provider"]),

  // optional fields (adjust based on your DB)
  name: z.string().min(1).optional(),
  age: z.number().int().min(0).optional(),
  phone: z.string().min(10).optional(),
  specialization: z.string().optional(), // for provider
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

    const { data: patient } = await supabase
      .from("patients")
      .select("*")
      .eq("user_id", user.id)
      .single()

    const { data: provider } = await supabase
      .from("providers")
      .select("*")
      .eq("user_id", user.id)
      .single()

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      patient,
      provider,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // ✅ VALIDATE INPUT
    const parsed = ProfileSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { profileType, ...data } = parsed.data

    const table = profileType === "provider" ? "providers" : "patients"

    const { data: updated, error } = await supabase
      .from(table)
      .update(data)
      .eq("user_id", user.id)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}