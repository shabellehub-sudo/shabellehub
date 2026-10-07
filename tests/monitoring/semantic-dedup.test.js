import assert from 'node:assert';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(
  new URL('../../lib/monitoring/runCheck.js', import.meta.url),
  'utf8'
);

const start = source.indexOf('const DUPLICATE_COMPATIBLE_CATEGORIES');
const end = source.indexOf('export async function createPendingChange');

if (start === -1 || end === -1 || end <= start) {
  throw new Error('Could not locate semantic dedup helpers in runCheck.js');
}

const helperSource = source.slice(start, end);

const context = {};
vm.runInNewContext(
  `${helperSource}
globalThis.normalizeSemanticValue = normalizeSemanticValue;
globalThis.isSemanticDuplicate = isSemanticDuplicate;
`,
  context
);

const normalizeSemanticValue = context.normalizeSemanticValue;
const isSemanticDuplicate = context.isSemanticDuplicate;

let n = 0;

function check(label, fn) {
  n++;
  try {
    fn();
    console.log(`  ok  ${n}. ${label}`);
  } catch (e) {
    console.log(`FAIL  ${n}. ${label} -> ${e.message}`);
    process.exitCode = 1;
  }
}

function existing(overrides = {}) {
  return {
    tool_slug: 'krea',
    change_category: 'pricing',
    old_value: 'Free',
    new_value: 'Basic $9/month',
    detected_at: '2026-10-07T20:00:00.000Z',
    ...overrides,
  };
}

function incoming(overrides = {}) {
  return {
    slug: 'krea',
    category: 'pricing',
    oldValue: 'Free',
    newValue: 'Basic $9/month',
    ...overrides,
  };
}

check('A. same category + same old/new state -> duplicate', () => {
  assert.strictEqual(
    isSemanticDuplicate(existing(), incoming()),
    true
  );
});

check('B. pricing -> plan_change with same state -> duplicate', () => {
  assert.strictEqual(
    isSemanticDuplicate(
      existing({ change_category: 'pricing' }),
      incoming({ category: 'plan_change' })
    ),
    true
  );
});

check('C. plan_change -> pricing with same state -> duplicate', () => {
  assert.strictEqual(
    isSemanticDuplicate(
      existing({ change_category: 'plan_change' }),
      incoming({ category: 'pricing' })
    ),
    true
  );
});

check('D. unrelated category -> NOT duplicate', () => {
  assert.strictEqual(
    isSemanticDuplicate(
      existing({ change_category: 'feature' }),
      incoming({ category: 'pricing' })
    ),
    false
  );
});

check('E. "$9 / month" and "$9/month" normalize equally', () => {
  assert.strictEqual(
    normalizeSemanticValue('Basic $9 / month'),
    normalizeSemanticValue('Basic $9/month')
  );

  assert.strictEqual(
    isSemanticDuplicate(
      existing({ new_value: 'Basic $9 / month' }),
      incoming({ newValue: 'Basic $9/month' })
    ),
    true
  );
});

check('F. "Basic $9/month" and "API $9/month" remain different', () => {
  assert.strictEqual(
    isSemanticDuplicate(
      existing({ new_value: 'Basic $9/month' }),
      incoming({ newValue: 'API $9/month' })
    ),
    false
  );
});

check('G. different old/new state -> NOT duplicate', () => {
  assert.strictEqual(
    isSemanticDuplicate(
      existing({
        old_value: 'Free',
        new_value: 'Basic $9/month',
      }),
      incoming({
        oldValue: 'Basic $9/month',
        newValue: 'Pro $19/month',
      })
    ),
    false
  );
});

check('H. null old/new values are handled safely', () => {
  assert.strictEqual(
    isSemanticDuplicate(
      existing({
        old_value: null,
        new_value: null,
      }),
      incoming({
        oldValue: null,
        newValue: null,
      })
    ),
    false
  );
});

check('I. HTML entities normalize consistently', () => {
  assert.strictEqual(
    normalizeSemanticValue('Basic &amp; Pro'),
    normalizeSemanticValue('Basic & Pro')
  );
});

check('J. duplicate window still uses detected_at >= 24h boundary query', () => {
  assert.match(
    source,
    /\.gte\(\s*['"]detected_at['"]\s*,\s*since\s*\)/
  );

  assert.match(
    source,
    /24\s*\*\s*60\s*\*\s*60\s*\*\s*1000/
  );
});

console.log(`\n${n} semantic-dedup checks completed.`);
