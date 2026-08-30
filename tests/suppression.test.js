import assert from 'node:assert';
import { shouldSuppress } from '../lib/monitoring/suppression.js';

let n = 0;
async function check(label, fn) {
  n++;
  const num = n;
  try { await fn(); console.log(`  ok  ${num}. ${label}`); }
  catch (e) { console.log(`FAIL  ${num}. ${label} -> ${e.message}`); process.exitCode = 1; }
}

function makeMockDb(rows, { errorOnQuery = null } = {}) {
  return {
    from() {
      return {
        select() {
          return {
            eq(col, val) {
              return {
                order() {
                  return {
                    limit(n) {
                      if (errorOnQuery) return Promise.resolve({ data: null, error: errorOnQuery });
                      const filtered = rows.filter((r) => r.tool_slug === val);
                      const sorted = [...filtered].sort((a, b) => (a.detected_at < b.detected_at ? 1 : -1));
                      return Promise.resolve({
                        data: sorted.slice(0, n).map((r) => ({ id: r.id, doc: r.doc })),
                        error: null,
                      });
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
  };
}

function change({ tool_slug, change_category, evidence_url, status, detected_at }) {
  return { tool_slug, detected_at, doc: { change_category, evidence_url, status, detected_at } };
}

await check('1. 3 matching dismissals -> true', async () => {
  const rows = [
    change({ tool_slug: 't1', change_category: 'pricing', evidence_url: 'u1', status: 'dismissed', detected_at: '2026-08-01' }),
    change({ tool_slug: 't1', change_category: 'pricing', evidence_url: 'u1', status: 'dismissed', detected_at: '2026-08-05' }),
    change({ tool_slug: 't1', change_category: 'pricing', evidence_url: 'u1', status: 'dismissed', detected_at: '2026-08-10' }),
  ];
  const db = makeMockDb(rows);
  const result = await shouldSuppress(db, 't1', 'pricing', 'u1');
  assert.strictEqual(result, true);
});

await check('2. 2 matching dismissals -> false (below threshold)', async () => {
  const rows = [
    change({ tool_slug: 't1', change_category: 'pricing', evidence_url: 'u1', status: 'dismissed', detected_at: '2026-08-01' }),
    change({ tool_slug: 't1', change_category: 'pricing', evidence_url: 'u1', status: 'dismissed', detected_at: '2026-08-05' }),
  ];
  const db = makeMockDb(rows);
  const result = await shouldSuppress(db, 't1', 'pricing', 'u1');
  assert.strictEqual(result, false);
});

await check('3. CORE BUG FIX: 3 matching dismissals + 10 unrelated NEWER changes -> still true', async () => {
  const rows = [
    change({ tool_slug: 't1', change_category: 'pricing', evidence_url: 'u1', status: 'dismissed', detected_at: '2026-07-01' }),
    change({ tool_slug: 't1', change_category: 'pricing', evidence_url: 'u1', status: 'dismissed', detected_at: '2026-07-02' }),
    change({ tool_slug: 't1', change_category: 'pricing', evidence_url: 'u1', status: 'dismissed', detected_at: '2026-07-03' }),
    ...Array.from({ length: 10 }, (_, i) =>
      change({ tool_slug: 't1', change_category: 'model_update', evidence_url: 'u2', status: 'pending_review', detected_at: `2026-08-${10 + i}` })
    ),
  ];
  const db = makeMockDb(rows);
  const result = await shouldSuppress(db, 't1', 'pricing', 'u1');
  assert.strictEqual(result, true, 'the fix must find the 3 matching dismissals regardless of how many unrelated changes came after them');
});

await check('3b. sanity check: the OLD LOOKBACK=5 behavior would have failed this exact case', async () => {
  const rows = [
    change({ tool_slug: 't1', change_category: 'pricing', evidence_url: 'u1', status: 'dismissed', detected_at: '2026-07-01' }),
    change({ tool_slug: 't1', change_category: 'pricing', evidence_url: 'u1', status: 'dismissed', detected_at: '2026-07-02' }),
    change({ tool_slug: 't1', change_category: 'pricing', evidence_url: 'u1', status: 'dismissed', detected_at: '2026-07-03' }),
    ...Array.from({ length: 10 }, (_, i) =>
      change({ tool_slug: 't1', change_category: 'model_update', evidence_url: 'u2', status: 'pending_review', detected_at: `2026-08-${10 + i}` })
    ),
  ];
  const sortedDesc = [...rows].sort((a, b) => (a.detected_at < b.detected_at ? 1 : -1));
  const oldBuggyWindow = sortedDesc.slice(0, 5);
  const matchingWithinOldWindow = oldBuggyWindow.filter((r) => r.doc.change_category === 'pricing' && r.doc.evidence_url === 'u1');
  assert.strictEqual(matchingWithinOldWindow.length, 0, 'confirms the old LOOKBACK=5-of-any-category approach would find zero matches here');
});

await check('4. DB error -> false (fail-open)', async () => {
  const db = makeMockDb([], { errorOnQuery: { message: 'connection reset' } });
  const result = await shouldSuppress(db, 't1', 'pricing', 'u1');
  assert.strictEqual(result, false);
});

await check('exact category+url match required -- different evidence_url does not count', async () => {
  const rows = [
    change({ tool_slug: 't1', change_category: 'pricing', evidence_url: 'official.com', status: 'dismissed', detected_at: '2026-08-01' }),
    change({ tool_slug: 't1', change_category: 'pricing', evidence_url: 'official.com', status: 'dismissed', detected_at: '2026-08-02' }),
    change({ tool_slug: 't1', change_category: 'pricing', evidence_url: 'support.com', status: 'dismissed', detected_at: '2026-08-03' }),
  ];
  const db = makeMockDb(rows);
  const result = await shouldSuppress(db, 't1', 'pricing', 'official.com');
  assert.strictEqual(result, false, 'only 2 rows match evidence_url=official.com, below threshold');
});

await check('most-recent-3 semantics: a stale 4th-oldest dismissal outside the top-3 window does not count when the most recent matching entry is not dismissed', async () => {
  const rows = [
    change({ tool_slug: 't1', change_category: 'pricing', evidence_url: 'u1', status: 'dismissed', detected_at: '2026-01-01' }),
    change({ tool_slug: 't1', change_category: 'pricing', evidence_url: 'u1', status: 'dismissed', detected_at: '2026-06-01' }),
    change({ tool_slug: 't1', change_category: 'pricing', evidence_url: 'u1', status: 'dismissed', detected_at: '2026-07-01' }),
    change({ tool_slug: 't1', change_category: 'pricing', evidence_url: 'u1', status: 'confirmed', detected_at: '2026-08-01' }),
  ];
  const db = makeMockDb(rows);
  const result = await shouldSuppress(db, 't1', 'pricing', 'u1');
  assert.strictEqual(
    result, false,
    'the most recent 3 matching entries are [confirmed, dismissed, dismissed] -- the stale 4th-oldest dismissal must NOT count toward the threshold'
  );
});

await check('most-recent-3 semantics (positive case): with the same 4-record shape, if the 3 MOST RECENT are all dismissed, the stale 4th does not block suppression', async () => {
  const rows = [
    change({ tool_slug: 't1', change_category: 'pricing', evidence_url: 'u1', status: 'confirmed', detected_at: '2026-01-01' }),
    change({ tool_slug: 't1', change_category: 'pricing', evidence_url: 'u1', status: 'dismissed', detected_at: '2026-06-01' }),
    change({ tool_slug: 't1', change_category: 'pricing', evidence_url: 'u1', status: 'dismissed', detected_at: '2026-07-01' }),
    change({ tool_slug: 't1', change_category: 'pricing', evidence_url: 'u1', status: 'dismissed', detected_at: '2026-08-01' }),
  ];
  const db = makeMockDb(rows);
  const result = await shouldSuppress(db, 't1', 'pricing', 'u1');
  assert.strictEqual(
    result, true,
    'the most recent 3 matching entries are all dismissed -- an older 4th entry being "confirmed" must not block suppression'
  );
});

console.log(`\n${n} checks run.`);
