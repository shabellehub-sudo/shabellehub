// lib/monitoring/sources.js
// Maps a tool to the official URL to monitor for changes. Defaults to the
// tool's own `website` field. Add an entry here to override with a
// dedicated pricing/changelog page for a specific tool.
const OVERRIDES = {
  // Tools whose main website blocks automated requests (403/bot-detection) —
  // point monitoring at a friendlier page instead (e.g. their pricing page).
  'claude': 'https://claude.com/pricing',
};

export function getMonitoringUrl(tool) {
  if (OVERRIDES[tool.slug]) return OVERRIDES[tool.slug];
  return tool.website || null;
}
