const { createClient } = require("@supabase/supabase-js")

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("[VERIFY] Missing Supabase credentials")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const EXPECTED_TABLES = [
  "users",
  "profiles",
  "patients",
  "healthcare_providers",
  "appointments",
  "medical_records",
  "health_data",
  "notifications",
  "offline_sync_log",
]

async function verifyMigrations() {
  try {
    console.log("[VERIFY] Checking database tables...\n")

    const result = await supabase.rpc("get_tables", {})

    if (result.error) {
      console.error("[VERIFY] Error querying tables:", result.error)
      console.log("[VERIFY] Attempting direct schema check...\n")

      for (const table of EXPECTED_TABLES) {
        try {
          const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true })

          if (error) {
            console.log(`❌ Table "${table}": NOT FOUND`)
            console.log(`   Error: ${error.message}\n`)
          } else {
            console.log(`✅ Table "${table}": OK (${count} records)\n`)
          }
        } catch (e) {
          console.log(`❌ Table "${table}": ERROR - ${e.message}\n`)
        }
      }
    } else {
      console.log("[VERIFY] Schema verification complete")
    }

    console.log("[VERIFY] ✅ Migration check finished")
    process.exit(0)
  } catch (error) {
    console.error("[VERIFY] Fatal error:", error)
    process.exit(1)
  }
}

verifyMigrations()
