// lib/monitoring/sources.js
// Maps a tool to the official URL(s) to monitor for changes. Defaults to
// the tool's own `website` field (as a single-item list). Add an entry
// here to override with dedicated pricing/changelog page(s) for a
// specific tool — list multiple URLs to provide fallbacks: fetchSnapshot
// tries each in order and uses the first one that returns usable text.
const OVERRIDES = {
  // Tools whose main website blocks automated requests (403/bot-detection) —
  // point monitoring at a friendlier page instead (e.g. their pricing page).
  // NOTE: gemini/chatgpt fall back to unofficial secondary sources (Google
  // Support, Wikipedia) since their official sites block datacenter IPs
  // (Google) or run a Cloudflare JS challenge (OpenAI). Expect a lag of
  // hours-to-days between an official release and these pages reflecting it.
  'claude': ['https://claude.com/pricing'],
  'gemini': ['https://support.google.com/gemini/answer/13594961', 'https://blog.google/products/gemini/'],
  'chatgpt': ['https://en.wikipedia.org/wiki/ChatGPT'],
  'notebooklm': ['https://en.wikipedia.org/wiki/NotebookLM'],
};

// Returns an ordered array of candidate URLs to try for a tool.
export function getMonitoringUrls(tool) {
  if (OVERRIDES[tool.slug]) return OVERRIDES[tool.slug];
  return tool.website ? [tool.website] : [];
}
