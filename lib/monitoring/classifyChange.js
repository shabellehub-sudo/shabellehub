// lib/monitoring/classifyChange.js
const MODEL_WORDS = ['new model', 'gpt-5', 'gpt-4', 'gpt-6', 'claude opus', 'claude sonnet', 'claude haiku', 'gemini 2', 'gemini 3', 'gemini 4', 'now powered by', 'upgraded to', 'model update', 'switched to'];
const PRICING_WORDS = ['price', 'pricing', '/mo', '/month', '/year', 'subscription'];
const PLAN_WORDS = ['new plan', 'new plans', 'plan tier', 'enterprise plan', 'team plan', 'pro plan', 'starter plan', 'plan renamed', 'plan discontinued', 'max plan', 'max plans'];
const LIMIT_WORDS = ['rate limit', 'usage limit', 'quota', 'messages per day', 'requests per', 'tokens per', 'limit increased', 'limit decreased', 'limit raised', 'limit lowered'];
const API_WORDS = ['api change', 'api update', 'new endpoint', 'endpoint deprecated', 'api version', 'breaking change', 'api deprecated'];
const INTEGRATION_WORDS = ['now integrates with', 'integration with', 'now supports zapier', 'now supports slack', 'plugin for', 'connector for', 'now works with'];
const FEATURE_ADDED_WORDS = ['now supports', 'new feature', 'introducing', 'now available', 'added', 'launch'];
const FEATURE_REMOVED_WORDS = ['no longer supports', 'removed', 'feature removed', 'deprecated feature', 'sunset feature', 'discontinuing'];
const STATUS_WORDS = ['discontinued', 'sunset', 'shut down', 'shutting down', 'deprecated', 'no longer available', 'end of life', 'end-of-life'];
const CURRENCY_PATTERN = /[$€£¥]\s?\d/;
const OLD_YEAR_PATTERN = /\b(201[0-9]|202[0-3])\b/;

const CATEGORY_PRIORITY = {
  status: 'critical',
  model_update: 'high',
  pricing: 'high',
  plan_change: 'medium',
  limit_change: 'medium',
  api_change: 'medium',
  integration_change: 'low',
  feature_added: 'low',
  feature_removed: 'medium',
  unknown: 'none',
};

function hasAny(lower, words) {
  return words.some((w) => lower.includes(w));
}

export function classifyChange(diffText) {
  const lower = diffText.toLowerCase();
  const looksStale = OLD_YEAR_PATTERN.test(lower);

  const hasCurrency = CURRENCY_PATTERN.test(diffText);
  const hasStatusWord = hasAny(lower, STATUS_WORDS);
  const hasModelWord = hasAny(lower, MODEL_WORDS);
  const hasPricingWord = hasAny(lower, PRICING_WORDS);
  const hasPlanWord = hasAny(lower, PLAN_WORDS);
  const hasLimitWord = hasAny(lower, LIMIT_WORDS);
  const hasApiWord = hasAny(lower, API_WORDS);
  const hasIntegrationWord = hasAny(lower, INTEGRATION_WORDS);
  const hasFeatureAddedWord = hasAny(lower, FEATURE_ADDED_WORDS);
  const hasFeatureRemovedWord = hasAny(lower, FEATURE_REMOVED_WORDS);

  let result;
  if (hasStatusWord) result = { category: 'status', confidence: 'high', signal: true };
  else if (hasModelWord) result = { category: 'model_update', confidence: 'high', signal: true };
  else if (hasPricingWord && hasCurrency) result = { category: 'pricing', confidence: 'high', signal: true };
  else if (hasPricingWord) result = { category: 'pricing', confidence: 'medium', signal: true };
  else if (hasPlanWord) result = { category: 'plan_change', confidence: 'medium', signal: true };
  else if (hasLimitWord) result = { category: 'limit_change', confidence: 'medium', signal: true };
  else if (hasApiWord) result = { category: 'api_change', confidence: 'medium', signal: true };
  else if (hasFeatureRemovedWord) result = { category: 'feature_removed', confidence: 'medium', signal: true };
  else if (hasIntegrationWord) result = { category: 'integration_change', confidence: 'medium', signal: true };
  else if (hasFeatureAddedWord && !looksStale) result = { category: 'feature_added', confidence: 'medium', signal: true };
  else if (hasFeatureAddedWord && looksStale) result = { category: 'feature_added', confidence: 'low', signal: false };
  else result = { category: 'unknown', confidence: 'low', signal: false };

  return { ...result, priority: CATEGORY_PRIORITY[result.category] };
}
