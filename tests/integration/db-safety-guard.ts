/**
 * tests/integration/db-safety-guard.ts
 *
 * Strict safety guard enforcing:
 * 1. ZERO tests run against production Supabase instances.
 * 2. Refuses execution if URL matches production project reference (boyzdmlvzvcplzolenef)
 *    or any non-local/non-test environment.
 * 3. Gracefully skips tests with a clear diagnostic message if a local/staging
 *    Supabase instance is not active.
 */

const KNOWN_PRODUCTION_REFS = [
  "boyzdmlvzvcplzolenef",
  "ruralhealth",
  "production",
];

export interface DatabaseTargetSafety {
  isSafeToExecute: boolean;
  targetUrl: string;
  skipReason?: string;
}

export function verifyIntegrationDatabaseTarget(): DatabaseTargetSafety {
  const rawUrl = (
    process.env.SUPABASE_INTEGRATION_TEST_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ""
  ).trim();

  const url = rawUrl === "undefined" ? "" : rawUrl.toLowerCase();

  // 1. HARD FAIL: If the target matches production, abort immediately
  const isProduction = KNOWN_PRODUCTION_REFS.some((ref) => url.includes(ref));
  if (isProduction) {
    throw new Error(
      `[SECURITY HALT] Integration tests REFUSE to run against production database target: "${url}". ` +
      `Integration tests MUST run only against a local Supabase CLI container (http://127.0.0.1:54321) ` +
      `or an isolated staging database.`
    );
  }

  // 2. CHECK: Is a valid local instance explicitly available?
  const isLocalOrTest =
    Boolean(url) &&
    (url.includes("127.0.0.1") || url.includes("localhost"));

  if (!isLocalOrTest) {
    return {
      isSafeToExecute: false,
      targetUrl: url,
      skipReason:
        "No local Supabase test instance detected (expected http://127.0.0.1:54321 or SUPABASE_INTEGRATION_TEST_URL). " +
        "To run live integration tests: start local Supabase with `npx supabase start`.",
    };
  }

  return {
    isSafeToExecute: true,
    targetUrl: url,
  };
}
