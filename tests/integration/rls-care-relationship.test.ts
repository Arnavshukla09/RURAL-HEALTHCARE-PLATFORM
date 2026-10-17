/**
 * tests/integration/rls-care-relationship.test.ts
 *
 * Real Database Integration & Behavioral Contract Suite:
 * 1. Database Safety & Allowlist Guard (rejects unallowlisted/production targets, fast-fails on REQUIRE_DB=1).
 * 2. Real JWT Authentication & Role-Based Client Provisioning (Patients A & B, Doctors D1 & D2, Admin, Demo Admin, Normal Demo User).
 * 3. Cross-Patient Isolation (Patient A cannot read or query Patient B's medical records or profile).
 * 4. Doctor Care-Relationship Scoping (Doctor D1 reads Patient A [scheduled], not Patient B [cancelled]; Doctor D2 reads nothing).
 * 5. Doctor DELETE Prohibition (Doctors cannot delete medical records even with an active care relationship).
 * 6. Admin Confidentiality & Moderation (Admin SELECT on medical_records returns 0 rows; Admin DELETE succeeds for GDPR right-to-erasure).
 * 7. Privilege Escalation Guard (Patients cannot elevate own role to 'admin' on UPDATE or INSERT).
 * 8. Healthcare Provider Table Protection (Patients and Doctors cannot write healthcare_providers.user_id).
 * 9. Append-Only Access Audit Log (Forged user_id insert rejected by RLS WITH CHECK; patient reads only own audit entries).
 * 10. Concurrency Double-Booking Protection (Exactly 1 of 20 parallel bookings for the same scheduled slot succeeds; 19 fail with 23505).
 * 11. Offline Sync Idempotency (Same client_op_id twice yields exactly 1 processed row in processed_client_ops).
 * 12. Demo Safety Guard (Normal user with 'demo' in email can update own appointments; exact 'admin@ruralhealth.demo' is blocked by trigger).
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, SupabaseClient, User } from "@supabase/supabase-js";
import { verifyIntegrationDatabaseTarget } from "./db-safety-guard";
import crypto from "crypto";

const safety = verifyIntegrationDatabaseTarget();
const isDbAvailable = safety.isSafeToExecute;

// Guard check: safety helper throws fast if REQUIRE_DB=1 and target is invalid/missing
describe.skipIf(!isDbAvailable)("Live RLS & Care Relationship Integration Suite (Local Supabase)", () => {
  const runId = crypto.randomUUID().slice(0, 8);
  const targetUrl = safety.targetUrl;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  let adminClient: SupabaseClient;
  let anonClient: SupabaseClient;

  interface TestActor {
    user: User;
    patientId: string;
    client: SupabaseClient;
    providerId?: string;
  }

  let patientA: TestActor;
  let patientB: TestActor;
  let doctorD1: TestActor;
  let doctorD2: TestActor;
  let adminUser: TestActor;
  let demoAdmin: TestActor;
  let normalDemoUser: TestActor;

  let recordA1Id: string;
  let recordB1Id: string;
  let apptNormalDemoId: string;

  async function provisionActor(email: string, role: string, name: string): Promise<TestActor> {
    const password = `TestPass!_${runId}_${crypto.randomUUID().slice(0, 6)}`;

    // Try signing in or create user
    const { data: signData } = await anonClient.auth.signInWithPassword({ email, password }).catch(() => ({ data: { user: null, session: null } }));
    let user = signData?.user;

    if (!user) {
      const { data: createData, error: createErr } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role, full_name: name },
      });

      if (createErr && createErr.message.includes("already been registered")) {
        const { data: listData } = await adminClient.auth.admin.listUsers();
        const existing = listData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
        if (!existing) throw new Error(`Could not find pre-existing user for ${email}`);
        await adminClient.auth.admin.updateUserById(existing.id, {
          password,
          user_metadata: { role, full_name: name },
        });
        user = existing;
      } else if (createErr) {
        throw new Error(`Failed to create test user ${email}: ${createErr.message}`);
      } else {
        user = createData.user;
      }
    }

    // Provision or verify patient profile
    let { data: profile } = await adminClient
      .from("patients")
      .select("id, user_id, role")
      .eq("user_id", user!.id)
      .maybeSingle();

    if (!profile) {
      const { data: newProfile, error: pErr } = await adminClient
        .from("patients")
        .insert({
          user_id: user!.id,
          first_name: name,
          email: email,
          role: role,
        })
        .select("id, user_id, role")
        .single();

      if (pErr) throw new Error(`Failed to insert patient profile for ${email}: ${pErr.message}`);
      profile = newProfile;
    } else if (profile.role !== role) {
      const { data: updProfile, error: uErr } = await adminClient
        .from("patients")
        .update({ role })
        .eq("id", profile.id)
        .select("id, user_id, role")
        .single();
      if (uErr) throw new Error(`Failed to update patient profile role for ${email}: ${uErr.message}`);
      profile = updProfile;
    }

    // Sign in after profile and role are confirmed in the database to obtain fresh session
    const { data: authSession, error: sErr } = await anonClient.auth.signInWithPassword({ email, password });
    if (sErr || !authSession.session) throw new Error(`Failed to sign in test user ${email}: ${sErr?.message}`);
    const session = authSession.session;

    // Create authenticated client carrying this actor's real JWT
    const client = createClient(targetUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      },
    });

    return { user: user!, patientId: profile.id, client };
  }

  beforeAll(async () => {
    if (!anonKey || !serviceRoleKey) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY environment variables are required for integration database tests."
      );
    }

    adminClient = createClient(targetUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    anonClient = createClient(targetUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 1. Provision all test actors with real JWT credentials
    patientA = await provisionActor(`patient_a_${runId}@ruralhealth.test`, "patient", "Patient Alpha");
    patientB = await provisionActor(`patient_b_${runId}@ruralhealth.test`, "patient", "Patient Beta");
    doctorD1 = await provisionActor(`doctor_d1_${runId}@ruralhealth.test`, "doctor", "Dr. Doctor One");
    doctorD2 = await provisionActor(`doctor_d2_${runId}@ruralhealth.test`, "doctor", "Dr. Doctor Two");
    adminUser = await provisionActor(`real_admin_${runId}@ruralhealth.test`, "admin", "Admin Auditor");
    demoAdmin = await provisionActor(`admin@ruralhealth.demo`, "admin", "Demo Admin Preview");
    normalDemoUser = await provisionActor(`user_demo_account_${runId}@ruralhealth.test`, "patient", "Normal Demo Patient");

    // 2. Link healthcare_providers entries for Doctor D1 and Doctor D2
    const { data: provD1, error: p1Err } = await adminClient
      .from("healthcare_providers")
      .insert({
        user_id: doctorD1.user.id,
        name: "Dr. Doctor One Clinical Practice",
        email: doctorD1.user.email,
        specialization: "General Medicine",
        is_verified: true,
      })
      .select("id")
      .single();
    if (p1Err) throw new Error(`Failed to create provider for D1: ${p1Err.message}`);
    doctorD1.providerId = provD1.id;

    const { data: provD2, error: p2Err } = await adminClient
      .from("healthcare_providers")
      .insert({
        user_id: doctorD2.user.id,
        name: "Dr. Doctor Two Orthopedics",
        email: doctorD2.user.email,
        specialization: "Orthopedics",
        is_verified: true,
      })
      .select("id")
      .single();
    if (p2Err) throw new Error(`Failed to create provider for D2: ${p2Err.message}`);
    doctorD2.providerId = provD2.id;

    // 3. Setup Appointments:
    // D1 with Patient A -> status = 'scheduled' (Care relationship active)
    await adminClient.from("appointments").insert({
      provider_id: doctorD1.providerId,
      patient_id: patientA.patientId,
      appointment_date: new Date(Date.now() + 100000000).toISOString(),
      status: "scheduled",
      notes: "Active consultation session",
    });

    // D1 with Patient B -> status = 'cancelled' (Care relationship INACTIVE)
    await adminClient.from("appointments").insert({
      provider_id: doctorD1.providerId,
      patient_id: patientB.patientId,
      appointment_date: new Date(Date.now() + 100050000).toISOString(),
      status: "cancelled",
      notes: "Cancelled consultation session",
    });

    // Appointment for Normal Demo User (for demo safety guard test)
    const { data: apptDemo } = await adminClient
      .from("appointments")
      .insert({
        provider_id: doctorD1.providerId,
        patient_id: normalDemoUser.patientId,
        appointment_date: new Date(Date.now() + 100100000).toISOString(),
        status: "scheduled",
        notes: "Initial note by normal demo user",
      })
      .select("id")
      .single();
    apptNormalDemoId = apptDemo!.id;

    // 4. Setup Medical Records:
    const { data: recA } = await adminClient
      .from("medical_records")
      .insert({
        patient_id: patientA.patientId,
        provider_id: doctorD1.providerId,
        record_type: "prescription",
        content: "Patient A Confidential Clinical Details",
      })
      .select("id")
      .single();
    recordA1Id = recA!.id;

    const { data: recB } = await adminClient
      .from("medical_records")
      .insert({
        patient_id: patientB.patientId,
        provider_id: doctorD1.providerId,
        record_type: "prescription",
        content: "Patient B Confidential Clinical Details",
      })
      .select("id")
      .single();
    recordB1Id = recB!.id;
  });

  afterAll(async () => {
    // Teardown: clean up test-specific rows
    if (patientA && patientB) {
      await adminClient.from("medical_records").delete().in("patient_id", [patientA.patientId, patientB.patientId]);
      await adminClient.from("appointments").delete().in("patient_id", [patientA.patientId, patientB.patientId]);
      if (doctorD1.providerId) await adminClient.from("healthcare_providers").delete().eq("id", doctorD1.providerId);
      if (doctorD2.providerId) await adminClient.from("healthcare_providers").delete().eq("id", doctorD2.providerId);
    }
  });

  // --------------------------------------------------------------------------
  // Test 1: Cross-Patient Denial
  // --------------------------------------------------------------------------
  it("verifies cross-patient denial: Patient A cannot access Patient B's records or profile", async () => {
    // Patient A queries medical records: sees only own records
    const { data: recordsA, error: recErr } = await patientA.client.from("medical_records").select("id, patient_id");
    expect(recErr).toBeNull();
    expect(recordsA).toBeDefined();
    expect(recordsA!.some((r) => r.id === recordA1Id)).toBe(true);
    expect(recordsA!.some((r) => r.id === recordB1Id)).toBe(false);

    // Patient A explicit query for Patient B's record: returns empty array
    const { data: bQuery } = await patientA.client.from("medical_records").select("id").eq("id", recordB1Id);
    expect(bQuery).toEqual([]);

    // Patient A queries patients profile: sees only self
    const { data: patientsA } = await patientA.client.from("patients").select("id, user_id");
    expect(patientsA).toBeDefined();
    expect(patientsA!.length).toBe(1);
    expect(patientsA![0].id).toBe(patientA.patientId);
  });

  // --------------------------------------------------------------------------
  // Test 2: Doctor Care Relationship Scoping
  // --------------------------------------------------------------------------
  it("verifies doctor care relationship scope: D1 reads A (scheduled), not B (cancelled); D2 reads nothing", async () => {
    // Doctor D1 has scheduled appointment with Patient A: can read Record A1
    const { data: d1Records, error: d1Err } = await doctorD1.client.from("medical_records").select("id, patient_id");
    expect(d1Err).toBeNull();
    expect(d1Records).toBeDefined();
    expect(d1Records!.some((r) => r.id === recordA1Id)).toBe(true);
    // Cancelled appointment with Patient B does NOT establish care relationship: cannot read Record B1
    expect(d1Records!.some((r) => r.id === recordB1Id)).toBe(false);

    // Doctor D2 has no appointments with anyone: returns 0 rows
    const { data: d2Records, error: d2Err } = await doctorD2.client.from("medical_records").select("id");
    expect(d2Err).toBeNull();
    expect(d2Records).toEqual([]);
  });

  // --------------------------------------------------------------------------
  // Test 3: No Doctor DELETE
  // --------------------------------------------------------------------------
  it("verifies no doctor DELETE: doctor D1 cannot delete patient records even with active care relationship", async () => {
    // D1 attempts DELETE on Record A1
    const { data: delResult, error: delErr } = await doctorD1.client.from("medical_records").delete().eq("id", recordA1Id).select();
    // In PostgREST RLS, delete on disallowed rows returns empty result or error
    expect(delResult === null || delResult.length === 0 || Boolean(delErr)).toBe(true);

    // Verify record remains untouched in the database
    const { data: checkRec } = await adminClient.from("medical_records").select("id").eq("id", recordA1Id).single();
    expect(checkRec).toBeDefined();
    expect(checkRec!.id).toBe(recordA1Id);
  });

  // --------------------------------------------------------------------------
  // Test 4: Admin Confidentiality vs Moderation
  // --------------------------------------------------------------------------
  it("verifies admin confidentiality & moderation: admin SELECT returns 0 rows, but DELETE succeeds", async () => {
    // Admin SELECT on medical_records returns 0 rows (confidentiality invariant)
    const { data: adminSelect, error: adminSelErr } = await adminUser.client.from("medical_records").select("id, content");
    expect(adminSelErr).toBeNull();
    expect(adminSelect).toEqual([]);

    // Check adminUser identity and patient role
    const { data: userProfile, error: profErr } = await adminClient.from("patients").select("id, user_id, role").eq("user_id", adminUser.user.id).single();
    expect(profErr).toBeNull();
    expect(userProfile?.role).toBe("admin");

    // Verify admin role is active via security definer RPC
    const { data: roleCheck, error: roleErr } = await adminUser.client.rpc("get_user_role");
    if (roleErr) {
      throw new Error(`get_user_role RPC failed for adminUser: ${roleErr.message}`);
    }
    expect(roleCheck).toBe("admin");

    // Create temporary disposable record to verify admin DELETE
    const { data: disposable, error: dispErr } = await adminClient
      .from("medical_records")
      .insert({
        patient_id: patientA.patientId,
        provider_id: doctorD1.providerId,
        record_type: "lab_report",
        content: "Disposable record for right-to-erasure test",
      })
      .select("id")
      .single();
    expect(dispErr).toBeNull();
    expect(disposable).toBeDefined();

    // Admin DELETE succeeds
    const { error: adminDelErr } = await adminUser.client.from("medical_records").delete().eq("id", disposable!.id);
    if (adminDelErr) {
      throw new Error(`adminUser DELETE failed: ${adminDelErr.message} (code: ${adminDelErr.code})`);
    }
    expect(adminDelErr).toBeNull();

    // Verify record is permanently deleted
    const { data: afterDel, error: afterErr } = await adminClient.from("medical_records").select("id").eq("id", disposable!.id);
    expect(afterErr).toBeNull();
    if (afterDel && afterDel.length > 0) {
      throw new Error(`Record was NOT deleted by adminUser: afterDel returned ${JSON.stringify(afterDel)}`);
    }
    expect(afterDel).toEqual([]);
  });

  // --------------------------------------------------------------------------
  // Test 5: Privilege Escalation Prevention
  // --------------------------------------------------------------------------
  it("verifies privilege escalation prevention: patient cannot set own role on UPDATE or INSERT", async () => {
    // Patient attempts UPDATE of role to 'admin'
    const { error: updateErr } = await patientA.client
      .from("patients")
      .update({ role: "admin" })
      .eq("id", patientA.patientId);

    // guard_patient_privileges() raises exception or blocks
    const { data: profileAfterUpdate } = await adminClient.from("patients").select("role").eq("id", patientA.patientId).single();
    expect(profileAfterUpdate!.role).toBe("patient");

    // Patient attempts INSERT with role='admin'
    const fakeUserId = crypto.randomUUID();
    const { data: insertResult, error: insertErr } = await patientA.client
      .from("patients")
      .insert({
        user_id: patientA.user.id,
        first_name: "Escalation Attempt",
        role: "admin",
      })
      .select("role");

    // Either error returned or trigger enforced role to 'patient'
    const { data: finalRoles } = await adminClient.from("patients").select("role").eq("user_id", patientA.user.id);
    expect(finalRoles!.every((r) => r.role === "patient")).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Test 6: Healthcare Provider Table Write Protection
  // --------------------------------------------------------------------------
  it("verifies provider table write protection: patient and doctor cannot write healthcare_providers.user_id", async () => {
    // Patient attempts to claim Doctor D2's provider entry
    const { data: patUpdate, error: patErr } = await patientA.client
      .from("healthcare_providers")
      .update({ user_id: patientA.user.id })
      .eq("id", doctorD2.providerId!)
      .select();

    expect(patUpdate === null || patUpdate.length === 0 || Boolean(patErr)).toBe(true);

    // Doctor D1 attempts to overwrite Doctor D2's provider entry
    const { data: docUpdate, error: docErr } = await doctorD1.client
      .from("healthcare_providers")
      .update({ user_id: doctorD1.user.id })
      .eq("id", doctorD2.providerId!)
      .select();

    expect(docUpdate === null || docUpdate.length === 0 || Boolean(docErr)).toBe(true);

    // Verify D2's provider row remains linked to D2
    const { data: providerCheck } = await adminClient.from("healthcare_providers").select("user_id").eq("id", doctorD2.providerId!).single();
    expect(providerCheck!.user_id).toBe(doctorD2.user.id);
  });

  // --------------------------------------------------------------------------
  // Test 7: Append-Only Access Audit Log
  // --------------------------------------------------------------------------
  it("verifies access audit log: forged user_id insert is rejected, patient reads only own rows", async () => {
    // Patient A attempts forged insert claiming action performed by Patient B
    const { error: forgeErr } = await patientA.client.from("access_audit_log").insert({
      user_id: patientB.user.id,
      action: "forged_medical_access",
      resource_type: "medical_records",
      patient_id: patientA.patientId,
    });
    // Policy audit_log_insert_own requires user_id = auth.uid()
    expect(forgeErr).not.toBeNull();

    // Legitimate insert by Patient A
    const { error: legitErr } = await patientA.client.from("access_audit_log").insert({
      user_id: patientA.user.id,
      action: "patient_view_records",
      resource_type: "medical_records",
      patient_id: patientA.patientId,
    });
    expect(legitErr).toBeNull();

    // Insert audit row for Patient B via admin
    await adminClient.from("access_audit_log").insert({
      user_id: patientB.user.id,
      action: "patient_b_action",
      resource_type: "medical_records",
      patient_id: patientB.patientId,
    });

    // Patient A selects audit logs: sees only own rows
    const { data: auditA } = await patientA.client.from("access_audit_log").select("patient_id");
    expect(auditA).toBeDefined();
    expect(auditA!.length).toBeGreaterThan(0);
    expect(auditA!.every((r) => r.patient_id === patientA.patientId)).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Test 8: Concurrency Double-Booking Protection
  // --------------------------------------------------------------------------
  it("verifies booking concurrency: exactly 1 of 20 parallel bookings for the same slot succeeds (23505 for the rest)", async () => {
    const collisionSlot = new Date(Date.now() + 200000000).toISOString();

    // Dispatch 20 concurrent booking requests simultaneously for the exact same scheduled slot
    const attempts = Array.from({ length: 20 }, (_, i) =>
      patientA.client.from("appointments").insert({
        provider_id: doctorD1.providerId!,
        patient_id: patientA.patientId,
        appointment_date: collisionSlot,
        status: "scheduled",
        notes: `Concurrent race attempt ${i}`,
      })
    );

    const outcomes = await Promise.all(attempts);
    const successes = outcomes.filter((o) => !o.error);
    const collisions = outcomes.filter((o) => o.error && o.error.code === "23505");

    expect(successes.length).toBe(1);
    expect(collisions.length).toBe(19);

    // Teardown collision slot
    await adminClient.from("appointments").delete().eq("appointment_date", collisionSlot).eq("provider_id", doctorD1.providerId!);
  });

  // --------------------------------------------------------------------------
  // Test 9: Offline Sync Idempotency
  // --------------------------------------------------------------------------
  it("verifies offline sync idempotency: same client_op_id twice yields exactly 1 processed row", async () => {
    const clientOpId = crypto.randomUUID();

    // First processing
    const { error: op1Err } = await adminClient.from("processed_client_ops").upsert(
      {
        user_id: patientA.user.id,
        client_op_id: clientOpId,
        table_name: "appointments",
      },
      { onConflict: "user_id,client_op_id" }
    );
    expect(op1Err).toBeNull();

    // Duplicate replay processing
    const { error: op2Err } = await adminClient.from("processed_client_ops").upsert(
      {
        user_id: patientA.user.id,
        client_op_id: clientOpId,
        table_name: "appointments",
      },
      { onConflict: "user_id,client_op_id" }
    );
    expect(op2Err).toBeNull();

    // Query rows: exactly 1 entry exists
    const { data: ops } = await adminClient
      .from("processed_client_ops")
      .select("client_op_id")
      .eq("user_id", patientA.user.id)
      .eq("client_op_id", clientOpId);

    expect(ops).toBeDefined();
    expect(ops!.length).toBe(1);

    // Cleanup
    await adminClient.from("processed_client_ops").delete().eq("client_op_id", clientOpId);
  });

  // --------------------------------------------------------------------------
  // Test 10: Demo Safety Guard
  // --------------------------------------------------------------------------
  it("verifies demo safety guard: normal user with 'demo' in email can update own appointment, demo admin cannot", async () => {
    // Normal user whose email contains 'demo' updates own appointment
    const { error: normalUpdateErr } = await normalDemoUser.client
      .from("appointments")
      .update({ notes: "Valid update by demo user" })
      .eq("id", apptNormalDemoId);

    expect(normalUpdateErr).toBeNull();

    // Exact demo admin (admin@ruralhealth.demo) attempting to delete or update appointment
    const { error: demoAdminErr } = await demoAdmin.client
      .from("appointments")
      .delete()
      .eq("id", apptNormalDemoId);

    // guard_demo_admin_safety() trigger halts transaction
    expect(demoAdminErr).not.toBeNull();
    expect(demoAdminErr!.message).toContain("Demo admin mode restricted");
  });
});

describe("Database Safety & Allowlist Guard Unit Invariants", () => {
  it("rejects non-allowlisted remote database targets", () => {
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const originalRequireDb = process.env.REQUIRE_DB;
    try {
      delete process.env.REQUIRE_DB;
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://unauthorized-cloud-target.supabase.co";
      const result = verifyIntegrationDatabaseTarget();
      expect(result.isSafeToExecute).toBe(false);
      expect(result.skipReason).toContain("is NOT in the integration allowlist");
    } finally {
      if (originalUrl !== undefined) process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
      else delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (originalRequireDb !== undefined) process.env.REQUIRE_DB = originalRequireDb;
      else delete process.env.REQUIRE_DB;
    }
  });

  it("throws immediately when REQUIRE_DB=1 is set with an unallowlisted target", () => {
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const originalRequireDb = process.env.REQUIRE_DB;
    try {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://unauthorized-cloud-target.supabase.co";
      process.env.REQUIRE_DB = "1";
      expect(() => verifyIntegrationDatabaseTarget()).toThrow(/REQUIRE_DB=1 is set, failing test run/);
    } finally {
      if (originalUrl !== undefined) process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
      else delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (originalRequireDb !== undefined) process.env.REQUIRE_DB = originalRequireDb;
      else delete process.env.REQUIRE_DB;
    }
  });

  it("approves execution when targeting local loopback container", () => {
    const originalTestUrl = process.env.SUPABASE_INTEGRATION_TEST_URL;
    try {
      process.env.SUPABASE_INTEGRATION_TEST_URL = "http://127.0.0.1:54321";
      const result = verifyIntegrationDatabaseTarget();
      expect(result.isSafeToExecute).toBe(true);
      expect(result.targetUrl).toBe("http://127.0.0.1:54321");
    } finally {
      if (originalTestUrl !== undefined) process.env.SUPABASE_INTEGRATION_TEST_URL = originalTestUrl;
      else delete process.env.SUPABASE_INTEGRATION_TEST_URL;
    }
  });
});
