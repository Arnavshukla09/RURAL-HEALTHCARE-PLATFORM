import fs from 'node:fs';

const reportPath = process.argv[2] || 'vitest-integration-report.json';

if (!fs.existsSync(reportPath)) {
  console.log(`[dump_vitest_failures] Report file not found at ${reportPath}`);
  process.exit(0);
}

try {
  const content = fs.readFileSync(reportPath, 'utf8');
  const report = JSON.parse(content);

  console.log(
    `Test Summary: passed=${report.numPassedTests}, failed=${report.numFailedTests}, skipped=${report.numPendingTests || 0}`
  );

  let md = '### Integration Test Failures\n\n';
  let hasFailures = false;

  for (const tr of report.testResults || []) {
    for (const a of tr.assertionResults || []) {
      if (a.status === 'failed') {
        hasFailures = true;
        console.log(`--- FAILED TEST: ${a.title} ---`);
        const msg = (a.failureMessages || []).join('\n');
        console.log(msg);

        md += `#### ${a.title}\n\`\`\`\n${msg}\n\`\`\`\n\n`;

        const sanitizedTitle = a.title.slice(0, 60).replace(/[:\r\n]/g, ' ');
        const sanitizedDetail = (a.failureMessages?.[0] || a.title)
          .replace(/[\r\n]+/g, ' ')
          .slice(0, 300);
        console.error(`::error title=${sanitizedTitle}::${sanitizedDetail}`);
      }
    }
  }

  if (hasFailures && process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
  }
} catch (err) {
  console.error('[dump_vitest_failures] Error processing report:', err.message);
}
