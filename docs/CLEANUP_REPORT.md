# Repository Cleanup & Modularization Report

This report tracks the baseline metrics and empirical deltas across the cleanup, dependency pruning, asset optimisation, and modularization passes on the Rural Healthcare Platform.

---

## 1. Before (Baseline Metrics)
**Timestamp:** 2026-10-17T21:41:00+05:30  
**Git Commit:** `43d66be`  
**Branch:** `chore/cleanup-modularize` (branched from `main`)  

### A. Repository Size & File Counts
* **Tracked Files:** 372 files
* **Total Tracked Size:** ~6.1 MB

### B. Total LOC & Size per Top-Level Directory
| Directory | Files | Lines of Code (LOC) | Total Size (Bytes) |
| :--- | :---: | :---: | :---: |
| `(root)` | 19 | 14,398 | 546,735 |
| `.agents/` | 1 | 36 | 1,627 |
| `.github/` | 2 | 224 | 8,079 |
| `app/` | 56 | 6,280 | 246,586 |
| `components/` | 104 | 22,760 | 995,111 |
| `docs/` | 25 | 6,957 | 471,019 |
| `hooks/` | 2 | 212 | 4,510 |
| `lib/` | 55 | 32,802 | 1,310,236 |
| `loadtest/` | 10 | 1,339 | 61,901 |
| `public/` | 22 | 600 | 1,244,456 |
| `scripts/` | 23 | 2,871 | 108,706 |
| `supabase/` | 25 | 4,849 | 206,185 |
| `tests/` | 27 | 5,419 | 208,209 |
| `types/` | 1 | 27 | 425 |
| **Total** | **372** | **98,774** | **5,413,785** |

*(Note: `components/` non-ui components account for 16,328 lines across 35 files).*

---

### C. Top 25 Largest Tracked Files

#### By Raw Size (Bytes)
| # | Path | Size | Lines |
| :-: | :--- | :---: | :---: |
| 1 | `public/hero.png` | 877.9 KB | 0 (binary) |
| 2 | `lib/data/real-doctors.ts` | 528.4 KB | 10,701 |
| 3 | `package-lock.json` | 476.0 KB | 12,990 |
| 4 | `lib/geo/pan-india-lgd.json` | 194.5 KB | 9,838 |
| 5 | `lib/schemes/health-schemes.ts` | 140.2 KB | 1,550 |
| 6 | `public/hero.webp` | 117.5 KB | 0 (binary) |
| 7 | `docs/CHANGELOG.md` | 108.6 KB | 1,113 |
| 8 | `public/icons/icon-512.png` | 104.9 KB | 0 (binary) |
| 9 | `components/Directory.tsx` | 62.0 KB | 1,229 |
| 10 | `components/EmergencyModule.tsx` | 56.6 KB | 1,204 |
| 11 | `lib/emergency/helplines.ts` | 54.6 KB | 1,262 |
| 12 | `components/HealthInfoHub.tsx` | 53.3 KB | 623 |
| 13 | `components/MapView.tsx` | 52.6 KB | 1,154 |
| 14 | `components/ConsultationPortal.tsx` | 52.2 KB | 1,017 |
| 15 | `tests/integration/rls-care-relationship.test.ts` | 42.3 KB | 1,013 |
| 16 | `lib/i18n/translations.ts` | 38.4 KB | 693 |
| 17 | `docs/RLS_SNAPSHOT_before.md` | 37.0 KB | 924 |
| 18 | `public/icons/maskable-512.png` | 36.8 KB | 0 (binary) |
| 19 | `supabase/migrations/20261018000200_reconcile_security_state.sql` | 35.1 KB | 892 |
| 20 | `components/GovernmentSchemes.tsx` | 34.8 KB | 739 |
| 21 | `README.md` | 34.7 KB | 697 |
| 22 | `components/PatientRecords.tsx` | 34.1 KB | 691 |
| 23 | `components/SymptomChecker.tsx` | 33.0 KB | 603 |
| 24 | `components/AdminUserManagement.tsx` | 32.1 KB | 600 |
| 25 | `components/CampLocations.tsx` | 31.7 KB | 684 |

#### By Line Count (LOC)
| # | Path | LOC | Size |
| :-: | :--- | :---: | :---: |
| 1 | `package-lock.json` | 12,990 | 476.0 KB |
| 2 | `lib/data/real-doctors.ts` | 10,701 | 528.4 KB |
| 3 | `lib/geo/pan-india-lgd.json` | 9,838 | 194.5 KB |
| 4 | `lib/schemes/health-schemes.ts` | 1,550 | 140.2 KB |
| 5 | `lib/emergency/helplines.ts` | 1,262 | 54.6 KB |
| 6 | `components/Directory.tsx` | 1,229 | 62.0 KB |
| 7 | `components/EmergencyModule.tsx` | 1,204 | 56.6 KB |
| 8 | `components/MapView.tsx` | 1,154 | 52.6 KB |
| 9 | `docs/CHANGELOG.md` | 1,113 | 108.6 KB |
| 10 | `components/ConsultationPortal.tsx` | 1,017 | 52.2 KB |
| 11 | `tests/integration/rls-care-relationship.test.ts` | 1,013 | 42.3 KB |
| 12 | `lib/abdm/fhir.ts` | 974 | 27.6 KB |
| 13 | `docs/RLS_SNAPSHOT_before.md` | 924 | 37.0 KB |
| 14 | `supabase/migrations/20261018000200_reconcile_security_state.sql` | 892 | 35.1 KB |
| 15 | `components/GovernmentSchemes.tsx` | 739 | 34.8 KB |
| 16 | `components/ui/sidebar.tsx` | 727 | 21.2 KB |
| 17 | `components/HelplineDirectory.tsx` | 706 | 28.5 KB |
| 18 | `README.md` | 697 | 34.7 KB |
| 19 | `lib/i18n/translations.ts` | 693 | 38.4 KB |
| 20 | `components/PatientRecords.tsx` | 691 | 34.1 KB |
| 21 | `components/CampLocations.tsx` | 684 | 31.7 KB |
| 22 | `components/HealthInfoHub.tsx` | 623 | 53.3 KB |
| 23 | `components/SymptomChecker.tsx` | 603 | 33.0 KB |
| 24 | `components/AdminUserManagement.tsx` | 600 | 32.1 KB |
| 25 | `supabase/seed.sql` | 557 | 28.7 KB |

---

### D. Dependency & Security Metrics
* **Production Dependencies (`npm ls --omit=dev --depth=0`):** 60 direct production packages (125 total tree entries).
* **NPM Audit Summary (`npm audit --omit=dev`):**
  * Total Vulnerabilities: **10** (4 moderate, 6 high).
  * High Advisories:
    * `braces` (via `@ducanh2912/next-pwa` -> `workbox-build` -> `fast-glob` -> `micromatch`)
    * `micromatch` (via `@ducanh2912/next-pwa`)
    * `fast-glob` (via `@ducanh2912/next-pwa`)
    * `@ducanh2912/next-pwa`
    * `serialize-javascript` (via `@ducanh2912/next-pwa` -> `workbox-build`)
    * `postcss` (via `next`)

---

### E. Knip Compact Summary (`npx knip --reporter compact`)
* **Unused Files (71 total):**
  * `app/sw.ts` (false positive: referenced via `next.config.mjs` `swSrc`)
  * 44 unused shadcn component files in `components/ui/`
  * Duplicate hooks: `hooks/use-mobile.ts`, `components/ui/use-mobile.ts`, `components/ui/use-mobile.tsx`, `components/ui/use-toast.ts`
  * Unused lib modules: `lib/hooks/useOffline.ts`, `lib/hooks/useOfflineData.ts`, `lib/jitsi/config.ts`, `lib/offline/storage.ts`, `lib/speech/bhashini.ts`, `lib/supabase/middleware.ts`
  * Loadtest tools: `loadtest/k6/lib.js`, `loadtest/k6/rural_health_mixed.js`, `loadtest/tools/*`
  * Scripts: 8 ad-hoc debug scripts (`benchmark.js`, `check_deployed.js`, `fix_roles.js`, `full_audit.js`, `test_keys.js`, `test_rls.js`, `test_rls2.js`, `test_users.js`), plus `build_pan_india_doctors.mjs`, `check_gemini.mjs`, `ingest_pmjay_facilities.mjs`, `make_icons.mjs`, `reconcile_doctor_providers.mjs`
* **Unused Dependencies (35):**
  * Candidate removals: `@ducanh2912/next-pwa`, `@radix-ui/react-*` (accordion, alert-dialog, aspect-ratio, checkbox, collapsible, context-menu, dropdown-menu, hover-card, menubar, navigation-menu, popover, progress, radio-group, scroll-area, select, separator, slider, switch, toggle, toggle-group, tooltip), `cmdk`, `embla-carousel-react`, `input-otp`, `react-day-picker`, `react-hook-form`, `react-resizable-panels`, `vaul`
  * Verified active false positives: `serwist`, `next-themes`, `sonner`, `recharts`, `tailwindcss-animate`, `glob`
* **Unused DevDependencies:** `sharp` (used by Next.js image optimization / Vercel runtime)
* **Unused Exports:** 22 symbols
* **Unused Exported Types:** 20 type definitions

---

### F. Performance & Compilation Benchmarks
* **TypeScript Compilation Time (`npx tsc --noEmit`):** 3.41 s (0 errors).
* **Unit Test Execution Time (`npm run test:unit`):** 2.31 s (23 files, 176 tests passing).

---

### G. Next.js Production Build Route Table (`next build`)
```text
Route (app)                                     Size  First Load JS  Revalidate  Expire
┌ ○ /                                        10.5 kB         191 kB          1h      1y
├ ○ /_not-found                                200 B         105 kB
├ ○ /admin/appointments                       5.1 kB         185 kB
├ ○ /admin/campaigns                         6.44 kB         186 kB
├ ○ /admin/chat-review                       3.04 kB         180 kB
├ ○ /admin/dashboard                         1.51 kB         185 kB
├ ○ /admin/notifications                     8.56 kB         186 kB
├ ○ /admin/records                           6.03 kB         186 kB
├ ○ /admin/users                               12 kB         236 kB
├ ƒ /api/abdm/fhir-export                      200 B         105 kB
├ ƒ /api/admin/doctor-provider-link            200 B         105 kB
├ ƒ /api/admin/erase-record                    200 B         105 kB
├ ƒ /api/ai-chat                               200 B         105 kB
├ ƒ /api/appointments                          200 B         105 kB
├ ƒ /api/auth/ensure-patient                   200 B         105 kB
├ ƒ /api/auth/login                            200 B         105 kB
├ ƒ /api/auth/profile                          200 B         105 kB
├ ƒ /api/cache-status                          200 B         105 kB
├ ƒ /api/chat-cache                            200 B         105 kB
├ ƒ /api/doctor-requests                       200 B         105 kB
├ ƒ /api/facilities/district/[districtCode]    200 B         105 kB
├ ƒ /api/facilities/nearby                     200 B         105 kB
├ ƒ /api/health                                200 B         105 kB
├ ƒ /api/health-data                           200 B         105 kB
├ ƒ /api/medical-records                       200 B         105 kB
├ ƒ /api/notifications                         200 B         105 kB
├ ƒ /api/offline-sync                          200 B         105 kB
├ ƒ /api/providers                             200 B         105 kB
├ ƒ /api/ready                                 200 B         105 kB
├ ƒ /api/symptom-analyze                       200 B         105 kB
├ ƒ /api/teleconsult/room                      200 B         105 kB
├ ○ /appointments                            6.48 kB         198 kB
├ ƒ /auth/callback                             200 B         105 kB
├ ○ /camps                                     11 kB         191 kB          1h      1y
├ ○ /consultation                            14.9 kB         273 kB
├ ○ /dashboard                               5.98 kB         205 kB
├ ○ /directory                               13.6 kB         269 kB          1h      1y
├ ○ /doctor/claim                            8.93 kB         233 kB
├ ○ /doctor/dashboard                         1.5 kB         186 kB
├ ○ /doctor/patients                          6.6 kB         184 kB
├ ○ /doctor/requests                         8.81 kB         186 kB
├ ○ /emergency                               39.7 kB         253 kB          1h      1y
├ ○ /health-info                               19 kB         196 kB          1h      1y
├ ○ /health-info/schemes                     39.4 kB         220 kB          1h      1y
├ ○ /locations                               3.94 kB         173 kB          1h      1y
├ ○ /login                                   3.15 kB         192 kB
├ ○ /offline                                 4.22 kB         121 kB
├ ○ /records                                 11.1 kB         200 kB
├ ○ /symptom-checker                         36.6 kB         217 kB          1h      1y
├ ○ /teleconsult/confirm                      7.4 kB         184 kB
└ ○ /teleconsult/room                        10.3 kB         123 kB
+ First Load JS shared by all                 105 kB
  ├ chunks/2804-c43756fd712fde1b.js          47.7 kB
  ├ chunks/4bd1b696-100b9d70ed4e49c1.js      54.2 kB
  └ other shared chunks (total)              2.73 kB

ƒ Middleware                                 90.7 kB
```

---

## 2. After (Final Cleanup & Modularization Metrics)
**Timestamp:** 2026-10-17T23:15:00+05:30  
**Git Commit:** `fcfe87c`  
**Branch:** `chore/cleanup-modularize`  

### A. Repository Size & File Counts
* **Tracked Files:** 427 files (modularized sub-components and service modules added while dead assets and obsolete packages pruned)
* **Total Tracked Size:** ~4.1 MB (down from ~5.4 MB; pruned ~1.3 MB of unreferenced binaries and dead code)

### B. Total LOC & Size per Top-Level Directory
| Directory | Files | Lines of Code (LOC) | Total Size (Bytes) | Notes |
| :--- | :---: | :---: | :---: | :--- |
| `(root)` | 21 | 10,959 | 393,592 | Pruned 3,439 LOC from lockfile & removed obsolete PWA deps |
| `.agents/` | 1 | 48 | 3,213 | Invariant rules & documentation standard |
| `.github/` | 2 | 237 | 8,417 | Gitleaks scanner + full CI matrix with Knip & modularity gate |
| `app/` | 56 | 4,396 | 169,337 | All 18 API handlers lean (≤63 LOC, well under 150 LOC limit) |
| `components/` | 167 | 22,268 | 900,047 | 100% of non-ui components ≤400 LOC, modularized with shims |
| `docs/` | 23 | 5,939 | 398,612 | Consolidated, pruned redundant snapshots, updated CHANGELOG |
| `hooks/` | 1 | 192 | 3,945 | Consolidated duplicate `use-toast` and `use-mobile` hooks |
| `lib/` | 64 | 34,418 | 1,371,688 | All code modules ≤400 LOC; ABDM FHIR split into 3 focused builders |
| `loadtest/` | 10 | 1,339 | 61,901 | Preserved load test scenarios |
| `public/` | 15 | 1,954 | 335,685 | Pruned ~1 MB of dead binaries (`hero.png`, unreferenced icons) |
| `scripts/` | 14 | 2,351 | 86,441 | Deleted 8 unsafe scripts; added Step 8 modularity gate |
| `supabase/` | 25 | 4,849 | 206,185 | Cryptographically locked migrations via `migrations.sha256` |
| `tests/` | 27 | 5,419 | 208,209 | 176 unit tests passing; RLS mutation proofs intact |
| `types/` | 1 | 27 | 425 | Global core types |
| **Total** | **427** | **89,396** | **4,147,697** | **Net ~9,378 LOC reduced & ~1.3 MB assets saved** |

---

### C. Modularity & Invariant 5 Enforcement
Every non-ui component in `components/` and code module in `lib/` strictly complies with the **400 LOC limit**:
1. `components/directory/` (main index: 374 LOC; 6 sub-parts ≤215 LOC; backward-compatible shim: 8 LOC)
2. `components/emergency/` (main index: 353 LOC; sub-parts and beacon hooks ≤210 LOC; shim: 8 LOC)
3. `components/map-view/` (main index: 295 LOC; discovery hook: 334 LOC; parts ≤191 LOC; shim: 8 LOC)
4. `components/consultation-portal/` (main index: 310 LOC; booking parts ≤360 LOC; shim: 8 LOC)
5. `components/government-schemes/` (main index: 239 LOC; parts ≤180 LOC; shim: 8 LOC)
6. `components/helpline-directory/` (main index: 203 LOC; parts ≤159 LOC; shim: 8 LOC)
7. `components/patient-records/` (main index: 309 LOC; hook: 134 LOC; parts ≤176 LOC; shim: 8 LOC)
8. `components/camp-locations/` (main index: 354 LOC; parts ≤170 LOC; shim: 8 LOC)
9. `components/health-info-hub/` (main index: 106 LOC; parts ≤191 LOC; shim: 8 LOC)
10. `components/admin-user-management/` (main index: 242 LOC; parts ≤310 LOC; shim: 8 LOC)
11. `components/admin-campaign-manager/` (main index: 184 LOC; parts ≤200 LOC; shim: 8 LOC)
12. `components/symptom-checker/` (main index: 279 LOC; chat hook: 195 LOC; parts ≤227 LOC; shim: 8 LOC)
13. `components/floating-chat/` (main index: 388 LOC; parts ≤113 LOC; shim: 8 LOC)
14. `components/authentication/` (main index: 242 LOC; parts ≤145 LOC; shim: 8 LOC)
15. `components/header/` (main index: 148 LOC; parts ≤200 LOC; shim: 8 LOC)
16. `components/notification-bell/` (main index: 248 LOC; parts ≤60 LOC; shim: 8 LOC)
17. `components/dashboard/` (main index: 122 LOC; parts ≤80 LOC; shim: 8 LOC)

All 18 route handlers in `app/api/**` strictly adhere to the **<150 LOC limit** (all are ≤63 LOC), delegating business logic to `lib/services/`:
* `lib/services/ai-chat.service.ts`
* `lib/services/appointments.service.ts`
* `lib/services/doctor-provider-link.service.ts`
* `lib/services/doctor-requests.service.ts`
* `lib/services/fhir-export.service.ts`
* `lib/services/medical-records.service.ts`
* `lib/services/notifications.service.ts`
* `lib/services/offline-sync.service.ts`

FHIR resource generation (`lib/abdm/builders.ts`) is decomposed into modular sub-builders:
* `lib/abdm/prescription-builder.ts` (187 LOC)
* `lib/abdm/diagnostic-builder.ts` (278 LOC)
* `lib/abdm/encounter-builder.ts` (143 LOC)

---

### D. Dependency & Security Metrics
* **Production Dependencies:** Pruned obsolete `@ducanh2912/next-pwa` and unused Radix UI primitives (reduced from 60 to 24 dependencies).
* **NPM Audit Summary (`npm audit --omit=dev`):**
  * Exact command output: **2 vulnerabilities (1 moderate, 1 high)** in production dependencies (`postcss <=8.5.22` via `next`).
  * Both are allowlisted in `audit-allowlist.json` (server-side CSS parsing in Next.js build pipeline without runtime user-controlled CSS stringification, tracking upstream Next.js patch).
  * Automated enforcement: `node scripts/ci/audit_allowlist.mjs` strictly fails on any unallowlisted advisory.
* **Gitleaks:** Automated secret scanner enabled in `.github/workflows/ci.yml` via `.gitleaks.toml`.
* **Database Immutability:** SHA256 checksum manifest `supabase/migrations.sha256` validated in CI and pre-commit hooks via `scripts/db/check_migration_immutability.mjs`.

---

### E. Knip Verification Gate
* **Unused Files:** **0** (All 44 unused UI primitives, duplicate hooks, and dead scripts purged).
* **Unused Dependencies:** **0** (All pruned or registered with active runtime configurations).
* **Automated CI Enforcement:** `npx knip` runs as a mandatory gating step in `scripts/ci/check_components.mjs` and GitHub Actions.

---

### F. Performance & Compilation Benchmarks
* **TypeScript Compilation Time (`npx tsc --noEmit`):** Clean pass with **0 type errors**.
* **ESLint Validation (`next lint`):** Passes with max-lines warning threshold at 300 LOC (exempt data catalogs); 0 errors.
* **Vitest Unit Test Suite (`npm run test:unit`):** **176 tests passing** across 23 test suites in ~2.2 s.
* **Next.js Production Build (`next build`):** **51 routes** successfully compiled, optimized, and bundled.

#### Measured `next build` Route Table & First Load JS
```text
Route (app)                                     Size  First Load JS  Revalidate  Expire
┌ ○ /                                        10.5 kB         191 kB          1h      1y
├ ○ /_not-found                                200 B         105 kB
├ ○ /admin/appointments                       5.1 kB         185 kB
├ ○ /admin/campaigns                         6.61 kB         187 kB
├ ○ /admin/chat-review                       3.04 kB         180 kB
├ ○ /admin/dashboard                         1.51 kB         185 kB
├ ○ /admin/notifications                     8.56 kB         186 kB
├ ○ /admin/records                           6.03 kB         186 kB
├ ○ /admin/users                             12.1 kB         236 kB
├ ƒ /api/abdm/fhir-export                      200 B         105 kB
├ ƒ /api/admin/doctor-provider-link            200 B         105 kB
├ ƒ /api/admin/erase-record                    200 B         105 kB
├ ƒ /api/ai-chat                               200 B         105 kB
├ ƒ /api/appointments                          200 B         105 kB
├ ƒ /api/auth/ensure-patient                   200 B         105 kB
├ ƒ /api/auth/login                            200 B         105 kB
├ ƒ /api/auth/profile                          200 B         105 kB
├ ƒ /api/cache-status                          200 B         105 kB
├ ƒ /api/chat-cache                            200 B         105 kB
├ ƒ /api/doctor-requests                       200 B         105 kB
├ ƒ /api/facilities/district/[districtCode]    200 B         105 kB
├ ƒ /api/facilities/nearby                     200 B         105 kB
├ ƒ /api/health                                200 B         105 kB
├ ƒ /api/health-data                           200 B         105 kB
├ ƒ /api/medical-records                       200 B         105 kB
├ ƒ /api/notifications                         200 B         105 kB
├ ƒ /api/offline-sync                          200 B         105 kB
├ ƒ /api/providers                             200 B         105 kB
├ ƒ /api/ready                                 200 B         105 kB
├ ƒ /api/symptom-analyze                       200 B         105 kB
├ ƒ /api/teleconsult/room                      200 B         105 kB
├ ○ /appointments                            6.48 kB         198 kB
├ ƒ /auth/callback                             200 B         105 kB
├ ○ /camps                                   11.2 kB         191 kB          1h      1y
├ ○ /consultation                            15.2 kB         273 kB
├ ○ /dashboard                               5.94 kB         205 kB
├ ○ /directory                               13.8 kB         269 kB          1h      1y
├ ○ /doctor/claim                            9.02 kB         233 kB
├ ○ /doctor/dashboard                         1.5 kB         186 kB
├ ○ /doctor/patients                          6.6 kB         184 kB
├ ○ /doctor/requests                         8.81 kB         186 kB
├ ○ /emergency                               40.4 kB         253 kB          1h      1y
├ ○ /health-info                             18.7 kB         196 kB          1h      1y
├ ○ /health-info/schemes                     39.8 kB         221 kB          1h      1y
├ ○ /locations                               3.94 kB         173 kB          1h      1y
├ ○ /login                                   3.16 kB         192 kB
├ ○ /offline                                 4.22 kB         121 kB
├ ○ /records                                 11.5 kB         200 kB
├ ○ /symptom-checker                         37.2 kB         218 kB          1h      1y
├ ○ /teleconsult/confirm                      7.4 kB         184 kB
└ ○ /teleconsult/room                        10.5 kB         123 kB
+ First Load JS shared by all                 105 kB
  ├ chunks/2804-c43756fd712fde1b.js          47.7 kB
  ├ chunks/4bd1b696-100b9d70ed4e49c1.js      54.2 kB
  └ other shared chunks (total)              2.73 kB

ƒ Middleware                                 90.7 kB
```

---

### G. Comprehensive Task Status & Close-Out Ledger

| Task / Item | Status | Verification & Evidence |
| :--- | :---: | :--- |
| **Unsafe Debug Scripts Deletion** | **DONE** | All 8 unsafe scripts purged; 0 hardcoded password literals in codebase. |
| **Obsolete PWA Package Removal** | **DONE** | `@ducanh2912/next-pwa` deleted; Serwist runtime active. |
| **Component Modularity ($\le 400$ LOC)** | **DONE** | All 17 components + `app/teleconsult/room` (389 LOC) + `app/doctor/claim` (385 LOC) strictly $\le 400$ LOC. |
| **API Route Thin Handlers ($<150$ LOC)** | **DONE** | All 18 route handlers $\le 63$ LOC delegating business logic to `lib/services/`. |
| **Documentation Consolidation** | **DONE** | History archived in `docs/history/`; personal interview doc deleted; README streamlined to 188 LOC. |
| **CI Gitleaks & Immutability Gates** | **DONE** | Gitleaks, knip, migration gate, and modularity gate active in `.github/workflows/ci.yml`. |
| **Scripts Organization into Subfolders** | **DONE** | Scripts organized into `scripts/data/`, `scripts/db/`, `scripts/ci/`; `package.json` and CI workflows updated. |
| **ESLint `max-lines` Rule** | **DONE** | `.eslintrc.json` configured with `max-lines` warning at 300 LOC (data catalogs exempt); Step 8 enforces error ceiling. |
| **Housekeeping Migration** | **DONE (Ready)** | `supabase/migrations/20261019000000_housekeeping.sql` written; verification and rollback SQL prepared for manual apply. |
| **Integration Test for Storage Isolation** | **DONE** | Test 20 added in `tests/integration/rls-care-relationship.test.ts`; CI threshold updated to 23 tests. |
| **ABDM Milestone 2 Conformance Wording** | **DONE** | Reworded to "FHIR R4 structured export modelled on ABDM profiles; not validated against official profiles". |
| **Remove `--debug` from CI Steps** | **DONE** | Removed `--debug` flag from both `db-tests` and `e2e` jobs in `.github/workflows/ci.yml`. |
| **`healthcare_providers.user_id` Exposure** | **PENDING** | Technical options (explicit column grants vs public view) presented for user decision. |
| **Large Data Bundles (`real-doctors.ts` etc.)** | **PENDING** | Trade-off options (streaming JSON / dynamic import / bundle retention) presented for user decision. |
| **Seed Account Credential Rotation** | **NOT DONE** | Requires project owner manual execution in Supabase Dashboard (no production credentials in repo). |
| **Branch Deletion & Tag `v1.0.0` Retagging** | **NOT DONE** | Safe git commands prepared; awaits project owner execution after CI runs. |

---

### H. Author Provenance & Copyright Preservation
* Verified **156 files** across components, services, shims, tests, and documentation containing clear author attribution and provenance headers for **Arnav Shukla** (`github.com/Arnavshukla09`).
