// loadtest/k6/lib.js — shared helpers for rural_health_mixed.js
import encoding from 'k6/encoding';

// ---------------------------------------------------------------------------
// Config (all via -e NAME=value)
// ---------------------------------------------------------------------------
export const cfg = {
  baseUrl: (__ENV.BASE_URL || '').replace(/\/+$/, ''),
  supabaseUrl: (__ENV.SUPABASE_URL || '').replace(/\/+$/, ''),
  loadtestKey: __ENV.LOADTEST_KEY || '',          // must match LOADTEST_KEY on the staging deployment
  tokensFile: __ENV.TOKENS_FILE || '../tokens.json',
  coordJitter: parseFloat(__ENV.COORD_JITTER || '0.15'),
  // Persona weights (percent of user interactions)
  weights: {
    anon: parseInt(__ENV.W_ANON || '60', 10),
    chat: parseInt(__ENV.W_CHAT || '12', 10),
    symptom: parseInt(__ENV.W_SYMPTOM || '5', 10),
    patient: parseInt(__ENV.W_PATIENT || '20', 10),
    doctor: parseInt(__ENV.W_DOCTOR || '3', 10),
  },
};

export function projectRef() {
  const m = cfg.supabaseUrl.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/i);
  return m ? m[1] : '';
}

// ---------------------------------------------------------------------------
// Safety: refuse to hammer production
// ---------------------------------------------------------------------------
export function assertNotProduction() {
  if (!cfg.baseUrl) throw new Error('Set -e BASE_URL=https://your-STAGING-deployment.vercel.app');
  const prodHosts = (__ENV.PROD_HOSTS || 'rural-healthcare-platform.vercel.app')
    .split(',').map((s) => s.trim()).filter(Boolean);
  const host = cfg.baseUrl.replace(/^https?:\/\//, '').split('/')[0];
  if (prodHosts.includes(host) && __ENV.ALLOW_PROD !== 'yes') {
    throw new Error(
      `Refusing to load-test "${host}" (listed as production). Use a separate staging deployment. ` +
      'Override only if you really mean it: -e ALLOW_PROD=yes'
    );
  }
}

// ---------------------------------------------------------------------------
// Headers
// ---------------------------------------------------------------------------
export function baseHeaders(extra) {
  const h = { 'User-Agent': 'k6-loadtest/1.0', Accept: '*/*' };
  if (cfg.loadtestKey) h['x-loadtest-key'] = cfg.loadtestKey;   // bypasses per-IP limiter + stubs Gemini (staging only)
  return Object.assign(h, extra || {});
}

export function jsonHeaders() {
  return baseHeaders({ 'Content-Type': 'application/json' });
}

// ---------------------------------------------------------------------------
// Supabase SSR cookie (what the Next.js API routes read)
//   @supabase/ssr 0.6.x: value = "base64-" + base64url(JSON(session)),
//   split into chunks of 3180 chars named <key>.0, <key>.1 ... when too long.
// Verify with the smoke test first (profile call must return 200, not 401).
// ---------------------------------------------------------------------------
const MAX_CHUNK = 3180;

export function authCookies(session) {
  const key = `sb-${projectRef()}-auth-token`;
  const value = 'base64-' + encoding.b64encode(JSON.stringify(session), 'rawurl');
  if (value.length <= MAX_CHUNK) return { [key]: value };
  const out = {};
  for (let i = 0, n = 0; i < value.length; i += MAX_CHUNK, n++) {
    out[`${key}.${n}`] = value.slice(i, i + MAX_CHUNK);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Random helpers
// ---------------------------------------------------------------------------
export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function rand(min, max) {
  return min + Math.random() * (max - min);
}

export function weightedPersona() {
  const w = cfg.weights;
  const total = w.anon + w.chat + w.symptom + w.patient + w.doctor;
  let r = Math.random() * total;
  for (const k of ['anon', 'chat', 'symptom', 'patient', 'doctor']) {
    if ((r -= w[k]) < 0) return k;
  }
  return 'anon';
}

// Where your users actually are (Madhya Pradesh towns)
export const TOWNS = [
  { name: 'Bhopal', lat: 23.2599, lon: 77.4126 },
  { name: 'Indore', lat: 22.7196, lon: 75.8577 },
  { name: 'Jabalpur', lat: 23.1815, lon: 79.9864 },
  { name: 'Gwalior', lat: 26.2183, lon: 78.1828 },
  { name: 'Ujjain', lat: 23.1765, lon: 75.7885 },
  { name: 'Sagar', lat: 23.8388, lon: 78.7378 },
  { name: 'Rewa', lat: 24.5373, lon: 81.3042 },
  { name: 'Satna', lat: 24.6005, lon: 80.8322 },
  { name: 'Chhindwara', lat: 22.0574, lon: 78.9382 },
  { name: 'Shivpuri', lat: 25.4231, lon: 77.6593 },
];

export function randomCoord() {
  const t = pick(TOWNS);
  const j = cfg.coordJitter;
  return {
    lat: (t.lat + rand(-j, j)).toFixed(5),
    lon: (t.lon + rand(-j, j)).toFixed(5),
  };
}

export const PUBLIC_PAGES = [
  '/camps', '/health-info', '/directory', '/emergency', '/symptom-checker', '/locations', '/login',
];

export const FACILITY_TYPES = ['hospital', 'clinic', 'pharmacy', 'health_post', 'lab'];

// Chat corpus: curated hits, Hinglish, Hindi, unmatched-to-LLM, and emergencies
export const CHAT_MESSAGES = [
  { m: 'fever tips', l: 'en' },
  { m: 'I have a headache since morning', l: 'en' },
  { m: 'mujhe bukhar hai kya karu', l: 'en' },
  { m: 'pet dard aur ulti', l: 'en' },
  { m: 'what is dengue and what are its symptoms', l: 'en' },
  { m: 'how to prevent malaria in monsoon', l: 'en' },
  { m: 'is brown rice ok for diabetes', l: 'en' },
  { m: 'my child has loose motions how much ORS', l: 'en' },
  { m: 'बुखार में क्या खाना चाहिए', l: 'hi' },
  { m: 'सिर दर्द का घरेलू इलाज', l: 'hi' },
  { m: 'डेंगू के लक्षण क्या हैं', l: 'hi' },
  { m: 'tips for high blood pressure', l: 'en' },
  { m: 'where is the nearest PHC', l: 'en' },
  { m: 'is it safe to take medicines during pregnancy', l: 'en' },
  { m: 'how much water should I drink in summer', l: 'en' },
  // emergencies must never reach the LLM
  { m: 'my father has chest pain', l: 'en' },
  { m: 'snake bite on leg', l: 'en' },
  { m: 'सीने में दर्द है', l: 'hi' },
];

export const SYMPTOM_SETS = [
  ['Fever', 'Headache'],
  ['Cough', 'Fever', 'Fatigue'],
  ['Stomach pain', 'Vomiting'],
  ['Diarrhea', 'Fever'],
  ['Sore throat', 'Cough'],
  ['Body ache', 'Fever', 'Chills'],
  ['Headache'],
  ['Chest pain', 'Sweating'],
];

export function futureIso() {
  const days = 1 + Math.floor(Math.random() * 28);
  const hours = 9 + Math.floor(Math.random() * 8);
  const d = new Date(Date.now() + days * 86400000);
  d.setUTCHours(hours, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60), Math.floor(Math.random() * 1000));
  return d.toISOString();
}
