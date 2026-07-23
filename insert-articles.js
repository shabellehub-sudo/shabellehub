// insert-articles.js
// Run from your project root in Termux: node insert-articles.js remaining-6-articles.json
//
// Reads a JSON array of "doc" objects and inserts each as a new row into the
// posts table via Supabase's REST API, using the service role key from your
// project's .env.local (falls back to .env if .env.local doesn't exist).
//
// Requires: SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL (or
// SUPABASE_URL) already set in your project's env file — the same ones
// your Next.js app already uses.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function loadEnv() {
  const candidates = ['.env.local', '.env'];
  const env = {};
  for (const file of candidates) {
    if (fs.existsSync(file)) {
      const lines = fs.readFileSync(file, 'utf8').split('\n');
      for (const line of lines) {
        const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
        if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    }
  }
  return env;
}

async function main() {
  const jsonFile = process.argv[2];
  if (!jsonFile) {
    console.error('❌ Usage: node insert-articles.js <path-to-json-file>');
    process.exit(1);
  }
  if (!fs.existsSync(jsonFile)) {
    console.error('❌ Could not find ' + jsonFile);
    process.exit(1);
  }

  const env = loadEnv();
  const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
  const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('❌ Could not find NEXT_PUBLIC_SUPABASE_URL / SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    console.error('   Make sure you run this from your project root, where .env.local lives.');
    process.exit(1);
  }

  const docs = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
  console.log(`Found ${docs.length} articles to insert.`);

  let success = 0;
  let failed = 0;

  for (const doc of docs) {
    const row = { id: crypto.randomUUID(), doc };
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/posts`, {
        method: 'POST',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(row),
      });
      if (res.ok) {
        console.log(`✅ ${doc.slug}`);
        success++;
      } else {
        const text = await res.text();
        console.error(`❌ ${doc.slug}: ${res.status} ${text}`);
        failed++;
      }
    } catch (err) {
      console.error(`❌ ${doc.slug}: ${err.message}`);
      failed++;
    }
  }

  console.log('');
  console.log(`Done. ${success} inserted, ${failed} failed.`);
}

main();
