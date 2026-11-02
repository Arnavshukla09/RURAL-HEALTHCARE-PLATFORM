# Production Credential Rotation & Secret Remediation Checklist

**Incident Reference:** Security Hygiene & Credential Remediation Pass  
**Author:** Senior Security & Release Engineer  
**Target Environment:** Production Supabase Project (`boyzdmlvzvcplzolenef`), Vercel Deployment, and External APIs  
**Audience:** Repository Owner / Production Administrator (Manual Execution Required)  

---

## 1. Executive Summary

During the repository cleanup and secret audit of git history and deleted debug scripts, several credentials were identified in historical commits (`5ede26a`, `30a1981`, `a029514`, `3a56382`, `cab385e`, etc.):
- Legacy seed/debug accounts (`admin@ruralhealth.com`, `doctor@ruralhealth.com`, `patient@ruralhealth.com`).
- Historical `SECRET_SALT` in commit `30a1981` (rotated).
- Ad-hoc scripts containing hardcoded credentials in historical commits (now permanently removed from `main` and tracked files).

While all vulnerable scripts have been deleted and automated secret scanning (`gitleaks`) has been integrated into CI, **secrets present in public git history must be treated as permanently compromised**. The production environment must be rotated manually according to this checklist.

---

## 2. Git History Secret Scan Findings (Metadata Only)

*Scan executed over full `git log -p` history. Values omitted in compliance with security guidelines.*

| Commit | Affected File | Vulnerability / Secret Type | Remediation Status in Code |
| :---: | :--- | :--- | :---: |
| `30a1981` | `lib/doctor-claims.ts` | Secret Salt / Cryptographic Key | Rotated in commit `d1c19e3`; env-driven |
| `5ede26a` | `scripts/full_audit.js` | Hardcoded User Password | **Deleted** in Task 1 |
| `5ede26a` | `scripts/test_rls.js` | Hardcoded User Password | **Deleted** in Task 1 |
| `5ede26a` | `scripts/test_rls2.js` | Hardcoded User Password | **Deleted** in Task 1 |
| `3a56382` | `scripts/benchmark.js` | Hardcoded User Password | **Deleted** in Task 1 |
| `cab385e` | `scripts/seed_e2e_users.js` | Hardcoded User Password | Refactored in `8f3b20c` to ephemeral `crypto.randomUUID()` |
| `a029514` | `app/api/fix-db/route.ts` | Database Connection String with Credentials | Route removed in earlier commit |
| `49899b7` | `app/api/admin/seed-demo/route.ts` | Hardcoded User Password | Refactored in commit `290973e` |
| `e90cbc8` | `seed-demo.js`, `fix-demo-records.js` | Hardcoded User Password | Historical files purged in baseline |
| `39e46a1` | `scripts/sanity_test.js` | Hardcoded User Password | Historical files purged in baseline |

---

## 3. Mandatory Production Action Checklist (For Project Owner)

Please check off each step after executing in the Supabase Dashboard, Google Cloud Console, and Vercel:

### Phase A: Production User Accounts Audit & Rotation
- [ ] **Step 1: Verify No Real Patient/Clinical Reliance on Seed Accounts**
  - Navigate to Supabase Dashboard > Authentication > Users.
  - Inspect users with email domains `@ruralhealth.com`, `@ruralhealth.demo`, and `@ruralhealth.test`.
  - Confirm that no genuine health records, appointments, or live operational workflows depend on `patient@ruralhealth.com`, `doctor@ruralhealth.com`, or `admin@ruralhealth.com`.
- [ ] **Step 2: Delete or Rotate Production Seed Accounts**
  - Delete or reset the passwords for:
    - `patient@ruralhealth.com`
    - `doctor@ruralhealth.com`
    - `admin@ruralhealth.com`
  - For `.demo` accounts (`admin@ruralhealth.demo`, `doctor@ruralhealth.demo`, `patient@ruralhealth.demo`):
    - Update passwords to strong, unique credentials stored in an encrypted password manager or Vercel environment variables.
  - Delete disposable `.test` accounts from production (`test_patient_*`, `test_doctor_*`).

### Phase B: Supabase Service Role Key & API Keys
- [ ] **Step 3: Rotate Supabase Service Role Key**
  - Navigate to Supabase Dashboard > Project Settings > API.
  - Click **Roll API Keys / Generate new secret**.
  - Immediately update `SUPABASE_SERVICE_ROLE_KEY` in:
    - Vercel Project Environment Variables (Production & Preview).
    - GitHub Actions Secrets (`SUPABASE_SERVICE_ROLE_KEY`).
  - Deploy Vercel to activate the new service role key.
- [ ] **Step 4: Enable Leaked-Password Protection (HaveIBeenPwned Integration)**
  - Navigate to Supabase Dashboard > Authentication > Security / Attack Protection.
  - Enable **Leaked Password Detection** (checks passwords against HaveIBeenPwned database on signup/reset).

### Phase C: External API Keys & Session Salts
- [ ] **Step 5: Rotate Google Gemini API Key**
  - Navigate to Google AI Studio / Google Cloud Console > API Keys.
  - Generate a new restricted Gemini API Key.
  - Update `GEMINI_API_KEY` in Vercel and GitHub Secrets.
  - Revoke and delete the previous Gemini API key.
- [ ] **Step 6: Rotate Claim & Session Salt (`DOCTOR_CLAIM_SECRET`)**
  - Confirm `DOCTOR_CLAIM_SECRET` in Vercel is set to a cryptographically secure 64-character random string (`openssl rand -hex 32`).
  - Never commit this salt or leave it empty in production.

---

## 4. Optional Git History Rewrite Plan (`git filter-repo`)

### Analysis & Recommendation
* **Why Rotation Is Primary:** Once a key is committed to a public git repository, it is indexed by search engines and mirroring bots. Rewriting git history does **not** un-compromise a leaked credential. Rotating credentials in the Supabase/Google dashboard immediately renders any historical secret useless.
* **When to Rewrite History:** History rewriting is recommended **only after all credentials have been rotated**, if you desire a pristine public repository without legacy credential strings in historical commit diffs.

### Caution & Force-Push Consequences
> [!CAUTION]
> Rewriting git history modifies every commit SHA from the point of the change forward.
> - Breaks existing local clones and active branches.
> - Invalidates historical commit references in issues, pull requests, and audit logs.
> - Requires a force-push (`git push --force-with-lease`) across all remote branches.
> - Requires all collaborators to delete their local repository and perform a fresh clone.

### Optional Execution Procedure (If Decided)
If you decide to purge the historical files from git history:

1. **Install `git-filter-repo`:**
   ```bash
   pip install git-filter-repo
   ```
2. **Make a Full Backup of the Repository:**
   ```bash
   git clone --mirror https://github.com/Arnavshukla09/RURAL-HEALTHCARE-PLATFORM.git repo-backup.git
   ```
3. **Execute File Removal Across History:**
   ```bash
   git filter-repo --invert-paths \
     --path scripts/full_audit.js \
     --path scripts/test_rls.js \
     --path scripts/test_rls2.js \
     --path scripts/test_keys.js \
     --path scripts/test_users.js \
     --path scripts/fix_roles.js \
     --path scripts/check_deployed.js \
     --path scripts/benchmark.js \
     --path scripts/check_gemini.mjs \
     --path scripts/sanity_test.js \
     --path seed-demo.js \
     --path fix-demo-records.js
   ```
4. **Re-add Remote and Force-Push (Only after team coordination):**
   ```bash
   git remote add origin https://github.com/Arnavshukla09/RURAL-HEALTHCARE-PLATFORM.git
   git push origin --force --all
   git push origin --force --tags
   ```

**Recommendation:** Perform the credential rotation steps in Section 3 immediately. Evaluate Section 4 as an optional post-release task.
