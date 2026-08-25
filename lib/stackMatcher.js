/**
 * Smart Stack Matcher — Phase 4.3 Core Matching Logic
 *
 * Builds a 3-tool "Complete AI Stack" bundle around a Primary tool:
 *   Primary        -> the tool the user is currently viewing
 *   Complementary 1 (Asset)        -> different role, shares tags/useCases
 *   Complementary 2 (Distribution) -> different role, shares tags/useCases
 *
 * Pure function, no DB calls, no side effects -- designed to run inside
 * getStaticProps at build time (0 extra runtime Supabase reads).
 */

// Category -> workflow role. Every one of the 14 live Supabase categories
// (confirmed 2026-08-25 after Phase 4.2 normalization) must map to exactly
// one role below -- getComplementaryStack() throws if a tool's category is
// missing from this map, so a future 15th category can't silently fall
// through and produce a broken/empty bundle.
export const CATEGORY_ROLE_MAP = {
  // Creation -- where the content/product originates
  'Writing': 'creation',
  'Coding': 'creation',
  'Research': 'creation',
  'Data Analysis': 'creation',
  'Productivity': 'creation',
  // Asset -- visual/media assets that support the creation
  'Design': 'asset',
  'Image Generation': 'asset',
  'Video Generation': 'asset',
  'Audio': 'asset',
  'Presentation': 'asset',
  // Distribution -- where the output reaches an audience/customer
  'Marketing': 'distribution',
  'Automation': 'distribution',
  'AI Agents': 'distribution',
  'Chatbots': 'distribution',
};

function tagOverlapScore(a, b) {
  const tagsA = new Set(a.tags || []);
  const tagsB = new Set(b.tags || []);
  let score = 0;
  for (const t of tagsB) if (tagsA.has(t)) score++;
  return score;
}

/**
 * @param {object} primary - the tool object currently being viewed (must have .category, .tags, .slug)
 * @param {object[]} allTools - the full published tools list
 * @returns {{ primary: object, asset: object|null, distribution: object|null }}
 */
export function getComplementaryStack(primary, allTools) {
  const primaryRole = CATEGORY_ROLE_MAP[primary.category];
  if (!primaryRole) {
    throw new Error(`getComplementaryStack: unmapped category "${primary.category}" for tool "${primary.slug}" -- add it to CATEGORY_ROLE_MAP`);
  }

  const candidates = allTools.filter((t) => t.slug !== primary.slug);

  function bestForRole(role) {
    if (role === primaryRole) return null; // don't recommend the same role as Primary
    const pool = candidates.filter((t) => CATEGORY_ROLE_MAP[t.category] === role);
    if (pool.length === 0) return null;
    return pool
      .map((t) => ({ tool: t, score: tagOverlapScore(primary, t) }))
      .sort((a, b) => b.score - a.score || (b.tool.rating || 0) - (a.tool.rating || 0))[0].tool;
  }

  return {
    primary,
    asset: bestForRole('asset'),
    distribution: bestForRole('distribution'),
  };
}
