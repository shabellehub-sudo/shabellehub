// lib/monitoring/robots.js
// Minimal robots.txt compliance check for our single-path, low-frequency
// use case. Not a full parser (no wildcard/$ support), but covers the
// common case: User-agent: * blocks with Disallow: /path lines.

export async function checkRobotsAllowed(targetUrl) {
  const url = new URL(targetUrl);
  const robotsUrl = `${url.protocol}//${url.host}/robots.txt`;

  let text = '';
  try {
    const res = await fetch(robotsUrl, {
      headers: { 'User-Agent': 'ShabelleHubMonitor/1.0 (+https://shabellehub.com/bot)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      return { allowed: true, crawlDelay: null };
    }
    text = await res.text();
  } catch {
    return { allowed: true, crawlDelay: null };
  }

  const lines = text.split('\n').map(l => l.trim());
  let inRelevantBlock = false;
  let disallowed = false;
  let crawlDelay = null;

  for (const line of lines) {
    const [rawKey, ...rest] = line.split(':');
    if (!rawKey) continue;
    const key = rawKey.trim().toLowerCase();
    const value = rest.join(':').trim();

    if (key === 'user-agent') {
      inRelevantBlock = value === '*';
    } else if (inRelevantBlock && key === 'disallow' && value) {
      if (url.pathname.startsWith(value)) disallowed = true;
    } else if (inRelevantBlock && key === 'crawl-delay' && value) {
      const n = parseFloat(value);
      if (!Number.isNaN(n)) crawlDelay = n * 1000;
    }
  }

  return { allowed: !disallowed, crawlDelay };
}
