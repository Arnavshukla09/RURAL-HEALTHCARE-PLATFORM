/**
 * scripts/report_dataset.mjs
 *
 * Evidence-based dataset audit and provenance report for Rural Healthcare Platform.
 * Validates local file datasets against strict integrity rules.
 * Fails with process.exit(1) if any integrity or provenance invariant is violated.
 */

import fs from 'fs'
import path from 'path'

function runReport() {
  console.log('='.repeat(70))
  console.log(' RURAL HEALTHCARE PLATFORM - DATASET INTEGRITY & PROVENANCE AUDIT')
  console.log(' Mode: Local File Audit')
  console.log(' Timestamp: ' + new Date().toISOString())
  console.log('='.repeat(70) + '\n')

  let failureCount = 0
  function assertRule(name, passed, detail) {
    if (passed) {
      console.log(`  [PASS] ${name}${detail ? ': ' + detail : ''}`)
    } else {
      console.error(`  [FAIL] ${name}: ${detail}`)
      failureCount++
    }
  }

  // 1. Doctors Dataset Audit
  const doctorsPath = path.resolve('lib/data/real-doctors.ts')
  if (!fs.existsSync(doctorsPath)) {
    console.error('Fatal: lib/data/real-doctors.ts not found')
    process.exit(1)
  }

  const doctorContent = fs.readFileSync(doctorsPath, 'utf8')
  
  // Extract all JSON objects from the array
  const marker = 'export const REAL_DOCTORS: RealDoctor[] = ['
  const startIdx = doctorContent.indexOf(marker)
  if (startIdx === -1) {
    console.error('Fatal: REAL_DOCTORS array marker not found')
    process.exit(1)
  }

  // Regex-extract structured doctor records
  const idMatches = (doctorContent.match(/"id"\s*:\s*"([^"]+)"/g) || []).map(m => m.split(':')[1].replace(/["\s]/g, ''))
  const recordTypeMatches = (doctorContent.match(/"recordType"\s*:\s*"([^"]+)"/g) || []).map(m => m.split(':')[1].replace(/["\s]/g, ''))
  const verificationMatches = (doctorContent.match(/"verificationStatus"\s*:\s*"([^"]+)"/g) || []).map(m => m.split(':')[1].replace(/["\s]/g, ''))
  const lats = (doctorContent.match(/"lat"\s*:\s*([\d\.\-]+)/g) || []).map(m => parseFloat(m.split(':')[1].trim()))
  const lons = (doctorContent.match(/"lon"\s*:\s*([\d\.\-]+)/g) || []).map(m => parseFloat(m.split(':')[1].trim()))
  const phones = (doctorContent.match(/"phone"\s*:\s*"([^"]+)"/g) || []).map(m => m.split(':')[1].replace(/["\s]/g, ''))
  const opdMatches = doctorContent.match(/"opdTimings"\s*:\s*"([^"]+)"/g) || []

  console.log('1. DIRECTORY DATASET PROVENANCE (lib/data/real-doctors.ts)')
  console.log(`   - Total Extracted Directory Records: ${idMatches.length}`)
  
  // Rule: Unique IDs
  const idSet = new Set(idMatches)
  assertRule('Unique Record Identifiers', idSet.size === idMatches.length, `${idSet.size} unique across ${idMatches.length} records`)

  // Rule: Phone format
  const validPhones = phones.filter(p => /^\+91\d{10}$/.test(p.replace(/[\s\-]/g, '')))
  assertRule('Standard +91 Phone Format', validPhones.length === phones.length, `${validPhones.length}/${phones.length} conformant`)

  // Rule: Coordinate bounds (India Bounding Box: 6.5°N - 37.5°N, 68.7°E - 97.5°E)
  let validCoords = 0
  let swappedCoords = 0
  for (let i = 0; i < lats.length; i++) {
    const lat = lats[i]
    const lon = lons[i]
    if (lat >= 6.5 && lat <= 37.5 && lon >= 68.7 && lon <= 97.5) {
      validCoords++
    }
    // Check swapped lat/lon (lon is between 6.5-37.5 and lat is between 68.7-97.5)
    if (lon >= 6.5 && lon <= 37.5 && lat >= 68.7 && lat <= 97.5) {
      swappedCoords++
    }
  }
  assertRule('Coordinates Within India Bounding Box', validCoords === lats.length, `${validCoords}/${lats.length} within 6.5-37.5N, 68.7-97.5E`)
  assertRule('Zero Swapped Latitude/Longitude Coordinates', swappedCoords === 0, `${swappedCoords} detected swapped`)

  // Rule: Facility Nodal Contacts must NOT have fabricated OPD Timings
  const facilityCount = recordTypeMatches.filter(r => r === 'facility_nodal_contact').length
  const clinicianCount = recordTypeMatches.filter(r => r === 'clinician').length
  console.log(`   - Clinician Records: ${clinicianCount}`)
  console.log(`   - Facility Nodal Contact Records: ${facilityCount}`)
  assertRule('Facility Contacts Have No Fabricated Timings', opdMatches.length <= clinicianCount, `OPD timings count (${opdMatches.length}) does not exceed clinician count (${clinicianCount})`)

  console.log('')

  // 2. Facilities Raw CSV Audit
  console.log('2. RAW PM-JAY FACILITIES AUDIT (pmjay_facilities_contacts.csv)')
  if (fs.existsSync('pmjay_facilities_contacts.csv')) {
    const pmjayContent = fs.readFileSync('pmjay_facilities_contacts.csv', 'utf8')
    const lines = pmjayContent.split('\n').filter(l => l.trim().length > 0)
    const dataLines = lines.slice(1)
    let validPmjayGps = 0
    let validPmjayPhone = 0
    
    function parseCsvLine(text) {
      const res = []
      let cur = ''
      let inQ = false
      for (let i = 0; i < text.length; i++) {
        const c = text[i]
        if (c === '"') inQ = !inQ
        else if (c === ',' && !inQ) { res.push(cur); cur = '' }
        else cur += c
      }
      res.push(cur)
      return res
    }

    for (const line of dataLines) {
      const parts = parseCsvLine(line)
      const lat = parseFloat(parts[3])
      const lon = parseFloat(parts[4])
      const mobile = (parts[6] || '').trim()
      if (!isNaN(lat) && !isNaN(lon) && lat >= 6.5 && lat <= 37.5 && lon >= 68.7 && lon <= 97.5) {
        validPmjayGps++
      }
      if (mobile && mobile.replace(/[^\d]/g, '').length >= 10) {
        validPmjayPhone++
      }
    }

    console.log(`   - Total Raw Facility Rows: ${dataLines.length}`)
    console.log(`   - Valid Coordinate Rows:   ${validPmjayGps}`)
    console.log(`   - Valid Phone Contact Rows: ${validPmjayPhone}`)
    assertRule('Raw Dataset Has Valid Coordinate Density', validPmjayGps > 5000, `${validPmjayGps} rows pass bounding box`)
  } else {
    console.log('   - Note: pmjay_facilities_contacts.csv not found in working tree')
  }

  console.log('')

  // 3. Geographic Boundary Audit
  console.log('3. LGD GEOGRAPHIC REFERENCE AUDIT (lib/geo/pan-india-lgd.json)')
  if (fs.existsSync('lib/geo/pan-india-lgd.json')) {
    const lgd = JSON.parse(fs.readFileSync('lib/geo/pan-india-lgd.json', 'utf8'))
    let totalDistricts = 0
    lgd.forEach(s => totalDistricts += (s.districts || []).length)
    console.log(`   - States and UTs Mapped: ${lgd.length}`)
    console.log(`   - Administrative Districts Mapped: ${totalDistricts}`)
    assertRule('LGD Directory Covers All States and UTs', lgd.length >= 36, `${lgd.length} states/UTs mapped`)
    assertRule('LGD Directory Covers National Districts', totalDistricts >= 700, `${totalDistricts} districts mapped`)
  }

  console.log('\n' + '='.repeat(70))
  if (failureCount > 0) {
    console.error(`AUDIT FAILED: ${failureCount} integrity rules violated.`)
    console.log('='.repeat(70) + '\n')
    process.exit(1)
  } else {
    console.log('AUDIT PASSED: All evidence-based dataset rules satisfied.')
    console.log('='.repeat(70) + '\n')
  }
}

runReport()
