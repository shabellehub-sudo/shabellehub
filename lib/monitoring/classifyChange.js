// lib/monitoring/classifyChange.js
// Deterministic keyword-based classification of scraped text diffs (+ added lines).
// Designed to run fast and reliably with zero network calls.

function isStaleYear(text) {
  const currentYear = new Date().getFullYear();
  const maxStaleYear = currentYear - 3;
  const yearMatches = text.match(/\b(20\d\d)\b/g);
  if (!yearMatches) return false;
  return yearMatches.some(y => {
    const yr = parseInt(y, 10);
    return yr >= 2010 && yr <= maxStaleYear;
  });
}

const STATUS_WORDS = ['discontinued', 'deprecated', 'shut down', 'sunsetted', 'end of life', /\beol\b/i];

// Tier 0: specific, named model/version identifiers -- safe as substring
// match (hyphenated/multi-token strings, negligible collision surface).
// v1.-v5. punctuation markers are intentionally left here unchanged
// (Pass 2 scope: punctuation-token matching needs different handling --
// "Endpoint v2.3 deployed" is a documented known gap, not fixed here).
const MODEL_IDENTIFIERS = [
  'gpt-4', 'gpt-4o', 'gpt-3.5', 'claude 3', 'claude 3.5', 'gemini 1.5',
  'llama 3', 'mistral', 'deepseek', 'qwen',
  'v1.', 'v2.', 'v3.', 'v4.', 'v5.'
];

// Generic/ambiguous model vocabulary -- "model" and "version" are
// semantically ambiguous even with a word-boundary applied ("business
// model", "API version" are real words, not substring collisions), so
// these are demoted to the fallback tier (lower priority, confidence:
// medium) rather than treated as a Tier-0 high-confidence signal.
const MODEL_GENERIC_WORDS = [/\bmodel\b/i, /\bversion\b/i, 'checkpoint', 'weights', 'fine-tune', 'fine-tuned', 'multimodal'];

// Pass 2: bare currency symbols now require an adjacent digit (before
// or after, with optional whitespace) to fire. This stops JS template
// literal syntax like "${env}" from matching -- $/eur/etc alone are no
// longer sufficient, a real amount ("$20", "20 EUR-style adjacency via
// eur word-boundary above) must be present.
const CURRENCY_WITH_DIGIT = /[$€£¥]\s?\d|\d\s?[$€£¥]/;

const PRICING_WORDS = [
  'price', 'pricing', 'cost', CURRENCY_WITH_DIGIT, 'usd', /\beur\b/i, 'gbp',
  '/month', /\/mo\b/i, '/yr', '/year', 'per month', 'per year', 'billing', 'subscription'
];

// "plan" and "business" removed -- generic/semantic words moved to the
// fallback tier below (PLAN_GENERIC_WORDS).
const PLAN_WORDS = [
  'tier', 'free tier', 'pro plan', 'team plan', 'enterprise plan',
  'starter', 'unlimited plan', 'custom plan'
];

const PLAN_GENERIC_WORDS = [/\bplan\b/i, /\bbusiness\b/i];

// "credits" removed -- generic word moved to the fallback tier below
// (LIMIT_GENERIC_WORDS). "limit" now uses a word boundary so it no
// longer matches inside "limitations".
const LIMIT_WORDS = [
  /\blimit\b/i, 'quota', 'rate limit', 'token limit', 'request limit', 'rpm', 'tpm',
  'rpd', 'top-up', 'usage cap', 'concurrency'
];

const LIMIT_GENERIC_WORDS = [/\bcredits\b/i];

// "api" now uses a word boundary so it no longer matches inside
// unrelated words like "rapid", "capital", or "zapier".
const API_WORDS = [
  /\bapi\b/i, 'endpoint', 'webhook', 'sdk', 'graphql', 'rest api', 'v1/chat', 'v1/completions',
  'bearer token', 'api key', 'rate-limit header'
];

// "extension" removed -- generic word moved to the fallback tier below
// (INTEGRATION_GENERIC_WORDS).
const INTEGRATION_WORDS = [
  'integration', 'plugin', 'zapier', 'github action', 'slack app',
  'discord bot', 'vscode extension', 'chrome extension', 'connector'
];

const INTEGRATION_GENERIC_WORDS = [/\bextension\b/i];

const FEATURE_ADDED_WORDS = [
  'launch', 'launched', 'announcing', 'introducing', 'new feature', 'now available',
  'added support', 'added', 'supports', 'feature', 'capability', 'dashboard', 'analytics'
];

const FEATURE_REMOVED_WORDS = [
  'removed', 'discontinued feature', 'no longer supported', 'dropped support', 'phased out'
];

function hasAny(text, wordList) {
  const lower = text.toLowerCase();
  return wordList.some(w => {
    if (w instanceof RegExp) {
      return w.test(text);
    }
    return lower.includes(w);
  });
}

export function classifyChange(diffText) {
  if (!diffText || typeof diffText !== 'string') {
    return { category: 'unknown', confidence: 'low', signal: false };
  }

  const addedLines = diffText
    .split('\n')
    .filter(line => line.startsWith('+'))
    .join('\n');

  const textToScan = addedLines || diffText;

  if (hasAny(textToScan, MODEL_IDENTIFIERS)) {
    return { category: 'model_update', confidence: 'high', signal: true };
  }
  if (hasAny(textToScan, STATUS_WORDS)) {
    return { category: 'status', confidence: 'high', signal: true };
  }
  if (hasAny(textToScan, PRICING_WORDS)) {
    return { category: 'pricing', confidence: 'high', signal: true };
  }
  if (hasAny(textToScan, PLAN_WORDS)) {
    return { category: 'plan_change', confidence: 'high', signal: true };
  }
  if (hasAny(textToScan, LIMIT_WORDS)) {
    return { category: 'limit_change', confidence: 'high', signal: true };
  }
  if (hasAny(textToScan, API_WORDS)) {
    return { category: 'api_change', confidence: 'high', signal: true };
  }
  if (hasAny(textToScan, INTEGRATION_WORDS)) {
    return { category: 'integration_change', confidence: 'high', signal: true };
  }
  if (hasAny(textToScan, FEATURE_REMOVED_WORDS)) {
    return { category: 'feature_removed', confidence: 'high', signal: true };
  }
  if (hasAny(textToScan, FEATURE_ADDED_WORDS)) {
    const isStale = isStaleYear(textToScan);
    return {
      category: 'feature_added',
      confidence: isStale ? 'low' : 'medium',
      signal: !isStale
    };
  }

  // Fallback tier: generic/semantic single-word signals that are real
  // words (not substring collisions) but too ambiguous on their own to
  // warrant high confidence. Checked in the same relative priority order
  // as their non-generic counterparts above. signal stays true (still a
  // genuine weak signal worth flagging) but confidence is downgraded to
  // 'medium' so it never outranks a real high-confidence category match,
  // and never drives urgent-priority admin alerting on its own.
  if (hasAny(textToScan, MODEL_GENERIC_WORDS)) {
    return { category: 'model_update', confidence: 'medium', signal: true };
  }
  if (hasAny(textToScan, PLAN_GENERIC_WORDS)) {
    return { category: 'plan_change', confidence: 'medium', signal: true };
  }
  if (hasAny(textToScan, LIMIT_GENERIC_WORDS)) {
    return { category: 'limit_change', confidence: 'medium', signal: true };
  }
  if (hasAny(textToScan, INTEGRATION_GENERIC_WORDS)) {
    return { category: 'integration_change', confidence: 'medium', signal: true };
  }

  return { category: 'unknown', confidence: 'low', signal: false };
}
