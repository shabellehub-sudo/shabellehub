// lib/monitoring/sources.js
// Maps a tool to an ORDERED chain of candidate URLs to monitor for changes.
// fetchSnapshot tries each candidate in order and stops at the first one
// that returns usable text. Each candidate carries a `type` so the rest of
// the pipeline (classification, dashboard) can reason about trustworthiness:
//
//   official    — the tool's own site/pricing page. Fully trusted.
//   support     — vendor-run help center / blog (still first-party).
//   wikipedia   — community-maintained. Can lag hours-to-days behind an
//                 official release and is occasionally itself unreachable.
//   unofficial  — any other third-party page (news, aggregator, etc).
//
// Add or edit entries in OVERRIDES for any tool whose official site blocks
// automated requests (403 / bot-detection / Cloudflare JS challenge).

const OVERRIDES = {
  // Blocks datacenter IPs / bot traffic on the main site — chain falls
  // through official pricing -> vendor support/blog -> Wikipedia.
  claude: [
    { url: 'https://claude.com/pricing', type: 'official' },
  ],
  gemini: [
    { url: 'https://support.google.com/gemini/answer/13594961', type: 'support' },
    { url: 'https://blog.google/products/gemini/', type: 'support' },
    { url: 'https://en.wikipedia.org/wiki/Gemini_(chatbot)', type: 'wikipedia' },
  ],
  chatgpt: [
    { url: 'https://openai.com/chatgpt/pricing/', type: 'official' },
    { url: 'https://help.openai.com/en/articles/6825453-chatgpt-release-notes', type: 'support' },
    { url: 'https://en.wikipedia.org/wiki/ChatGPT', type: 'wikipedia' },
  ],
  notebooklm: [
    { url: 'https://support.google.com/notebooklm', type: 'support' },
    { url: 'https://en.wikipedia.org/wiki/NotebookLM', type: 'wikipedia' },
  ],
};

// Returns an ordered array of { url, type } candidates to try for a tool.
export function getMonitoringUrls(tool) {
  if (OVERRIDES[tool.slug]) return OVERRIDES[tool.slug];
  return tool.website ? [{ url: tool.website, type: 'official' }] : [];
}

// Convenience: plain URL list, for callers that don't need the type info.
export function getMonitoringUrlList(tool) {
  return getMonitoringUrls(tool).map((c) => c.url);
}
