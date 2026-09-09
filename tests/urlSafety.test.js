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

// ===== IPv4-mapped / IPv4-compatible IPv6 (audit finding C1) =====

check('BLOCKS IPv4-mapped loopback ::ffff:127.0.0.1', () => assert.strictEqual(isBlockedIPv6('::ffff:127.0.0.1'), true));
check('BLOCKS IPv4-mapped metadata ::ffff:169.254.169.254', () => assert.strictEqual(isBlockedIPv6('::ffff:169.254.169.254'), true));
check('BLOCKS IPv4-mapped private ::ffff:10.0.0.1', () => assert.strictEqual(isBlockedIPv6('::ffff:10.0.0.1'), true));
check('BLOCKS IPv4-mapped private ::ffff:192.168.1.1', () => assert.strictEqual(isBlockedIPv6('::ffff:192.168.1.1'), true));
check('BLOCKS IPv4-compatible loopback ::127.0.0.1', () => assert.strictEqual(isBlockedIPv6('::127.0.0.1'), true));
check('BLOCKS IPv4-mapped hex-group form ::ffff:a9fe:a9fe (= 169.254.169.254)', () => assert.strictEqual(isBlockedIPv6('::ffff:a9fe:a9fe'), true));
check('ALLOWS IPv4-mapped public address ::ffff:8.8.8.8', () => assert.strictEqual(isBlockedIPv6('::ffff:8.8.8.8'), false));

check('BLOCKS compressed hex IPv4-mapped loopback ::ffff:7f00:1', () =>
  assert.strictEqual(isBlockedIPv6('::ffff:7f00:1'), true)
);

check('BLOCKS fully-expanded IPv4-mapped loopback 0:0:0:0:0:ffff:7f00:1', () =>
  assert.strictEqual(isBlockedIPv6('0:0:0:0:0:ffff:7f00:1'), true)
);

check('BLOCKS fully-expanded IPv4-mapped metadata 0000:0000:0000:0000:0000:ffff:a9fe:a9fe', () =>
  assert.strictEqual(
    isBlockedIPv6('0000:0000:0000:0000:0000:ffff:a9fe:a9fe'),
    true
  )
);

check('BLOCKS compressed hex IPv4-compatible loopback ::7f00:1', () =>
  assert.strictEqual(isBlockedIPv6('::7f00:1'), true)
);

check('BLOCKS fully-expanded IPv4-compatible loopback 0:0:0:0:0:0:7f00:1', () =>
  assert.strictEqual(isBlockedIPv6('0:0:0:0:0:0:7f00:1'), true)
);

check('BLOCKS fully-expanded IPv4-compatible metadata 0000:0000:0000:0000:0000:0000:a9fe:a9fe', () =>
  assert.strictEqual(
    isBlockedIPv6('0000:0000:0000:0000:0000:0000:a9fe:a9fe'),
    true
  )
);

check('ALLOWS compressed hex IPv4-mapped public ::ffff:808:808', () =>
  assert.strictEqual(isBlockedIPv6('::ffff:808:808'), false)
);

check('ALLOWS fully-expanded IPv4-mapped public 0:0:0:0:0:ffff:808:808', () =>
  assert.strictEqual(
    isBlockedIPv6('0:0:0:0:0:ffff:808:808'),
    false
  )
);
check('BLOCKS fe90:: (fe80::/10 range, not just literal "fe80:" prefix)', () => assert.strictEqual(isBlockedIPv6('fe90::1'), true));
check('BLOCKS febf:: (fe80::/10 range upper bound)', () => assert.strictEqual(isBlockedIPv6('febf::1'), true));
check('ALLOWS fec0:: (just above fe80::/10 range)', () => assert.strictEqual(isBlockedIPv6('fec0::1'), false));

await checkAsync('BLOCKS IPv4-mapped IPv6 metadata via full URL: http://[::ffff:169.254.169.254]/', async () => {
  const r = await isSafeMonitoringUrl('http://[::ffff:169.254.169.254]/');
  assert.strictEqual(r.safe, false);
});

await checkAsync('ALLOWS IPv4-mapped IPv6 of a public address via full URL: http://[::ffff:8.8.8.8]/', async () => {
  const r = await isSafeMonitoringUrl('http://[::ffff:8.8.8.8]/');
  assert.strictEqual(r.safe, true);
});

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

// ===== safeFetch -- redirect-bypass tests =====
//
// safeFetch intentionally uses pinnedRequest() rather than globalThis.fetch.
// Tests therefore inject a deterministic request implementation through the
// internal test hook below. Production behavior remains connection-pinned.

const realPinnedRequest = globalThis.__SHABELLEHUB_TEST_PINNED_REQUEST__;

function installMockPinnedRequest(responsesByUrl) {
  globalThis.__SHABELLEHUB_TEST_PINNED_REQUEST__ = async (url, ip, options = {}) => {
    const entry = responsesByUrl[url];
    if (!entry) {
      throw new Error(`mockPinnedRequest: no canned response for ${url}`);
    }

    return {
      status: entry.status,
      ok: entry.status >= 200 && entry.status < 300,
      headers: {
        get: (name) => {
          const key = name.toLowerCase();
          if (key === 'location') return entry.location ?? null;
          if (key === 'content-type') return entry.contentType ?? 'text/html';
          return null;
        },
      },
      text: async () => entry.body || '',
    };
  };
}

function restoreMockPinnedRequest() {
  if (realPinnedRequest === undefined) {
    delete globalThis.__SHABELLEHUB_TEST_PINNED_REQUEST__;
  } else {
    globalThis.__SHABELLEHUB_TEST_PINNED_REQUEST__ = realPinnedRequest;
  }
}

await checkAsync('REDIRECT TO PRIVATE IP IS BLOCKED: public URL 302-redirecting to cloud metadata is blocked, not followed', async () => {
  installMockPinnedRequest({
    'https://93.184.216.34/redirector': {
      status: 302,
      location: 'http://169.254.169.254/latest/meta-data/',
    },
  });

  try {
    await safeFetch('https://93.184.216.34/redirector');
    assert.fail('safeFetch must throw for a redirect to a blocked IP, but it did not');
  } catch (err) {
    assert.ok(err instanceof SsrfBlockedError, `expected SsrfBlockedError, got ${err.constructor.name}`);
    assert.ok(
      err.url.includes('169.254.169.254'),
      `error must identify the actual blocked hop, got: ${err.url}`
    );
  } finally {
    restoreMockPinnedRequest();
  }
});

await checkAsync('REDIRECT TO IPv4-MAPPED IPv6 PRIVATE ADDRESS IS BLOCKED', async () => {
  installMockPinnedRequest({
    'https://93.184.216.34/redirector2': {
      status: 302,
      location: 'http://[::ffff:169.254.169.254]/latest/meta-data/',
    },
  });

  try {
    await safeFetch('https://93.184.216.34/redirector2');
    assert.fail('safeFetch must throw for a redirect to a mapped-IPv6 blocked address');
  } catch (err) {
    assert.ok(err instanceof SsrfBlockedError);
    assert.ok(
      err.url.includes('a9fe:a9fe') || err.url.includes('169.254.169.254'),
      `error must identify the blocked metadata address, got: ${err.url}`
    );
  } finally {
    restoreMockPinnedRequest();
  }
});

await checkAsync('PUBLIC URL ALLOWED: legitimate public->public redirect chain is followed successfully', async () => {
  installMockPinnedRequest({
    'https://1.1.1.1/page': {
      status: 301,
      location: 'https://93.184.216.34/page',
    },
    'https://93.184.216.34/page': {
      status: 200,
      body: 'final content',
    },
  });

  try {
    const res = await safeFetch('https://1.1.1.1/page');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(await res.text(), 'final content');
  } finally {
    restoreMockPinnedRequest();
  }
});

await checkAsync('Redirect loop eventually throws instead of looping forever', async () => {
  installMockPinnedRequest({
    'https://93.184.216.34/a': {
      status: 302,
      location: 'https://1.1.1.1/b',
    },
    'https://1.1.1.1/b': {
      status: 302,
      location: 'https://93.184.216.34/a',
    },
  });

  try {
    await safeFetch('https://93.184.216.34/a');
    assert.fail('must throw on a redirect loop, not hang forever');
  } catch (err) {
    assert.ok(err instanceof SsrfBlockedError);
    assert.strictEqual(err.reason, 'too_many_redirects');
  } finally {
    restoreMockPinnedRequest();
  }
});

await checkAsync('A non-redirect response (200) is returned directly, no redirect logic triggered', async () => {
  installMockPinnedRequest({
    'https://93.184.216.34/direct': {
      status: 200,
      body: 'ok',
    },
  });

  try {
    const res = await safeFetch('https://93.184.216.34/direct');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(await res.text(), 'ok');
  } finally {
    restoreMockPinnedRequest();
  }
});

await checkAsync('DIRECT PRIVATE IP VIA safeFetch: blocked before any fetch is attempted', async () => {
  installMockPinnedRequest({});

  try {
    await safeFetch('http://127.0.0.1/admin');
    assert.fail('must block before attempting any fetch');
  } catch (err) {
    assert.ok(err instanceof SsrfBlockedError);
  } finally {
    restoreMockPinnedRequest();
  }
});

console.log(`\n${n} checks run.`);
