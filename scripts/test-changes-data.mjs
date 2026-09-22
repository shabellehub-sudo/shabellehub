// scripts/test-changes-data.mjs
// Plain Node, no framework. Run from the repo root:
//   node --input-type=module -e "await import('./scripts/test-changes-data.mjs')"
import { buildPublicChanges, isEligible, safeEvidenceUrl } from '../lib/changes/publicData.js';

let failed = 0;
function check(label, ok, detail) {
  if (!ok) failed += 1;
  console.log(`${label}: ${ok ? 'PASS' : 'FAIL'}${detail === undefined ? '' : `  ${JSON.stringify(detail)}`}`);
}
const row = (o) => ({ id: 'r1', tool_slug: 'tool-a', status: 'confirmed', detected_at: '2026-09-15T10:00:00.000Z',
  priority: 'medium', change_category: 'pricing', evidence_url: 'https://example.com/pricing',
  source_type: 'official', ai_summary: null, reviewed_at: '2026-09-16T10:00:00.000Z', ...o });
const tools = [{ slug: 'tool-a', name: 'Tool A', logo_url: null }, { slug: 'tool-b', name: 'Tool B', logo_url: 'https://cdn.example.com/b.png' }];

// 1. eligibility
check('elig confirmed', isEligible(row({})) === true);
check('elig shipped', isEligible(row({ status: 'shipped' })) === true);
check('elig dismissed excluded', isEligible(row({ status: 'dismissed' })) === false);
check('elig pending_review excluded', isEligible(row({ status: 'pending_review' })) === false);
check('elig low excluded', isEligible(row({ priority: 'low' })) === false);
check('elig wikipedia excluded', isEligible(row({ source_type: 'wikipedia' })) === false);
check('elig null priority passes', isEligible(row({ priority: null })) === true);
check('elig null source_type passes', isEligible(row({ source_type: null })) === true);

// 2. tool join: unpublished/unknown tool excluded
const j = buildPublicChanges([row({ id: '1' }), row({ id: '2', tool_slug: 'ghost' })], tools);
check('join excludes unresolved tool', j.display.length === 1 && j.display[0].tool_slug === 'tool-a', j.display.map((d) => d.tool_slug));

// 3. output shape has no internal fields
const keys = Object.keys(j.display[0]).sort();
check('public keys exact', JSON.stringify(keys) === JSON.stringify(['anchor', 'category', 'detected_at', 'evidence_url', 'summary', 'tool_logo', 'tool_name', 'tool_slug']), keys);
check('rss extra key is only pubMs', Object.keys(j.rss[0]).filter((k) => !keys.includes(k)).join() === 'pubMs', Object.keys(j.rss[0]));
check('no id/doc/row/reviewed_at leaked', !JSON.stringify(j).match(/"(id|doc|row|reviewed_at|reviewed_by|shipped_by|diff_excerpt|old_value|new_value)"/));

// 4. summaries
const s = (o) => buildPublicChanges([row(o)], tools).display[0].summary;
check('summary uses ai_summary', s({ ai_summary: '  Plan X now costs more.  ' }) === 'Plan X now costs more.');
check('summary blank ai -> template', s({ ai_summary: '   ' }) === 'Pricing information changed');
check('summary model_update', s({ change_category: 'model_update' }) === 'Model update detected');
check('summary plan_change', s({ change_category: 'plan_change' }) === 'Plan information changed');
check('summary unknown category', s({ change_category: 'status' }) === 'Change detected');
check('summary prototype-key category', s({ change_category: 'constructor' }) === 'Change detected');
check('summary null category', s({ change_category: null }) === 'Change detected');

// 5. evidence url safety
for (const [u, want] of [
  ['https://example.com/x', 'https://example.com/x'], ['http://example.com/x', null], ['javascript:alert(1)', null],
  ['https://user:pw@example.com/x', null], ['https://192.168.0.1/x', null], ['https://localhost/x', null],
  ['https://intranet.local/x', null], ['not a url', null], [null, null], ['https://' + 'a'.repeat(2100) + '.com', null],
]) check(`evidence ${String(u).slice(0, 30)}`, safeEvidenceUrl(u) === want);

// 6. logo: only https or root-relative
const logo = (v) => buildPublicChanges([row({ tool_slug: 'tool-b' })], [{ slug: 'tool-b', name: 'B', logo_url: v }]).display[0].tool_logo;
check('logo https kept', logo('https://cdn.example.com/b.png') === 'https://cdn.example.com/b.png');
check('logo js: dropped', logo('javascript:alert(1)') === null);
check('logo missing -> null', logo(undefined) === null);

// 7. display DESC vs anchor ASC pass (same tool, same day)
const two = buildPublicChanges([
  row({ id: 'e2', detected_at: '2026-09-15T18:00:00.000Z' }),
  row({ id: 'e1', detected_at: '2026-09-15T06:00:00.000Z' }),
], tools);
check('display newest first, anchors from ASC pass', two.display[0].anchor === 'tool-a-2026-09-15-2' && two.display[1].anchor === 'tool-a-2026-09-15', two.display.map((d) => d.anchor));

// 8. rss order uses pubDate (reviewed_at), not detected_at
const r = buildPublicChanges([
  row({ id: 'p1', tool_slug: 'tool-a', detected_at: '2026-09-01T00:00:00.000Z', reviewed_at: '2026-09-20T00:00:00.000Z' }),
  row({ id: 'p2', tool_slug: 'tool-b', detected_at: '2026-09-10T00:00:00.000Z', reviewed_at: '2026-09-11T00:00:00.000Z' }),
], tools);
check('rss newest pubDate first', r.rss[0].tool_slug === 'tool-a' && r.display[0].tool_slug === 'tool-b', { rss: r.rss.map((x) => x.tool_slug), display: r.display.map((x) => x.tool_slug) });

// 9. empty and invalid
check('empty input', JSON.stringify(buildPublicChanges([], tools)) === '{"display":[],"rss":[]}');
check('null inputs', JSON.stringify(buildPublicChanges(null, null)) === '{"display":[],"rss":[]}');
let threw = false;
try { buildPublicChanges([row({ detected_at: 'garbage' })], tools); } catch { threw = true; }
check('invalid detected_at throws', threw);

console.log(failed === 0 ? 'ALL PASS' : `FAILURES: ${failed}`);
if (failed) process.exitCode = 1;
