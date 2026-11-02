#!/usr/bin/env node
/**
 * tools/mint_tokens.mjs
 *
 * Logs in N of the synthetic users created by seed/seed_staging.sql and writes
 * their sessions to tokens.json, which the k6 script reads. Doing the logins
 * ONCE here (slowly) means the load test never hammers Supabase Auth, which has
 * its own rate limits and would otherwise skew your results.
 *
 * Requires Node 18+. No dependencies.
 *
 *   SUPABASE_URL=https://STAGING-REF.supabase.co \
 *   SUPABASE_ANON_KEY=...            (the publishable/anon key of the STAGING project) \
 *   node tools/mint_tokens.mjs --count 300 --out ../tokens.json
 *
 * Optional:
 *   --password   default LoadTest#2026 (must match seed_staging.sql)
 *   --start      first user number, default 1
 *   --delay      ms between logins, default 250 (raise it if you see 429)
 *   --doctors    stop early once this many doctor accounts were found, default 0 (off)
 *
 * Access tokens last about an hour by default. Re-run this before long tests.
 * NEVER commit tokens.json (it is a set of live sessions). It is git-ignored in
 * the README instructions.
 */
import { writeFileSync } from 'node:fs';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => {
    if (cur.startsWith('--')) acc.push([cur.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : 'true']);
    return acc;
  }, [])
);

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const COUNT = parseInt(args.count || '300', 10);
const START = parseInt(args.start || '1', 10);
const PASSWORD = args.password || process.env.LOADTEST_PASSWORD || 'LoadTest#2026';
const DELAY = parseInt(args.delay || '250', 10);
const WANT_DOCTORS = parseInt(args.doctors || '0', 10);
const OUT = args.out || '../tokens.json';

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_ANON_KEY (STAGING project).');
  process.exit(1);
}
const PROD_REF = process.env.PROD_SUPABASE_REF || 'boyzdmlvzvcplzolenef'; // your production project ref (public in your page source)
if (SUPABASE_URL.includes(PROD_REF) && process.env.ALLOW_PROD !== 'yes') {
  console.error('That looks like your PRODUCTION Supabase project. Use the staging project.');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function login(email) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  if (res.status === 429) return { rateLimited: true };
  if (!res.ok) return { error: `${res.status} ${(await res.text()).slice(0, 120)}` };
  return { session: await res.json() };
}

async function profile(session) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/patients?select=id,role&user_id=eq.${session.user.id}&limit=1`,
    { headers: { apikey: ANON_KEY, Authorization: `Bearer ${session.access_token}` } }
  );
  if (!res.ok) return {};
  const rows = await res.json();
  return rows[0] || {};
}

const out = [];
let doctors = 0;
let failures = 0;
let backoff = DELAY;

for (let n = START; out.length < COUNT; n++) {
  const email = `loadtest+${String(n).padStart(6, '0')}@loadtest.example.com`;
  const r = await login(email);

  if (r.rateLimited) {
    backoff = Math.min(backoff * 2, 10000);
    console.warn(`429 from Supabase Auth, backing off to ${backoff} ms`);
    await sleep(backoff);
    n--; // retry the same user
    continue;
  }
  if (r.error) {
    failures++;
    console.warn(`login failed for ${email}: ${r.error}`);
    if (failures >= 10 && out.length === 0) {
      console.error('10 failures and no successes. Check the seed ran, the password matches, and email confirmations are off.');
      process.exit(2);
    }
    if (n - START > COUNT * 3) break;
    continue;
  }

  const p = await profile(r.session);
  if (p.role === 'doctor') doctors++;
  out.push({ email, role: p.role || 'patient', patient_id: p.id || null, session: r.session });
  if (out.length % 25 === 0) console.log(`minted ${out.length}/${COUNT} (doctors: ${doctors})`);
  if (WANT_DOCTORS && doctors >= WANT_DOCTORS && out.length >= Math.min(COUNT, 50)) break;
  await sleep(DELAY);
}

writeFileSync(OUT, JSON.stringify(out));
console.log(`\nWrote ${out.length} sessions (${doctors} doctors) to ${OUT}`);
console.log('Do NOT commit this file. Sessions expire in ~1 hour; re-run before long tests.');
