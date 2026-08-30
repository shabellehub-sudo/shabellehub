// lib/monitoring/priority.js
const CHANGE_WEIGHT = 10;
const COLD_START_BASE = 5;
const AGING_WEIGHT_PER_DAY = 0.5;
const AGING_CAP_DAYS = 20;
const FAILURE_PENALTY_PER_FAILURE = 3;
const FAILURE_PENALTY_CAP = 9;

export function computeToolPriority({ recentChangeCount = 0, recentFailureCount = 0, daysSinceLastCheck = null }) {
  const changeScore = recentChangeCount * CHANGE_WEIGHT;
  const isNeverChecked = daysSinceLastCheck === null;
  const baseScore = (recentChangeCount === 0 && isNeverChecked) ? COLD_START_BASE : 0;
  const effectiveDays = isNeverChecked ? AGING_CAP_DAYS : Math.min(daysSinceLastCheck, AGING_CAP_DAYS);
  const agingScore = effectiveDays * AGING_WEIGHT_PER_DAY;
  const failurePenalty = Math.min(recentFailureCount * FAILURE_PENALTY_PER_FAILURE, FAILURE_PENALTY_CAP);
  const score = changeScore + baseScore + agingScore - failurePenalty;
  return { score, breakdown: { changeScore, baseScore, agingScore, failurePenalty, recentFailureCount } };
}

export function selectBatch(slugs, priorityBySlug, daysSinceLastCheckBySlug, cursorIndex, batchSize, opts = {}) {
  const { reservedOverdueSlots = 0, overdueThresholdDays = Infinity } = opts;
  const n = slugs.length;
  if (n === 0) return [];
  const distanceFromCursor = (i) => (i - cursorIndex + n) % n;
  const indexed = slugs.map((slug, i) => ({ slug, i }));
  const overdueEligible = indexed.filter(({ slug }) => {
    const days = daysSinceLastCheckBySlug.get(slug);
    return days === null || days === undefined || days >= overdueThresholdDays;
  });
  overdueEligible.sort((a, b) => distanceFromCursor(a.i) - distanceFromCursor(b.i));
  const forced = overdueEligible.slice(0, Math.min(reservedOverdueSlots, batchSize));
  const forcedSlugs = new Set(forced.map((f) => f.slug));
  const remainingSlots = Math.max(batchSize - forced.length, 0);
  const scored = indexed
    .filter(({ slug }) => !forcedSlugs.has(slug))
    .map(({ slug, i }) => ({
      slug,
      score: priorityBySlug.get(slug)?.score ?? 0,
      tieBreakDistance: distanceFromCursor(i),
    }));
  scored.sort((a, b) => (b.score !== a.score ? b.score - a.score : a.tieBreakDistance - b.tieBreakDistance));
  const rankedRest = scored.slice(0, remainingSlots).map((s) => s.slug);
  return [...forced.map((f) => f.slug), ...rankedRest];
}
