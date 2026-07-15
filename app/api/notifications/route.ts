import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { rateLimit } from "@/lib/rate-limit"
import { createAdminClient } from "@/lib/supabase/admin"

// Schema for creating notification
const NotificationSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  type: z.enum(["info", "warning", "success", "emergency"]).default("info"),
  recipient_type: z.enum(["all", "role", "individual"]).default("all"),
  recipient_role: z.string().optional().nullable(),
  recipient_id: z.string().uuid().optional().nullable(),
})

// Schema for updating notification (PATCH)
const UpdateNotificationSchema = z.object({
  notificationId: z.string().uuid(),
  is_read: z.boolean(),
})

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1'
    if (!(await rateLimit(ip))) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get("unreadOnly") === "true"

    // RLS (users_read_notifications) already filters the correct rows
    let query = supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })

    if (unreadOnly) {
      query = query.eq("is_read", false)
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
    if (!(await rateLimit(ip))) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = NotificationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    // Insert notification (RLS admin_full_access ensures only admins can do this via standard client)
    const { data, error } = await supabase
      .from("notifications")
      .insert([parsed.data])
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1'
    if (!(await rateLimit(ip))) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = UpdateNotificationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { notificationId, is_read } = parsed.data

    // Only allow updating is_read for individual notifications where recipient_id = user.id
    // This prevents one user marking a broadcast message as read for everyone.
    // The RLS policy "users_update_notifications" already enforces this, but we'll add it to the query to be safe.
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read })
      .eq("id", notificationId)
      .eq("recipient_type", "individual")
      .eq("recipient_id", user.id)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}