// lib/monitoring/classifyWithAI.js
// Optional AI-assisted refinement layer on top of classifyChange.js.
// NEVER throws — on any failure (missing key, timeout, rate limit, bad
// response) it resolves to null so the caller falls back to the fast
// keyword-based classification. This keeps monitoring runs resilient even
// when the free-tier quota is exhausted.

const GEMINI_MODEL = 'gemini-3.6-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const TIMEOUT_MS = 30000;

const CATEGORIES = ['status', 'model_update', 'pricing', 'plan_change', 'limit_change', 'api_change', 'integration_change', 'feature_added', 'feature_removed', 'unknown'];

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    category: { type: 'STRING', enum: CATEGORIES },
    confidence: { type: 'STRING', enum: ['high', 'medium', 'low'] },
    signal: { type: 'BOOLEAN' },
    summary: { type: 'STRING' },
  },
  required: ['category', 'confidence', 'signal', 'summary'],
};

function buildPrompt(diffExcerpt, keywordCategory) {
  return `You are a change-detection classifier for an AI tools directory website.
Below is a text diff (+ added, - removed) scraped from an AI tool's website or pricing page.
A keyword-based system pre-classified it as "${keywordCategory}".

Your job:
1. Confirm or correct the category, choosing exactly one of:
   - status: product discontinued or shut down
   - model_update: new model or version released
   - pricing: price or subscription cost change
   - plan_change: a plan/tier was added, renamed, or removed
   - limit_change: usage limits, rate limits, or quotas changed
   - api_change: API endpoints, versions, or behavior changed
   - integration_change: a new integration/plugin/connector was added or removed
   - feature_added: a new feature was launched
   - feature_removed: an existing feature was removed or deprecated
   - unknown: not a real signal (stale content, unrelated text, marketing noise)
2. Set signal=false if this is NOT a genuine, current change worth alerting an admin about (e.g. it references an old date, is boilerplate, or is a false positive).
3. Write a one-sentence summary (max 20 words) an admin can scan quickly.

Diff:
${diffExcerpt.slice(0, 2000)}`;
}

export async function classifyWithAI(diffExcerpt, keywordCategory) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !diffExcerpt) {
    console.warn('[classifyWithAI] skipped: missing apiKey or diffExcerpt');
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(diffExcerpt, keywordCategory) }] }],
        generationConfig: {
          thinkingConfig: { thinkingLevel: 'low' },
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0.1,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!res.ok) {
      console.warn(`[classifyWithAI] Gemini HTTP ${res.status}: ${await res.text().catch(() => '')}`);
      return null;
    }

    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.warn('[classifyWithAI] no text in Gemini response', JSON.stringify(json).slice(0, 300));
      return null;
    }

    const parsed = JSON.parse(text);
    if (!parsed.category || !parsed.confidence || typeof parsed.signal !== 'boolean') {
      console.warn('[classifyWithAI] malformed response fields', JSON.stringify(parsed).slice(0, 300));
      return null;
    }

    return {
      category: parsed.category,
      confidence: parsed.confidence,
      signal: parsed.signal,
      summary: (parsed.summary || '').slice(0, 200),
      source: 'ai',
    };
  } catch (err) {
    console.warn(`[classifyWithAI] exception: ${err.name} — ${err.message}`);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
