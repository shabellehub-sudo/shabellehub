#!/usr/bin/env node
// Fails the build if the Supabase service role key appears outside server-only files.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SECRETS = ['SUPABASE_SERVICE_ROLE_KEY'];
const ALLOWED = [
  path.join('pages', 'api'),
  path.join('lib', 'supabaseAdmin.js'),
  '.env.local.example',
  path.join('scripts', 'check-env-leakage.js'),
];
const SKIP = new Set(['node_modules', '.next', '.git', 'public', 'supabase']);

function walk(dir) {
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out = out.concat(walk(full));
    else if (/\.(js|jsx|ts|tsx)$/.test(e.name)) out.push(full);
  }
  return out;
}

const violations = [];
for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file);
  if (ALLOWED.some(a => rel === a || rel.startsWith(a + path.sep))) continue;
  const src = fs.readFileSync(file, 'utf8');
  for (const s of SECRETS) {
    if (src.includes(s)) violations.push(`${rel} references ${s}`);
  }
}

if (violations.length) {
  console.error('\n✖ Server-only secrets referenced outside allowed locations:\n');
  violations.forEach(v => console.error('  - ' + v));
  console.error('\nMove these to pages/api/** or lib/supabaseAdmin.js only.\n');
  process.exit(1);
}
console.log('✓ No admin secret leakage detected.');
