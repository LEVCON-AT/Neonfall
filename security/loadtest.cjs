// eslint-disable no-require-imports
/**
 * NEONFALL — Load/Stress Test Script
 * 
 * Tests:
 * 1. GET /api/leaderboard (read load)
 * 2. POST /api/scores (write load)
 * 3. GET / (page load)
 * 
 * Levels: 10, 50, 100, 200, 500 concurrent requests
 */
const http = require('http');

const BASE = 'http://127.0.0.1:3000';
const LEVELS = [10, 50, 100, 200, 500];

function makeRequest(method, path, body) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: '127.0.0.1',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data ? Buffer.byteLength(data) : 0,
      },
      timeout: 10000,
    };
    const start = Date.now();
    const req = http.request(opts, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          time: Date.now() - start,
          ok: res.statusCode >= 200 && res.statusCode < 300,
        });
      });
    });
    req.on('error', () => resolve({ status: 0, time: Date.now() - start, ok: false }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, time: Date.now() - start, ok: false, timeout: true }); });
    if (data) req.write(data);
    req.end();
  });
}

async function loadTest(level, testFn, testName) {
  const promises = [];
  for (let i = 0; i < level; i++) {
    promises.push(testFn(i));
  }
  const results = await Promise.all(promises);
  const ok = results.filter(r => r.ok).length;
  const fail = results.length - ok;
  const times = results.map(r => r.time).sort((a, b) => a - b);
  const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  const p50 = times[Math.floor(times.length * 0.5)];
  const p95 = times[Math.floor(times.length * 0.95)];
  const p99 = times[Math.floor(times.length * 0.99)];
  const max = times[times.length - 1];
  const timeouts = results.filter(r => r.timeout).length;
  
  console.log(`  ${testName} (${level} concurrent):`);
  console.log(`    OK: ${ok}  Fail: ${fail}  Timeouts: ${timeouts}`);
  console.log(`    Avg: ${avg}ms  P50: ${p50}ms  P95: ${p95}ms  P99: ${p99}ms  Max: ${max}ms`);
  return { level, ok, fail, avg, p50, p95, p99, max, timeouts };
}

async function run() {
  console.log('═══════════════════════════════════════');
  console.log('  NEONFALL — Load/Stress Test');
  console.log('═══════════════════════════════════════\n');

  const results = { leaderboard: [], scores: [], page: [] };

  for (const level of LEVELS) {
    console.log(`\n--- Level: ${level} concurrent ---`);
    
    // Test 1: GET /api/leaderboard (read)
    results.leaderboard.push(await loadTest(level, () =>
      makeRequest('GET', '/api/leaderboard?mode=marathon&limit=20')
    , 'GET /api/leaderboard'));

    // Test 2: POST /api/scores (write)
    results.scores.push(await loadTest(level, (i) =>
      makeRequest('POST', '/api/scores', {
        name: `LoadTest${i}`,
        score: Math.floor(Math.random() * 50000),
        lines: Math.floor(Math.random() * 50),
        level: Math.floor(Math.random() * 10) + 1,
        mode: 'marathon',
        duration: Math.floor(Math.random() * 600) + 60,
      })
    , 'POST /api/scores'));

    // Test 3: GET / (page load)
    results.page.push(await loadTest(level, () =>
      makeRequest('GET', '/')
    , 'GET / (page)'));
  }

  // Summary
  console.log('\n═══════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('═══════════════════════════════════════\n');
  
  console.log('Endpoint                | Level | OK  | Fail | Avg  | P95  | P99  | Max');
  console.log('------------------------|-------|-----|------|------|------|------|------');
  for (const r of results.leaderboard) {
    console.log(`GET /api/leaderboard     | ${String(r.level).padStart(5)} | ${String(r.ok).padStart(3)} | ${String(r.fail).padStart(4)} | ${String(r.avg).padStart(4)} | ${String(r.p95).padStart(4)} | ${String(r.p99).padStart(4)} | ${String(r.max).padStart(4)}`);
  }
  for (const r of results.scores) {
    console.log(`POST /api/scores         | ${String(r.level).padStart(5)} | ${String(r.ok).padStart(3)} | ${String(r.fail).padStart(4)} | ${String(r.avg).padStart(4)} | ${String(r.p95).padStart(4)} | ${String(r.p99).padStart(4)} | ${String(r.max).padStart(4)}`);
  }
  for (const r of results.page) {
    console.log(`GET / (page)             | ${String(r.level).padStart(5)} | ${String(r.ok).padStart(3)} | ${String(r.fail).padStart(4)} | ${String(r.avg).padStart(4)} | ${String(r.p95).padStart(4)} | ${String(r.p99).padStart(4)} | ${String(r.max).padStart(4)}`);
  }
  
  // Findings
  console.log('\n--- Findings ---');
  const firstFail = [...results.leaderboard, ...results.scores, ...results.page].find(r => r.fail > 0 || r.timeouts > 0);
  if (firstFail) {
    console.log(`⚠ First failures at ${firstFail.level} concurrent requests`);
  } else {
    console.log('✅ All requests succeeded at all levels (no failures)');
  }
  
  const slowP95 = [...results.leaderboard, ...results.scores, ...results.page].find(r => r.p95 > 2000);
  if (slowP95) {
    console.log(`⚠ P95 > 2s at ${slowP95.level} concurrent requests (${slowP95.p95}ms)`);
  } else {
    console.log('✅ P95 < 2s at all levels');
  }
  
  process.exit(0);
}

run().catch(console.error);
