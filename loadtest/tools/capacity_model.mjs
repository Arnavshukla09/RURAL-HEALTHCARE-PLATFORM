#!/usr/bin/env node
/**
 * tools/capacity_model.mjs — turns a k6 result into numbers you can plan with.
 *
 * Three things the raw "requests per second" number does not tell you:
 *   1. How many REAL users (who pause to read) that rate supports
 *      (Interactive Response Time Law:  N = X * (R + Z) ).
 *   2. Which MONTHLY QUOTA you hit first on free tiers (usually before any
 *      CPU limit does).
 *   3. The headroom you should keep (never plan at 100% of the breakpoint).
 *
 * Usage (all flags optional except --breakpoint-rps):
 *   node tools/capacity_model.mjs --breakpoint-rps 35 --response-s 1.8 \
 *        --calls-per-interaction 4 --fn-per-interaction 3 \
 *        --client-kb 300 --supabase-kb 60 --mau 20000
 *
 * Where each input comes from:
 *   --breakpoint-rps        "BREAKPOINT ... at roughly N interactions/s" in the breakpoint summary
 *   --response-s            iteration_duration avg (seconds) from a load run at ~50% of breakpoint
 *   --calls-per-interaction http_reqs.count / iterations.count from any run
 *   --fn-per-interaction    how many of those calls run serverless code (API routes + SSR pages);
 *                           static files and CDN hits do not count. Check Vercel > Usage.
 *   --client-kb             what the browser downloads per interaction (Vercel bandwidth):
 *                           data_received.count / iterations.count / 1024 from k6
 *   --supabase-kb           data Supabase sends per interaction (Supabase egress). Measure it: run a
 *                           known number of interactions, read Supabase > Reports > Egress, divide.
 *   --mau                   monthly active users you want to support
 *
 * Plan limits below were checked on 2026-10-10 against the vendors' docs.
 * They change. Override with the flags or edit the PLAN object.
 */
const a = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => {
    if (cur.startsWith('--')) acc.push([cur.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : 'true']);
    return acc;
  }, [])
);
const num = (k, d) => (a[k] !== undefined ? parseFloat(a[k]) : d);

const PLAN = {
  name: a.plan || 'Vercel Hobby + Supabase Free',
  vercelInvocationsPerMonth: num('vercel-invocations', 1_000_000),   // Hobby (verify on vercel.com/pricing)
  supabaseEgressGbPerMonth: num('egress-gb', 5),                     // Supabase Free
  realtimeConcurrent: num('realtime-conns', 200),                    // Supabase Free (hard cap)
  supabaseDbGb: num('db-gb', 0.5),                                   // Supabase Free
  vercelBandwidthGb: num('vercel-bandwidth-gb', 100),                // Vercel Hobby (verify)
};

const X = num('breakpoint-rps', NaN);
if (!Number.isFinite(X)) {
  console.error('Usage: node tools/capacity_model.mjs --breakpoint-rps <n> [--response-s 1.5] [--think-seconds 30] [--safety 0.5] ...');
  process.exit(1);
}
const R = num('response-s', 1.5);                // seconds per interaction
const Z = num('think-seconds', 30);              // how long a real user pauses between interactions
const safety = num('safety', 0.5);               // plan at 50% of the breakpoint
const callsPer = num('calls-per-interaction', 4);
const fnPer = num('fn-per-interaction', 3);
const clientKb = num('client-kb', 300);
const supabaseKb = num('supabase-kb', 60);
const interactionsPerSession = num('interactions-per-session', 6);
const sessionsPerUserMonth = num('sessions-per-user-month', 8);
const mau = num('mau', 5000);
const peakShare = num('peak-share', 0.10);       // fraction of a day's traffic arriving in the busiest hour
const loggedInShare = num('logged-in-share', 0.6); // share of concurrent users holding a realtime connection

const f = (n, d = 0) => Number(n).toLocaleString('en-IN', { maximumFractionDigits: d });

const sustainableX = X * safety;
const concurrentUsers = sustainableX * (R + Z);
const interactionsPerHour = sustainableX * 3600;
const activeUsersPerHour = interactionsPerHour / interactionsPerSession;

console.log(`\nPlan modelled : ${PLAN.name}`);
console.log(`Breakpoint    : ${f(X, 1)} interactions/s  ->  plan for ${f(sustainableX, 1)}/s (${safety * 100}% headroom rule)`);
console.log(`Real users    : ~${f(concurrentUsers)} concurrent users can be served at that rate`);
console.log(`                (N = X x (R + Z) = ${f(sustainableX, 1)} x (${R}s + ${Z}s))`);
console.log(`Busy hour     : ~${f(activeUsersPerHour)} user sessions per hour\n`);

// Monthly quota use at the requested MAU
const interactionsMonth = mau * sessionsPerUserMonth * interactionsPerSession;
const invocations = interactionsMonth * fnPer;
const egressGb = (interactionsMonth * supabaseKb) / 1024 / 1024;
const bandwidthGb = (interactionsMonth * clientKb) / 1024 / 1024;
const peakHourInteractions = interactionsMonth / 30 * peakShare;
const peakRps = peakHourInteractions / 3600;
const peakConcurrent = peakRps * (R + Z);
const realtimeNeeded = peakConcurrent * loggedInShare;

const rows = [
  ['Compute capacity (peak rate vs plan)', `${f(peakRps, 2)}/s needed`, `${f(sustainableX, 1)}/s`, peakRps / sustainableX],
  ['Vercel function invocations / month', f(invocations), f(PLAN.vercelInvocationsPerMonth), invocations / PLAN.vercelInvocationsPerMonth],
  ['Vercel bandwidth GB / month', f(bandwidthGb, 1), f(PLAN.vercelBandwidthGb), bandwidthGb / PLAN.vercelBandwidthGb],
  ['Supabase egress GB / month', f(egressGb, 1), f(PLAN.supabaseEgressGbPerMonth), egressGb / PLAN.supabaseEgressGbPerMonth],
  ['Realtime concurrent connections (peak)', f(realtimeNeeded), f(PLAN.realtimeConcurrent), realtimeNeeded / PLAN.realtimeConcurrent],
];

console.log(`At ${f(mau)} monthly active users (${sessionsPerUserMonth} sessions/user/month, ${interactionsPerSession} interactions/session):`);
console.log('-'.repeat(86));
console.log('Resource'.padEnd(42) + 'Need'.padEnd(18) + 'Limit'.padEnd(14) + 'Used');
console.log('-'.repeat(86));
for (const [name, need, lim, ratio] of rows) {
  const flag = ratio > 1 ? '  <-- OVER' : ratio > 0.7 ? '  <-- close' : '';
  console.log(name.padEnd(42) + String(need).padEnd(18) + String(lim).padEnd(14) + f(ratio * 100) + '%' + flag);
}
console.log('-'.repeat(86));

const first = rows.slice().sort((x, y) => y[3] - x[3])[0];
console.log(`\nFirst limit you will hit: ${first[0]}`);

// Reverse: max MAU each limit allows
const perUserInteractions = sessionsPerUserMonth * interactionsPerSession;
const maxMauInvocations = PLAN.vercelInvocationsPerMonth / (perUserInteractions * fnPer);
const maxMauEgress = (PLAN.supabaseEgressGbPerMonth * 1024 * 1024) / (perUserInteractions * supabaseKb);
const maxMauBandwidth = (PLAN.vercelBandwidthGb * 1024 * 1024) / (perUserInteractions * clientKb);
// busy hour carries `peakShare` of a day's traffic, so the daily capacity is hourly capacity / peakShare
const maxMauCompute = ((sustainableX * 3600 / peakShare) * 30) / perUserInteractions;
console.log('\nMaximum monthly active users each limit allows on its own:');
console.log(`  Vercel invocations : ~${f(maxMauInvocations)} MAU`);
console.log(`  Vercel bandwidth   : ~${f(maxMauBandwidth)} MAU`);
console.log(`  Supabase egress    : ~${f(maxMauEgress)} MAU`);
console.log(`  Compute (tested)   : ~${f(maxMauCompute)} MAU  (busy-hour share ${peakShare * 100}%)`);
console.log('\nThese are estimates built from YOUR measured numbers plus the assumptions above.');
console.log('Change the assumptions (sessions/user, interactions/session, peak-share) to match real analytics once you have them.\n');
