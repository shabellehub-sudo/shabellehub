import assert from 'node:assert';
import { computeToolPriority, selectBatch } from '../lib/monitoring/priority.js';

let n = 0;
function check(label, fn) {
  n++;
  try { fn(); console.log(`  ok  ${n}. ${label}`); }
  catch (e) { console.log(`FAIL  ${n}. ${label} -> ${e.message}`); process.exitCode = 1; }
}

check('1. High-change tools score higher than stable observed tools', () => {
  const active = computeToolPriority({ recentChangeCount: 3, recentFailureCount: 0, daysSinceLastCheck: 2 });
  const stable = computeToolPriority({ recentChangeCount: 0, recentFailureCount: 0, daysSinceLastCheck: 2 });
  assert.ok(active.score > stable.score);
});

check('2. Failures reduce score (capped at -9), never increase it', () => {
  const withF = computeToolPriority({ recentChangeCount: 2, recentFailureCount: 10, daysSinceLastCheck: 5 });
  const noF = computeToolPriority({ recentChangeCount: 2, recentFailureCount: 0, daysSinceLastCheck: 5 });
  assert.ok(withF.score < noF.score);
  assert.strictEqual(noF.score - withF.score, 9);
});

check('3a. A failing tool with zero changes does not outscore an active non-failing tool', () => {
  const failing = computeToolPriority({ recentChangeCount: 0, recentFailureCount: 20, daysSinceLastCheck: 1 });
  const active = computeToolPriority({ recentChangeCount: 1, recentFailureCount: 0, daysSinceLastCheck: 1 });
  assert.ok(active.score > failing.score);
});

check('cold-start gets the fixed baseline, not zero', () => {
  const cold = computeToolPriority({ recentChangeCount: 0, recentFailureCount: 0, daysSinceLastCheck: null });
  assert.strictEqual(cold.breakdown.baseScore, 5);
});

check('aging boost caps at 20 days (10 points)', () => {
  const at20 = computeToolPriority({ recentChangeCount: 0, recentFailureCount: 0, daysSinceLastCheck: 20 });
  const at40 = computeToolPriority({ recentChangeCount: 0, recentFailureCount: 0, daysSinceLastCheck: 40 });
  assert.strictEqual(at20.score, at40.score);
  assert.strictEqual(at20.breakdown.agingScore, 10);
});

check('4/5. GUARANTEE: an overdue tool is selected even when 79 other tools permanently outscore it (no starvation)', () => {
  const targetSlug = 'starved-tool';
  const otherSlugs = Array.from({ length: 79 }, (_, i) => `high-scorer-${i}`);
  const slugs = [targetSlug, ...otherSlugs];
  const priorityBySlug = new Map();
  priorityBySlug.set(targetSlug, { score: 1 });
  for (const s of otherSlugs) priorityBySlug.set(s, { score: 9999 });
  const daysSinceLastCheckBySlug = new Map();
  daysSinceLastCheckBySlug.set(targetSlug, 20);
  for (const s of otherSlugs) daysSinceLastCheckBySlug.set(s, 0);
  const batch = selectBatch(slugs, priorityBySlug, daysSinceLastCheckBySlug, 0, 40, { reservedOverdueSlots: 10, overdueThresholdDays: 20 });
  assert.ok(batch.includes(targetSlug), `starved-tool (score=1) must be selected via the forced lane despite ${otherSlugs.length} tools scoring 9999`);
});

check('6a. Forced lane uses the cursor for fair rotation when overdue-eligible pool exceeds reserved slots', () => {
  const slugs = Array.from({ length: 20 }, (_, i) => `t${i}`);
  const priorityBySlug = new Map(slugs.map((s) => [s, { score: 0 }]));
  const daysSinceLastCheckBySlug = new Map(slugs.map((s) => [s, 25]));
  const batchAtCursor0 = selectBatch(slugs, priorityBySlug, daysSinceLastCheckBySlug, 0, 5, { reservedOverdueSlots: 5, overdueThresholdDays: 20 });
  const batchAtCursor10 = selectBatch(slugs, priorityBySlug, daysSinceLastCheckBySlug, 10, 5, { reservedOverdueSlots: 5, overdueThresholdDays: 20 });
  assert.notDeepStrictEqual(batchAtCursor0, batchAtCursor10);
  assert.deepStrictEqual(batchAtCursor0, ['t0', 't1', 't2', 't3', 't4']);
  assert.deepStrictEqual(batchAtCursor10, ['t10', 't11', 't12', 't13', 't14']);
});

check('6b. Stage-2 (priority-ranked) also uses cursor as score tie-break, not just stage 1', () => {
  const slugs = ['a', 'b', 'c', 'd'];
  const priorityBySlug = new Map(slugs.map((s) => [s, { score: 10 }]));
  const daysSinceLastCheckBySlug = new Map(slugs.map((s) => [s, 0]));
  const batch = selectBatch(slugs, priorityBySlug, daysSinceLastCheckBySlug, 2, 4, { reservedOverdueSlots: 0, overdueThresholdDays: 999 });
  assert.deepStrictEqual(batch, ['c', 'd', 'a', 'b']);
});

check('never-checked (null) tools count as overdue-eligible for the forced lane', () => {
  const slugs = ['known', 'brand-new'];
  const priorityBySlug = new Map([['known', { score: 50 }], ['brand-new', { score: 5 }]]);
  const daysSinceLastCheckBySlug = new Map([['known', 0]]);
  const batch = selectBatch(slugs, priorityBySlug, daysSinceLastCheckBySlug, 0, 1, { reservedOverdueSlots: 1, overdueThresholdDays: 20 });
  assert.deepStrictEqual(batch, ['brand-new']);
});

check('reservedOverdueSlots never exceeds batchSize even if configured larger', () => {
  const slugs = ['a', 'b'];
  const priorityBySlug = new Map(slugs.map((s) => [s, { score: 0 }]));
  const daysSinceLastCheckBySlug = new Map(slugs.map((s) => [s, 99]));
  const batch = selectBatch(slugs, priorityBySlug, daysSinceLastCheckBySlug, 0, 1, { reservedOverdueSlots: 10, overdueThresholdDays: 20 });
  assert.strictEqual(batch.length, 1);
});

check('no duplicate slug ever appears in the same batch (forced lane and stage-2 never overlap)', () => {
  const slugs = Array.from({ length: 50 }, (_, i) => `t${i}`);
  const priorityBySlug = new Map(slugs.map((s, i) => [s, { score: i }]));
  const daysSinceLastCheckBySlug = new Map(slugs.map((s, i) => [s, i % 25]));
  const batch = selectBatch(slugs, priorityBySlug, daysSinceLastCheckBySlug, 7, 20, { reservedOverdueSlots: 10, overdueThresholdDays: 20 });
  const uniq = new Set(batch);
  assert.strictEqual(uniq.size, batch.length, 'batch must not contain duplicate slugs');
});

check('multi-run: a tool outside the first reserved-slot window at cursor=0 is eventually selected as the cursor rotates', () => {
  const slugs = Array.from({ length: 30 }, (_, i) => `t${i}`);
  const priorityBySlug = new Map(slugs.map((s) => [s, { score: 0 }]));
  const daysSinceLastCheckBySlug = new Map(slugs.map((s) => [s, 25]));
  const targetSlug = 't25';
  const BATCH_SIZE_SIM = 12;
  const RESERVED_SIM = 10;
  let found = false;
  let cursor = 0;
  let runs = 0;
  while (!found && runs < 15) {
    const batch = selectBatch(slugs, priorityBySlug, daysSinceLastCheckBySlug, cursor, BATCH_SIZE_SIM, { reservedOverdueSlots: RESERVED_SIM, overdueThresholdDays: 20 });
    if (batch.includes(targetSlug)) found = true;
    cursor = (cursor + BATCH_SIZE_SIM) % slugs.length;
    runs++;
  }
  assert.ok(found, `t25 must be selected within a bounded number of cursor rotations (checked ${runs} simulated runs)`);
});

check('PRODUCTION-SCALE: cursor stepping by +1 makes all 100 tools forced-lane-reachable across a full rotation (the fix)', () => {
  const TOTAL = 100;
  const BATCH = 40;
  const RESERVED = 10;
  const slugs = Array.from({ length: TOTAL }, (_, i) => `tool-${i}`);
  const priorityBySlug = new Map(slugs.map((s) => [s, { score: 0 }]));
  const daysSinceLastCheckBySlug = new Map(slugs.map((s) => [s, 25]));
  const everSelectedViaForcedLane = new Set();
  let cursor = 0;
  for (let run = 0; run < TOTAL; run++) {
    const batch = selectBatch(slugs, priorityBySlug, daysSinceLastCheckBySlug, cursor, BATCH, { reservedOverdueSlots: RESERVED, overdueThresholdDays: 20 });
    for (const slug of batch.slice(0, RESERVED)) everSelectedViaForcedLane.add(slug);
    cursor = (cursor + 1) % TOTAL;
  }
  assert.strictEqual(everSelectedViaForcedLane.size, TOTAL, `expected all ${TOTAL} tools reachable via the forced lane with +1 stepping, got ${everSelectedViaForcedLane.size}`);
});

check('REGRESSION GUARD: the old +=BATCH_SIZE(40) stepping (gcd=20) provably strands exactly half of a 100-tool space', () => {
  const TOTAL = 100;
  const BATCH = 40;
  const RESERVED = 10;
  const slugs = Array.from({ length: TOTAL }, (_, i) => `tool-${i}`);
  const priorityBySlug = new Map(slugs.map((s) => [s, { score: 0 }]));
  const daysSinceLastCheckBySlug = new Map(slugs.map((s) => [s, 25]));
  const everSelected = new Set();
  const visitedCursors = new Set();
  let cursor = 0;
  for (let run = 0; run < 20 && !visitedCursors.has(cursor); run++) {
    visitedCursors.add(cursor);
    const batch = selectBatch(slugs, priorityBySlug, daysSinceLastCheckBySlug, cursor, BATCH, { reservedOverdueSlots: RESERVED, overdueThresholdDays: 20 });
    for (const slug of batch.slice(0, RESERVED)) everSelected.add(slug);
    cursor = (cursor + BATCH) % TOTAL;
  }
  assert.strictEqual(visitedCursors.size, 5, 'gcd(40,100)=20 means only 5 distinct cursor positions are ever visited by +=BATCH_SIZE stepping');
  assert.strictEqual(everSelected.size, 50, 'exactly half the tool space is permanently unreachable under the old +=BATCH_SIZE stepping');
});

check('no duplicates hold even at production scale across the full +1 rotation', () => {
  const TOTAL = 100;
  const BATCH = 40;
  const slugs = Array.from({ length: TOTAL }, (_, i) => `tool-${i}`);
  const priorityBySlug = new Map(slugs.map((s, i) => [s, { score: i % 7 }]));
  const daysSinceLastCheckBySlug = new Map(slugs.map((s, i) => [s, i % 25]));
  let cursor = 0;
  for (let run = 0; run < TOTAL; run++) {
    const batch = selectBatch(slugs, priorityBySlug, daysSinceLastCheckBySlug, cursor, BATCH, { reservedOverdueSlots: 10, overdueThresholdDays: 20 });
    assert.strictEqual(new Set(batch).size, batch.length, `duplicate found in batch at cursor=${cursor}`);
    cursor = (cursor + 1) % TOTAL;
  }
});

console.log(`\n${n} checks run.`);
