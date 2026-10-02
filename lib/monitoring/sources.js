// lib/monitoring/sources.js
// Maps a tool to an ORDERED chain of candidate URLs to monitor for changes.
// fetchSnapshot tries each candidate in order and stops at the first one
// that returns usable text. Each candidate carries a `type` so the rest of
// the pipeline (classification, dashboard) can reason about trustworthiness:
//
//   official    — the tool's own site/pricing page. Fully trusted.
//   support     — vendor-run help center / blog (still first-party).
//   wikipedia   — informational fallback only; never used as monitoring
//                 change evidence because it can lag official releases.
//   unofficial  — any other third-party page (news, aggregator, etc).
//
// Add or edit entries in OVERRIDES for any tool whose official site blocks
// automated requests (403 / bot-detection / Cloudflare JS challenge).

const OVERRIDES = {
  // Blocks datacenter IPs / bot traffic on the main site — use the
  // official pricing page as the monitoring source.
  claude: [
    { url: 'https://claude.com/pricing', type: 'official' },
  ],
  gemini: [
    { url: 'https://gemini.google/gemini-drops/', type: 'support' },
    { url: 'https://blog.google/products/gemini/', type: 'support' },
  ],
  chatgpt: [
    { url: 'https://openai.com/chatgpt/pricing/', type: 'official' },
    { url: 'https://help.openai.com/en/articles/6825453-chatgpt-release-notes', type: 'support' },
  ],
  notebooklm: [
    { url: 'https://support.google.com/notebooklm', type: 'support' },
  ],
};

// Returns an ordered array of { url, type } candidates to try for a tool.
export function getMonitoringUrls(tool) {
  const candidates = OVERRIDES[tool.slug]
    || (tool.website ? [{ url: tool.website, type: 'official' }] : []);

  // Wikipedia is informational only and must never become monitoring
  // change evidence. If official/support sources fail, runCheck.js
  // can use its existing grounded AI-search fallback.
  return candidates.filter((candidate) => candidate.type !== 'wikipedia');
}

// Convenience: plain URL list, for callers that don't need the type info.
export function getMonitoringUrlList(tool) {
  return getMonitoringUrls(tool).map((c) => c.url);
}
