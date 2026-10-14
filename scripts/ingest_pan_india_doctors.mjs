/**
 * scripts/ingest_pan_india_doctors.mjs
 *
 * Ingestion script for PAN-India Doctors, Specialists, Clinics & Hospitals
 * from Overpass export (7,736 features in export.geojson).
 *
 * Key safety & efficiency rules:
 * - Stays strictly within Supabase free-tier limits (500MB DB quota).
 * - Uses on_conflict=osm_id & resolution=merge-duplicates to prevent duplicate rows.
 * - Resolves missing district and state names using pan-india-lgd.json (722 districts).
 * - Batches in 250-record chunks with a 150ms backoff to prevent connection pool exhaustion.
 */

import fs from 'fs'
import path from 'path'

// 1. Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  for (const line of envContent.split('\n')) {
    const [k, ...v] = line.split('=')
    if (k && v.length) process.env[k.trim()] = v.join('=').trim()
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const SOURCE_GEOJSON = 'C:/Users/aarrn/Desktop/rural health/export.geojson'
const LGD_PATH = path.resolve(process.cwd(), 'lib/geo/pan-india-lgd.json')

// 2. Load LGD Districts for Spatial Fallback
const lgdData = JSON.parse(fs.readFileSync(LGD_PATH, 'utf8'))
const allDistricts = []
lgdData.forEach(s => {
  s.districts.forEach(d => {
    allDistricts.push({
      state: s.nameEn,
      district: d.nameEn,
      lat: d.center.lat,
      lng: d.center.lng
    })
  })
})

function findNearestDistrict(lat, lon) {
  let closest = null
  let minDist = Infinity
  for (const d of allDistricts) {
    const dLat = lat - d.lat
    const dLon = lon - d.lng
    const distSq = dLat * dLat + dLon * dLon
    if (distSq < minDist) {
      minDist = distSq
      closest = d
    }
  }
  return closest
}

function getFeatureCoordinates(geom) {
  if (!geom) return null
  if (geom.type === 'Point') {
    return { lon: geom.coordinates[0], lat: geom.coordinates[1] }
  }
  if (geom.type === 'Polygon' && geom.coordinates && geom.coordinates[0]) {
    let sumLon = 0, sumLat = 0, count = 0
    geom.coordinates[0].forEach(([lon, lat]) => {
      sumLon += lon
      sumLat += lat
      count++
    })
    return count > 0 ? { lon: sumLon / count, lat: sumLat / count } : null
  }
  return null
}

function mapType(p) {
  const amenity = (p.amenity || '').toLowerCase()
  const healthcare = (p.healthcare || '').toLowerCase()
  const name = (p.name || '').toLowerCase()

  if (amenity === 'doctors' || healthcare === 'doctor' || amenity === 'dentist') {
    return 'doctors'
  }
  if (amenity === 'hospital' || healthcare === 'hospital' || name.includes('hospital') || name.includes('medical college')) {
    return 'hospital'
  }
  if (amenity === 'pharmacy' || healthcare === 'pharmacy') {
    return 'pharmacy'
  }
  if (healthcare === 'centre' || name.includes('phc') || name.includes('chc') || name.includes('health post')) {
    return 'health_post'
  }
  return 'clinic'
}

async function uploadBatch(records) {
  if (records.length === 0) return true

  const res = await fetch(`${SUPABASE_URL}/rest/v1/healthcare_facilities?on_conflict=osm_id`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify(records)
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error(`❌ Batch upload failed (HTTP ${res.status}):`, errText.slice(0, 250))
    return false
  }
  return true
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function run() {
  console.log('🚀 Starting PAN-India Doctors & Specialists Ingestion...')
  console.log(`📁 Source: ${SOURCE_GEOJSON}`)

  if (!fs.existsSync(SOURCE_GEOJSON)) {
    console.error(`❌ File not found at: ${SOURCE_GEOJSON}`)
    process.exit(1)
  }

  const raw = fs.readFileSync(SOURCE_GEOJSON, 'utf8')
  const geojson = JSON.parse(raw)
  const features = geojson.features || []

  console.log(`📊 Total features in dataset: ${features.length}`)

  const BATCH_SIZE = 250
  let currentBatch = []
  let totalProcessed = 0
  let totalUploaded = 0
  let skipped = 0
  const startTime = Date.now()

  for (const f of features) {
    totalProcessed++
    const p = f.properties || {}
    const coords = getFeatureCoordinates(f.geometry)

    if (!coords || !coords.lat || !coords.lon) {
      skipped++
      continue
    }

    // Extract OSM ID
    let osmId = null
    if (p['@id']) {
      const num = p['@id'].replace(/[^\d]/g, '')
      if (num) osmId = parseInt(num, 10)
    } else if (f.id) {
      const num = String(f.id).replace(/[^\d]/g, '')
      if (num) osmId = parseInt(num, 10)
    }

    if (!osmId) {
      skipped++
      continue
    }

    // Determine facility type
    const type = mapType(p)

    // Doctor / Facility Name
    const name = p.name || p['name:en'] || (type === 'doctors' ? 'Medical Practitioner / Clinic' : 'Healthcare Facility')

    // Contact phone
    const phone = p.phone || p['contact:phone'] || p['contact:mobile'] || null

    // Address
    const address = p['addr:full'] || 
      [p['addr:housenumber'], p['addr:street'], p['addr:suburb'], p['addr:city'], p['addr:postcode']].filter(Boolean).join(', ') || 
      null

    // Resolve district and state
    let district = p['addr:district'] || p['addr:city'] || null
    let state = p['addr:state'] || null

    if (!district || !state) {
      const nearest = findNearestDistrict(coords.lat, coords.lon)
      if (nearest) {
        if (!district) district = nearest.district
        if (!state) state = nearest.state
      }
    }

    // Tags & Specialization
    const tags = {
      speciality: p['healthcare:speciality'] || null,
      emergency: p.emergency || null,
      operator: p.operator || p['operator:type'] || null,
      opening_hours: p.opening_hours || null,
      website: p.website || null
    }

    currentBatch.push({
      osm_id: osmId,
      name: name.slice(0, 255),
      type,
      address: address ? address.slice(0, 500) : null,
      phone: phone ? phone.slice(0, 100) : null,
      district: district ? district.slice(0, 100) : null,
      state: state ? state.slice(0, 100) : null,
      lat: Math.round(coords.lat * 10000000) / 10000000,
      lon: Math.round(coords.lon * 10000000) / 10000000,
      tags
    })

    if (currentBatch.length >= BATCH_SIZE) {
      const ok = await uploadBatch(currentBatch)
      if (ok) totalUploaded += currentBatch.length
      currentBatch = []
      process.stdout.write(`\r⏳ Uploaded: ${totalUploaded}/${features.length} (${Math.round((totalProcessed / features.length) * 100)}%)`)
      await sleep(150) // polite throttle
    }
  }

  // Upload final batch
  if (currentBatch.length > 0) {
    const ok = await uploadBatch(currentBatch)
    if (ok) totalUploaded += currentBatch.length
  }

  const durationSec = Math.round((Date.now() - startTime) / 1000)
  console.log('\n\n' + '='.repeat(60))
  console.log(`✅ Ingestion Complete in ${durationSec}s!`)
  console.log(`📊 Successfully Processed & Uploaded: ${totalUploaded} facilities & doctors`)
  console.log(`⚠️ Skipped (no coords/id): ${skipped}`)
  console.log('='.repeat(60))
}

run().catch(console.error)
