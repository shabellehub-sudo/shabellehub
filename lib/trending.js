// lib/trending.js — SERVER-ONLY (import from getStaticProps/API routes)
// Aggregates public.tool_events into two rankings:
//   - "this week": most clicks in the last 7 days
//   - "fastest growing": biggest % increase comparing the last 7 days
//     against the 7 days before that (needs at least a few days of
//     history in both windows to mean anything — see minEvents below)
//
// Both gracefully return an empty array if Supabase isn't configured,
// the table has no rows yet, or the query fails — callers should fall
// back to the static `hot` flag (see components/home/Trending/TrendingSection.jsx).

import { getSupabaseAdmin } from './supabaseAdmin';
import { tools } from '../data';

const DAY_MS = 24 * 60 * 60 * 1000;

function countByTool(rows) {
  const counts = new Map();
  for (const row of rows) {
    counts.set(row.tool_id, (counts.get(row.tool_id) || 0) + 1);
  }
  return counts;
}

function attachToolData(toolId, count, extra = {}) {
  const tool = tools.find((t) => t.id === toolId);
  if (!tool) return null; // stale event referencing a since-removed tool
  return { ...tool, eventCount: count, ...extra };
}

/**
 * getTrendingThisWeek — top N tools by click count in the last `days`.
 */
export async function getTrendingThisWeek({ days = 7, limit = 6 } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return [];

  const since = new Date(Date.now() - days * DAY_MS).toISOString();
  const { data, error } = await admin
    .from('tool_events')
    .select('tool_id')
    .eq('event_type', 'click')
    .gte('created_at', since);

  if (error || !data) return [];

  const counts = countByTool(data);
  return [...counts.entries()]
    .map(([toolId, count]) => attachToolData(toolId, count))
    .filter(Boolean)
    .sort((a, b) => b.eventCount - a.eventCount)
    .slice(0, limit);
}

/**
 * getFastestGrowing — tools whose click count grew the most, comparing
 * the last `days` window against the `days` window immediately before
 * it. `minEvents` guards against a tool with 1 click going to 3 clicks
 * showing up as "+200%" — noise, not a real trend.
 */
export async function getFastestGrowing({ days = 7, limit = 6, minEvents = 3 } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return [];

  const now = Date.now();
  const recentSince = new Date(now - days * DAY_MS).toISOString();
  const priorSince = new Date(now - days * 2 * DAY_MS).toISOString();
  const priorUntil = recentSince;

  const [{ data: recentData, error: recentErr }, { data: priorData, error: priorErr }] =
    await Promise.all([
      admin.from('tool_events').select('tool_id').eq('event_type', 'click').gte('created_at', recentSince),
      admin.from('tool_events').select('tool_id').eq('event_type', 'click').gte('created_at', priorSince).lt('created_at', priorUntil),
    ]);

  if (recentErr || priorErr || !recentData) return [];

  const recentCounts = countByTool(recentData);
  const priorCounts = countByTool(priorData || []);

  const growth = [...recentCounts.entries()]
    .filter(([, count]) => count >= minEvents)
    .map(([toolId, recentCount]) => {
      const priorCount = priorCounts.get(toolId) || 0;
      // Avoid divide-by-zero: treat "0 -> N" as a clean +100%*N-scaled
      // signal rather than Infinity, so brand-new-but-popular tools can
      // still rank sensibly against tools with an established baseline.
      const growthRate = priorCount === 0 ? recentCount : (recentCount - priorCount) / priorCount;
      return { toolId, recentCount, priorCount, growthRate };
    })
    .sort((a, b) => b.growthRate - a.growthRate)
    .slice(0, limit)
    .map(({ toolId, recentCount, growthRate }) =>
      attachToolData(toolId, recentCount, { growthPct: Math.round(growthRate * 100) })
    )
    .filter(Boolean);

  return growth;
}
