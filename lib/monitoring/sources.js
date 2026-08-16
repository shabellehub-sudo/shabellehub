// lib/monitoring/sources.js
// Maps a tool to the official URL to monitor for changes. Defaults to the
// tool's own `website` field. Add an entry here to override with a
// dedicated pricing/changelog page for a specific tool.
const OVERRIDES = {
  // Tools whose main website blocks automated requests (403/bot-detection) —
  // point monitoring at a friendlier page instead (e.g. their pricing page).
  // NOTE: gemini/chatgpt point to unofficial secondary sources (Google
  // Support, Wikipedia) since their official sites block datacenter IPs
  // (Google) or run a Cloudflare JS challenge (OpenAI). Expect a lag of
  // hours-to-days between an official release and these pages reflecting it.
  'claude': 'https://claude.com/pricing',
  'gemini': 'https://support.google.com/gemini/answer/13594961',
  'chatgpt': 'https://en.wikipedia.org/wiki/ChatGPT', // help.openai.com and openai.com are behind a Cloudflare JS challenge (cf-mitigated: challenge) — unofficial but reliably fetchable
};

export function getMonitoringUrl(tool) {
  if (OVERRIDES[tool.slug]) return OVERRIDES[tool.slug];
  return tool.website || null;
}
