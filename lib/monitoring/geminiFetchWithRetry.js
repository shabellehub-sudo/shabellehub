const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 3;

export async function geminiFetchWithRetry(url, options = {}) {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    let res = null;

    try {
      res = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(30000),
      });
    } catch {}

    if (res?.ok) return res;

    const status = res?.status ?? "network/timeout";

    if (res && !RETRYABLE.has(res.status)) {
      console.warn(`[gemini] HTTP ${status}, not retryable`);
      return null;
    }

    if (i === MAX_ATTEMPTS - 1) break;

    const ra = Number(res?.headers.get("retry-after"));
    const base = 1000 * 2 ** i;

    const ms =
      ra > 0
        ? Math.min(ra * 1000, 15000)
        : base / 2 + Math.random() * (base / 2);

    console.warn(
      `[gemini] HTTP ${status}, retry ${i + 1}/${MAX_ATTEMPTS - 1} ` +
      `in ${Math.round(ms)}ms (retry-after: ${ra > 0})`
    );

    await new Promise((r) => setTimeout(r, ms));
  }

  console.warn("[gemini] retries exhausted, using keyword fallback");
  return null;
}
