// lib/monitoring/classifyWithAI.js
// Optional AI-assisted refinement layer on top of classifyChange.js.
// NEVER throws — on any failure (missing key, timeout, rate limit, bad
// response) it resolves to null so the caller falls back to the fast
// keyword-based classification. This keeps monitoring runs resilient even
// when the free-tier quota is exhausted.

const GEMINI_MODEL = 'gemini-3.6-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const TIMEOUT_MS = 30000;

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    category: { type: 'STRING', enum: ['status', 'model_update', 'pricing', 'features', 'unknown'] },
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
1. Confirm or correct the category: status (discontinued/shutdown), model_update (new model version released), pricing (price/plan change), features (new feature launched), or unknown (not a real signal — e.g. stale content, unrelated text, marketing noise).
2. Set signal=false if this is NOT a genuine, current change worth alerting an admin about (e.g. it references an old date, is boilerplate, or is a false positive).
3. Write a one-sentence summary (max 20 words) an admin can scan quickly.

Diff:
${diffExcerpt.slice(0, 2000)}`;
}

export async function classifyWithAI(diffExcerpt, keywordCategory) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !diffExcerpt) return null;

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
      // 429 = rate limit, 4xx/5xx = other failure — always degrade gracefully
      return null;
    }

    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const parsed = JSON.parse(text);
    if (!parsed.category || !parsed.confidence || typeof parsed.signal !== 'boolean') return null;

    return {
      category: parsed.category,
      confidence: parsed.confidence,
      signal: parsed.signal,
      summary: (parsed.summary || '').slice(0, 200),
      source: 'ai',
    };
  } catch (err) {
    // Network error, timeout, JSON parse failure — never propagate.
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
