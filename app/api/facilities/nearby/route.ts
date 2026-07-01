import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { rateLimit } from "@/lib/rate-limit"
import { z } from "zod"

const QuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  type: z.enum(["hospital", "clinic", "doctors", "pharmacy", "health_post", "lab"]).optional(),
  radius_km: z.coerce.number().min(1).max(100).optional().default(25),
})

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1"
  if (!rateLimit(ip, 30, 60000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const { searchParams } = new URL(req.url)
  const parsed = QuerySchema.safeParse({
    lat: searchParams.get("lat"),
    lon: searchParams.get("lon"),
    type: searchParams.get("type") || undefined,
    radius_km: searchParams.get("radius_km") || undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid params — provide lat, lon as numbers", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { lat, lon, type, radius_km } = parsed.data
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("nearby_facilities", {
    user_lat: lat,
    user_lon: lon,
    facility_type: type ?? null,
    radius_km,
  })

  if (error) {
    console.error("[/api/facilities/nearby] RPC error:", error.message)
    return NextResponse.json(
      { error: "Failed to fetch facilities", detail: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ facilities: data ?? [] })
}
