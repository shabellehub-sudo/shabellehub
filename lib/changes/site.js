// lib/changes/site.js
// Site base URL for the new public change log (canonical, RSS links, og:url).
//
// Resolved from NEXT_PUBLIC_SITE_URL at build/init time. There is no
// existing reusable base-URL mechanism in this codebase: every existing
// page hardcodes 'https://shabellehub.com' (lib/seo.js, pages/sitemap.xml.js,
// public/robots.txt), which currently returns NXDOMAIN. This module does
// NOT hardcode that or any other host; it requires the deployment to
// configure the real serving host explicitly.
//
// KNOWN LIMITATION (Session 3 item): the existing sitewide canonical/
// sitemap/robots mechanism above is untouched by this file and still
// points at shabellehub.com. Only /changes, RSS, and the new sitemap
// entry use this module.
function resolveSiteUrl(raw) {
  if (typeof raw !== 'string' || raw.trim() === '') {
    throw new Error('NEXT_PUBLIC_SITE_URL is missing or empty.');
  }
  const trimmed = raw.trim();
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(`NEXT_PUBLIC_SITE_URL is not a valid URL: ${trimmed}`);
  }
  if (parsed.protocol !== 'https:') {
    throw new Error(`NEXT_PUBLIC_SITE_URL must use https:// — got: ${trimmed}`);
  }
  if (parsed.search || parsed.hash || parsed.pathname !== '/') {
    throw new Error(`NEXT_PUBLIC_SITE_URL must be an origin only (no path/query/hash): ${trimmed}`);
  }
  // parsed.origin has no trailing slash (e.g. "https://shabellehub.vercel.app").
  return parsed.origin;
}

export const SITE_URL = resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
