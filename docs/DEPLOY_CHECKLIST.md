# Deployment & Post-Overhaul Checklist

Use this checklist when deploying the `chatbot-overhaul` branch to production (Vercel) and updating your external services.

---

## 1. Supabase Setup
- [ ] **Run `supabase/05_chat_cache.sql`**: Open your [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql) and paste the contents of `supabase/05_chat_cache.sql`. Execute the script to create the `chat_cache` table and its associated Row Level Security (RLS) policies.
- [ ] **Confirm Database Password**: Verify that your new database password (`09Arnav@Supabase`) is recorded in your private password manager.
- [ ] **Revoke Deprecated Standby/Previous Keys**: Under **Project Settings &rarr; API Keys**, ensure legacy HS256 tokens are revoked once all active sessions expire.

---

## 2. Vercel Environment Variables
Under your project settings in the Vercel Dashboard (**Settings &rarr; Environment Variables**), configure the following for **Production**, **Preview**, and **Development**:

| Variable Name | Status | Value / Description |
|---------------|--------|---------------------|
| `GEMINI_API_KEY` | **Required** | Your new Google AI Studio API key |
| `GEMINI_MODELS` | **Required** | `gemini-3.5-flash,gemini-3.1-flash-lite,gemini-2.5-flash` |
| `NEXT_PUBLIC_GEMINI_API_KEY` | **DELETE** | Must not be present (security risk) |
| `NEXT_PUBLIC_SUPABASE_URL` | Verified | Current project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Verified | Current publishable/anon key (`sb_publishable_...`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Verified | Current secret service role key (`sb_secret_...`) |

---

## 3. Git Merge & Redeploy
- [ ] Merge the `chatbot-overhaul` branch into `main` via Pull Request or direct merge:
  ```bash
  git checkout main
  git merge chatbot-overhaul
  git push origin main
  ```
- [ ] In the Vercel Dashboard, verify that the deployment completes successfully.
- [ ] If environment variables were updated after the last build, trigger **Redeploy** on the latest deployment.

---

## 4. Client PWA Cache Clearance
Because the platform uses a Progressive Web App service worker that caches assets aggressively:
1. Open the application in Google Chrome / Safari.
2. Open Developer Tools &rarr; **Application** &rarr; **Storage** &rarr; Click **"Clear site data"**.
3. Reload the page to load the latest service worker bundle.
4. On mobile devices, pull to refresh or reinstall from the home screen prompt.

---

## 5. Medical Review Sign-off
- [ ] Share [`docs/MEDICAL_REVIEW_TODO.md`](docs/MEDICAL_REVIEW_TODO.md) with a qualified medical officer or PHC healthcare advisor to certify all draft clinical guidance strings.
