// lib/changes/rssDates.js
// PURE module: zero imports, no env/browser/Supabase/Next APIs.
// RSS-only date logic. reviewed_at may affect pubDate/order ONLY; it never
// affects anchors, guids, or the displayed change date (those use detected_at).

const ISO_Z = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

function calendarOk(str) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(str);
  if (!m) return false;
  const mo = Number(m[2]);
  const da = Number(m[3]);
  const dim = new Date(Date.UTC(Number(m[1]), mo, 0)).getUTCDate();
  return mo >= 1 && mo <= 12 && da >= 1 && da <= dim;
}

// Strict: returns epoch ms, or throws. Never substitutes a date.
function parseDetected(value) {
  const ok = (typeof value === 'string' && value.trim() !== '') || value instanceof Date;
  if (!ok) throw new Error(`Invalid detected_at: ${String(value)}`);
  const ms = new Date(value).getTime();
  if (Number.isNaN(ms)) throw new Error(`Invalid detected_at: ${String(value)}`);
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value) && !calendarOk(value)) {
    throw new Error(`Invalid detected_at (impossible date): ${value}`);
  }
  return ms;
}

// reviewed_at is trusted ONLY in exact ISO-UTC form with a literal Z.
export function isValidReviewedAt(value) {
  return (
    typeof value === 'string' &&
    ISO_Z.test(value) &&
    calendarOk(value) &&
    !Number.isNaN(new Date(value).getTime())
  );
}

// Epoch ms used for pubDate. Invalid detected_at ALWAYS throws, even when
// reviewed_at is valid (detected_at is foundational).
export function rssPubTimestamp(detectedAt, reviewedAt) {
  const detectedMs = parseDetected(detectedAt);
  return isValidReviewedAt(reviewedAt) ? new Date(reviewedAt).getTime() : detectedMs;
}

// RFC-822 style UTC string, e.g. "Thu, 10 Sep 2026 05:45:00 GMT".
export function rssPubDate(detectedAt, reviewedAt) {
  return new Date(rssPubTimestamp(detectedAt, reviewedAt)).toUTCString();
}

// timestamps: array of epoch ms. Empty -> undefined (omit <lastBuildDate>).
// Compares numbers, never formatted strings. Never uses the current time.
export function latestBuildDate(timestamps) {
  if (!Array.isArray(timestamps) || timestamps.length === 0) return undefined;
  let max = -Infinity;
  for (const t of timestamps) {
    if (typeof t !== 'number' || Number.isNaN(t)) throw new Error('Invalid pubDate timestamp');
    if (t > max) max = t;
  }
  return new Date(max).toUTCString();
}

// items: [{ pubMs: number, anchor: string }] -> NEW array,
// newest pubMs first, tie-breaker anchor ASC (never formatted strings).
export function sortRssItems(items) {
  return [...items].sort((a, b) => {
    if (a.pubMs !== b.pubMs) return b.pubMs - a.pubMs;
    return a.anchor < b.anchor ? -1 : a.anchor > b.anchor ? 1 : 0;
  });
}
