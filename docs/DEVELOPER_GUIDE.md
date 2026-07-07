# Developer Guide: Rural Healthcare Platform

Welcome to the Rural Healthcare Platform! This guide provides all the necessary information for new developers to install, run, debug, and contribute to the project.

---

## 1. Installation & Project Setup

### Prerequisites
- **Node.js** (v18.17 or higher)
- **npm** (v9 or higher)
- **Supabase Account** (for local development or cloud database)
- **Google Gemini API Key**

### Step-by-Step Setup
1. **Clone the repository:**
   ```bash
   git clone https://github.com/Arnavshukla09/RURAL-HEALTHCARE-PLATFORM.git
   cd RURAL-HEALTHCARE-PLATFORM
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Copy the example environment file and fill in your keys.
   ```bash
   cp .env.example .env.local
   ```
   *Note: Never commit `.env.local` to version control.*

4. **Database Setup:**
   Run the SQL scripts located in `scripts/` in your Supabase SQL Editor in numerical order (`001` through `008`).
   Finally, seed the PostGIS facility database:
   ```bash
   node scripts/seed_mp_facilities.js
   ```

---

## 2. Running Locally

To start the Next.js development server:
```bash
npm run dev
```
The application will be available at `http://localhost:3000`. 
Hot-module reloading (HMR) is enabled, meaning your changes will reflect instantly in the browser.

---

## 3. Debugging

### Frontend Debugging
- **React Developer Tools:** Use the browser extension to inspect component state, especially the global props passed down from `app/page.tsx` (`user`, `language`, `setCurrentPage`).
- **Network Tab:** Monitor API calls to `/api/*` for 400 (Zod validation) or 401 (Auth) errors.

### Backend Debugging
- **Supabase Logs:** If database operations fail, check the Supabase Dashboard -> Logs -> Postgres Logs.
- **Serverless Functions:** Use `console.error` in `/app/api/*` routes. These logs will appear in your local terminal during development or in Vercel's logging dashboard in production.

---

## 4. Testing

*Note: Automated testing is currently pending implementation.*

### Planned Testing Architecture
- **Unit Testing:** `Vitest` will be used for testing isolated utilities (e.g., rate-limiter, Zod schemas).
- **Component Testing:** `React Testing Library` for ensuring accessible UI.
- **E2E Testing:** `Playwright` for testing the critical user flows (e.g., booking an appointment).

**Manual Testing:** Before submitting a Pull Request, you must manually verify the "Registration -> AI Triaging -> Booking" flow.

---

## 5. Deployment

The project is optimized for deployment on **Vercel**.

1. Connect your GitHub repository to Vercel.
2. In the Vercel Dashboard, navigate to Project Settings -> Environment Variables and paste all variables from your `.env.local`.
3. Vercel automatically deploys the `main` branch.

---

## 6. Code Style

- **Strict TypeScript:** Do not use `any`. Define interfaces for all API payloads.
- **Tailwind CSS:** Use utility classes for all styling. Use the `cn()` utility from `lib/utils.ts` for dynamic class merging.
- **Bilingual Support:** Any new user-facing text must support both English and Hindi.
  ```tsx
  // Example
  <p>{language === 'en' ? 'Hello' : 'नमस्ते'}</p>
  ```
- **Zod Validation:** All incoming API requests must be parsed and validated using a Zod schema.

---

## 7. Architecture Overview

This project uses a **Serverless Backend-For-Frontend (BFF)** architecture.
- **Client UI:** Single Page Application (SPA) driven by state inside `app/page.tsx`.
- **API Routes:** Next.js Serverless functions (`/app/api/`) handle secure operations and hide API keys (e.g., Gemini).
- **Database:** Supabase PostgreSQL manages relational data, Auth manages sessions via SSR HttpOnly cookies, and PostGIS handles spatial facility mapping.

*(For a deep dive, read `docs/ARCHITECTURE.md` and `docs/DATABASE.md`).*

---

## 8. Development Workflow

1. **Pick an Issue:** Review `docs/ROADMAP.md` or GitHub Issues.
2. **Read the Docs:** Familiarize yourself with the affected components in `docs/COMPONENTS.md`.
3. **Branch Out:** Create a feature branch.
4. **Develop:** Write your code, ensuring it follows the strict TypeScript and Bilingual guidelines.
5. **Test:** Manually verify your changes locally.
6. **Commit:** Follow the Conventional Commits specification.

---

## 9. Git Workflow

We use a standard Feature Branch workflow.

- **`main` branch:** The stable, production-ready branch. Deployments run from here.
- **Feature branches:** Branch off `main` using the format `feat/your-feature-name` or `fix/your-bug-name`.
  ```bash
  git checkout -b feat/add-notifications
  ```
- **Commits:** Use conventional commits:
  - `feat: Added new email notification service`
  - `fix: Resolved map loading error on mobile`
  - `docs: Updated developer guide`
- **Pull Requests:** Open a PR against `main`. Require at least one review before merging.

---

## 10. Recommended Practices

- **Row Level Security (RLS):** Never assume data is secure just because the UI hides it. Ensure Supabase RLS policies strictly limit data access at the database level.
- **PostGIS Triggers:** Never manually insert data into the `geom` column of `healthcare_facilities`. Insert `lat` and `lon`, and let the database trigger calculate the geometry.
- **API Fallbacks:** When interacting with external APIs (like Google Gemini), always provide a hardcoded functional fallback in case the API rate limits or goes down.
- **Fat Components:** Don't prematurely abstract code. It is acceptable for components in this repository to handle their own data fetching and state until they become unmanageable.
