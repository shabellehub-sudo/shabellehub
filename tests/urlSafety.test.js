import assert from 'node:assert';
import { isBlockedIPv4, isBlockedIPv6, isSafeMonitoringUrl, safeFetch, SsrfBlockedError } from '../lib/monitoring/urlSafety.js';

let n = 0;
function check(label, fn) {
  n++;
  try { fn(); console.log(`  ok  ${n}. ${label}`); }
  catch (e) { console.log(`FAIL  ${n}. ${label} -> ${e.message}`); process.exitCode = 1; }
}
async function checkAsync(label, fn) {
  n++;
  const num = n;
  try { await fn(); console.log(`  ok  ${num}. ${label}`); }
  catch (e) { console.log(`FAIL  ${num}. ${label} -> ${e.message}`); process.exitCode = 1; }
}

// ===== isBlockedIPv4 -- exhaustive range boundary tests =====

check('BLOCKS loopback 127.0.0.1', () => assert.strictEqual(isBlockedIPv4('127.0.0.1'), true));
check('BLOCKS loopback boundary 127.255.255.255', () => assert.strictEqual(isBlockedIPv4('127.255.255.255'), true));
check('ALLOWS 126.255.255.255 (just below loopback range)', () => assert.strictEqual(isBlockedIPv4('126.255.255.255'), false));
check('ALLOWS 128.0.0.0 (just above loopback range)', () => assert.strictEqual(isBlockedIPv4('128.0.0.0'), false));

check('BLOCKS private 10.0.0.0/8: 10.0.0.1', () => assert.strictEqual(isBlockedIPv4('10.0.0.1'), true));
check('BLOCKS private 10.0.0.0/8 boundary: 10.255.255.255', () => assert.strictEqual(isBlockedIPv4('10.255.255.255'), true));
check('ALLOWS 9.255.255.255 (just below 10.0.0.0/8)', () => assert.strictEqual(isBlockedIPv4('9.255.255.255'), false));
check('ALLOWS 11.0.0.0 (just above 10.0.0.0/8)', () => assert.strictEqual(isBlockedIPv4('11.0.0.0'), false));

check('BLOCKS private 172.16.0.0/12: 172.16.0.0 (range start)', () => assert.strictEqual(isBlockedIPv4('172.16.0.0'), true));
check('BLOCKS private 172.16.0.0/12: 172.31.255.255 (range end)', () => assert.strictEqual(isBlockedIPv4('172.31.255.255'), true));
check('ALLOWS 172.15.255.255 (just below 172.16.0.0/12)', () => assert.strictEqual(isBlockedIPv4('172.15.255.255'), false));
check('ALLOWS 172.32.0.0 (just above 172.16.0.0/12)', () => assert.strictEqual(isBlockedIPv4('172.32.0.0'), false));

check('BLOCKS private 192.168.0.0/16: 192.168.1.1', () => assert.strictEqual(isBlockedIPv4('192.168.1.1'), true));
check('BLOCKS private 192.168.0.0/16 boundary: 192.168.255.255', () => assert.strictEqual(isBlockedIPv4('192.168.255.255'), true));
check('ALLOWS 192.167.255.255 (just below 192.168.0.0/16)', () => assert.strictEqual(isBlockedIPv4('192.167.255.255'), false));
check('ALLOWS 192.169.0.0 (just above 192.168.0.0/16)', () => assert.strictEqual(isBlockedIPv4('192.169.0.0'), false));

check('BLOCKS link-local 169.254.0.0/16 (CLOUD METADATA RANGE): 169.254.169.254', () => assert.strictEqual(isBlockedIPv4('169.254.169.254'), true));
check('BLOCKS link-local boundary: 169.254.0.0', () => assert.strictEqual(isBlockedIPv4('169.254.0.0'), true));
check('ALLOWS 169.253.255.255 (just below 169.254.0.0/16)', () => assert.strictEqual(isBlockedIPv4('169.253.255.255'), false));
check('ALLOWS 169.255.0.0 (just above 169.254.0.0/16)', () => assert.strictEqual(isBlockedIPv4('169.255.0.0'), false));

check('BLOCKS carrier-grade NAT 100.64.0.0/10: 100.64.0.1', () => assert.strictEqual(isBlockedIPv4('100.64.0.1'), true));
check('BLOCKS CGNAT boundary: 100.127.255.255', () => assert.strictEqual(isBlockedIPv4('100.127.255.255'), true));
check('ALLOWS 100.63.255.255 (just below CGNAT range)', () => assert.strictEqual(isBlockedIPv4('100.63.255.255'), false));
check('ALLOWS 100.128.0.0 (just above CGNAT range)', () => assert.strictEqual(isBlockedIPv4('100.128.0.0'), false));

check('BLOCKS "this network" 0.0.0.0/8: 0.0.0.0', () => assert.strictEqual(isBlockedIPv4('0.0.0.0'), true));

check('ALLOWS real public IP: 8.8.8.8 (Google DNS)', () => assert.strictEqual(isBlockedIPv4('8.8.8.8'), false));
check('ALLOWS real public IP: 1.1.1.1 (Cloudflare)', () => assert.strictEqual(isBlockedIPv4('1.1.1.1'), false));
check('ALLOWS real public IP: 93.184.216.34 (public-range example)', () => assert.strictEqual(isBlockedIPv4('93.184.216.34'), false));

check('malformed IPv4 fails closed (blocked)', () => assert.strictEqual(isBlockedIPv4('999.999.999.999'), true));

// ===== isBlockedIPv6 =====

check('BLOCKS IPv6 loopback ::1', () => assert.strictEqual(isBlockedIPv6('::1'), true));
check('BLOCKS IPv6 link-local fe80::1', () => assert.strictEqual(isBlockedIPv6('fe80::1'), true));
check('BLOCKS IPv6 unique-local fc00::1', () => assert.strictEqual(isBlockedIPv6('fc00::1'), true));
check('BLOCKS IPv6 unique-local fd00::1', () => assert.strictEqual(isBlockedIPv6('fd00::1'), true));
check('ALLOWS real public IPv6: 2606:4700:4700::1111 (Cloudflare)', () => assert.strictEqual(isBlockedIPv6('2606:4700:4700::1111'), false));

// ===== isSafeMonitoringUrl -- IP-literal cases (no DNS needed, deterministic) =====

await checkAsync('DIRECT PRIVATE IP: http://127.0.0.1/ is blocked', async () => {
  const r = await isSafeMonitoringUrl('http://127.0.0.1/');
  assert.strictEqual(r.safe, false);
  assert.strictEqual(r.reason, 'blocked_ip_literal');
});

await checkAsync('DIRECT PRIVATE IP: http://169.254.169.254/latest/meta-data/ (cloud metadata) is blocked', async () => {
  const r = await isSafeMonitoringUrl('http://169.254.169.254/latest/meta-data/');
  assert.strictEqual(r.safe, false);
});

await checkAsync('DIRECT PRIVATE IP: http://10.0.0.5:5432/ (private IP + port) is blocked', async () => {
  const r = await isSafeMonitoringUrl('http://10.0.0.5:5432/');
  assert.strictEqual(r.safe, false);
});

await checkAsync('PUBLIC URL ALLOWED: http://93.184.216.34/ is allowed', async () => {
  const r = await isSafeMonitoringUrl('http://93.184.216.34/');
  assert.strictEqual(r.safe, true);
});

await checkAsync('BLOCKS file:// scheme', async () => {
  const r = await isSafeMonitoringUrl('file:///etc/passwd');
  assert.strictEqual(r.safe, false);
  assert.ok(r.reason.startsWith('blocked_protocol'));
});

await checkAsync('BLOCKS ftp:// scheme', async () => {
  const r = await isSafeMonitoringUrl('ftp://example.com/');
  assert.strictEqual(r.safe, false);
});

await checkAsync('BLOCKS malformed URL', async () => {
  const r = await isSafeMonitoringUrl('not a url at all');
  assert.strictEqual(r.safe, false);
  assert.strictEqual(r.reason, 'invalid_url');
});

// ===== safeFetch -- redirect-bypass tests (mocked fetch, deterministic IP literals only) =====

const realFetch = globalThis.fetch;
function mockFetch(responsesByUrl) {
  globalThis.fetch = async (url) => {
    const entry = responsesByUrl[url];
    if (!entry) throw new Error(`mockFetch: no canned response for ${url}`);
    return {
      status: entry.status,
      ok: entry.status >= 200 && entry.status < 300,
      headers: { get: (name) => (name.toLowerCase() === 'location' ? entry.location : null) },
      text: async () => entry.body || '',
    };
  };
}
function restoreFetch() { globalThis.fetch = realFetch; }

await checkAsync('REDIRECT TO PRIVATE IP IS BLOCKED: public URL 302-redirecting to cloud metadata is blocked, not followed', async () => {
  mockFetch({
    'https://93.184.216.34/redirector': { status: 302, location: 'http://169.254.169.254/latest/meta-data/' },
  });
  try {
    await safeFetch('https://93.184.216.34/redirector');
    assert.fail('safeFetch must throw for a redirect to a blocked IP, but it did not');
  } catch (err) {
    assert.ok(err instanceof SsrfBlockedError, `expected SsrfBlockedError, got ${err.constructor.name}`);
    assert.ok(err.url.includes('169.254.169.254'), `error must identify the actual blocked hop, got: ${err.url}`);
  } finally {
    restoreFetch();
  }
});

await checkAsync('PUBLIC URL ALLOWED: legitimate public->public redirect chain is followed successfully', async () => {
  mockFetch({
    'https://1.1.1.1/page': { status: 301, location: 'https://93.184.216.34/page' },
    'https://93.184.216.34/page': { status: 200, body: 'final content' },
  });
  try {
    const res = await safeFetch('https://1.1.1.1/page');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(await res.text(), 'final content');
  } finally {
    restoreFetch();
  }
});

await checkAsync('Redirect loop eventually throws instead of looping forever', async () => {
  mockFetch({
    'https://93.184.216.34/a': { status: 302, location: 'https://1.1.1.1/b' },
    'https://1.1.1.1/b': { status: 302, location: 'https://93.184.216.34/a' },
  });
  try {
    await safeFetch('https://93.184.216.34/a');
    assert.fail('must throw on a redirect loop, not hang forever');
  } catch (err) {
    assert.ok(err instanceof SsrfBlockedError);
    assert.strictEqual(err.reason, 'too_many_redirects');
  } finally {
    restoreFetch();
  }
});

await checkAsync('A non-redirect response (200) is returned directly, no redirect logic triggered', async () => {
  mockFetch({ 'https://93.184.216.34/direct': { status: 200, body: 'ok' } });
  try {
    const res = await safeFetch('https://93.184.216.34/direct');
    assert.strictEqual(res.status, 200);
  } finally {
    restoreFetch();
  }
});

await checkAsync('DIRECT PRIVATE IP VIA safeFetch: blocked before any fetch is attempted', async () => {
  mockFetch({});
  try {
    await safeFetch('http://127.0.0.1/admin');
    assert.fail('must block before attempting any fetch');
  } catch (err) {
    assert.ok(err instanceof SsrfBlockedError);
  } finally {
    restoreFetch();
  }
});

console.log(`\n${n} checks run.`);
