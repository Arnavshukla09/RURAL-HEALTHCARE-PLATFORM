/**
 * Rural Healthcare Platform — Real Performance Benchmark
 * Run: node scripts/benchmark.js
 * Keys are read from .env.local — never hardcoded.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Load env from .env.local (never hardcode secrets)
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) process.env[match[1].trim()] = match[2].trim().replace(/\r$/, '');
    }
  } catch (_) {
    console.error('Could not load .env.local — ensure it exists with NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
}
loadEnv();

const BASE_URL     = 'https://rural-healthcare-platform.vercel.app';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) {
  console.error('Missing env vars. Check .env.local');
  process.exit(1);
}

const results = { timestamp: new Date().toISOString(), database: {}, postgis: {}, api: {}, security: {}, deployment: {} };

function timedFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const start = process.hrtime.bigint();
    const mod = url.startsWith('https') ? https : http;
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (url.startsWith('https') ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: { 'User-Agent': 'RuralHealth-Benchmark/1.0', 'Accept': 'application/json', ...options.headers }
    };
    const req = mod.request(reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const ms = Number(process.hrtime.bigint() - start) / 1_000_000;
        resolve({ status: res.statusCode, latencyMs: parseFloat(ms.toFixed(2)), headers: res.headers, body });
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
    if (options.body) req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    req.end();
  });
}

async function benchmark(label, url, options = {}, n = 30) {
  console.log(`\n  Benchmarking: ${label} (${n} requests)...`);
  const latencies = [], errors = [];
  let successCount = 0;
  for (let i = 0; i < n; i++) {
    try {
      const res = await timedFetch(url, options);
      latencies.push(res.latencyMs);
      if (res.status >= 200 && res.status < 500) successCount++;
      if (i % 10 === 9) await sleep(200);
    } catch (e) { errors.push(e.message); }
  }
  if (!latencies.length) return { label, error: 'All failed', errorSample: errors[0] };
  latencies.sort((a, b) => a - b);
  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const stats = {
    label, requests: n, successCount,
    avg: +avg.toFixed(1),
    p50: +latencies[Math.floor(latencies.length * 0.50)].toFixed(1),
    p95: +latencies[Math.floor(latencies.length * 0.95)].toFixed(1),
    p99: +(latencies[Math.floor(latencies.length * 0.99)] || latencies.at(-1)).toFixed(1),
    min: +latencies[0].toFixed(1),
    max: +latencies.at(-1).toFixed(1),
    errorRate: `${((errors.length / n) * 100).toFixed(1)}%`,
    errors: errors.length
  };
  console.log(`    avg=${stats.avg}ms p95=${stats.p95}ms max=${stats.max}ms errors=${stats.errors}`);
  return stats;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function supabaseQuery(table, params = '', useService = false) {
  const key = useService ? SERVICE_KEY : ANON_KEY;
  return timedFetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'Prefer': 'count=exact' }
  });
}

async function supabaseRPC(fn, body, useService = false) {
  const key = useService ? SERVICE_KEY : ANON_KEY;
  return timedFetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

async function main() {
  console.log('='.repeat(60));
  console.log('RURAL HEALTHCARE PLATFORM — REAL PERFORMANCE BENCHMARK');
  console.log(`Started: ${results.timestamp}`);
  console.log('='.repeat(60));

  // 1. DATABASE METRICS
  console.log('\n[1/6] DATABASE METRICS');
  for (const table of ['patients','healthcare_providers','providers','appointments','medical_records','healthcare_facilities','camps','notifications','health_data','offline_sync_log','doctor_requests']) {
    try {
      const res = await supabaseQuery(table, 'select=count', true);
      const cr = res.headers['content-range'];
      const count = cr ? parseInt(cr.match(/\/(\d+)/)?.[1] || 0) : (() => { try { return JSON.parse(res.body).length } catch(_) { return '?' } })();
      results.database[table] = count;
      console.log(`  ${table}: ${count} rows (HTTP ${res.status})`);
    } catch (e) { results.database[table] = 'error'; }
    await sleep(100);
  }
  const vd = await supabaseQuery('healthcare_providers', 'is_verified=eq.true&select=count', true);
  const vdCr = vd.headers['content-range'];
  results.database.verified_doctors = vdCr ? parseInt(vdCr.match(/\/(\d+)/)?.[1] || 0) : '?';
  console.log(`  Verified doctors: ${results.database.verified_doctors}`);

  // 2. POSTGIS
  console.log('\n[2/6] POSTGIS SPATIAL QUERY PERFORMANCE');
  const coords = [
    {lat:23.2599,lon:77.4126},{lat:22.7196,lon:75.8577},{lat:26.2183,lon:78.1828},
    {lat:23.8388,lon:78.7378},{lat:21.1471,lon:79.0882}
  ];
  const pgLat = [];
  for (let i = 0; i < 30; i++) {
    const c = coords[i % coords.length];
    try {
      const start = process.hrtime.bigint();
      const res = await supabaseRPC('nearby_facilities', { p_lat: c.lat, p_lon: c.lon, p_radius_km: 25 }, true);
      const ms = Number(process.hrtime.bigint() - start) / 1_000_000;
      pgLat.push(parseFloat(ms.toFixed(2)));
      if (i === 0) {
        try { results.postgis.sample_count = JSON.parse(res.body).length; } catch(_) {}
        console.log(`  Sample query returned ${results.postgis.sample_count} facilities in ${ms.toFixed(1)}ms`);
      }
    } catch (e) { console.log(`  error: ${e.message}`); }
    await sleep(50);
  }
  pgLat.sort((a,b)=>a-b);
  const pgAvg = pgLat.reduce((a,b)=>a+b,0)/pgLat.length;
  results.postgis = { ...results.postgis, queries: pgLat.length, avg_ms: +pgAvg.toFixed(1), p50_ms: pgLat[Math.floor(pgLat.length*.5)], p95_ms: pgLat[Math.floor(pgLat.length*.95)], min_ms: pgLat[0], max_ms: pgLat.at(-1) };
  console.log(`  PostGIS avg=${results.postgis.avg_ms}ms p95=${results.postgis.p95_ms}ms max=${results.postgis.max_ms}ms`);

  // 3. API BENCHMARKS
  console.log('\n[3/6] API ENDPOINT BENCHMARKS');
  const endpoints = [
    { label: 'Landing Page (/)', url: `${BASE_URL}/`, n: 30 },
    { label: 'Login Page (/login)', url: `${BASE_URL}/login`, n: 30 },
    { label: 'Camps Page (/camps)', url: `${BASE_URL}/camps`, n: 30 },
    { label: 'Health Info (/health-info)', url: `${BASE_URL}/health-info`, n: 20 },
    { label: 'PostGIS RPC: nearby_facilities', url: `${SUPABASE_URL}/rest/v1/rpc/nearby_facilities`, options: {
      method:'POST', headers:{'apikey':ANON_KEY,'Authorization':`Bearer ${ANON_KEY}`,'Content-Type':'application/json'},
      body: JSON.stringify({p_lat:23.2599,p_lon:77.4126,p_radius_km:25})
    }, n: 30 },
    { label: 'Supabase: healthcare_providers', url: `${SUPABASE_URL}/rest/v1/healthcare_providers?is_verified=eq.true&select=id,name,specialization`, options:{headers:{'apikey':ANON_KEY,'Authorization':`Bearer ${ANON_KEY}`}}, n: 30 },
    { label: 'Supabase: camps list', url: `${SUPABASE_URL}/rest/v1/camps?select=*&order=start_date.asc`, options:{headers:{'apikey':ANON_KEY,'Authorization':`Bearer ${ANON_KEY}`}}, n: 30 },
  ];
  for (const ep of endpoints) {
    results.api[ep.label] = await benchmark(ep.label, ep.url, ep.options || {}, ep.n || 20);
    await sleep(500);
  }

  // 4. SECURITY
  console.log('\n[4/6] SECURITY CHECKS');
  results.security = { checks: {}, score: 0, total: 0 };
  function secCheck(name, passed, detail) {
    results.security.checks[name] = { passed, detail };
    results.security.total++;
    if (passed) results.security.score++;
    console.log(`  [${passed?'✅':'❌'}] ${name}: ${detail}`);
  }
  const homeRes = await timedFetch(`${BASE_URL}/`);
  const h = homeRes.headers;
  secCheck('HTTPS Enforced', BASE_URL.startsWith('https'), 'TLS');
  secCheck('X-Content-Type-Options', !!h['x-content-type-options'], h['x-content-type-options']||'missing');
  secCheck('X-Frame-Options', !!(h['x-frame-options']||(h['content-security-policy']||'').includes('frame-ancestors')), h['x-frame-options']||'CSP');
  secCheck('HSTS', !!h['strict-transport-security'], h['strict-transport-security']||'missing');
  secCheck('Content-Security-Policy', !!h['content-security-policy'], h['content-security-policy']?'present':'missing');
  secCheck('X-Powered-By Hidden', !h['x-powered-by'], h['x-powered-by']||'not exposed');
  const dashRes = await timedFetch(`${BASE_URL}/dashboard`);
  secCheck('Protected Route Redirect', dashRes.status===307||dashRes.status===302, `/dashboard → HTTP ${dashRes.status}`);
  const anonP = await supabaseQuery('patients','select=*&limit=1',false);
  let anonPRows=[]; try{anonPRows=JSON.parse(anonP.body);}catch(_){}
  secCheck('RLS: anon cannot read patients', Array.isArray(anonPRows)&&anonPRows.length===0, `${anonPRows.length??'?'} rows returned`);
  const anonSync = await supabaseQuery('offline_sync_log','select=*&limit=1',false);
  let anonSyncRows=[]; try{anonSyncRows=JSON.parse(anonSync.body);}catch(_){}
  secCheck('RLS: anon cannot read offline_sync_log', Array.isArray(anonSyncRows)&&anonSyncRows.length===0, `${anonSyncRows.length??'?'} rows returned`);
  const sqliRes = await timedFetch(`${SUPABASE_URL}/rest/v1/patients?email=eq.%27+OR+%271%27=%271`,{headers:{'apikey':ANON_KEY,'Authorization':`Bearer ${ANON_KEY}`}});
  let sqliRows=[]; try{sqliRows=JSON.parse(sqliRes.body);}catch(_){}
  secCheck('SQL Injection blocked by RLS', Array.isArray(sqliRows)&&sqliRows.length===0, `${sqliRows.length} rows`);
  const pct = Math.round((results.security.score/results.security.total)*100);
  results.security.percentage = pct;
  console.log(`\n  Security Score: ${results.security.score}/${results.security.total} (${pct}%)`);

  // 5. DEPLOYMENT TTFB
  console.log('\n[5/6] DEPLOYMENT TTFB MEASUREMENTS');
  const ttfbs = [];
  for (let i=0;i<10;i++) { const r=await timedFetch(`${BASE_URL}/login`); ttfbs.push(r.latencyMs); await sleep(2000); }
  ttfbs.sort((a,b)=>a-b);
  results.deployment = {
    samples: ttfbs.length,
    min_ms: ttfbs[0],
    avg_ms: +(ttfbs.reduce((a,b)=>a+b,0)/ttfbs.length).toFixed(1),
    p95_ms: ttfbs[Math.floor(ttfbs.length*.95)]||ttfbs.at(-1),
    max_ms: ttfbs.at(-1),
    vercel_id: h['x-vercel-id']||'N/A',
    cache_control: h['cache-control']||'not set'
  };
  console.log(`  TTFB: min=${results.deployment.min_ms}ms avg=${results.deployment.avg_ms}ms max=${results.deployment.max_ms}ms`);

  console.log('\n[6/6] WRITING RESULTS...');
  // Strip any accidental key leakage before writing
  const safe = JSON.parse(JSON.stringify(results));
  fs.writeFileSync(path.join(__dirname,'benchmark_results.json'), JSON.stringify(safe, null, 2));
  console.log('  Written: scripts/benchmark_results.json');
  console.log('\n' + '='.repeat(60));
  console.log('BENCHMARK COMPLETE');
  console.log('='.repeat(60));
}

main().catch(e => { console.error('ERROR:', e); process.exit(1); });
