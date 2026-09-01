import assert from 'node:assert';
import {
  canonicalPairSlugs,
  comparisonUrl,
  getAllComparisonPairs,
  resolveComparisonPair,
  isComparisonPairEligible,
  parsePairParam,
} from '../lib/comparisons.js';

let n = 0;
function check(label, fn) {
  n++;
  try { fn(); console.log(`  ok  ${n}. ${label}`); }
  catch (e) { console.log(`FAIL  ${n}. ${label} -> ${e.message}`); process.exitCode = 1; }
}

function tool(overrides) {
  return { id: 1, slug: 'x', name: 'X', category: 'Writing', rating: 4.5, price: 'Free', pros: ['a'], cons: ['b'], alternatives: [], ...overrides };
}

check('canonicalPairSlugs is order-independent (alphabetical)', () => {
  assert.deepStrictEqual(canonicalPairSlugs('claude', 'chatgpt'), ['chatgpt', 'claude']);
  assert.deepStrictEqual(canonicalPairSlugs('chatgpt', 'claude'), ['chatgpt', 'claude']);
});

check('comparisonUrl is identical regardless of argument order (no duplicate URLs)', () => {
  assert.strictEqual(comparisonUrl('claude', 'chatgpt'), comparisonUrl('chatgpt', 'claude'));
  assert.strictEqual(comparisonUrl('chatgpt', 'claude'), '/compare/chatgpt-vs-claude');
});

check('getAllComparisonPairs finds a pair when only ONE side lists the other', () => {
  const a = tool({ id: 1, slug: 'chatgpt', alternatives: ['claude'] });
  const b = tool({ id: 2, slug: 'claude', alternatives: [] });
  const pairs = getAllComparisonPairs([a, b]);
  assert.strictEqual(pairs.length, 1);
  assert.deepStrictEqual([pairs[0].slug1, pairs[0].slug2], ['chatgpt', 'claude']);
});

check('getAllComparisonPairs deduplicates when BOTH sides list each other (bidirectional)', () => {
  const a = tool({ id: 1, slug: 'chatgpt', alternatives: ['claude'] });
  const b = tool({ id: 2, slug: 'claude', alternatives: ['chatgpt'] });
  const pairs = getAllComparisonPairs([a, b]);
  assert.strictEqual(pairs.length, 1, 'bidirectional listing must not produce 2 pairs');
});

check('getAllComparisonPairs drops a dangling alternatives reference (never fabricates)', () => {
  const a = tool({ id: 1, slug: 'chatgpt', alternatives: ['claude', 'this-does-not-exist'] });
  const b = tool({ id: 2, slug: 'claude', alternatives: [] });
  const pairs = getAllComparisonPairs([a, b]);
  assert.strictEqual(pairs.length, 1);
  assert.ok(!pairs.some((p) => p.slug1 === 'this-does-not-exist' || p.slug2 === 'this-does-not-exist'));
});

check('getAllComparisonPairs never pairs a tool with itself', () => {
  const a = tool({ id: 1, slug: 'chatgpt', alternatives: ['chatgpt'] });
  const pairs = getAllComparisonPairs([a]);
  assert.strictEqual(pairs.length, 0);
});

check('getAllComparisonPairs never uses same-category cross-product (only explicit alternatives)', () => {
  const tools = ['a', 'b', 'c', 'd', 'e'].map((s, i) => tool({ id: i + 1, slug: s, category: 'Writing', alternatives: [] }));
  const pairs = getAllComparisonPairs(tools);
  assert.strictEqual(pairs.length, 0);
});

check('resolveComparisonPair works and is order-independent for the caller', () => {
  const a = tool({ id: 1, slug: 'chatgpt', alternatives: ['claude'] });
  const b = tool({ id: 2, slug: 'claude', alternatives: [] });
  const allTools = [a, b];
  const p1 = resolveComparisonPair('chatgpt', 'claude', allTools);
  const p2 = resolveComparisonPair('claude', 'chatgpt', allTools);
  assert.deepStrictEqual([p1.slug1, p1.slug2], [p2.slug1, p2.slug2]);
});

check('resolveComparisonPair returns null when neither tool lists the other (not curated)', () => {
  const a = tool({ id: 1, slug: 'chatgpt', alternatives: [] });
  const b = tool({ id: 2, slug: 'claude', alternatives: [] });
  assert.strictEqual(resolveComparisonPair('chatgpt', 'claude', [a, b]), null);
});

check('resolveComparisonPair returns null when a tool does not exist', () => {
  const a = tool({ id: 1, slug: 'chatgpt', alternatives: ['ghost-tool'] });
  assert.strictEqual(resolveComparisonPair('chatgpt', 'ghost-tool', [a]), null);
});

check('isComparisonPairEligible true when both tools have required fields', () => {
  const a = tool({ id: 1, slug: 'a', alternatives: ['b'] });
  const b = tool({ id: 2, slug: 'b' });
  const pair = resolveComparisonPair('a', 'b', [a, b]);
  assert.strictEqual(isComparisonPairEligible(pair), true);
});

check('isComparisonPairEligible false when one tool is missing a required field', () => {
  const a = tool({ id: 1, slug: 'a', alternatives: ['b'] });
  const b = tool({ id: 2, slug: 'b', price: '' });
  const pair = resolveComparisonPair('a', 'b', [a, b]);
  assert.strictEqual(isComparisonPairEligible(pair), false);
});

check('isComparisonPairEligible false for a null pair', () => {
  assert.strictEqual(isComparisonPairEligible(null), false);
});

check('parsePairParam resolves a simple pair with no hyphens in slugs', () => {
  const allTools = [tool({ slug: 'chatgpt' }), tool({ slug: 'claude' })];
  assert.deepStrictEqual(parsePairParam('chatgpt-vs-claude', allTools), ['chatgpt', 'claude']);
});

check('parsePairParam correctly disambiguates when BOTH slugs contain hyphens', () => {
  const allTools = [tool({ slug: 'copy-ai' }), tool({ slug: 'notion-ai' })];
  assert.deepStrictEqual(parsePairParam('copy-ai-vs-notion-ai', allTools), ['copy-ai', 'notion-ai']);
});

check('parsePairParam returns null for a param that does not match two known slugs', () => {
  const allTools = [tool({ slug: 'chatgpt' }), tool({ slug: 'claude' })];
  assert.strictEqual(parsePairParam('chatgpt-vs-nonexistent', allTools), null);
});

check('parsePairParam returns null when the "-vs-" marker is entirely absent', () => {
  const allTools = [tool({ slug: 'chatgpt' }), tool({ slug: 'claude' })];
  assert.strictEqual(parsePairParam('chatgpt-claude', allTools), null);
});

console.log(`\n${n} checks run.`);
