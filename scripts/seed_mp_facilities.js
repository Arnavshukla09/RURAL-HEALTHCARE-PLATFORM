/**
 * seed_mp_facilities.js
 * 
 * Pulls real healthcare facility data for Madhya Pradesh from
 * OpenStreetMap via the Overpass API, classifies each result,
 * and bulk-upserts into Supabase healthcare_facilities table.
 * 
 * Usage:
 *   node scripts/seed_mp_facilities.js
 * 
 * Requires:
 *   - NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 *   - npm install @supabase/supabase-js dotenv
 *   - 006_facilities_postgis.sql already run in Supabase SQL Editor
 */

require("dotenv").config({ path: ".env.local" })
const { createClient } = require("@supabase/supabase-js")

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// Overpass QL: query all health-related amenities within MP's admin boundary
const OVERPASS_QUERY = `
[out:json][timeout:120];
area["name"="Madhya Pradesh"]["admin_level"="4"]->.mp;
(
  nwr["amenity"~"hospital|clinic|doctors|pharmacy"](area.mp);
  nwr["healthcare"~"hospital|clinic|doctor|pharmacy|laboratory|centre"](area.mp);
  nwr["amenity"="health_post"](area.mp);
  nwr["healthcare"="laboratory"](area.mp);
);
out center tags;
`

// Map OSM tags to our facility type enum
function classifyType(tags) {
  const amenity = tags.amenity || ""
  const healthcare = tags.healthcare || ""
  if (amenity === "hospital" || healthcare === "hospital") return "hospital"
  if (amenity === "clinic" || healthcare === "clinic" || healthcare === "centre") return "clinic"
  if (amenity === "doctors" || healthcare === "doctor") return "doctors"
  if (amenity === "pharmacy" || healthcare === "pharmacy") return "pharmacy"
  if (healthcare === "laboratory") return "lab"
  if (amenity === "health_post") return "health_post"
  return "clinic"
}

function extractName(tags) {
  return (
    tags.name ||
    tags["name:en"] ||
    tags["name:hi"] ||
    tags.operator ||
    tags.brand ||
    `${classifyType(tags).replace("_", " ")} (unnamed)`
  )
}

function extractAddress(tags) {
  const parts = [
    tags["addr:housename"],
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:suburb"],
    tags["addr:city"] || tags["addr:village"],
    tags["addr:district"],
    tags["addr:postcode"],
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(", ") : null
}

async function main() {
  console.log("Querying Overpass API for MP healthcare facilities...")
  console.log("(this takes 30-90 seconds)\n")

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: `data=${encodeURIComponent(OVERPASS_QUERY)}`,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  })

  if (!res.ok) {
    console.error(`Overpass API error: ${res.status} ${res.statusText}`)
    process.exit(1)
  }

  const data = await res.json()
  const elements = data.elements || []
  console.log(`Overpass returned ${elements.length} raw elements\n`)

  const facilities = []
  const seen = new Set()

  for (const el of elements) {
    const lat = el.lat ?? el.center?.lat
    const lon = el.lon ?? el.center?.lon
    if (!lat || !lon) continue

    const osmId = el.id
    if (seen.has(osmId)) continue
    seen.add(osmId)

    const tags = el.tags || {}
    facilities.push({
      osm_id: osmId,
      name: extractName(tags),
      type: classifyType(tags),
      address: extractAddress(tags),
      phone: tags.phone || tags["contact:phone"] || null,
      district: tags["addr:district"] || tags["addr:city"] || null,
      state: "Madhya Pradesh",
      lat,
      lon,
      tags,
    })
  }

  console.log(`Classified ${facilities.length} unique facilities:`)
  const counts = {}
  facilities.forEach(f => { counts[f.type] = (counts[f.type] || 0) + 1 })
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => console.log(`  ${type}: ${count}`))
  console.log()

  // Batch upsert (500 at a time)
  const BATCH = 500
  let inserted = 0

  for (let i = 0; i < facilities.length; i += BATCH) {
    const batch = facilities.slice(i, i + BATCH).map(f => ({
      osm_id: f.osm_id,
      name: f.name,
      type: f.type,
      address: f.address,
      phone: f.phone,
      district: f.district,
      state: f.state,
      lat: f.lat,
      lon: f.lon,
      tags: f.tags,
    }))

    const { error } = await supabase
      .from("healthcare_facilities")
      .upsert(batch, { onConflict: "osm_id" })

    if (error) {
      console.error(`Batch ${Math.floor(i / BATCH) + 1} error:`, error.message)
    } else {
      inserted += batch.length
      process.stdout.write(`\rUpserted ${inserted}/${facilities.length}...`)
    }
  }

  console.log(`\n\nDone! ${inserted} facilities upserted.`)
  console.log("\nVerify in Supabase SQL Editor:")
  console.log("  SELECT type, count(*) FROM healthcare_facilities GROUP BY type ORDER BY count(*) DESC;")
  console.log("  SELECT * FROM nearby_facilities(23.2599, 77.4126, NULL, 25);")
}

main().catch(err => {
  console.error("Fatal error:", err)
  process.exit(1)
})
