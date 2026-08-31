import assert from 'node:assert';
import { resolveAlternatives, isAlternativesPageEligible, MIN_ALTERNATIVES_TO_SHOW } from '../lib/alternatives.js';

let n = 0;
function check(label, fn) {
  n++;
  try { fn(); console.log(`  ok  ${n}. ${label}`); }
  catch (e) { console.log(`FAIL  ${n}. ${label} -> ${e.message}`); process.exitCode = 1; }
}

function tool(overrides) {
  return { id: 1, slug: 'x', name: 'X', category: 'Writing', alternatives: [], ...overrides };
}

check('MIN_ALTERNATIVES_TO_SHOW is 3 (per spec)', () => {
  assert.strictEqual(MIN_ALTERNATIVES_TO_SHOW, 3);
});

check('explicit alternatives with 3+ valid entries -> source explicit, eligible', () => {
  const t = tool({ slug: 'chatgpt', alternatives: ['claude', 'gemini', 'llama'] });
  const allTools = [
    t,
    tool({ id: 2, slug: 'claude', name: 'Claude' }),
    tool({ id: 3, slug: 'gemini', name: 'Gemini' }),
    tool({ id: 4, slug: 'llama', name: 'Llama' }),
  ];
  const { items, source } = resolveAlternatives(t, allTools);
  assert.strictEqual(source, 'explicit');
  assert.strictEqual(items.length, 3);
  assert.strictEqual(isAlternativesPageEligible(t, allTools), true);
});

check('explicit alternatives referencing a nonexistent slug are silently dropped, not fabricated', () => {
  const t = tool({ slug: 'chatgpt', alternatives: ['claude', 'this-tool-does-not-exist', 'gemini'] });
  const allTools = [
    t,
    tool({ id: 2, slug: 'claude', name: 'Claude' }),
    tool({ id: 3, slug: 'gemini', name: 'Gemini' }),
  ];
  const { items } = resolveAlternatives(t, allTools);
  assert.strictEqual(items.length, 2, 'only the 2 real matches should survive');
  assert.ok(items.every((i) => i.slug !== 'this-tool-does-not-exist'));
});

check('a tool listing itself in alternatives excludes itself from the results', () => {
  const t = tool({ slug: 'chatgpt', id: 1, alternatives: ['chatgpt', 'claude', 'gemini'] });
  const allTools = [
    t,
    tool({ id: 2, slug: 'claude', name: 'Claude' }),
    tool({ id: 3, slug: 'gemini', name: 'Gemini' }),
  ];
  const { items } = resolveAlternatives(t, allTools);
  assert.ok(items.every((i) => i.slug !== 'chatgpt'));
  assert.strictEqual(items.length, 2);
});

check('explicit alternatives below threshold falls back to category (per spec: "missing OR too few")', () => {
  const t = tool({ slug: 'chatgpt', id: 1, category: 'Writing', alternatives: ['claude'] });
  const allTools = [
    t,
    tool({ id: 2, slug: 'claude', name: 'Claude', category: 'Chat' }),
    tool({ id: 3, slug: 'jasper', name: 'Jasper', category: 'Writing' }),
    tool({ id: 4, slug: 'copy-ai', name: 'Copy.ai', category: 'Writing' }),
    tool({ id: 5, slug: 'writesonic', name: 'Writesonic', category: 'Writing' }),
  ];
  const { items, source } = resolveAlternatives(t, allTools);
  assert.strictEqual(source, 'category', 'too-few explicit matches must fall back to category, not stay explicit');
  assert.strictEqual(items.length, 3);
  assert.strictEqual(isAlternativesPageEligible(t, allTools), true);
});

check('explicit alternatives below threshold AND category also below threshold -> not eligible either way', () => {
  const t = tool({ slug: 'niche', id: 1, category: 'Obscure', alternatives: ['claude'] });
  const allTools = [
    t,
    tool({ id: 2, slug: 'claude', name: 'Claude' }),
    tool({ id: 3, slug: 'other-obscure', category: 'Obscure' }),
  ];
  assert.strictEqual(isAlternativesPageEligible(t, allTools), false);
});

check('empty explicit alternatives array falls back to category', () => {
  const t = tool({ slug: 'chatgpt', id: 1, category: 'Writing', alternatives: [] });
  const allTools = [
    t,
    tool({ id: 2, slug: 'jasper', name: 'Jasper', category: 'Writing' }),
    tool({ id: 3, slug: 'copy-ai', name: 'Copy.ai', category: 'Writing' }),
    tool({ id: 4, slug: 'writesonic', name: 'Writesonic', category: 'Writing' }),
  ];
  const { items, source } = resolveAlternatives(t, allTools);
  assert.strictEqual(source, 'category');
  assert.strictEqual(items.length, 3);
  assert.strictEqual(isAlternativesPageEligible(t, allTools), true);
});

check('category fallback below threshold -> not eligible (no dedicated page)', () => {
  const t = tool({ slug: 'niche-tool', id: 1, category: 'Obscure', alternatives: [] });
  const allTools = [
    t,
    tool({ id: 2, slug: 'other-niche', name: 'Other', category: 'Obscure' }),
  ];
  const { items } = resolveAlternatives(t, allTools);
  assert.strictEqual(items.length, 1);
  assert.strictEqual(isAlternativesPageEligible(t, allTools), false);
});

check('no alternatives field and no category match -> empty items, not eligible', () => {
  const t = tool({ slug: 'lonely-tool', id: 1, category: 'Nobody Else Here', alternatives: undefined });
  const allTools = [t];
  const { items } = resolveAlternatives(t, allTools);
  assert.strictEqual(items.length, 0);
  assert.strictEqual(isAlternativesPageEligible(t, allTools), false);
});

check('exactly at threshold (3 category matches) is eligible -- boundary check', () => {
  const t = tool({ slug: 'x', id: 1, category: 'Design', alternatives: [] });
  const allTools = [
    t,
    tool({ id: 2, slug: 'a', category: 'Design' }),
    tool({ id: 3, slug: 'b', category: 'Design' }),
    tool({ id: 4, slug: 'c', category: 'Design' }),
  ];
  assert.strictEqual(isAlternativesPageEligible(t, allTools), true);
});

check('exactly one below threshold (2 category matches) is NOT eligible -- boundary check', () => {
  const t = tool({ slug: 'x', id: 1, category: 'Design', alternatives: [] });
  const allTools = [
    t,
    tool({ id: 2, slug: 'a', category: 'Design' }),
    tool({ id: 3, slug: 'b', category: 'Design' }),
  ];
  assert.strictEqual(isAlternativesPageEligible(t, allTools), false);
});

console.log(`\n${n} checks run.`);
