import assert from 'node:assert/strict';
import { stripHtml, NORMALIZER_VERSION } from '../lib/monitoring/fetchSnapshot.js';

let failed = 0;
function check(name, fn) {
  try { fn(); console.log('PASS', name); }
  catch (e) { failed += 1; console.log('FAIL', name, '-', e.message); }
}
const filler = '<p>' + 'Real product content that must always survive normalization. '.repeat(8) + '</p>';

check('normalizer version is 3', () => assert.equal(NORMALIZER_VERSION, 3));

check('">" inside a quoted attribute does not leak', () => {
  const t = stripHtml('<main><div class="flex [&>svg]:px-3 gap-2"><p>Basic plan $9 per month</p></div>' + filler + '</main>');
  assert.ok(!t.includes('svg]'), t);
  assert.ok(t.includes('Basic plan $9 per month'), t);
});

check('entities are decoded, not leaked', () => {
  const t = stripHtml('<main><p>It&#x27;s fine &amp; good &#39;x&#39; &rsquo;</p>' + filler + '</main>');
  assert.ok(t.includes("It's fine & good 'x'"), t);
  assert.ok(!/&#x|&#39|&rsquo/i.test(t), t);
});

check('block boundaries become line breaks', () => {
  const t = stripHtml('<main><h2>Free</h2><p>$0 forever</p><p>Pro $35</p></main>');
  assert.equal(t, 'Free\n$0 forever\nPro $35');
});

check('nested cookie banner is fully removed', () => {
  const t = stripHtml('<main><div id="cookie-banner"><div class="inner">x</div>By clicking Accept you agree to cookies</div>' + filler + '</main>');
  assert.ok(!t.includes('Accept'), t);
  assert.ok(t.includes('Real product content'), t);
});

check('a cookie-named page wrapper is NOT removed', () => {
  const t = stripHtml('<main><div class="app cookie-consent-open">' + filler + '</div></main>');
  assert.ok(t.includes('Real product content'), t);
});

check('unbalanced cookie div leaves content alone', () => {
  const t = stripHtml('<main><div class="cookie-bar"><p>stay here</p>' + filler + '</main>');
  assert.ok(t.includes('stay here'), t);
});

check('deterministic output', () => {
  const html = '<main><p>A &amp; B</p>' + filler + '</main>';
  assert.equal(stripHtml(html), stripHtml(html));
});

check('tiny first <article> without <main> does not hide the page', () => {
  const t = stripHtml('<body><article><p>Ramp quote about agents and a shared workspace for engineers.</p></article><section><h2>Plans</h2><p>Free $0 forever</p><p>Pro $20 per month</p></section>' + filler + filler + '</body>', 'https://example.com/');
  assert.ok(t.includes('Pro $20 per month'), t);
});

check('a <main> holding most of the page is still used alone', () => {
  const t = stripHtml('<body><header><p>Site header text outside main</p></header><main>' + filler + filler + '</main></body>', 'https://example.com/');
  assert.ok(!t.includes('Site header text outside main'), t);
  assert.ok(t.includes('Real product content'), t);
});

process.exit(failed ? 1 : 0);
