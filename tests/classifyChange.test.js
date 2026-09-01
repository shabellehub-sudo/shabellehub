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


// ── Pass 1: substring & semantic false-positive fixes (collision audit) ──

check('COLLISION FIX: "Rapid response time improved" -> unknown, not api_change (api substring in "rapid")', () => {
  const r = classifyChange('+ Rapid response time improved');
  assert.notStrictEqual(r.category, 'api_change');
  assert.strictEqual(r.category, 'unknown');
});

check('COLLISION FIX: "Capital raised for expansion" -> unknown, not api_change (api substring in "capital")', () => {
  const r = classifyChange('+ Capital raised for expansion');
  assert.notStrictEqual(r.category, 'api_change');
  assert.strictEqual(r.category, 'unknown');
});

check('COLLISION FIX: "New Zapier integration available" -> integration_change (was api_change via api substring in "zapier")', () => {
  const r = classifyChange('+ New Zapier integration available');
  assert.strictEqual(r.category, 'integration_change');
});

check('COLLISION FIX: "subscription model" -> pricing, not model_update (pricing tier checked before model-generic fallback)', () => {
  const r = classifyChange('+ Introducing a new subscription model');
  assert.strictEqual(r.category, 'pricing');
  assert.strictEqual(r.confidence, 'high');
});

check('FALLBACK BEHAVIOR: "business model is changing" -> model_update at MEDIUM confidence (was HIGH) -- model-generic checked before business-generic within the fallback tier, so category is unchanged but confidence is downgraded', () => {
  const r = classifyChange('+ Our business model is changing');
  assert.strictEqual(r.category, 'model_update');
  assert.strictEqual(r.confidence, 'medium');
});

check('COLLISION FIX: "New API version 2 released" -> api_change, not model_update (api tier checked before model-generic fallback)', () => {
  const r = classifyChange('+ New API version 2 released');
  assert.strictEqual(r.category, 'api_change');
});

check('KNOWN GAP (Pass 2, unchanged): "Endpoint v2.3 deployed" -> still model_update (punctuation version markers not addressed in Pass 1)', () => {
  const r = classifyChange('+ Endpoint v2.3 deployed');
  assert.strictEqual(r.category, 'model_update');
  assert.strictEqual(r.confidence, 'high');
});

check('COLLISION FIX: "Now available in Europe" -> not pricing (eur substring in "Europe" now word-boundaried)', () => {
  const r = classifyChange('+ Now available in Europe');
  assert.notStrictEqual(r.category, 'pricing');
});

check('KNOWN GAP (Pass 2, unchanged): dollar-brace config variable -> still pricing (bare $ punctuation not addressed in Pass 1)', () => {
  const r = classifyChange('+ Updated ${env} config variable');
  assert.strictEqual(r.category, 'pricing');
});

check('COLLISION FIX: "We plan to launch next quarter" -> not plan_change (bare "plan" verb moved to fallback; "launch" is a real feature_added signal)', () => {
  const r = classifyChange('+ We plan to launch next quarter');
  assert.strictEqual(r.category, 'feature_added');
});

check('FALLBACK BEHAVIOR: "Our business continues to grow" -> plan_change at MEDIUM confidence (was HIGH) -- bare "business" is a real word, not a substring collision, so category is unchanged but confidence is downgraded', () => {
  const r = classifyChange('+ Our business continues to grow');
  assert.strictEqual(r.category, 'plan_change');
  assert.strictEqual(r.confidence, 'medium');
});

check('COLLISION FIX: "No limitations on export size" -> unknown, not limit_change ("limit" word-boundary no longer matches inside "limitations")', () => {
  const r = classifyChange('+ No limitations on export size');
  assert.strictEqual(r.category, 'unknown');
});

check('FALLBACK BEHAVIOR: "Photo credits: Unsplash" -> limit_change at MEDIUM confidence (was HIGH) -- bare "credits" is a real word, not a substring collision, so category is unchanged but confidence is downgraded', () => {
  const r = classifyChange('+ Photo credits: Unsplash');
  assert.strictEqual(r.category, 'limit_change');
  assert.strictEqual(r.confidence, 'medium');
});

check('FALLBACK BEHAVIOR: "Trial extension for all users" -> integration_change at MEDIUM confidence (was HIGH) -- bare "extension" is a real word, not a substring collision, so category is unchanged but confidence is downgraded', () => {
  const r = classifyChange('+ Trial extension for all users');
  assert.strictEqual(r.category, 'integration_change');
  assert.strictEqual(r.confidence, 'medium');
});

// ── Regression guards: exact/multi-word phrases must keep working after removing their bare generic counterparts ──

check('REGRESSION GUARD: "New checkpoint for gpt-4" -> model_update via MODEL_IDENTIFIERS (Tier 0 unaffected)', () => {
  const r = classifyChange('+ New checkpoint for gpt-4');
  assert.strictEqual(r.category, 'model_update');
  assert.strictEqual(r.confidence, 'high');
});

check('REGRESSION GUARD: "$20/month pricing update" -> pricing via currency symbol (Pass 2 territory, untouched, must still work)', () => {
  const r = classifyChange('+ $20/month pricing update');
  assert.strictEqual(r.category, 'pricing');
  assert.strictEqual(r.confidence, 'high');
});

check('REGRESSION GUARD: "New pro plan tier" -> plan_change via exact phrase (must survive removal of bare "plan")', () => {
  const r = classifyChange('+ New pro plan tier');
  assert.strictEqual(r.category, 'plan_change');
  assert.strictEqual(r.confidence, 'high');
});

check('REGRESSION GUARD: "New Chrome extension released" -> integration_change via exact phrase (must survive removal of bare "extension")', () => {
  const r = classifyChange('+ New Chrome extension released');
  assert.strictEqual(r.category, 'integration_change');
  assert.strictEqual(r.confidence, 'high');
});

check('REGRESSION GUARD: "ChatGPT has been discontinued" -> status (Tier-0 boundary case: no model identifier present)', () => {
  const r = classifyChange('+ ChatGPT has been discontinued');
  assert.strictEqual(r.category, 'status');
  assert.strictEqual(r.confidence, 'high');
});

check('REGRESSION GUARD: "GPT-4 has been discontinued" -> model_update (Tier-0 boundary case: model identifier present, wins per approved decision)', () => {
  const r = classifyChange('+ GPT-4 has been discontinued');
  assert.strictEqual(r.category, 'model_update');
  assert.strictEqual(r.confidence, 'high');
});

console.log(`\n${n} checks run.`);
