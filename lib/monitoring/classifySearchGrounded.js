// lib/monitoring/classifySearchGrounded.js
// Last-resort fallback: when a tool's entire sources.js candidate chain
// (official -> support -> wikipedia) fails to fetch (Cloudflare block,
// robots.txt, timeout, etc.), ask Gemini to search the web directly for
// current info about the tool instead of scraping a specific URL.
//
// This never throws and always degrades to null on any failure, keeping
// monitoring runs resilient. Confidence is always capped at 'low' because
// there's no diff/history to compare against — just a single point-in-time
// answer from the model.

const GEMINI_MODEL = 'gemini-3.6-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const TIMEOUT_MS = 30000;

const DAILY_CAP = 50;

function buildSearchPrompt(toolName) {
  return `Search the web for the most recent, current information about the AI tool "${toolName}".
Focus specifically on: pricing changes, plan changes, usage limit changes, API changes, integration changes, new model or version releases, new feature launches or removed features, or whether the product has been discontinued or shut down.

Respond with ONLY a JSON object, no markdown formatting, no code fences, no extra text. Use this exact shape:
{"found": true or false, "category": "status" or "model_update" or "pricing" or "plan_change" or "limit_change" or "api_change" or "integration_change" or "feature_added" or "feature_removed" or "unknown", "summary": "one sentence, max 25 words", "signal": true or false}

Set found=false if you cannot find any recent relevant information about this tool.
Set signal=false if nothing notable has changed recently, or the information is old/stale/unclear.`;
}

function stripCodeFences(text) {
  return text.replace(/^```(json)?\s*/i, '').replace(/```\s*$/i, '').trim();
}

export async function checkSearchGroundingBudget(db) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count } = await db
    .from('monitoring_audit_log')
    .select('id', { count: 'exact', head: true })
    .eq('action', 'ai_search_grounded')
    .gte('created_at', todayStart.toISOString());

  return (count || 0) < DAILY_CAP;
}

export async function classifySearchGrounded(toolName) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !toolName) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildSearchPrompt(toolName) }] }],
        tools: [{ google_search: {} }],
        generationConfig: {
          thinkingConfig: { thinkingLevel: 'low' },
          temperature: 0.1,
          maxOutputTokens: 512,
        },
      }),
    });

    if (!res.ok) return null;

    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text)
      .filter(Boolean)
      .join('') || '';
    if (!text) return null;

    const parsed = JSON.parse(stripCodeFences(text));
    if (typeof parsed.found !== 'boolean') return null;
    if (!parsed.found) return null;

    return {
      category: parsed.category || 'unknown',
      confidence: 'low',
      signal: !!parsed.signal,
      summary: (parsed.summary || '').slice(0, 200),
      source: 'ai_search',
    };
  } catch (err) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
