/**
 * Seed Madhya Pradesh healthcare facilities into Supabase.
 *
 * Sources data from OpenStreetMap's Overpass API, scoped to the
 * actual administrative boundary of Madhya Pradesh (not a crude
 * bounding box), across all relevant amenity/healthcare tags.
 *
 * Run with:  node scripts/seed_mp_facilities.js
 *
 * Requires in .env.local (or exported in shell):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   <-- service role, NOT anon key (bypasses RLS for bulk insert)
 */

/**
 * Seed Madhya Pradesh healthcare facilities into Supabase.
 *
 * IMPORTANT: As of 2025-2026, overpass-api.de and most public mirrors
 * actively block programmatic/bot-shaped requests with HTTP 406/504
 * (confirmed: github.com/drolbr/Overpass-API/issues/791, and Overpass's
 * own robots.txt now disallows automated clients). Running this query
 * from a Node script directly no longer works reliably.
 *
 * Instead, this script reads a GeoJSON file you export manually from
 * the Overpass Turbo web UI (which works fine in a real browser):
 *
 *   1. Go to https://overpass-turbo.eu
 *   2. Paste the query from QUERY_FOR_OVERPASS_TURBO.txt (next to this file)
 *   3. Click Run, wait for results
 *   4. Click Export -> Download as GeoJSON
 *   5. Save it as ./scripts/mp_facilities.geojson
 *   6. Run:  node scripts/seed_mp_facilities.js
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

const fs = require("fs")
const path = require("path")
require("dotenv").config({ path: ".env.local" })
const { createClient } = require("@supabase/supabase-js")

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const GEOJSON_PATH = path.join(__dirname, "mp_facilities.geojson")

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("[SEED] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
  process.exit(1)
}

if (!fs.existsSync(GEOJSON_PATH)) {
  console.error(`[SEED] File not found: ${GEOJSON_PATH}`)
  console.error("[SEED] Export it from https://overpass-turbo.eu first — see comment at top of this file.")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const TYPE_MAP = {
  hospital: "hospital",
  clinic: "clinic",
  doctors: "doctors",
  pharmacy: "pharmacy",
  health_post: "health_post",
}

function classify(props) {
  if (props.healthcare === "laboratory") return "lab"
  if (TYPE_MAP[props.amenity]) return TYPE_MAP[props.amenity]
  return "clinic"
}

function buildAddress(props) {
  const parts = [
    props["addr:housenumber"],
    props["addr:street"],
    props["addr:suburb"],
    props["addr:city"] || props["addr:town"] || props["addr:village"],
    props["addr:district"],
  ].filter(Boolean)
  return parts.length ? parts.join(", ") : null
}

async function seed() {
  console.log(`[SEED] Reading ${GEOJSON_PATH}...`)
  const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, "utf8"))

  if (!geojson.features || geojson.features.length === 0) {
    console.error("[SEED] No features found in the GeoJSON file.")
    process.exit(1)
  }

  console.log(`[SEED] Found ${geojson.features.length} raw features.`)

  const rows = []
  const seenOsmIds = new Set()

  for (const feature of geojson.features) {
    const props = feature.properties || {}
    let lon, lat

    if (feature.geometry?.type === "Point") {
      ;[lon, lat] = feature.geometry.coordinates
    } else if (feature.geometry?.type === "Polygon") {
      // Use first vertex as an approximate center for way-based facilities
      ;[lon, lat] = feature.geometry.coordinates[0][0]
    } else {
      continue
    }
    if (!lat || !lon) continue

    const osmType = props["@id"]?.split("/")[0] || feature.id?.split("/")[0] || "node"
    const osmNumId = props["@id"]?.split("/")[1] || feature.id?.split("/")[1] || feature.id
    const osmId = `${osmType}/${osmNumId}`
    if (seenOsmIds.has(osmId)) continue
    seenOsmIds.add(osmId)

    const type = classify(props)
    const name = props.name || props["name:en"] || `Unnamed ${type}`

    rows.push({
      osm_id: osmId,
      name,
      type,
      address: buildAddress(props),
      phone: props.phone || props["contact:phone"] || null,
      district: props["addr:district"] || props["addr:city"] || null,
      geom: `SRID=4326;POINT(${lon} ${lat})`,
      source: "osm",
      verified: false,
    })
  }

  console.log(`[SEED] ${rows.length} usable facilities after dedup + filtering missing coordinates.`)

  const BATCH_SIZE = 500
  let inserted = 0
  let failed = 0

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from("healthcare_facilities")
      .upsert(batch, { onConflict: "osm_id", ignoreDuplicates: false })

    if (error) {
      console.error(`[SEED] Batch ${i / BATCH_SIZE + 1} failed:`, error.message)
      failed += batch.length
    } else {
      inserted += batch.length
      console.log(`[SEED] Batch ${i / BATCH_SIZE + 1}/${Math.ceil(rows.length / BATCH_SIZE)} upserted (${inserted} total so far)`)
    }
  }

  console.log(`\n[SEED] Done. Inserted/updated: ${inserted}. Failed: ${failed}.`)

  const byType = rows.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1
    return acc
  }, {})
  console.log("[SEED] Breakdown by type:", byType)
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[SEED] Fatal error:", err.message)
    process.exit(1)
  })

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[SEED] Fatal error:", err.message)
    process.exit(1)
  })
