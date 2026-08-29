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

const STATUS_WORDS = ['discontinued', 'deprecated', 'shut down', 'sunsetted', 'end of life', 'eol'];

const MODEL_WORDS = [
  'model', 'gpt-4', 'gpt-4o', 'gpt-3.5', 'claude 3', 'claude 3.5', 'gemini 1.5',
  'llama 3', 'mistral', 'deepseek', 'qwen', 'version', 'v1.', 'v2.', 'v3.', 'v4.', 'v5.',
  'checkpoint', 'weights', 'fine-tune', 'fine-tuned', 'multimodal'
];

const PRICING_WORDS = [
  'price', 'pricing', 'cost', '$', '€', '£', '¥', 'usd', 'eur', 'gbp',
  '/month', /\/mo\b/i, '/yr', '/year', 'per month', 'per year', 'billing', 'subscription'
];

const PLAN_WORDS = [
  'plan', 'tier', 'free tier', 'pro plan', 'team plan', 'enterprise plan',
  'starter', 'business', 'unlimited plan', 'custom plan'
];

const LIMIT_WORDS = [
  'limit', 'quota', 'rate limit', 'token limit', 'request limit', 'rpm', 'tpm',
  'rpd', 'credits', 'top-up', 'usage cap', 'concurrency'
];

const API_WORDS = [
  'api', 'endpoint', 'webhook', 'sdk', 'graphql', 'rest api', 'v1/chat', 'v1/completions',
  'bearer token', 'api key', 'rate-limit header'
];

const INTEGRATION_WORDS = [
  'integration', 'plugin', 'extension', 'zapier', 'github action', 'slack app',
  'discord bot', 'vscode extension', 'chrome extension', 'connector'
];

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

  if (hasAny(textToScan, STATUS_WORDS)) {
    return { category: 'status', confidence: 'high', signal: true };
  }
  if (hasAny(textToScan, MODEL_WORDS)) {
    return { category: 'model_update', confidence: 'high', signal: true };
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
  return { category: 'unknown', confidence: 'low', signal: false };
}
