import fs from 'fs'
import path from 'path'

// 1. Load pan-india-lgd.json for state/district normalization
const lgdData = JSON.parse(fs.readFileSync('lib/geo/pan-india-lgd.json', 'utf8'))
const stateCodeMap = new Map()
const stateNameMap = new Map()

lgdData.forEach(s => {
  stateCodeMap.set(s.nameEn.toLowerCase(), s.code)
  stateNameMap.set(s.nameEn.toLowerCase(), s.nameEn)
  // Also check alternative names
  if (s.nameEn === 'Odisha') stateCodeMap.set('orissa', s.code)
  if (s.nameEn === 'Uttarakhand') stateCodeMap.set('uttaranchal', s.code)
})

function inferSpecialty(hospitalName) {
  const h = hospitalName.toLowerCase()
  if (h.includes('heart') || h.includes('cardio') || h.includes('cardiac')) return { key: 'cardiology', name: 'Cardiology' }
  if (h.includes('pediatric') || h.includes('children') || h.includes('child') || h.includes('shishu')) return { key: 'pediatrics', name: 'Pediatrics & Child Care' }
  if (h.includes('maternity') || h.includes('women') || h.includes('zanana') || h.includes('ob') || h.includes('gyn') || h.includes('mahila')) return { key: 'gynecology', name: 'Obstetrics & Gynecology' }
  if (h.includes('ortho') || h.includes('bone') || h.includes('joint') || h.includes('fracture') || h.includes('spine')) return { key: 'orthopedics', name: 'Orthopedics & Joint Care' }
  if (h.includes('neuro') || h.includes('brain') || h.includes('mental')) return { key: 'neurology', name: 'Neurology' }
  if (h.includes('cancer') || h.includes('onco')) return { key: 'oncology', name: 'Oncology' }
  if (h.includes('ent') || h.includes('ear') || h.includes('eye') || h.includes('netra')) return { key: 'ent', name: 'ENT & Specialist Care' }
  if (h.includes('chest') || h.includes('pulmo') || h.includes('lung') || h.includes('tb')) return { key: 'pulmonology', name: 'Pulmonology' }
  if (h.includes('skin') || h.includes('derma')) return { key: 'dermatology', name: 'Dermatology' }
  return { key: 'general', name: 'General Medicine & Surgery' }
}

function parseCsv(text) {
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

const content = fs.readFileSync('pmjay_facilities_contacts.csv', 'utf8')
const lines = content.split('\n')

// Keep track of counts per state and specialty to ensure a balanced, high-quality directory
const stateSpecialtyCount = {}
const extractedDoctors = []

for (let i = 1; i < lines.length; i++) {
  const line = lines[i]
  if (!line) continue
  const clean = parseCsv(line)
  const nin = (clean[0] || '').trim()
  const address = (clean[2] || '').trim()
  const lat = parseFloat(clean[3])
  const lon = parseFloat(clean[4])
  const contact = (clean[5] || '').trim()
  const mobile = (clean[6] || '').trim()
  const hospital = (clean[8] || '').trim()
  const pincode = (clean[9] || '').trim()
  const district = (clean[10] || '').trim()
  const stateRaw = (clean[11] || '').trim()

  if (!contact || !contact.toLowerCase().includes('dr') || !mobile || mobile.length < 8 || !lat || !lon || !hospital) {
    continue
  }

  const stateKey = stateRaw.toLowerCase()
  const stateCode = stateCodeMap.get(stateKey)
  const stateName = stateNameMap.get(stateKey) || stateRaw

  if (!stateCode) continue

  const countKey = `${stateCode}_nodal`
  const curCount = stateSpecialtyCount[countKey] || 0

  // Allow up to 25 hospital contacts per state
  if (curCount >= 25) continue
  stateSpecialtyCount[countKey] = curCount + 1

  // Format clean contact person name without fabricating 'Dr. ' prefix
  const cleanContact = contact.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
  // Format phone to standard +91 international dialing format (strictly 10 digits)
  let rawDigits = mobile.replace(/[^\d]/g, '')
  if (rawDigits.startsWith('91') && rawDigits.length === 12) rawDigits = rawDigits.slice(2)
  if (rawDigits.length !== 10) continue
  const formattedPhone = `+91 ${rawDigits.slice(0, 5)} ${rawDigits.slice(5)}`

  let docId = nin ? `doc-pmjay-${nin.toLowerCase()}` : `doc-pmjay-fac-${i}`
  if (extractedDoctors.some(d => d.id === docId)) {
    docId = `${docId}-${i}`
  }

  const cleanHospital = hospital.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
  const cleanDistrict = district.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')

  extractedDoctors.push({
    id: docId,
    name: cleanContact,
    contactPersonName: cleanContact,
    specialty: 'unspecified',
    specialtyName: 'Facility Medical Desk / Hospital Nodal Contact',
    hospitalAffiliation: cleanHospital,
    stateCode,
    stateName,
    districtName: cleanDistrict,
    location: address || `${cleanHospital}, ${cleanDistrict}, ${stateName} ${pincode}`,
    phone: formattedPhone,
    verified: false, // Not an independently verified private clinician
    verificationStatus: 'source_confirmed',
    recordType: 'facility_nodal_contact',
    sourceName: 'National Health Authority AB-PMJAY Empaneled Hospital Directory',
    sourceRecordId: nin.toUpperCase(),
    sourceUrl: 'https://data.gov.in/resource/national-hospital-directory-geo-code-and-additional-parameters-updated-till-last-month',
    available: false, // Cannot be booked online; direct facility phone contact only
    lat,
    lon,
    bio: `Institutional nodal medical contact at ${cleanHospital}, empaneled under AB-PMJAY serving ${cleanDistrict}. Contact details confirmed from official NHA hospital registry. Please contact facility directly to verify doctor OPD schedules.`
  })
}

console.log(`Extracted ${extractedDoctors.length} hospital nodal contacts across ${Object.keys(stateSpecialtyCount).length} states!`)

// Read existing real-doctors.ts
const existingContent = fs.readFileSync('lib/data/real-doctors.ts', 'utf8')
const marker = 'export const REAL_DOCTORS: RealDoctor[] = ['
const parts = existingContent.split(marker)

if (parts.length !== 2) {
  console.error('Marker not found in real-doctors.ts')
  process.exit(1)
}

// Find closing bracket of array
const endMarker = '\n]'
const arrayCloseIdx = parts[1].lastIndexOf(endMarker)

if (arrayCloseIdx === -1) {
  console.error('End marker not found')
  process.exit(1)
}

let baseArrayStr = parts[1].slice(0, arrayCloseIdx)
const firstPmjayIdx = baseArrayStr.indexOf('"doc-pmjay')
if (firstPmjayIdx !== -1) {
  const lastBraceBeforePmjay = baseArrayStr.lastIndexOf('},', firstPmjayIdx)
  if (lastBraceBeforePmjay !== -1) {
    baseArrayStr = baseArrayStr.slice(0, lastBraceBeforePmjay + 2)
  }
}

// Format new doctor objects
const newDoctorsStr = extractedDoctors.map(d => `  ${JSON.stringify(d, null, 2).replace(/\n/g, '\n  ')},`).join('\n')

const remainder = parts[1].slice(arrayCloseIdx)
const updatedContent = parts[0] + marker + baseArrayStr + '\n  // --- PAN-INDIA HOSPITAL NODAL CONTACTS (OFFICIAL AB-PMJAY REGISTRY) ---\n' + newDoctorsStr + remainder

fs.writeFileSync('lib/data/real-doctors.ts', updatedContent, 'utf8')
console.log('Successfully updated lib/data/real-doctors.ts with PAN-India hospital nodal contacts.')
