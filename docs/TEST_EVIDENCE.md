# Verification Test Evidence & Mutation Proofs

## 1. Provider Foreign Key Alignment Contract Test
- **File:** `tests/unit/provider-fk-alignment.test.ts`
- **Tests Executed:**
  - `verifies migration 20261021000000 targets healthcare_providers and safe ON DELETE actions` (PASS)
  - `proves contract validator fails if appointments.provider_id points back to providers (mutation proof)` (PASS)
- **Output:**
```text
✓ tests/unit/provider-fk-alignment.test.ts (2 tests) 5ms
Test Files  1 passed (1)
Tests  2 passed (2)
```

### Mutation Proof (Provider FK Alignment)
1. **Normal State:** `appointments.provider_id` targets `healthcare_providers` with rule `RESTRICT`. Contract validator exits 0.
2. **Injected Mutation:** `appointments.provider_id` re-pointed to target `providers`.
3. **Execution Trace:**
```text
✖ FK TARGET DRIFT on appointments.provider_id:
   Expected target: healthcare_providers
   Actual target:   providers
❌ CONTRACT CHECK FAILED with 4 violation(s).
```
4. **Clean Restoration:** Re-targeted to `healthcare_providers` in migration `20261021000000`. Contract passes cleanly.

---

## 2. Security Follow-ups: Rate Limiting & Fast Liveness
- **File:** `tests/unit/security-followups-ratelimit.test.ts`
- **Tests Executed:**
  - `enforces 10 req/min limit on /api/auth/login and responds with 429 on the 11th request` (PASS)
  - `keeps /api/ready instant without database overhead` (PASS)
- **Output:**
```text
✓ tests/unit/security-followups-ratelimit.test.ts (2 tests) 15ms
Test Files  1 passed (1)
Tests  2 passed (2)
```

### Mutation Proof (Login Rate Limiter)
1. **Normal State:** 10 requests allowed, 11th request returns 429 (`RATE_LIMITED`).
2. **Injected Mutation:** Disable rate limit check in `app/api/auth/login/route.ts`.
3. **Result:** 11th request returns 400 (Bad Request) instead of 429, failing test expectation: `expected 400 to be 429`.
4. **Clean Restoration:** Restored `checkRateLimit(request, "auth")`, test passes cleanly.

---

## 3. Migration Sealing & Immutability Gate
- **File:** `scripts/db/check_migration_immutability.mjs`
- **Command:** `npm run check:migrations`
- **Output:**
```text
============================================================
  🛡️  DATABASE MIGRATION IMMUTABILITY & ORDERING GATE       
============================================================
✔ PASS: All 22 migrations strictly verified against sha256 manifest.
✔ PASS: 100% of migration files are sealed and forward-ordered.
```

### Mutation Proof (Unsealed Migration Detection)
1. **Normal State:** All 22 migrations recorded in `supabase/migrations.sha256`.
2. **Injected Mutation:** Added unsealed dummy migration `supabase/migrations/20261021999999_unsealed.sql`.
3. **Execution Trace:**
```text
❌ [UNSEALED MIGRATION VIOLATION] Migration file is NOT sealed in migrations.sha256: 20261021999999_unsealed.sql
    Run 'npm run migrations:seal' to compute and record its SHA256 hash.
❌ FAILED: 1 migration immutability/sealing violation(s) detected.
```
4. **Clean Restoration:** Deleted unsealed file. Gate exits 0.
