import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// ✅ Allowed tables (VERY IMPORTANT)
const allowedTables = [
  "appointments",
  "health_data",
  "medical_records",
  "notifications",
]

// ✅ Schema for each operation
const OperationSchema = z.object({
  table: z.enum(["appointments", "health_data", "medical_records", "notifications"]),
  type: z.enum(["INSERT", "UPDATE", "DELETE"]),
  data: z.record(z.string(), z.any()).optional(),
  id: z.string().uuid().optional(),
})

// ✅ Schema for full request
const SyncSchema = z.object({
  operations: z.array(OperationSchema).min(1),
})

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

    // ✅ VALIDATE FULL REQUEST
    const parsed = SyncSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { operations } = parsed.data

    // ✅ Log operations
    const syncLog = operations.map((op) => ({
      user_id: user.id,
      table_name: op.table,
      operation: op.type,
      data: op.data,
    }))

    const { error: logError } = await supabase
      .from("offline_sync_log")
      .insert(syncLog)

    if (logError) {
      return NextResponse.json({ error: logError.message }, { status: 500 })
    }

    // ✅ Process operations safely
    for (const op of operations) {
      try {
        if (!allowedTables.includes(op.table)) continue

        if (op.type === "INSERT" && op.data) {
          await supabase.from(op.table).insert([op.data])
        }

        if (op.type === "UPDATE" && op.data && op.id) {
          await supabase.from(op.table).update(op.data).eq("id", op.id)
        }

        if (op.type === "DELETE" && op.id) {
          await supabase.from(op.table).delete().eq("id", op.id)
        }
      } catch (opError) {
        console.error(`Failed ${op.type} on ${op.table}`, opError)
      }
    }

    return NextResponse.json({
      success: true,
      synced: operations.length,
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}