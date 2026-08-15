// lib/monitoring/fetchSnapshot.js
// Fetches a tool's monitoring URL, strips it down to normalized visible
// text, and hashes it. Never throws — always returns a result object so
// the caller can log the outcome either way. Critically: a failed or
// incomplete fetch is NEVER interpreted as "no change".
import crypto from 'crypto';
import { checkRobotsAllowed } from './robots';

const USER_AGENT = 'ShabelleHubMonitor/1.0 (+https://shabellehub.com/bot)';
const MIN_TEXT_LENGTH = 200;

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function fetchSnapshot(toolSlug, sourceUrl) {
  const base = { tool_slug: toolSlug, source_url: sourceUrl };

  const robots = await checkRobotsAllowed(sourceUrl);
  if (!robots.allowed) {
    return { ...base, outcome: 'robots_disallowed', http_status: null, normalized_text: null, text_hash: null, fetch_error: null };
  }
  if (robots.crawlDelay) {
    await new Promise((r) => setTimeout(r, Math.min(robots.crawlDelay, 5000)));
  }

  try {
    const res = await fetch(sourceUrl, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
      signal: AbortSignal.timeout(15000),
      redirect: 'follow',
    });

    const contentType = res.headers.get('content-type') || '';
    if (!res.ok) {
      return { ...base, outcome: 'fetch_failed', http_status: res.status, normalized_text: null, text_hash: null, fetch_error: `HTTP ${res.status}` };
    }
    if (!contentType.includes('text/html')) {
      return { ...base, outcome: 'fetch_incomplete', http_status: res.status, normalized_text: null, text_hash: null, fetch_error: `Unexpected content-type: ${contentType}` };
    }

    const html = await res.text();
    const normalized = stripHtml(html);

    if (normalized.length < MIN_TEXT_LENGTH) {
      return { ...base, outcome: 'fetch_incomplete', http_status: res.status, normalized_text: normalized, text_hash: null, fetch_error: `Only ${normalized.length} chars of text — likely JS-rendered or blocked` };
    }

    const hash = crypto.createHash('sha256').update(normalized).digest('hex');
    return { ...base, outcome: 'fetched', http_status: res.status, normalized_text: normalized, text_hash: hash, fetch_error: null };
  } catch (err) {
    return { ...base, outcome: 'fetch_failed', http_status: null, normalized_text: null, text_hash: null, fetch_error: err.message || 'Unknown fetch error' };
  }
}
