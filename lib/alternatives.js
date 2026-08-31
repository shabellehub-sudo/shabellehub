// lib/alternatives.js
// Pure resolution logic for the dedicated /tools/[slug]/alternatives page.
// Mirrors the inline related-tools logic already in pages/tools/[slug].js,
// but does not cap the result at 3 (the dedicated page shows every valid
// alternative), and is exported separately so it can be used at build time
// for getStaticPaths/sitemap eligibility without any React dependency.

const MIN_ALTERNATIVES_TO_SHOW = 3;

// Resolves alternatives for a tool. Returns { items, source } where source
// is 'explicit' (from tool.alternatives) or 'category' (fallback). Never
// fabricates an entry -- a slug in tool.alternatives that doesn't match a
// real tool in allTools is silently dropped, and a tool never lists itself.
//
// Per spec: falls back to category when explicit alternatives are MISSING
// *or* TOO FEW (fewer than MIN_ALTERNATIVES_TO_SHOW) -- not only when
// there are exactly zero explicit matches. If explicit already meets the
// threshold, it is used as-is (never padded/merged with category matches).
export function resolveAlternatives(tool, allTools) {
  let explicitItems = [];
  if (tool.alternatives && tool.alternatives.length > 0) {
    explicitItems = tool.alternatives
      .map((slug) => allTools.find((t) => t.slug === slug))
      .filter(Boolean)
      .filter((t) => t.slug !== tool.slug);
  }
  if (explicitItems.length >= MIN_ALTERNATIVES_TO_SHOW) {
    return { items: explicitItems, source: 'explicit' };
  }
  const categoryItems = allTools.filter((t) => t.category === tool.category && t.id !== tool.id);
  if (categoryItems.length >= MIN_ALTERNATIVES_TO_SHOW) {
    return { items: categoryItems, source: 'category' };
  }
  // Neither source clears the threshold -- return whichever is non-empty
  // (or explicit, if both are empty) so callers still have something to
  // inspect; isAlternativesPageEligible() below is what actually gates
  // whether a page gets generated, so this doesn't imply eligibility.
  return explicitItems.length > 0
    ? { items: explicitItems, source: 'explicit' }
    : { items: categoryItems, source: 'category' };
}

// A dedicated alternatives page is only worth generating when there are
// enough real alternatives to show -- fewer than MIN_ALTERNATIVES_TO_SHOW
// would be thin, near-duplicate content (same as the tool page's own
// "Similar Tools" section), so no page is generated for those tools.
export function isAlternativesPageEligible(tool, allTools) {
  const { items } = resolveAlternatives(tool, allTools);
  return items.length >= MIN_ALTERNATIVES_TO_SHOW;
}

export { MIN_ALTERNATIVES_TO_SHOW };
