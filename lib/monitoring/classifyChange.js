// lib/monitoring/classifyChange.js
const MODEL_WORDS = [
  'gpt-5', 'gpt-4', 'gpt-6',
  'claude opus', 'claude sonnet', 'claude haiku',
  'gemini 2', 'gemini 3', 'gemini 4',
  'now powered by', 'upgraded to', 'new model', 'model update', 'switched to'
];
const PRICING_WORDS = ['price', 'pricing', 'plan', '/mo', '/month', '/year', 'subscription', 'tier', 'free', 'trial'];
const FEATURE_WORDS = ['now supports', 'new feature', 'introducing', 'beta', 'launch', 'now available', 'added'];
const STATUS_WORDS = ['discontinued', 'sunset', 'shut down', 'shutting down', 'deprecated', 'no longer available', 'end of life', 'end-of-life'];
const CURRENCY_PATTERN = /[$€£¥]\s?\d/;

const CATEGORY_PRIORITY = {
  status: 'critical',
  model_update: 'high',
  pricing: 'medium',
  features: 'low',
  unknown: 'none',
};

const OLD_YEAR_PATTERN = /\b(201[0-9]|202[0-3])\b/;

export function classifyChange(diffText) {
  const lower = diffText.toLowerCase();

  const hasCurrency = CURRENCY_PATTERN.test(diffText);
  const hasPricingWord = PRICING_WORDS.some((w) => lower.includes(w));
  const hasFeatureWord = FEATURE_WORDS.some((w) => lower.includes(w));
  const hasStatusWord = STATUS_WORDS.some((w) => lower.includes(w));
  const hasModelWord = MODEL_WORDS.some((w) => lower.includes(w));
  const looksStale = OLD_YEAR_PATTERN.test(lower);

  let result;
  if (hasStatusWord) result = { category: 'status', confidence: 'high', signal: true };
  else if (hasModelWord) result = { category: 'model_update', confidence: 'high', signal: true };
  else if (hasPricingWord && hasCurrency) result = { category: 'pricing', confidence: 'high', signal: true };
  else if (hasPricingWord) result = { category: 'pricing', confidence: 'medium', signal: true };
  else if (hasFeatureWord && !looksStale) result = { category: 'features', confidence: 'medium', signal: true };
  else if (hasFeatureWord && looksStale) result = { category: 'features', confidence: 'low', signal: false };
  else result = { category: 'unknown', confidence: 'low', signal: false };

  return { ...result, priority: CATEGORY_PRIORITY[result.category] };
}
