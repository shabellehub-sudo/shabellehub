// lib/monitoring/urlSafety.js
// SSRF guard for server-side fetches of admin-supplied URLs (tool.website).
//
// Blocks by IP RANGE, not by hostname string matching -- "localhost",
// "127.0.0.1", a bare IPv4 literal, AND a hostname that just happens to
// resolve to a private IP (DNS rebinding) all need to be caught the same
// way: resolve the hostname, then check whether the resolved address
// falls in a private/loopback/link-local/reserved range.

import net from 'node:net';
import dns from 'node:dns/promises';
import http from 'node:http';
import https from 'node:https';

// IPv4 ranges that must never be fetched from server-side monitoring:
// loopback, private (RFC1918), link-local (incl. cloud metadata
// 169.254.169.254), and a few reserved/special-use blocks.
const BLOCKED_IPV4_RANGES = [
  { base: [127, 0, 0, 0], bits: 8 },     // loopback
  { base: [10, 0, 0, 0], bits: 8 },      // private
  { base: [172, 16, 0, 0], bits: 12 },   // private
  { base: [192, 168, 0, 0], bits: 16 },  // private
  { base: [169, 254, 0, 0], bits: 16 },  // link-local (cloud metadata lives here)
  { base: [0, 0, 0, 0], bits: 8 },       // "this network"
  { base: [100, 64, 0, 0], bits: 10 },   // carrier-grade NAT
];

function ipv4ToInt(parts) {
  return (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

export function isBlockedIPv4(address) {
  if (
    typeof address !== 'string' ||
    !/^(?:0|[1-9]\d{0,2})(?:\.(?:0|[1-9]\d{0,2})){3}$/.test(address)
  ) {
    return true;
  }

  const parts = address.split('.').map(Number);
  if (parts.some((n) => n < 0 || n > 255)) return true;

  const addrInt = ipv4ToInt(parts) >>> 0;

  const inRange = (base, bits) => {
    const baseInt = ipv4ToInt(base) >>> 0;
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    return (addrInt & mask) === (baseInt & mask);
  };

  if (BLOCKED_IPV4_RANGES.some(({ base, bits }) => inRange(base, bits))) {
    return true;
  }

  const SPECIAL_USE = [
    { base: [192, 0, 0, 0], bits: 24 },
    { base: [192, 0, 2, 0], bits: 24 },
    { base: [198, 18, 0, 0], bits: 15 },
    { base: [198, 51, 100, 0], bits: 24 },
    { base: [203, 0, 113, 0], bits: 24 },
    { base: [224, 0, 0, 0], bits: 4 },
    { base: [240, 0, 0, 0], bits: 4 },
  ];

  return SPECIAL_USE.some(({ base, bits }) => inRange(base, bits));
}

// Expands any valid textual IPv6 representation -- compressed ("::"),
// fully written out, or with an embedded IPv4 dotted-quad tail -- into an
// array of 8 unsigned 16-bit integers. Returns null if the address can't
// be parsed as well-formed IPv6.
//
// This exists so IPv4-mapped/compatible detection works by GROUP POSITION
// (first 5 or 6 groups zero, etc.) rather than by matching specific string
// patterns -- a fully-expanded address like
// "0000:0000:0000:0000:0000:ffff:7f00:0001" carries the same 8 groups as
// "::ffff:127.0.0.1" once expanded, so one check covers every textual
// spelling instead of enumerating regexes per representation.
function expandIPv6(address) {
  if (typeof address !== 'string') return null;

  let addr = address.toLowerCase();

  // Reject IPv6 zone identifiers such as fe80::1%eth0.
  if (addr.includes('%')) return null;

  // Convert embedded IPv4 dotted-quad into two hexadecimal groups.
  if (addr.includes('.')) {
    const lastColon = addr.lastIndexOf(':');
    if (lastColon === -1) return null;

    const v4Text = addr.slice(lastColon + 1);

    if (
      !/^(?:0|[1-9]\d{0,2})(?:\.(?:0|[1-9]\d{0,2})){3}$/.test(v4Text)
    ) {
      return null;
    }

    const v4 = v4Text.split('.').map(Number);
    if (v4.some((n) => n < 0 || n > 255)) return null;

    const hi = ((v4[0] << 8) | v4[1]).toString(16);
    const lo = ((v4[2] << 8) | v4[3]).toString(16);

    addr = `${addr.slice(0, lastColon + 1)}${hi}:${lo}`;
  }

  const doubleColonCount = (addr.match(/::/g) || []).length;
  if (doubleColonCount > 1) return null;

  let groups;

  if (doubleColonCount === 1) {
    const [left, right] = addr.split('::');
    const head = left ? left.split(':') : [];
    const tail = right ? right.split(':') : [];

    const missing = 8 - (head.length + tail.length);

    // "::" must replace at least one group.
    if (missing < 1) return null;

    groups = [
      ...head,
      ...Array(missing).fill('0'),
      ...tail,
    ];
  } else {
    groups = addr.split(':');

    if (groups.length !== 8) return null;
  }

  if (groups.length !== 8) return null;

  const nums = groups.map((group) => {
    if (!/^[0-9a-f]{1,4}$/.test(group)) return NaN;
    return Number.parseInt(group, 16);
  });

  if (nums.some((n) => Number.isNaN(n) || n < 0 || n > 0xffff)) {
    return null;
  }

  return nums;
}

export function isBlockedIPv6(address) {
  const groups = expandIPv6(address);

  // Malformed IPv6 fails closed.
  if (!groups) return true;

  // IPv4-mapped ::ffff:0:0/96 and IPv4-compatible ::/96.
  const isMapped =
    groups.slice(0, 5).every((g) => g === 0) &&
    groups[5] === 0xffff;

  const isCompatible =
    !isMapped &&
    groups.slice(0, 6).every((g) => g === 0);

  if (isMapped || isCompatible) {
    const hi = groups[6];
    const lo = groups[7];

    const ipv4 =
      `${hi >> 8}.${hi & 0xff}.${lo >> 8}.${lo & 0xff}`;

    return isBlockedIPv4(ipv4);
  }

  // Unspecified and loopback.
  if (groups.every((g) => g === 0)) return true;

  if (
    groups.slice(0, 7).every((g) => g === 0) &&
    groups[7] === 1
  ) {
    return true;
  }

  // fe80::/10 link-local.
  if (groups[0] >= 0xfe80 && groups[0] <= 0xfebf) {
    return true;
  }

  // fc00::/7 unique-local.
  if (groups[0] >= 0xfc00 && groups[0] <= 0xfdff) {
    return true;
  }

  // ff00::/8 multicast.
  if ((groups[0] & 0xff00) === 0xff00) {
    return true;
  }

  // 6to4: 2002:V4ADDR::/48.
  if (groups[0] === 0x2002) {
    const embedded =
      `${groups[1] >> 8}.${groups[1] & 0xff}.${groups[2] >> 8}.${groups[2] & 0xff}`;

    if (isBlockedIPv4(embedded)) return true;
  }

  // NAT64 well-known prefix 64:ff9b::/96.
  if (
    groups[0] === 0x0064 &&
    groups[1] === 0xff9b
  ) {
    const hi = groups[6];
    const lo = groups[7];

    const embedded =
      `${hi >> 8}.${hi & 0xff}.${lo >> 8}.${lo & 0xff}`;

    if (isBlockedIPv4(embedded)) return true;
  }

  return false;
}

export function isBlockedIp(address, family) {
  if (family === 6 || address.includes(':')) return isBlockedIPv6(address);
  return isBlockedIPv4(address);
}

// Validates that `urlString` is http(s), has a hostname, and (once
// resolved) does not point at a private/loopback/link-local address.
// Returns { safe: boolean, reason?: string, resolvedIp?: string }.
export async function isSafeMonitoringUrl(urlString) {
  let parsed;
  try {
    parsed = new URL(urlString);
  } catch {
    return { safe: false, reason: 'invalid_url' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { safe: false, reason: `blocked_protocol:${parsed.protocol}` };
  }

  // Node's URL parser keeps the brackets in .hostname for an IPv6 literal
  // (e.g. "[::ffff:8.8.8.8]"), which net.isIP() does not recognize -- strip
  // them before checking, or every bracketed IPv6 literal silently falls
  // through to the DNS-lookup branch below and fails for the wrong reason.
  const hostname = parsed.hostname;
  const bareHost = hostname.startsWith('[') && hostname.endsWith(']')
    ? hostname.slice(1, -1)
    : hostname;

  // A bare IP literal in the URL -- check directly, no DNS needed.
  const literalFamily = net.isIP(bareHost);
  if (literalFamily) {
    if (isBlockedIp(bareHost, literalFamily)) {
      return { safe: false, reason: 'blocked_ip_literal', resolvedIp: bareHost };
    }
    return { safe: true, resolvedIp: bareHost };
  }

  // A hostname -- resolve it and check the ACTUAL address, so a hostname
  // that resolves to a private IP (DNS rebinding, or a name like
  // "internal.corp" pointed at 10.x.x.x) is caught, not just literal
  // "localhost" string matching.
  let addresses;
  try {
    addresses = await dns.lookup(hostname, { all: true });
  } catch {
    return { safe: false, reason: 'dns_resolution_failed' };
  }

  if (!addresses || addresses.length === 0) {
    return { safe: false, reason: 'no_dns_results' };
  }

  for (const { address, family } of addresses) {
    if (isBlockedIp(address, family)) {
      return { safe: false, reason: 'resolved_to_blocked_ip', resolvedIp: address };
    }
  }

  return { safe: true, resolvedIp: addresses[0].address };
}

export class SsrfBlockedError extends Error {
  constructor(url, reason) {
    super(`Blocked unsafe fetch target (${reason}): ${url}`);
    this.name = 'SsrfBlockedError';
    this.reason = reason;
    this.url = url;
  }
}

// Issues the actual network request directly against `ip` -- not the
// hostname in `urlString` -- so the TCP/TLS connection always goes to the
// exact address isSafeMonitoringUrl() just validated. This is what closes
// the DNS-rebinding gap: fetch(url) would re-resolve the hostname itself,
// so a changed DNS answer between validation and connection could still
// reach an unvalidated address (checking DNS twice doesn't fix this --
// only pinning the connection to an address you already resolved does).
// The Host header and TLS SNI (`servername`) still carry the original
// hostname so virtual hosting and certificate validation work normally --
// the certificate must match the domain name, not the IP we connected to.
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;

function pinnedRequest(urlString, ip, options = {}) {
  // Test-only injection point.
  if (globalThis.__SHABELLEHUB_TEST_PINNED_REQUEST__) {
    return globalThis.__SHABELLEHUB_TEST_PINNED_REQUEST__(
      urlString,
      ip,
      options
    );
  }

  return new Promise((resolve, reject) => {
    const parsed = new URL(urlString);
    const isHttps = parsed.protocol === 'https:';
    const transport = isHttps ? https : http;

    const originalHost =
      parsed.hostname.startsWith('[') && parsed.hostname.endsWith(']')
        ? parsed.hostname.slice(1, -1)
        : parsed.hostname;

    const reqOptions = {
      hostname: ip,
      family: net.isIP(ip) || undefined,
      port: parsed.port || (isHttps ? 443 : 80),
      path: `${parsed.pathname}${parsed.search}`,
      method: options.method || 'GET',
      headers: {
        ...(options.headers || {}),
        Host: parsed.host,
      },
      signal: options.signal,
    };

    // Connect to the validated IP while preserving TLS SNI for the
    // original hostname so normal certificate validation still works.
    if (isHttps && net.isIP(originalHost) === 0) {
      reqOptions.servername = originalHost;
    }

    const req = transport.request(reqOptions, (res) => {
      let totalBytes = 0;
      const chunks = [];
      let settled = false;

      const fail = (error) => {
        if (settled) return;
        settled = true;
        reject(error);
      };

      const contentLength = Number(res.headers['content-length']);

      if (
        Number.isFinite(contentLength) &&
        contentLength > MAX_RESPONSE_BYTES
      ) {
        res.destroy();
        fail(new Error('response_body_too_large'));
        return;
      }

      res.on('data', (chunk) => {
        totalBytes += chunk.length;

        if (totalBytes > MAX_RESPONSE_BYTES) {
          res.destroy();
          fail(new Error('response_body_too_large'));
          return;
        }

        chunks.push(chunk);
      });

      res.on('end', () => {
        if (settled) return;
        settled = true;

        const body = Buffer.concat(chunks);

        resolve({
          status: res.statusCode,
          ok: res.statusCode >= 200 && res.statusCode < 300,
          headers: {
            get: (name) => {
              const value = res.headers[name.toLowerCase()];
              return Array.isArray(value)
                ? value.join(', ')
                : (value ?? null);
            },
          },
          text: async () => body.toString('utf8'),
        });
      });

      res.on('error', fail);
    });

    req.on('error', reject);
    req.end();
  });
}

const MAX_REDIRECTS = 5;

// fetch() with `redirect: 'follow'` only validates the FIRST URL -- a
// legitimate public URL can 302 to an internal address (SSRF-via-redirect,
// a well-known bypass of naive "check the URL once" guards). This follows
// redirects manually so isSafeMonitoringUrl() re-validates every hop,
// including the resolved IP of each intermediate hostname -- and each hop
// connects via pinnedRequest() to the exact address that was validated.
export async function safeFetch(urlString, options = {}) {
  let currentUrl = urlString;

  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const check = await isSafeMonitoringUrl(currentUrl);
    if (!check.safe) {
      throw new SsrfBlockedError(currentUrl, check.reason);
    }

    const res = await pinnedRequest(currentUrl, check.resolvedIp, options);

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) {
        throw new SsrfBlockedError(currentUrl, 'redirect_without_location');
      }
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }

    return res;
  }

  throw new SsrfBlockedError(currentUrl, 'too_many_redirects');
}
