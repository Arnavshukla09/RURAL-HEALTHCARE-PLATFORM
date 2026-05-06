const https = require("https")
const fs = require("fs")

const OVERPASS_API = "https://overpass-api.de/api/interpreter"

// Bounding box for India (rough)
const BBOX = "8,68,35,97"

const overpassQuery = `[bbox:${BBOX}];
(
  node["amenity"="hospital"];
  node["amenity"="clinic"];
  node["amenity"="doctors"];
  way["amenity"="hospital"];
  way["amenity"="clinic"];
  way["amenity"="doctors"];
);
out center 100;`

function fetchFacilitiesFromOverpass() {
  return new Promise((resolve, reject) => {
    const postData = `data=${encodeURIComponent(overpassQuery)}`

    const options = {
      hostname: "overpass-api.de",
      port: 443,
      path: "/api/interpreter",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postData),
      },
    }

    const req = https.request(options, (res) => {
      let data = ""
      res.on("data", (chunk) => {
        data += chunk
      })
      res.on("end", () => {
        try {
          const json = JSON.parse(data)
          resolve(json)
        } catch (e) {
          reject(e)
        }
      })
    })

    req.on("error", reject)
    req.write(postData)
    req.end()
  })
}

async function seedFacilities() {
  try {
    console.log("[SEED] Fetching facilities from Overpass API...")
    const data = await fetchFacilitiesFromOverpass()

    if (!data.elements || data.elements.length === 0) {
      console.log("[SEED] No facilities found in Overpass data")
      return []
    }

    const facilities = data.elements
      .slice(0, 50) // Limit to 50 for demo
      .map((node, idx) => ({
        id: `facility_${idx}`,
        name: node.tags?.name || `Healthcare Facility ${idx}`,
        lat: node.center?.lat || node.lat,
        lon: node.center?.lon || node.lon,
        type: node.tags?.amenity || "clinic",
        address: node.tags?.["addr:full"] || "Address not available",
        phone: node.tags?.phone || "",
        beds_available: Math.floor(Math.random() * 50) + 5,
      }))
      .filter((f) => f.lat && f.lon)

    console.log(`[SEED] Found ${facilities.length} healthcare facilities`)
    fs.writeFileSync("./seeds/facilities.json", JSON.stringify(facilities, null, 2))
    console.log("[SEED] Facilities saved to seeds/facilities.json")
    return facilities
  } catch (error) {
    console.error("[SEED] Error fetching facilities:", error.message)
    // Fallback demo data
    const demoFacilities = [
      {
        id: "facility_1",
        name: "Rural Health Center - Mumbai",
        lat: 19.076,
        lon: 72.8479,
        type: "clinic",
        address: "Mumbai, Maharashtra",
        phone: "+91-22-1234-5678",
        beds_available: 15,
      },
      {
        id: "facility_2",
        name: "District Hospital - Pune",
        lat: 18.5204,
        lon: 73.8567,
        type: "hospital",
        address: "Pune, Maharashtra",
        phone: "+91-20-1234-5678",
        beds_available: 45,
      },
      {
        id: "facility_3",
        name: "Primary Health Center - Nashik",
        lat: 19.9975,
        lon: 73.791,
        type: "clinic",
        address: "Nashik, Maharashtra",
        phone: "+91-253-1234-567",
        beds_available: 12,
      },
    ]
    fs.writeFileSync("./seeds/facilities.json", JSON.stringify(demoFacilities, null, 2))
    console.log("[SEED] Using fallback demo facilities")
    return demoFacilities
  }
}

seedFacilities()
  .then((facilities) => {
    console.log(`[SEED] Complete: ${facilities.length} facilities ready`)
    process.exit(0)
  })
  .catch((error) => {
    console.error("[SEED] Failed:", error)
    process.exit(1)
  })
