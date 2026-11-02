// loadtest/k6/rural_health_mixed.js
//
// One script, six test types.  Pick with  -e TEST_TYPE=...
//
//   smoke       1 pass through every persona; checks the wiring (run this first!)
//   load        expected peak traffic held for 10 minutes
//   stress      steps 25% -> 300% of TARGET_RPS to see where it degrades
//   spike       sudden jump to 4x (a health camp announcement, SMS blast, ...)
//   soak        50% of TARGET_RPS for an hour (finds leaks and slow growth)
//   breakpoint  ramps until the error/latency thresholds fail, then aborts.
//               The rate reached when it aborts is your approximate maximum.
//
// The load model is OPEN: TARGET_RPS = new "user interactions" started per
// second (one interaction = one persona flow, e.g. open page + 2 API calls).
// That is the right model for finding capacity because new users keep
// arriving even when the server slows down.
//
// Usage (from this folder, STAGING only):
//   k6 run -e TEST_TYPE=smoke \
//          -e BASE_URL=https://your-staging.vercel.app \
//          -e SUPABASE_URL=https://xxxx.supabase.co \
//          -e LOADTEST_KEY=your-staging-secret \
//          -e TOKENS_FILE=/abs/path/tokens.json  rural_health_mixed.js

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import {
  cfg, assertNotProduction, baseHeaders, jsonHeaders, authCookies, pick, rand,
  weightedPersona, randomCoord, PUBLIC_PAGES, FACILITY_TYPES, CHAT_MESSAGES,
  SYMPTOM_SETS, futureIso,
} from './lib.js';

// ---------------------------------------------------------------------------
// Custom metrics: they tell you WHY something failed, not just that it did
// ---------------------------------------------------------------------------
const rateLimited = new Counter('app_rate_limited');        // HTTP 429 from the app's own limiter
const serverErrors = new Counter('server_errors');          // HTTP 5xx
const authFailures = new Counter('auth_failures');          // 401 on an authenticated call (cookie problem or expired token)
const aiFallbacks = new Counter('ai_fallback_replies');     // chat answered with fallback:true
const bookingConflicts = new Counter('booking_conflicts');  // 409 slot taken (expected under load)
const noTokenFallback = new Counter('persona_without_tokens');

// 409 is an expected business answer. 429/401/5xx stay counted as failures.
http.setResponseCallback(http.expectedStatuses({ min: 200, max: 399 }, 409));

// ---------------------------------------------------------------------------
// Test accounts (created by seed_staging.sql, logged in by tools/mint_tokens.mjs)
// ---------------------------------------------------------------------------
const tokens = new SharedArray('tokens', function () {
  try { return JSON.parse(open(cfg.tokensFile)); } catch (e) { return []; }
});
const doctorIdx = new SharedArray('doctor-idx', function () {
  try {
    return JSON.parse(open(cfg.tokensFile)).map((t, i) => (t.role === 'doctor' ? i : -1)).filter((i) => i >= 0);
  } catch (e) { return []; }
});

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------
const TEST = (__ENV.TEST_TYPE || 'smoke').toLowerCase();
const RPS = parseFloat(__ENV.TARGET_RPS || '10');          // interactions/sec at 100% load
const MAX_RPS = parseFloat(__ENV.MAX_RPS || '200');         // breakpoint ceiling
const MAX_VUS = parseInt(__ENV.MAX_VUS || '600', 10);
const THINK = parseFloat(__ENV.THINK_MAX || '1.5');         // max seconds pause between steps
const BREAK_MIN = parseInt(__ENV.BREAK_MINUTES || '20', 10);

function arrival(stages) {
  return {
    executor: 'ramping-arrival-rate',
    exec: 'interaction',
    startRate: 1,
    timeUnit: '1s',
    preAllocatedVUs: Math.min(60, MAX_VUS),
    maxVUs: MAX_VUS,
    stages,
  };
}

function stepStages(fractions, hold) {
  const out = [];
  fractions.forEach((f) => {
    out.push({ target: Math.max(1, RPS * f), duration: '30s' });
    out.push({ target: Math.max(1, RPS * f), duration: hold });
  });
  out.push({ target: 0, duration: '1m' });
  return out;
}

const SCENARIOS = {
  smoke: { smoke: { executor: 'shared-iterations', exec: 'smokeAll', vus: 1, iterations: 1, maxDuration: '3m' } },
  load: {
    load: arrival([
      { target: RPS, duration: '3m' },
      { target: RPS, duration: __ENV.LOAD_HOLD || '10m' },
      { target: 0, duration: '1m' },
    ]),
  },
  stress: { stress: arrival(stepStages([0.25, 0.5, 0.75, 1, 1.5, 2, 3], '2m')) },
  spike: {
    spike: arrival([
      { target: Math.max(1, RPS * 0.2), duration: '1m' },
      { target: RPS * 4, duration: '30s' },
      { target: RPS * 4, duration: '3m' },
      { target: Math.max(1, RPS * 0.2), duration: '30s' },
      { target: Math.max(1, RPS * 0.2), duration: '2m' },
    ]),
  },
  soak: {
    soak: arrival([
      { target: Math.max(1, RPS * 0.5), duration: '3m' },
      { target: Math.max(1, RPS * 0.5), duration: __ENV.SOAK_DURATION || '60m' },
      { target: 0, duration: '2m' },
    ]),
  },
  breakpoint: { breakpoint: arrival([{ target: MAX_RPS, duration: `${BREAK_MIN}m` }]) },
};

const thresholds = {
  http_req_failed: ['rate<0.01'],
  checks: ['rate>0.99'],
  'http_req_duration{kind:page}': ['p(95)<1500'],
  'http_req_duration{kind:api}': ['p(95)<800'],
  'http_req_duration{kind:ai}': ['p(95)<5000'],
};

if (TEST === 'breakpoint') {
  // Abort as soon as the app is clearly failing; the abort time tells you the rate.
  thresholds.http_req_failed = [{ threshold: 'rate<0.05', abortOnFail: true, delayAbortEval: '45s' }];
  thresholds['http_req_duration{kind:api}'] = [{ threshold: 'p(95)<3000', abortOnFail: true, delayAbortEval: '45s' }];
}

export const options = {
  scenarios: SCENARIOS[TEST] || SCENARIOS.smoke,
  thresholds,
  discardResponseBodies: false,
  noConnectionReuse: false,
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

// ---------------------------------------------------------------------------
// HTTP helper with consistent tags and failure classification
// ---------------------------------------------------------------------------
function call(method, path, body, o) {
  const opt = o || {};
  const params = {
    headers: body ? jsonHeaders() : baseHeaders(),
    tags: { kind: opt.kind || 'api', name: opt.name || `${method} ${path.split('?')[0]}` },
    timeout: '30s',
  };
  if (opt.cookies) params.cookies = opt.cookies;
  const url = cfg.baseUrl + path;
  const res = method === 'GET'
    ? http.get(url, params)
    : http.request(method, url, body ? JSON.stringify(body) : null, params);

  if (res.status === 429) rateLimited.add(1);
  else if (res.status === 401 && opt.cookies) authFailures.add(1);
  else if (res.status >= 500) serverErrors.add(1);
  else if (res.status === 409) bookingConflicts.add(1);

  const okStatuses = opt.ok || [200];
  const label = params.tags.name;
  check(res, { [`${label} status ok`]: (r) => okStatuses.indexOf(r.status) !== -1 });
  return res;
}

function think() { sleep(rand(0.2, THINK)); }

function jsonBody(res) {
  try { return res.json(); } catch (e) { return null; }
}

// ---------------------------------------------------------------------------
// Personas
// ---------------------------------------------------------------------------
function anonBrowse() {
  group('anon browse', function () {
    call('GET', '/', null, { kind: 'page', name: 'GET /' });
    think();
    call('GET', pick(PUBLIC_PAGES), null, { kind: 'page', name: 'GET public page' });
    think();
    call('GET', '/api/providers', null, { name: 'GET /api/providers' });
    const c = randomCoord();
    call('GET', `/api/facilities/nearby?lat=${c.lat}&lon=${c.lon}&type=${pick(FACILITY_TYPES)}`, null,
      { name: 'GET /api/facilities/nearby' });
  });
}

function chat() {
  group('chat', function () {
    const t = pick(CHAT_MESSAGES);
    const res = call('POST', '/api/ai-chat', { message: t.m, language: t.l, history: [] }, { kind: 'ai', name: 'POST /api/ai-chat' });
    const b = jsonBody(res);
    check(res, { 'ai-chat has reply': () => !!(b && b.reply) });
    if (b && b.fallback) aiFallbacks.add(1);
  });
}

function symptom() {
  group('symptom analyze', function () {
    const res = call('POST', '/api/symptom-analyze', {
      age: String(5 + Math.floor(Math.random() * 70)),
      gender: pick(['male', 'female']),
      symptoms: pick(SYMPTOM_SETS),
      daysSick: String(1 + Math.floor(Math.random() * 6)),
      language: pick(['en', 'hi']),
    }, { kind: 'ai', name: 'POST /api/symptom-analyze' });
    const b = jsonBody(res);
    check(res, { 'symptom-analyze has urgency': () => !!(b && b.urgency) });
  });
}

function sessionFor(idx) {
  const entry = tokens[idx];
  return entry ? authCookies(entry.session) : null;
}

function patientSession() {
  if (tokens.length === 0) { noTokenFallback.add(1); return anonBrowse(); }
  const cookies = sessionFor(Math.floor(Math.random() * tokens.length));
  group('patient session', function () {
    call('GET', '/api/auth/profile', null, { cookies });
    think();
    call('GET', '/api/appointments', null, { cookies });
    call('GET', '/api/medical-records', null, { cookies });
    call('GET', '/api/notifications', null, { cookies });
    call('GET', '/api/health-data', null, { cookies });
    if (Math.random() < 0.10) {
      think();
      call('POST', '/api/appointments', {
        appointment_date: futureIso(),
        consultation_type: 'video',
        notes: 'loadtest booking',
      }, { cookies, name: 'POST /api/appointments', ok: [201, 409] });
    }
  });
}

function doctorSession() {
  if (doctorIdx.length === 0) { return patientSession(); }
  const cookies = sessionFor(doctorIdx[Math.floor(Math.random() * doctorIdx.length)]);
  group('doctor session', function () {
    call('GET', '/api/auth/profile', null, { cookies });
    // For doctors/admins this returns EVERY appointment (unpaginated) — the query to watch.
    call('GET', '/api/appointments', null, { cookies, name: 'GET /api/appointments (doctor)' });
    call('GET', '/api/notifications', null, { cookies });
  });
}

const PERSONAS = { anon: anonBrowse, chat, symptom, patient: patientSession, doctor: doctorSession };

// ---------------------------------------------------------------------------
// Executors
// ---------------------------------------------------------------------------
export function setup() {
  assertNotProduction();
  const r = http.get(cfg.baseUrl + '/', { headers: baseHeaders(), tags: { kind: 'page', name: 'setup GET /' } });
  if (r.status !== 200) {
    throw new Error(`Base URL did not return 200 (got ${r.status}). Is the staging deployment up?`);
  }
  return { tokens: tokens.length, doctors: doctorIdx.length };
}

export function interaction() {
  PERSONAS[weightedPersona()]();
}

// Hits every persona once and reports on the wiring
export function smokeAll(data) {
  console.log(`tokens loaded: ${tokens.length}, doctors among them: ${doctorIdx.length}`);
  anonBrowse();
  chat();
  symptom();
  if (tokens.length > 0) {
    const cookies = sessionFor(0);
    const res = call('GET', '/api/auth/profile', null, { cookies, name: 'SMOKE auth profile' });
    check(res, { 'SMOKE: auth cookie accepted (profile 200)': (r) => r.status === 200 });
    if (res.status === 401) {
      console.error('AUTH COOKIE REJECTED: see README "Troubleshooting auth cookies".');
    }
    patientSession();
    doctorSession();
  } else {
    console.warn('No tokens.json found; authenticated personas skipped. Run tools/mint_tokens.mjs.');
  }
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
function val(data, metric, stat) {
  const m = data.metrics[metric];
  return m && m.values && m.values[stat] !== undefined ? m.values[stat] : undefined;
}
const f = (n, d) => (n === undefined ? 'n/a' : Number(n).toFixed(d === undefined ? 0 : d));

export function handleSummary(data) {
  const elapsedS = (data.state && data.state.testRunDurationMs ? data.state.testRunDurationMs : 0) / 1000;
  const lines = [];
  lines.push('');
  lines.push(`=== Rural Health load test: ${TEST.toUpperCase()} ===`);
  lines.push(`duration           : ${f(elapsedS, 0)} s`);
  lines.push(`interactions       : ${f(val(data, 'iterations', 'count'))}  (${f(val(data, 'iterations', 'rate'), 1)}/s average)`);
  lines.push(`http requests      : ${f(val(data, 'http_reqs', 'count'))}  (${f(val(data, 'http_reqs', 'rate'), 1)}/s average)`);
  lines.push(`failed requests    : ${f((val(data, 'http_req_failed', 'rate') || 0) * 100, 2)} %`);
  lines.push(`p95 pages (ms)     : ${f(val(data, 'http_req_duration{kind:page}', 'p(95)'))}`);
  lines.push(`p95 API (ms)       : ${f(val(data, 'http_req_duration{kind:api}', 'p(95)'))}`);
  lines.push(`p95 AI routes (ms) : ${f(val(data, 'http_req_duration{kind:ai}', 'p(95)'))}`);
  lines.push(`429 rate-limited   : ${f(val(data, 'app_rate_limited', 'count'))}   <- if >0 your limiter, not capacity, is the limit`);
  lines.push(`5xx server errors  : ${f(val(data, 'server_errors', 'count'))}`);
  lines.push(`401 auth failures  : ${f(val(data, 'auth_failures', 'count'))}   <- if >0 check cookies/token expiry`);
  lines.push(`booking conflicts  : ${f(val(data, 'booking_conflicts', 'count'))}`);
  lines.push(`AI fallbacks       : ${f(val(data, 'ai_fallback_replies', 'count'))}`);
  lines.push(`dropped iterations : ${f(val(data, 'dropped_iterations', 'count'))}   <- if >0 the load generator or maxVUs ran out`);
  lines.push(`peak VUs           : ${f(val(data, 'vus_max', 'max'))}`);

  if (TEST === 'breakpoint') {
    const total = BREAK_MIN * 60;
    const reached = elapsedS >= total ? MAX_RPS : 1 + (MAX_RPS - 1) * (elapsedS / total);
    const aborted = elapsedS < total - 5;
    lines.push('');
    lines.push(aborted
      ? `BREAKPOINT: thresholds failed after ~${f(elapsedS, 0)} s, i.e. at roughly ${f(reached, 0)} interactions/s.`
      : `No breakpoint reached: system held up to MAX_RPS=${MAX_RPS}. Raise MAX_RPS (and MAX_VUS) and rerun.`);
    lines.push('Use tools/capacity_model.mjs with this number to convert it into concurrent users and monthly quota use.');
  }
  lines.push('');

  return {
    stdout: lines.join('\n'),
    [`summary-${TEST}.json`]: JSON.stringify(data, null, 2),
  };
}
