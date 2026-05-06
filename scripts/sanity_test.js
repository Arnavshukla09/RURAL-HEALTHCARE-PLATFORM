const https = require("https")
const fs = require("fs")

const BASE_URL = process.env.API_URL || "http://localhost:3000"
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  passed: 0,
  failed: 0,
}

function logTest(name, passed, details = "") {
  console.log(`${passed ? "✅" : "❌"} ${name}`)
  if (details) console.log(`   ${details}`)
  testResults.tests.push({ name, passed, details })
  if (passed) testResults.passed++
  else testResults.failed++
}

function makeRequest(method, url, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    }

    const protocol = urlObj.protocol === "https:" ? https : require("http")
    const req = protocol.request(options, (res) => {
      let data = ""
      res.on("data", (chunk) => {
        data += chunk
      })
      res.on("end", () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null,
          })
        } catch {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
          })
        }
      })
    })

    req.on("error", reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

async function runSanityTests() {
  console.log("[SANITY] Starting Rural Healthcare Platform tests\n")

  try {
    // Test 1: Health check
    console.log("--- Test 1: Health Check ---")
    try {
      const healthRes = await makeRequest("GET", `${BASE_URL}/api/health`)
      logTest("Health endpoint accessible", healthRes.status === 200, `Status: ${healthRes.status}`)
    } catch (e) {
      logTest("Health endpoint accessible", false, e.message)
    }

    // Test 2: Auth signup
    console.log("\n--- Test 2: Authentication ---")
    const testEmail = `patient_${Date.now()}@test.com`
    const testPassword = "Test@12345"

    try {
      const signupRes = await makeRequest("POST", `${BASE_URL}/api/auth/signup`, {
        email: testEmail,
        password: testPassword,
        name: "Test Patient",
        role: "patient",
      })
      logTest("Patient signup", signupRes.status === 200 || signupRes.status === 201, `Status: ${signupRes.status}`)
    } catch (e) {
      logTest("Patient signup", false, e.message)
    }

    // Test 3: Symptom check
    console.log("\n--- Test 3: Symptom Checker ---")
    try {
      const symptomRes = await makeRequest("POST", `${BASE_URL}/api/symptoms/check`, {
        symptoms: ["fever", "cough"],
        duration_days: 3,
      })
      logTest("Symptom check endpoint", symptomRes.status === 200, `Status: ${symptomRes.status}`)
    } catch (e) {
      logTest("Symptom check endpoint", false, e.message)
    }

    // Test 4: Provider discovery
    console.log("\n--- Test 4: Provider Discovery ---")
    try {
      const providersRes = await makeRequest("GET", `${BASE_URL}/api/providers`)
      logTest("Provider discovery", providersRes.status === 200, `Found ${providersRes.body?.length || 0} providers`)
    } catch (e) {
      logTest("Provider discovery", false, e.message)
    }

    // Test 5: Appointment creation
    console.log("\n--- Test 5: Appointment Management ---")
    try {
      const appointmentRes = await makeRequest("POST", `${BASE_URL}/api/appointments`, {
        provider_id: "test-provider",
        appointment_date: new Date(Date.now() + 86400000).toISOString(),
        reason: "General checkup",
      })
      logTest(
        "Appointment creation",
        appointmentRes.status === 200 || appointmentRes.status === 201,
        `Status: ${appointmentRes.status}`,
      )
    } catch (e) {
      logTest("Appointment creation", false, e.message)
    }

    // Test 6: Offline sync
    console.log("\n--- Test 6: Offline Sync ---")
    try {
      const syncRes = await makeRequest("POST", `${BASE_URL}/api/sync/push`, {
        operations: [
          {
            table: "health_data",
            operation: "create",
            data: { heart_rate: 72, timestamp: new Date().toISOString() },
          },
        ],
      })
      logTest("Offline sync push", syncRes.status === 200 || syncRes.status === 201, `Status: ${syncRes.status}`)
    } catch (e) {
      logTest("Offline sync push", false, e.message)
    }

    // Test 7: Medical records
    console.log("\n--- Test 7: Medical Records ---")
    try {
      const recordsRes = await makeRequest("GET", `${BASE_URL}/api/medical-records`)
      logTest("Medical records retrieval", recordsRes.status === 200, `Status: ${recordsRes.status}`)
    } catch (e) {
      logTest("Medical records retrieval", false, e.message)
    }

    // Test 8: Health data
    console.log("\n--- Test 8: Health Data ---")
    try {
      const healthDataRes = await makeRequest("POST", `${BASE_URL}/api/health-data`, {
        data_type: "blood_pressure",
        systolic: 120,
        diastolic: 80,
        timestamp: new Date().toISOString(),
      })
      logTest(
        "Health data submission",
        healthDataRes.status === 200 || healthDataRes.status === 201,
        `Status: ${healthDataRes.status}`,
      )
    } catch (e) {
      logTest("Health data submission", false, e.message)
    }

    console.log("\n--- Test Summary ---")
    console.log(`✅ Passed: ${testResults.passed}`)
    console.log(`❌ Failed: ${testResults.failed}`)
    console.log(`Total: ${testResults.tests.length}\n`)

    fs.writeFileSync("./test-results.json", JSON.stringify(testResults, null, 2))
    console.log("[SANITY] Results saved to test-results.json")

    process.exit(testResults.failed === 0 ? 0 : 1)
  } catch (error) {
    console.error("[SANITY] Fatal error:", error)
    process.exit(1)
  }
}

runSanityTests()
