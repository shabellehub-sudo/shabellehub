// lib/monitoring/sources.js
// Maps a tool to the official URL to monitor for changes. Defaults to the
// tool's own `website` field. Add an entry here to override with a
// dedicated pricing/changelog page for a specific tool.
const OVERRIDES = {
  // 'some-tool-slug': 'https://example.com/pricing',
};

export function getMonitoringUrl(tool) {
  if (OVERRIDES[tool.slug]) return OVERRIDES[tool.slug];
  return tool.website || null;
}
