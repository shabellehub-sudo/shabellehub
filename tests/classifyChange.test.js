import assert from 'node:assert';
import { classifyChange } from '../lib/monitoring/classifyChange.js';

let n = 0;
function check(label, fn) {
  n++;
  try { fn(); console.log(`  ok  ${n}. ${label}`); }
  catch (e) { console.log(`FAIL  ${n}. ${label} -> ${e.message}`); process.exitCode = 1; }
}

// ── Target fix: MODEL_WORDS must win over STATUS_WORDS when a diff
// names a specific model AND uses status language together ──────────

check('"GPT-4 has been discontinued" -> model_update (post-fix target case)', () => {
  const r = classifyChange('+ GPT-4 has been discontinued');
  assert.strictEqual(r.category, 'model_update');
  assert.strictEqual(r.signal, true);
});

check('"GPT-4 deprecated" -> model_update', () => {
  const r = classifyChange('+ GPT-4 deprecated');
  assert.strictEqual(r.category, 'model_update');
});

check('"gpt-4o shut down" -> model_update', () => {
  const r = classifyChange('+ gpt-4o shut down');
  assert.strictEqual(r.category, 'model_update');
});

// ── Regression: pure product/company status language with NO model
// name must still classify as status (this must NOT break) ──────────

check('"ChatGPT has been discontinued" -> status (regression, no model word present)', () => {
  const r = classifyChange('+ ChatGPT has been discontinued');
  assert.strictEqual(r.category, 'status');
  assert.strictEqual(r.confidence, 'high');
});

check('"This service has been sunsetted" -> status (regression)', () => {
  const r = classifyChange('+ This service has been sunsetted');
  assert.strictEqual(r.category, 'status');
});

check('"End of life announced for the platform" -> status (regression)', () => {
  const r = classifyChange('+ End of life announced for the platform');
  assert.strictEqual(r.category, 'status');
});

// ── Boundary/collision: explicit priority check post-fix ────────────

check('collision: model word + status word + pricing word in same line -> model_update wins (new priority order)', () => {
  const r = classifyChange('+ The gpt-4 model has been deprecated, pricing now $10/mo');
  assert.strictEqual(r.category, 'model_update');
});

check('model word alone, no status word -> model_update (unaffected by fix)', () => {
  const r = classifyChange('+ New checkpoint released for claude 3.5');
  assert.strictEqual(r.category, 'model_update');
});

check('status word alone, no model word -> status (unaffected by fix)', () => {
  const r = classifyChange('+ Product discontinued as of today');
  assert.strictEqual(r.category, 'status');
});

// ── Other category regressions (must remain unchanged by this fix) ──

check('pricing words -> pricing (regression)', () => {
  const r = classifyChange('+ New pricing: $20/month for the pro plan');
  assert.strictEqual(r.category, 'pricing');
});

check('plan words only -> plan_change (regression)', () => {
  const r = classifyChange('+ Introducing a new starter plan tier');
  assert.strictEqual(r.category, 'plan_change');
});

check('limit words -> limit_change (regression)', () => {
  const r = classifyChange('+ New rate limit: 500 rpm');
  assert.strictEqual(r.category, 'limit_change');
});

check('api words -> api_change (regression)', () => {
  const r = classifyChange('+ New REST API endpoint added');
  assert.strictEqual(r.category, 'api_change');
});

check('integration words -> integration_change (regression)', () => {
  const r = classifyChange('+ New plugin support added');
  assert.strictEqual(r.category, 'integration_change');
});

check('feature removed words -> feature_removed (regression)', () => {
  const r = classifyChange('+ Dark mode has been removed');
  assert.strictEqual(r.category, 'feature_removed');
});

check('feature added, recent -> feature_added medium confidence (regression)', () => {
  const r = classifyChange('+ Now available: new dashboard analytics feature');
  assert.strictEqual(r.category, 'feature_added');
  assert.strictEqual(r.confidence, 'medium');
});

check('feature added, stale year -> feature_added low confidence, signal false (regression)', () => {
  const r = classifyChange('+ Launched in 2015, new analytics feature');
  assert.strictEqual(r.category, 'feature_added');
  assert.strictEqual(r.confidence, 'low');
  assert.strictEqual(r.signal, false);
});

check('no keyword match -> unknown (regression)', () => {
  const r = classifyChange('+ Just a random unrelated sentence here');
  assert.strictEqual(r.category, 'unknown');
  assert.strictEqual(r.signal, false);
});

check('empty/invalid input -> unknown, low confidence (regression)', () => {
  assert.strictEqual(classifyChange('').category, 'unknown');
  assert.strictEqual(classifyChange(null).category, 'unknown');
  assert.strictEqual(classifyChange(undefined).confidence, 'low');
});

// ── KNOWN GAP — documented, NOT fixed in this change (out of scope
// per explicit decision: MODEL_WORDS is a closed list and does not
// include gpt-5/claude-4/gemini-2/etc. This test documents current
// (incorrect) behavior so it fails loudly if silently "fixed" without
// a deliberate follow-up decision, rather than passing silently). ────

check('KNOWN GAP: "GPT-5.6" vs "GPT-5.5" diff -> currently unknown, NOT model_update (gpt-5 absent from MODEL_WORDS; tracked separately, not in scope for this fix)', () => {
  const r = classifyChange('+ GPT-5.6\n- GPT-5.5');
  assert.strictEqual(r.category, 'unknown', 'documents the known gap — expected to change only when MODEL_WORDS is deliberately extended');
  assert.strictEqual(r.signal, false);
});

console.log(`\n${n} checks run.`);
