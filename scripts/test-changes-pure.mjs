// scripts/test-changes-pure.mjs
// Plain Node, no framework. Run from the repo root:
//   node --input-type=module -e "await import('./scripts/test-changes-pure.mjs')"
import { assignAnchors, normalizeDetectedAt } from '../lib/changes/anchors.js';
import { rssPubDate, rssPubTimestamp, latestBuildDate, sortRssItems } from '../lib/changes/rssDates.js';

let failed = 0;
function show(label, actual, expected) {
  const a = JSON.stringify(actual);
  const ok = expected === undefined ? true : a === JSON.stringify(expected);
  if (!ok) failed += 1;
  console.log(`${label}: ${ok ? 'PASS' : 'FAIL'}  actual=${a}${expected === undefined ? '' : `  expected=${JSON.stringify(expected)}`}`);
}
function throws(label, fn) {
  try { const v = fn(); failed += 1; console.log(`${label}: FAIL  did not throw, returned=${JSON.stringify(v)}`); }
  catch (e) { console.log(`${label}: PASS  threw="${e.message}"`); }
}
const list = (rows) => assignAnchors(rows).map((r) => `${r.id}=${r.anchor}`);
const D = '2026-09-21T10:00:00.000Z';

// A: three same tool/date
show('A', list([
  { id: 'c', tool_slug: 'tool-a', detected_at: '2026-09-21T12:00:00.000Z' },
  { id: 'a', tool_slug: 'tool-a', detected_at: '2026-09-21T08:00:00.000Z' },
  { id: 'b', tool_slug: 'tool-a', detected_at: '2026-09-21T10:00:00.000Z' },
]), ['a=tool-a-2026-09-21', 'b=tool-a-2026-09-21-2', 'c=tool-a-2026-09-21-3']);

// B: different tool, same date -> no suffix
show('B', list([
  { id: '1', tool_slug: 'tool-a', detected_at: D },
  { id: '2', tool_slug: 'tool-b', detected_at: D },
]), ['1=tool-a-2026-09-21', '2=tool-b-2026-09-21']);

// C: shuffled input -> same assignments
const rows = [
  { id: 'x1', tool_slug: 'tool-a', detected_at: '2026-09-21T09:00:00Z' },
  { id: 'x2', tool_slug: 'tool-a', detected_at: '2026-09-21T11:00:00Z' },
  { id: 'x3', tool_slug: 'tool-b', detected_at: '2026-09-21T09:30:00Z' },
  { id: 'x4', tool_slug: 'tool-a', detected_at: '2026-09-20T23:00:00Z' },
];
const map = (rs) => Object.fromEntries(assignAnchors(rs).map((r) => [r.id, r.anchor]));
show('C', map([rows[2], rows[0], rows[3], rows[1]]), map(rows));
console.log('C (reference):', JSON.stringify(map(rows)));

// D: identical detected_at -> lower id first (< / >)
show('D', list([
  { id: 'id-b', tool_slug: 'tool-a', detected_at: D },
  { id: 'id-a', tool_slug: 'tool-a', detected_at: D },
]), ['id-a=tool-a-2026-09-21', 'id-b=tool-a-2026-09-21-2']);

// E: +03:00 offset -> UTC date 2026-09-20
show('E', list([{ id: '1', tool_slug: 'tool-a', detected_at: '2026-09-21T01:30:00+03:00' }]), ['1=tool-a-2026-09-20']);

// F: UTC midnight boundary
show('F', list([
  { id: '1', tool_slug: 'tool-a', detected_at: '2026-09-20T23:59:59.999Z' },
  { id: '2', tool_slug: 'tool-a', detected_at: '2026-09-21T00:00:00.000Z' },
]), ['1=tool-a-2026-09-20', '2=tool-a-2026-09-21']);

// G: invalid detected_at throws
throws('G', () => assignAnchors([{ id: '1', tool_slug: 'tool-a', detected_at: 'not-a-date' }]));
throws('G2 (empty)', () => normalizeDetectedAt(''));
throws('G3 (null)', () => normalizeDetectedAt(null));
throws('G4 (impossible date 2026-09-31)', () => normalizeDetectedAt('2026-09-31T00:00:00Z'));

// H: RSS dates. detected_at is the same in every case.
const DET = '2026-09-10T02:06:11.000Z';
const FALLBACK = 'Thu, 10 Sep 2026 02:06:11 GMT';
show('H1', rssPubDate(DET, '2026-09-10T05:45:00.000Z'), 'Thu, 10 Sep 2026 05:45:00 GMT');
show('H2', rssPubDate(DET, '2026-09-10 05:45:00'), FALLBACK);
show('H3 null', rssPubDate(DET, null), FALLBACK);
show('H3 undefined', rssPubDate(DET, undefined), FALLBACK);
show('H3 empty', rssPubDate(DET, ''), FALLBACK);
show('H4', rssPubDate(DET, '2026-13-45T99:99:99Z'), FALLBACK);
show('H4b (impossible day, regex-valid)', rssPubDate(DET, '2026-09-31T05:00:00Z'), FALLBACK);
show('H5', rssPubDate(DET, '2026-09-10T08:45:00+03:00'), FALLBACK);
const t1 = rssPubTimestamp('2026-09-02T08:00:00.000Z', null);
const t2 = rssPubTimestamp('2026-09-10T08:00:00.000Z', null);
show('H6', latestBuildDate([t1, t2]), 'Thu, 10 Sep 2026 08:00:00 GMT');
show('H6 (string compare would wrongly pick Wed)', ['Wed, 02 Sep 2026 08:00:00 GMT', 'Thu, 10 Sep 2026 08:00:00 GMT'].sort().pop(), 'Wed, 02 Sep 2026 08:00:00 GMT');
show('H7', latestBuildDate([]), undefined);
console.log(`H7 (strict): ${latestBuildDate([]) === undefined ? 'PASS' : 'FAIL'}  value=${String(latestBuildDate([]))}`);
throws('H8', () => rssPubDate('garbage', 'also-garbage'));
throws('H9', () => rssPubDate('garbage', '2026-09-10T05:45:00.000Z'));
show('H10 order', sortRssItems([
  { pubMs: 1, anchor: 'b' }, { pubMs: 3, anchor: 'z' }, { pubMs: 3, anchor: 'a' }, { pubMs: 2, anchor: 'm' },
]).map((i) => `${i.pubMs}${i.anchor}`), ['3a', '3z', '2m', '1b']);

console.log(failed === 0 ? 'ALL PASS' : `FAILURES: ${failed}`);
if (failed) process.exitCode = 1;
