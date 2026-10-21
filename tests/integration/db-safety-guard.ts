/**
 * tests/integration/db-safety-guard.ts
 *
 * Strict safety guard enforcing:
 * 1. Allowlist-only execution: Integration tests execute ONLY against local test containers
 *    (http://127.0.0.1:54321 or http://localhost:54321) or URLs explicitly allowlisted
 *    in INTEGRATION_ALLOWED_URLS.
 * 2. Non-allowlisted database targets (including remote/cloud instances) are rejected.
 * 3. Never hardcodes production project references.
 * 4. When REQUIRE_DB=1 is set, fails fast if the test database is absent or unallowlisted.
 */

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
  const requireDb = process.env.REQUIRE_DB === "1" || process.env.REQUIRE_DB === "true";

  // Strict allowlist: local test instances or explicit allowed list
  const allowedList = [
    "http://127.0.0.1:54321",
    "http://localhost:54321",
    "https://127.0.0.1:54321",
    "https://localhost:54321",
    "127.0.0.1:54321",
    "localhost:54321",
    ...(process.env.INTEGRATION_ALLOWED_URLS
      ? process.env.INTEGRATION_ALLOWED_URLS.split(",").map((u) => u.trim().toLowerCase())
      : []),
  ];

  const isAllowlisted =
    Boolean(url) && allowedList.some((allowed) => url === allowed || url.startsWith(allowed));

  if (!isAllowlisted) {
    const reason =
      `[SECURITY GUARD] Database target "${url || "EMPTY"}" is NOT in the integration allowlist. ` +
      `Integration tests MUST run only against a local test container (http://127.0.0.1:54321) ` +
      `or explicit INTEGRATION_ALLOWED_URLS.`;

    if (requireDb) {
      throw new Error(`${reason} REQUIRE_DB=1 is set, failing test run.`);
    }

    return {
      isSafeToExecute: false,
      targetUrl: url,
      skipReason: reason,
    };
  }

  return {
    isSafeToExecute: true,
    targetUrl: url,
  };
}
