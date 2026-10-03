// lib/monitoring/fetchSnapshot.js
// Fetches a tool's monitoring URL, extracts the most relevant stable
// document content, normalizes it, and hashes it.
// Never throws — always returns a result object so the caller can log
// the outcome either way. A failed or incomplete fetch is NEVER
// interpreted as "no change".

import crypto from 'crypto';
import { checkRobotsAllowed } from './robots.js';
import { safeFetch } from './urlSafety.js';

const USER_AGENT = 'ShabelleHubMonitor/1.0 (+https://shabellehub.com/bot)';
const MIN_TEXT_LENGTH = 200;

function removeNonContentHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<template[\s\S]*?<\/template>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<canvas[\s\S]*?<\/canvas>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    // Remove common cookie/privacy UI containers only.
    // Generic banners remain because they may contain legitimate
    // product or pricing announcements.
    .replace(
      /<(?:div|section|aside)[^>]*(?:id|class)=["'][^"']*(?:cookie|consent|onetrust|cookiebot|privacy-modal|privacy-popup)[^"']*["'][^>]*>[\s\S]*?<\/(?:div|section|aside)>/gi,
      ' '
    );
}

function normalizeText(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractContainer(html, tagName) {
  const match = html.match(
    new RegExp(`<${tagName}\\b[^>]*>[\\s\\S]*?<\\/${tagName}>`, 'i')
  );

  return match ? match[0] : null;
}

function extractPricingSections(html) {
  const marked = html.replace(
    /<h([1-6])\b[^>]*>([\s\S]*?)<\/h[1-6]>/gi,
    '\n__SH_HEADING__ $2\n'
  );

  const sections = marked.split(/__SH_HEADING__\s*/i);

  const selected = sections.filter((section) => {
    const text = normalizeText(section);

    if (!text) return false;

    return /(?:pricing|plans?|billing|subscription|free|pro|team|business|enterprise|monthly|annual|yearly|\$\s?\d|€\s?\d|£\s?\d|\d+\s*\/\s*(?:mo|month|yr|year))/i.test(
      text
    );
  });

  return selected.length ? selected.join(' ') : null;
}

function getSourcePath(sourceUrl) {
  try {
    return new URL(sourceUrl).pathname.toLowerCase();
  } catch {
    return String(sourceUrl || '').toLowerCase();
  }
}

function stripHtml(html, sourceUrl = '') {
  const cleanedHtml = removeNonContentHtml(html);

  // Prefer the semantic document region over the entire page.
  // This removes much of the navigation/footer/marketing chrome
  // without introducing a new HTML parser dependency.
  const container =
    extractContainer(cleanedHtml, 'main')
    || extractContainer(cleanedHtml, 'article');

  const pathname = getSourcePath(sourceUrl);

  const isPricingSource =
    /(?:pricing|plans?|billing|subscription)/i.test(pathname);

  const isReleaseSource =
    /(?:release|changelog|updates?|news|blog)/i.test(pathname);

  // Pricing pages need the pricing/plan sections specifically.
  // If no semantic pricing section is detectable, fall back to
  // the stable main/article region rather than guessing.
  if (isPricingSource) {
    const pricing = extractPricingSections(container || cleanedHtml);

    if (pricing) {
      return normalizeText(pricing);
    }
  }

  // Release notes, changelogs, support articles, and normal product
  // pages should prefer <main> or <article>.
  if (container) {
    return normalizeText(container);
  }

  // Conservative fallback for pages without a semantic container.
  return normalizeText(cleanedHtml);
}

export async function fetchSnapshot(toolSlug, sourceUrl) {
  const base = { tool_slug: toolSlug, source_url: sourceUrl };

  const robots = await checkRobotsAllowed(sourceUrl);

  if (!robots.allowed) {
    return {
      ...base,
      outcome: 'robots_disallowed',
      http_status: null,
      normalized_text: null,
      text_hash: null,
      fetch_error: null,
    };
  }

  if (robots.crawlDelay) {
    await new Promise((r) => setTimeout(r, Math.min(robots.crawlDelay, 5000)));
  }

  try {
    const res = await safeFetch(sourceUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html',
      },
      signal: AbortSignal.timeout(15000),
    });

    const contentType = res.headers.get('content-type') || '';

    if (!res.ok) {
      return {
        ...base,
        outcome: 'fetch_failed',
        http_status: res.status,
        normalized_text: null,
        text_hash: null,
        fetch_error: `HTTP ${res.status}`,
      };
    }

    if (!contentType.includes('text/html')) {
      return {
        ...base,
        outcome: 'fetch_incomplete',
        http_status: res.status,
        normalized_text: null,
        text_hash: null,
        fetch_error: `Unexpected content-type: ${contentType}`,
      };
    }

    const html = await res.text();
    const normalized = stripHtml(html, sourceUrl);

    if (normalized.length < MIN_TEXT_LENGTH) {
      return {
        ...base,
        outcome: 'fetch_incomplete',
        http_status: res.status,
        normalized_text: normalized,
        text_hash: null,
        fetch_error: `Only ${normalized.length} chars of text — likely JS-rendered or blocked`,
      };
    }

    const hash = crypto
      .createHash('sha256')
      .update(normalized)
      .digest('hex');

    return {
      ...base,
      outcome: 'fetched',
      http_status: res.status,
      normalized_text: normalized,
      text_hash: hash,
      fetch_error: null,
    };
  } catch (err) {
    return {
      ...base,
      outcome: 'fetch_failed',
      http_status: null,
      normalized_text: null,
      text_hash: null,
      fetch_error: err.message || 'Unknown fetch error',
    };
  }
}
