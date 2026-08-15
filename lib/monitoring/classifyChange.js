// lib/monitoring/classifyChange.js
const PRICING_WORDS = ['price', 'pricing', 'plan', '/mo', '/month', '/year', 'subscription', 'tier', 'free', 'trial'];
const FEATURE_WORDS = ['now supports', 'new feature', 'introducing', 'beta', 'launch', 'now available', 'added'];
const STATUS_WORDS = ['discontinued', 'sunset', 'shut down', 'shutting down', 'deprecated', 'no longer available', 'end of life', 'end-of-life'];
const CURRENCY_PATTERN = /[$€£¥]\s?\d/;

export function classifyChange(diffText) {
  const lower = diffText.toLowerCase();

  const hasCurrency = CURRENCY_PATTERN.test(diffText);
  const hasPricingWord = PRICING_WORDS.some((w) => lower.includes(w));
  const hasFeatureWord = FEATURE_WORDS.some((w) => lower.includes(w));
  const hasStatusWord = STATUS_WORDS.some((w) => lower.includes(w));

  if (hasStatusWord) return { category: 'status', confidence: 'high', signal: true };
  if (hasPricingWord && hasCurrency) return { category: 'pricing', confidence: 'high', signal: true };
  if (hasPricingWord) return { category: 'pricing', confidence: 'medium', signal: true };
  if (hasFeatureWord) return { category: 'features', confidence: 'medium', signal: true };

  return { category: 'unknown', confidence: 'low', signal: false };
}
