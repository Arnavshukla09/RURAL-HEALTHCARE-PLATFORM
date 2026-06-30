import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { rateLimit } from "@/lib/rate-limit"
import { z } from "zod"

const QuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  type: z.enum(["hospital", "clinic", "doctors", "pharmacy", "health_post", "lab"]).optional(),
  radius_km: z.coerce.number().min(1).max(200).optional().default(25),
})

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1"
  if (!rateLimit(ip)) {
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
    return NextResponse.json({ error: "Invalid query params", details: parsed.error.flatten() }, { status: 400 })
  }

  const { lat, lon, type, radius_km } = parsed.data
  const supabase = await createClient()

  // Try PostGIS RPC first (fast spatial query)
  const { data: rpcData, error: rpcError } = await supabase.rpc("nearby_facilities", {
    p_lat: lat,
    p_lon: lon,
    p_type: type ?? null,
    p_radius_km: radius_km,
  })

  if (!rpcError && rpcData) {
    return NextResponse.json({
      facilities: rpcData,
      center: { lat, lon },
      radius_km,
      count: rpcData.length,
    })
  }

  // Fallback: if RPC doesn't exist (PostGIS not set up), do a basic table query
  // Uses bounding box approximation instead of true distance
  console.warn("[facilities/nearby] RPC failed, falling back to basic query:", rpcError?.message)
  
  const degPerKm = 1 / 111.32 // rough conversion
  const latMin = lat - (radius_km * degPerKm)
  const latMax = lat + (radius_km * degPerKm)
  const lonMin = lon - (radius_km * degPerKm / Math.cos(lat * Math.PI / 180))
  const lonMax = lon + (radius_km * degPerKm / Math.cos(lat * Math.PI / 180))

  let query = supabase
    .from("healthcare_facilities")
    .select("id, name, type, address, phone, district, lat, lon")
    .gte("lat", latMin)
    .lte("lat", latMax)
    .gte("lon", lonMin)
    .lte("lon", lonMax)
    .limit(200)

  if (type) query = query.eq("type", type)

  const { data: fallbackData, error: fallbackError } = await query

  if (fallbackError) {
    // Table doesn't exist either — return empty with helpful message
    console.error("[facilities/nearby] Fallback query also failed:", fallbackError.message)
    return NextResponse.json({
      facilities: [],
      center: { lat, lon },
      radius_km,
      count: 0,
      note: "Healthcare facilities table not found. Please run 006_facilities_postgis.sql and seed_mp_facilities.js first.",
    })
  }

  // Calculate approximate distance for each result
  const withDistance = (fallbackData || []).map(f => ({
    ...f,
    distance_km: Math.round(
      Math.sqrt(
        Math.pow((f.lat - lat) * 111.32, 2) +
        Math.pow((f.lon - lon) * 111.32 * Math.cos(lat * Math.PI / 180), 2)
      ) * 10
    ) / 10,
  })).sort((a, b) => a.distance_km - b.distance_km)

  return NextResponse.json({
    facilities: withDistance,
    center: { lat, lon },
    radius_km,
    count: withDistance.length,
  })
}
