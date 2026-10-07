import assert from 'node:assert/strict';
import { diffSnapshots } from '../lib/monitoring/diffSnapshots.js';

let failed = 0;
async function check(name, fn) {
  try { await fn(); console.log('PASS', name); }
  catch (e) { failed += 1; console.log('FAIL', name, '-', e.message); }
}

await check('HTML-attribute fragments only -> not a change', async () => {
  const r = await diffSnapshots(
    `Recraft AI for designers ')"> ')"> ')"> TRUSTED by teams worldwide`,
    'Recraft AI for designers TRUSTED by teams worldwide'
  );
  assert.equal(r.changed, false);
});

await check('Tailwind class leakage only -> not a change', async () => {
  const r = await diffSnapshots(
    'Plans Free Pro svg]:px-3 Enterprise for teams',
    'Plans Free Pro Enterprise for teams'
  );
  assert.equal(r.changed, false);
});

await check('HTML entity never reaches the excerpt', async () => {
  const r = await diffSnapshots(
    'Plans for teams Zapier&#x27;s automation platform',
    'Plans for teams Zapier&#x27;s workflow platform'
  );
  assert.equal(r.changed, true);
  assert.ok(!/&#x/i.test(r.excerpt), r.excerpt);
});

await check('real price change is kept', async () => {
  const r = await diffSnapshots('Pro plan costs $20/month today', 'Pro plan costs $25/month today');
  assert.equal(r.changed, true);
  assert.ok(r.oldValue.includes('$20/month'), r.oldValue);
  assert.ok(r.newValue.includes('$25/month'), r.newValue);
});

await check('short plan name (Max) is kept', async () => {
  const r = await diffSnapshots('Team plan for groups', 'Max plan for groups');
  assert.equal(r.changed, true);
  assert.ok(r.newValue.includes('Max'), r.newValue);
});

await check('real prose change is kept', async () => {
  const r = await diffSnapshots('Assign OpenAI per agent today', 'Pick a frontier model for each agent today');
  assert.equal(r.changed, true);
});

process.exit(failed ? 1 : 0);
