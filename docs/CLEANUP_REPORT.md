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

## 2. After (Cleanup Metrics)
*(To be populated in Task 7 after all cleanup, modularization, and verification tasks).*
