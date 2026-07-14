import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { rateLimit } from "@/lib/rate-limit"

// ✅ Allowed tables
const allowedTables = [
  "appointments",
  "health_data",
  "medical_records",
  "notifications",
]

const OperationSchema = z.object({
  table: z.enum(["appointments", "health_data", "medical_records", "notifications"]),
  type: z.enum(["INSERT", "UPDATE", "DELETE"]),
  data: z.record(z.string(), z.any()).optional(),
  id: z.string().uuid().optional(),
})

const SyncSchema = z.object({
  operations: z.array(OperationSchema).min(1),
})

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1"
    if (!rateLimit(ip)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Hard auth guard — must have a valid user with a real UUID
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = SyncSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { operations } = parsed.data

    // ── Audit log (NON-BLOCKING) ──────────────────────────────────────────────
    // Failures here must never block the actual sync operations.
    // Root-cause fix: op.data can be undefined for DELETE ops → use {} to
    // satisfy the JSONB NOT NULL constraint on offline_sync_log.data
    try {
      const syncLog = operations.map((op) => ({
        user_id: user.id,                // guaranteed non-null above
        table_name: op.table,
        operation: op.type,
        data: op.data ?? {},             // ← fixes NULL JSONB constraint violation
      }))
      const { error: logError } = await supabase
        .from("offline_sync_log")
        .insert(syncLog)
      if (logError) {
        // Non-critical — just log server-side, never surface to client
        console.error("[offline-sync] audit log insert failed:", logError.message)
      }
    } catch (logErr) {
      console.error("[offline-sync] audit log threw:", logErr)
    }
    // ─────────────────────────────────────────────────────────────────────────

    // ── Process the actual sync operations ───────────────────────────────────
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
        console.error(`[offline-sync] Failed ${op.type} on ${op.table}`, opError)
      }
    }

    return NextResponse.json({ success: true, synced: operations.length })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}