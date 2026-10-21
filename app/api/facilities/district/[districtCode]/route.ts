import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { LGD_STATES, NationalFacility } from "@/lib/geo/lgd-iphs"
import fs from "fs"
import path from "path"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ districtCode: string }> }
) {
  const rl = await checkRateLimit(req, "public")
  if (!rl.success) return rateLimitResponse(rl)

  const { districtCode } = await params

  if (!districtCode || !/^\d{4}$/.test(districtCode)) {
    return NextResponse.json(
      { error: "Invalid LGD district code format. Expected 4 digits (e.g. 2301)." },
      { status: 400 }
    )
  }

  // 1. Check pre-generated static district pack on disk
  const filePath = path.join(process.cwd(), "public", "data", "facilities", `${districtCode}.json`)

  if (fs.existsSync(filePath)) {
    try {
      const fileData = fs.readFileSync(filePath, "utf-8")
      const facilities: NationalFacility[] = JSON.parse(fileData)

      return NextResponse.json(
        {
          districtCode,
          count: facilities.length,
          facilities,
          source: "cdn-static-pack",
        },
        {
          headers: {
            // Edge CDN caching: 24h edge cache, stale-while-revalidate 7 days
            "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
          },
        }
      )
    } catch (err) {
      console.error(`Error reading facility pack ${districtCode}:`, err)
    }
  }

  // 2. Return empty array for districts without packs yet
  return NextResponse.json(
    {
      districtCode,
      count: 0,
      facilities: [],
      source: "unseeded-district",
      message: "Facility data for this district is being indexed from ABDM/LGD registry.",
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  )
}
