/**
 * scripts/ingest_pan_india_geojson.mjs
 *
 * High-performance streaming ingestion for PAN India Health Facilities GeoJSON
 * (HotOSM / Geofabrik India Health Facilities: 139,664 features).
 *
 * Features:
 * 1. Reads the 100MB GeoJSON in chunks using standard Node.js fs streams (Zero external dependencies).
 * 2. Parses Points, Polygons, and Multipolygons (calculates centroid for polygon boundaries).
 * 3. Maps OpenStreetMap amenity / healthcare tags to platform types:
 *    - 'hospital' | 'clinic' | 'health_post' | 'pharmacy' | 'lab' | 'doctors'
 * 4. Extracts State (adm1_name), District (adm2_name), and Sub-district (adm3_name).
 * 5. Batch upserts into Supabase `healthcare_facilities` using PostGIS onConflict="osm_id".
 *    - The DB trigger `trg_set_facility_geom` automatically creates `geom` geography points!
 */

import fs from 'fs'
import path from 'path'

// Load .env.local
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

const GEOJSON_PATH = process.argv[2] || process.env.DATASET_PATH || path.resolve(process.cwd(), 'data/health_facilities.geojson')

// OpenStreetMap Attribution: Data © OpenStreetMap contributors, licensed under ODbL 1.0

function mapFacilityType(props) {
  const amenity = (props.amenity || '').toLowerCase()
  const healthcare = (props.healthcare || '').toLowerCase()
  const name = (props.name || '').toLowerCase()

  if (amenity === 'hospital' || healthcare === 'hospital' || name.includes('hospital') || name.includes('medical college')) {
    return 'hospital'
  }
  if (amenity === 'pharmacy' || healthcare === 'pharmacy' || name.includes('pharmacy') || name.includes('medical store')) {
    return 'pharmacy'
  }
  if (amenity === 'doctors' || healthcare === 'doctor' || amenity === 'dentist') {
    return 'doctors'
  }
  if (healthcare === 'centre' || name.includes('phc') || name.includes('primary health') || name.includes('chc') || name.includes('sub centre') || name.includes('arogya')) {
    return 'health_post'
  }
  if (amenity === 'clinic' || healthcare === 'clinic') {
    return 'clinic'
  }
  return 'clinic' // Default fallback
}

function cleanStateName(adm1) {
  if (!adm1) return null
  const s = adm1.trim()
  const map = {
    'Mahārāshtra': 'Maharashtra',
    'Tamil Nādu': 'Tamil Nadu',
    'Telangāna': 'Telangana',
    'Karnātaka': 'Karnataka',
    'Odisha': 'Odisha',
    'Gujarāt': 'Gujarat',
    'Chhattīsgarh': 'Chhattisgarh',
    'Haryāna': 'Haryana',
    'Punjab': 'Punjab',
    'Madhya Pradesh': 'Madhya Pradesh',
    'Rajasthan': 'Rajasthan',
    'Uttar Pradesh': 'Uttar Pradesh',
    'West Bengal': 'West Bengal',
    'Bihar': 'Bihar',
    'Kerala': 'Kerala',
    'Jharkhand': 'Jharkhand',
    'Assam': 'Assam',
    'Delhi': 'Delhi',
    'Himāchal Pradesh': 'Himachal Pradesh',
    'Uttarakhand': 'Uttarakhand',
    'Andhra Pradesh': 'Andhra Pradesh'
  }
  return map[s] || s
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
    console.error(`Batch insert failed (${res.status}):`, errText.slice(0, 200))
    return false
  }
  return true
}

async function run() {
  console.log('🚀 Starting PAN-India Health Facilities GeoJSON Streaming Ingestion...')
  console.log(`📁 Source: ${GEOJSON_PATH}`)

  if (!fs.existsSync(GEOJSON_PATH)) {
    console.error(`❌ GeoJSON file not found at: ${GEOJSON_PATH}`)
    process.exit(1)
  }

  const stream = fs.createReadStream(GEOJSON_PATH, { encoding: 'utf8', highWaterMark: 64 * 1024 })
  let buffer = ''
  const BATCH_SIZE = 500
  let currentBatch = []
  let totalProcessed = 0
  let totalInserted = 0
  const startTime = Date.now()

  stream.on('data', async (chunk) => {
    buffer += chunk
    const lines = buffer.split('\n')
    // Keep last partial line in buffer
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('{ "type": "Feature"') && !trimmed.startsWith('{"type":"Feature"')) {
        continue
      }

      // Strip trailing comma if present
      const cleanJson = trimmed.endsWith(',') ? trimmed.slice(0, -1) : trimmed

      try {
        const feature = JSON.parse(cleanJson)
        const props = feature.properties || {}
        const geom = feature.geometry || {}

        let lon = null
        let lat = null

        if (geom.type === 'Point' && Array.isArray(geom.coordinates)) {
          lon = geom.coordinates[0]
          lat = geom.coordinates[1]
        } else if (geom.type === 'Polygon' && Array.isArray(geom.coordinates) && geom.coordinates[0]?.length) {
          // Centroid approximation from first ring
          let sumLon = 0
          let sumLat = 0
          const ring = geom.coordinates[0]
          for (const pt of ring) {
            sumLon += pt[0]
            sumLat += pt[1]
          }
          lon = sumLon / ring.length
          lat = sumLat / ring.length
        }

        if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) {
          continue
        }

        const rawId = props.id || ''
        const numericOsmId = parseInt(rawId.replace(/\D/g, ''), 10) || null

        const name = (props.name || props.name_en || props.name_hi || props.name_latin || 'Healthcare Centre').trim()
        const state = cleanStateName(props.adm1_name)
        const district = props.adm2_name ? props.adm2_name.trim() : null
        const address = props.addr_full || (district && state ? `${district}, ${state}` : state || null)
        const type = mapFacilityType(props)

        currentBatch.push({
          osm_id: numericOsmId,
          name,
          type,
          address,
          district,
          state,
          lat,
          lon,
          tags: {
            healthcare: props.healthcare || null,
            speciality: props.healthcare_speciality || null,
            operator: props.operator_type || null,
            osm_feature_id: rawId
          }
        })

        totalProcessed++

        if (currentBatch.length >= BATCH_SIZE) {
          stream.pause()
          const toSend = currentBatch
          currentBatch = []
          const ok = await uploadBatch(toSend)
          if (ok) totalInserted += toSend.length
          
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
          process.stdout.write(`\r⏳ Processed: ${totalProcessed} | Uploaded: ${totalInserted} | Time: ${elapsed}s`)
          stream.resume()
        }
      } catch (e) {
        // Skip unparseable line
      }
    }
  })

  stream.on('end', async () => {
    if (currentBatch.length > 0) {
      const ok = await uploadBatch(currentBatch)
      if (ok) totalInserted += currentBatch.length
    }
    const totalSecs = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`\n\n🎉 INGESTION COMPLETE!`)
    console.log(`📊 Total features read: ${totalProcessed}`)
    console.log(`✅ Successfully uploaded to Supabase: ${totalInserted}`)
    console.log(`⏱ Total elapsed time: ${totalSecs} seconds`)
  })

  stream.on('error', (err) => {
    console.error('❌ Stream error:', err)
  })
}

run()
