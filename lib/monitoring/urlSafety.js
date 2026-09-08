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
  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true; // malformed -- fail closed
  const addrInt = ipv4ToInt(parts) >>> 0;
  return BLOCKED_IPV4_RANGES.some(({ base, bits }) => {
    const baseInt = ipv4ToInt(base) >>> 0;
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    return (addrInt & mask) === (baseInt & mask);
  });
}

export function isBlockedIPv6(address) {
  const a = address.toLowerCase();
  if (a === '::1' || a === '::') return true;

  // IPv4-mapped (::ffff:a.b.c.d) and IPv4-compatible (::a.b.c.d) forms embed
  // a real IPv4 address that fetch()/undici will connect to at the TCP
  // layer -- e.g. http://[::ffff:169.254.169.254]/ reaches cloud metadata
  // even though the literal string doesn't match any IPv6 private prefix.
  // Must unwrap and re-check against the IPv4 range list, not just the
  // outer IPv6 form.
  const dotted = a.match(/^::(?:ffff:)?(\d+\.\d+\.\d+\.\d+)$/);
  if (dotted) return isBlockedIPv4(dotted[1]);

  // Same mapping, but with the embedded IPv4 address written in hex groups
  // (e.g. ::ffff:a9fe:a9fe instead of ::ffff:169.254.169.254).
  const hexMapped = a.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hexMapped) {
    const hi = parseInt(hexMapped[1], 16);
    const lo = parseInt(hexMapped[2], 16);
    return isBlockedIPv4(`${hi >> 8}.${hi & 0xff}.${lo >> 8}.${lo & 0xff}`);
  }

  // fe80::/10 covers fe80:: through febf:: -- matching only the literal
  // "fe80:" prefix missed fe90::, fea0::, fec0:: etc.
  const firstGroup = parseInt(a.split(':')[0] || '', 16);
  if (!Number.isNaN(firstGroup) && firstGroup >= 0xfe80 && firstGroup <= 0xfebf) return true;

  return a.startsWith('fc') || a.startsWith('fd');
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

const MAX_REDIRECTS = 5;

// fetch() with `redirect: 'follow'` only validates the FIRST URL -- a
// legitimate public URL can 302 to an internal address (SSRF-via-redirect,
// a well-known bypass of naive "check the URL once" guards). This follows
// redirects manually so isSafeMonitoringUrl() re-validates every hop,
// including the resolved IP of each intermediate hostname.
export async function safeFetch(urlString, options = {}) {
  let currentUrl = urlString;

  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const check = await isSafeMonitoringUrl(currentUrl);
    if (!check.safe) {
      throw new SsrfBlockedError(currentUrl, check.reason);
    }

    const res = await fetch(currentUrl, { ...options, redirect: 'manual' });

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
