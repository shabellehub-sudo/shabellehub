// lib/comparisons.js
// Pure pair-resolution logic for dedicated tool-vs-tool comparison pages.
// Pair source is restricted to curated `tool.alternatives` relationships
// ONLY -- never full same-category cross-product. Audit confirmed that
// using all same-category pairs would generate 405 pages across the
// current 100-tool catalog (a combinatorial explosion / thin-content
// risk), vs. a much smaller, editorially-curated set from alternatives.

// Canonical ordering: "chatgpt vs claude" and "claude vs chatgpt" must
// always resolve to exactly one URL, so every pair is sorted the same way
// regardless of which tool's `alternatives` array produced it.
export function canonicalPairSlugs(slugA, slugB) {
  return slugA < slugB ? [slugA, slugB] : [slugB, slugA];
}

export function comparisonUrl(slugA, slugB) {
  const [s1, s2] = canonicalPairSlugs(slugA, slugB);
  return `/compare/${s1}-vs-${s2}`;
}

// Returns every valid, deduplicated, canonically-ordered comparison pair
// derivable from allTools' `alternatives` relationships. A pair is valid
// when at least one tool explicitly lists the other AND both tools
// actually exist in allTools -- a dangling slug reference is dropped
// rather than fabricated into a pair.
export function getAllComparisonPairs(allTools) {
  const slugToTool = new Map(allTools.map((t) => [t.slug, t]));
  const seen = new Set();
  const pairs = [];

  for (const tool of allTools) {
    if (!tool.alternatives || tool.alternatives.length === 0) continue;
    for (const altSlug of tool.alternatives) {
      if (altSlug === tool.slug) continue;
      const altTool = slugToTool.get(altSlug);
      if (!altTool) continue;

      const [s1, s2] = canonicalPairSlugs(tool.slug, altSlug);
      const key = `${s1}|${s2}`;
      if (seen.has(key)) continue;
      seen.add(key);

      pairs.push({ slug1: s1, slug2: s2, tool1: slugToTool.get(s1), tool2: slugToTool.get(s2) });
    }
  }
  return pairs;
}

// Resolves a specific pair by its two slugs, in either order. Returns null
// if either tool doesn't exist, or if neither direction of the
// alternatives relationship links them (i.e. not a curated pair -- refuses
// to fabricate a comparison between two unrelated tools just because both
// happen to exist).
export function resolveComparisonPair(slugA, slugB, allTools) {
  const slugToTool = new Map(allTools.map((t) => [t.slug, t]));
  const toolA = slugToTool.get(slugA);
  const toolB = slugToTool.get(slugB);
  if (!toolA || !toolB) return null;

  const aListsB = Array.isArray(toolA.alternatives) && toolA.alternatives.includes(slugB);
  const bListsA = Array.isArray(toolB.alternatives) && toolB.alternatives.includes(slugA);
  if (!aListsB && !bListsA) return null;

  const [s1, s2] = canonicalPairSlugs(slugA, slugB);
  return { slug1: s1, slug2: s2, tool1: slugToTool.get(s1), tool2: slugToTool.get(s2) };
}

// Thin-content guard: both tools must have the core structured fields the
// page renders. Currently 100/100 published tools have these fields
// (confirmed via Supabase), so this mainly protects against a future tool
// missing data, not today's catalog.
const REQUIRED_FIELDS = ['category', 'rating', 'price'];
export function isComparisonPairEligible(pair) {
  if (!pair) return false;
  return [pair.tool1, pair.tool2].every((t) =>
    REQUIRED_FIELDS.every((f) => t[f] !== undefined && t[f] !== null && t[f] !== '')
  );
}

// Parses a "/compare/[pair]" route param (e.g. "copy-ai-vs-notion-ai") back
// into its two slugs. A naive single split on the first "-vs-" occurrence
// would break for slugs that themselves contain hyphens (e.g. "copy-ai"),
// so this tries every occurrence of the "-vs-" marker and accepts the
// first split where BOTH halves match a real, known tool slug -- avoiding
// any hardcoded assumption about slug shape.
export function parsePairParam(param, allTools) {
  const slugs = new Set(allTools.map((t) => t.slug));
  const marker = '-vs-';
  let idx = param.indexOf(marker);
  while (idx !== -1) {
    const left = param.slice(0, idx);
    const right = param.slice(idx + marker.length);
    if (slugs.has(left) && slugs.has(right)) {
      return [left, right];
    }
    idx = param.indexOf(marker, idx + 1);
  }
  return null;
}
