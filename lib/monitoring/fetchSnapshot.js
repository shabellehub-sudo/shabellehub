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

// Patch B1: remove a cookie/consent container INCLUDING nested children.
// The old regex stopped at the first closing tag, leaving banner text
// behind. Safety: unbalanced blocks are left alone, and a block larger
// than 40% of the page is never removed (a page wrapper, not a banner).
function removeCookieBlocks(html) {
  const openRe = /<(div|section|aside)\b((?:"[^"]*"|'[^']*'|[^'">])*)>/gi;
  const anyTagRe = /<(\/?)(div|section|aside)\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi;
  const flagged = /\b(?:id|class)\s*=\s*(?:"[^"]*|'[^']*)(?:cookie|consent|onetrust|cookiebot|privacy-modal|privacy-popup)/i;
  let out = '';
  let pos = 0;
  let removed = 0;
  let m;
  while ((m = openRe.exec(html)) !== null) {
    if (m.index < pos) continue;
    if (!flagged.test(m[2]) || m[2].trim().endsWith('/')) continue;
    const tag = m[1].toLowerCase();
    anyTagRe.lastIndex = openRe.lastIndex;
    let depth = 1;
    let end = -1;
    let t;
    while ((t = anyTagRe.exec(html)) !== null) {
      if (t[2].toLowerCase() !== tag) continue;
      if (t[1]) depth -= 1;
      else if (!/\/>$/.test(t[0])) depth += 1;
      if (depth === 0) { end = anyTagRe.lastIndex; break; }
    }
    if (end === -1) continue;
    if (end - m.index > html.length * 0.4) continue;
    out += html.slice(pos, m.index) + ' ';
    pos = end;
    openRe.lastIndex = end;
    removed += 1;
    if (removed >= 50) break;
  }
  return out + html.slice(pos);
}

function removeNonContentHtml(html) {
  return removeCookieBlocks(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<template[\s\S]*?<\/template>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<canvas[\s\S]*?<\/canvas>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  // Cookie/privacy containers are removed up front by removeCookieBlocks()
  // (nested-aware, size-guarded). Generic banners remain because they may
  // contain legitimate product or pricing announcements.
}

function sanitizeUnicode(text) {
  let out = '';

  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);

    // Preserve valid UTF-16 surrogate pairs (emoji and other
    // supplementary Unicode characters).
    if (code >= 0xD800 && code <= 0xDBFF) {
      const next = text.charCodeAt(i + 1);

      if (next >= 0xDC00 && next <= 0xDFFF) {
        out += text[i] + text[i + 1];
        i += 1;
      }

      // Drop an unpaired high surrogate.
      continue;
    }

    // Drop an unpaired low surrogate.
    if (code >= 0xDC00 && code <= 0xDFFF) {
      continue;
    }

    out += text[i];
  }

  return out;
}

// Bump when normalizeText/stripHtml output changes for the same HTML.
// runCheck.js re-baselines (no diff) when a stored snapshot used an older version.
export const NORMALIZER_VERSION = 2;

const NAMED_ENTITIES = {
  nbsp: ' ', quot: '"', apos: "'", lt: '<', gt: '>',
  ndash: '–', mdash: '—', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
  hellip: '…', copy: '©', reg: '®', trade: '™', bull: '•', middot: '·',
  euro: '€', pound: '£', yen: '¥', times: '×',
};

function codePointToString(cp) {
  if (!Number.isFinite(cp) || cp < 32 || cp > 0x10FFFF) return ' ';
  if (cp >= 0xD800 && cp <= 0xDFFF) return ' ';
  return String.fromCodePoint(cp);
}

function decodeEntities(text) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => codePointToString(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => codePointToString(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, name) => {
      const key = name.toLowerCase();
      return Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, key) ? NAMED_ENTITIES[key] : m;
    })
    .replace(/&amp;/gi, '&');
}

const BLOCK_BREAK_RE = /<\/(?:p|div|li|ul|ol|h[1-6]|tr|section|article|header|footer|main|table|dd|dt|blockquote|figure|form)\s*>|<br\s*\/?>/gi;
// Quote-aware tag matcher: a ">" inside an attribute value (e.g. Tailwind
// "[&>svg]:px-3") must not end the tag early.
const TAG_RE = /<\/?[a-zA-Z][^\s>\/]*(?:"[^"]*"|'[^']*'|[^'">])*>/g;

function normalizeText(html) {
  const text = decodeEntities(
    html
      .replace(BLOCK_BREAK_RE, '\n')
      .replace(TAG_RE, ' ')
      .replace(/<[^>]*>/g, ' ')
  );
  return sanitizeUnicode(
    text
      .split('\n')
      .map((line) => line.replace(/[ \t\f\v\u00a0\u2000-\u200b\u202f\u205f\u3000]+/g, ' ').trim())
      .filter(Boolean)
      .join('\n')
  );
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

    return /(?:\bpricing\b|\bplans?\b|\bbilling\b|\bsubscription\b|\bfree\b|\bpro\b|\bteam\b|\bbusiness\b|\benterprise\b|\bmonthly\b|\bannual(?:ly)?\b|\byearly\b|\$\s?\d|€\s?\d|£\s?\d|\d+\s*\/\s*(?:mo|month|yr|year))/i.test(
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

export function stripHtml(html, sourceUrl = '') {
  const cleanedHtml = removeNonContentHtml(html);

  const pathname = getSourcePath(sourceUrl);

  const isPricingSource =
    /(?:pricing|plans?|billing|subscription)/i.test(pathname);

  const isReleaseSource =
    /(?:release|changelog|updates?|news|blog)/i.test(pathname);

  // Prefer the semantic document region over the entire page.
  // Release-style pages commonly use <article>, while product/pricing
  // pages more commonly expose their stable content in <main>.
  const container = isReleaseSource
    ? extractContainer(cleanedHtml, 'article')
      || extractContainer(cleanedHtml, 'main')
    : extractContainer(cleanedHtml, 'main')
      || extractContainer(cleanedHtml, 'article');

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
