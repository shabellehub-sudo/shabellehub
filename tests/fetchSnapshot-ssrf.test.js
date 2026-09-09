import assert from 'node:assert';
import { fetchSnapshot } from '../lib/monitoring/fetchSnapshot.js';
import { checkRobotsAllowed } from '../lib/monitoring/robots.js';

let n = 0;
async function check(label, fn) {
  n++;
  const num = n;
  try { await fn(); console.log(`  ok  ${num}. ${label}`); }
  catch (e) { console.log(`FAIL  ${num}. ${label} -> ${e.message}`); process.exitCode = 1; }
}

import http from 'node:http';
import https from 'node:https';

const realHttpRequest = http.request;
const realHttpsRequest = https.request;

function makeFakeIncomingMessage(entry) {
  const listeners = {};
  const res = {
    statusCode: entry.status,
    headers: {
      ...(entry.location ? { location: entry.location } : {}),
      ...(entry.contentType ? { 'content-type': entry.contentType } : {}),
    },
    on(event, cb) { listeners[event] = cb; return res; },
  };
  process.nextTick(() => {
    if (entry.body) listeners.data && listeners.data(Buffer.from(entry.body));
    listeners.end && listeners.end();
  });
  return res;
}

function mockTransport(responsesByUrl) {
  const makeFake = (scheme) => (options, callback) => {
    const key = `${scheme}//${options.headers.Host}${options.path}`;
    const entry = responsesByUrl[key];
    const listeners = {};
    const req = {
      on(event, cb) { listeners[event] = cb; return req; },
      end() {
        process.nextTick(() => {
          if (!entry) { listeners.error && listeners.error(new Error(`mockTransport: no canned response for ${key}`)); return; }
          callback(makeFakeIncomingMessage(entry));
        });
      },
    };
    return req;
  };
  http.request = makeFake('http:');
  https.request = makeFake('https:');
}
function restoreTransport() { http.request = realHttpRequest; https.request = realHttpsRequest; }

const HTML_BODY = `<html><body><h1>Pricing</h1><p>${'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(6)}</p></body></html>`;

await check('EXISTING BEHAVIOR PRESERVED: a safe public URL still returns outcome "fetched" with normalized text and hash', async () => {
  mockTransport({
    'https://93.184.216.34/robots.txt': { status: 200, body: 'User-agent: *\nAllow: /', contentType: 'text/plain' },
    'https://93.184.216.34/pricing': { status: 200, body: HTML_BODY, contentType: 'text/html' },
  });
  try {
    const result = await fetchSnapshot('demo-tool', 'https://93.184.216.34/pricing');
    assert.strictEqual(result.outcome, 'fetched');
    assert.ok(result.text_hash, 'must produce a text hash on success, same as before this change');
    assert.ok(result.normalized_text.includes('Pricing'));
    assert.strictEqual(result.fetch_error, null);
  } finally {
    restoreTransport();
  }
});

await check('DIRECT PRIVATE IP BLOCKED END-TO-END: fetchSnapshot on a private-IP source URL fails safely (fetch_failed), never crashes, never leaks a normalized_text', async () => {
  mockTransport({});
  try {
    const result = await fetchSnapshot('demo-tool', 'http://127.0.0.1/admin');
    assert.strictEqual(result.outcome, 'fetch_failed');
    assert.strictEqual(result.normalized_text, null);
    assert.ok(result.fetch_error.includes('Blocked unsafe fetch target'), `expected an SSRF-block message, got: ${result.fetch_error}`);
  } finally {
    restoreTransport();
  }
});

await check('REDIRECT-TO-PRIVATE-IP BLOCKED END-TO-END: a public source URL that redirects to cloud metadata fails safely via fetchSnapshot, not silently fetched', async () => {
  mockTransport({
    'https://93.184.216.34/robots.txt': { status: 200, body: 'User-agent: *\nAllow: /', contentType: 'text/plain' },
    'https://93.184.216.34/redirect-trap': { status: 302, location: 'http://169.254.169.254/latest/meta-data/' },
  });
  try {
    const result = await fetchSnapshot('demo-tool', 'https://93.184.216.34/redirect-trap');
    assert.strictEqual(result.outcome, 'fetch_failed');
    assert.ok(result.fetch_error.includes('169.254.169.254'), `error must reference the blocked redirect target, got: ${result.fetch_error}`);
  } finally {
    restoreTransport();
  }
});

await check('ROBOTS FAIL-OPEN PRESERVED: checkRobotsAllowed() on a private-IP host still fails open (allowed:true) instead of throwing', async () => {
  mockTransport({});
  try {
    const result = await checkRobotsAllowed('http://10.0.0.5/some-page');
    assert.strictEqual(result.allowed, true, 'robots check must fail open on any error, SSRF-block included, same as network-error behavior before this change');
    assert.strictEqual(result.crawlDelay, null);
  } finally {
    restoreTransport();
  }
});

await check('ROBOTS FAIL-OPEN PRESERVED (network-error case, unrelated to SSRF): a robots.txt fetch returning non-ok still fails open', async () => {
  mockTransport({
    'https://93.184.216.34/robots.txt': { status: 500, body: '' },
  });
  try {
    const result = await checkRobotsAllowed('https://93.184.216.34/page');
    assert.strictEqual(result.allowed, true);
  } finally {
    restoreTransport();
  }
});

await check('EXISTING BEHAVIOR PRESERVED: robots_disallowed outcome still works when Disallow matches the path', async () => {
  mockTransport({
    'https://93.184.216.34/robots.txt': { status: 200, body: 'User-agent: *\nDisallow: /blocked-path', contentType: 'text/plain' },
  });
  try {
    const result = await fetchSnapshot('demo-tool', 'https://93.184.216.34/blocked-path');
    assert.strictEqual(result.outcome, 'robots_disallowed');
  } finally {
    restoreTransport();
  }
});

console.log(`\n${n} checks run.`);
