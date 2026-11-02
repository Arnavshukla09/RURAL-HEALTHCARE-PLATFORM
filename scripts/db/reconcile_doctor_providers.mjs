#!/usr/bin/env node
/**
 * scripts/reconcile_doctor_providers.mjs
 *
 * Pre-Deploy / Operational Utility:
 * 1. Scans for doctor accounts in public.patients (role='doctor').
 * 2. Identifies doctors who lack a linked row in public.healthcare_providers (user_id IS NULL).
 * 3. Shows available unlinked healthcare_providers.
 * 4. With --auto-link flag: securely auto-links doctors whose email strictly matches an unlinked provider 1:1.
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const autoLink = process.argv.includes("--auto-link");

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("============================================================");
  console.log("  👨‍⚕️ DOCTOR-PROVIDER RECONCILIATION AUDIT TOOL");
  console.log("============================================================");

  // 1. Fetch doctors from patients
  const { data: doctors, error: docErr } = await supabase
    .from("patients")
    .select("id, user_id, first_name, last_name, email, role")
    .eq("role", "doctor");

  if (docErr) {
    console.error("❌ Failed to query patients:", docErr.message);
    process.exit(1);
  }

  // 2. Fetch all healthcare providers
  const { data: providers, error: provErr } = await supabase
    .from("healthcare_providers")
    .select("id, user_id, name, email, specialization, is_verified");

  if (provErr) {
    console.error("❌ Failed to query healthcare_providers:", provErr.message);
    process.exit(1);
  }

  const linkedUserIds = new Set((providers || []).map((p) => p.user_id).filter(Boolean));
  const unlinkedDoctors = (doctors || []).filter((d) => !linkedUserIds.has(d.user_id));
  const unlinkedProviders = (providers || []).filter((p) => !p.user_id);

  console.log(`\n📊 System Summary:`);
  console.log(`   Total doctors in patients:        ${(doctors || []).length}`);
  console.log(`   Doctors with linked provider:      ${(doctors || []).length - unlinkedDoctors.length}`);
  console.log(`   Doctors WITHOUT linked provider:   ${unlinkedDoctors.length}`);
  console.log(`   Healthcare providers without user: ${unlinkedProviders.length}`);

  if (unlinkedDoctors.length === 0) {
    console.log("\n✔ All doctors are currently linked to a healthcare_provider record!");
    return;
  }

  console.log("\n⚠️ Unlinked Doctors (Will not see patient records until linked):");
  unlinkedDoctors.forEach((d, idx) => {
    console.log(`  ${idx + 1}. [${d.user_id}] ${d.first_name || ""} ${d.last_name || ""} (${d.email || "No email"})`);
  });

  if (autoLink) {
    console.log("\n⚡ Performing safe 1:1 email auto-linking...");
    let linkedCount = 0;

    for (const doc of unlinkedDoctors) {
      if (!doc.email) continue;
      const targetEmail = doc.email.toLowerCase().trim();

      const matching = unlinkedProviders.filter(
        (p) => p.email && p.email.toLowerCase().trim() === targetEmail && !p.user_id
      );

      if (matching.length === 1) {
        const providerToLink = matching[0];
        console.log(`  -> Linking doctor ${doc.email} to provider '${providerToLink.name}' (${providerToLink.id})...`);

        const { error: updateErr } = await supabase
          .from("healthcare_providers")
          .update({
            user_id: doc.user_id,
            is_verified: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", providerToLink.id);

        if (updateErr) {
          console.error(`     ❌ Failed to link: ${updateErr.message}`);
        } else {
          console.log(`     ✔ Successfully linked!`);
          linkedCount++;
        }
      }
    }
    console.log(`\n✔ Auto-linking complete: ${linkedCount} doctor(s) linked.`);
  } else {
    console.log("\n💡 Tip: Run with --auto-link to automatically link doctors with 1:1 matching provider emails.");
    console.log("   Or use POST /api/admin/doctor-provider-link with { user_id, provider_id } for manual linking.");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
