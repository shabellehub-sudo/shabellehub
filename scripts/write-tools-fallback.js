// scripts/write-tools-fallback.js
//
// WRITE MODE. Regenerates data/index.js `tools` + `categories` from the
// 100 published Supabase tools (Supabase is the source of truth for all
// field values; only the numeric `id` is preserved by slug for existing
// tools). Creates a timestamped backup BEFORE writing. Locates the tools/
// categories array boundaries by searching for anchor text at runtime --
// never by hardcoded line numbers -- and aborts with zero writes if any
// anchor is missing or out of expected order. Self-verifies the written
// file (node --check + re-import + count/duplicate/required-field checks)
// and automatically restores the backup if verification fails.
//
// Usage: node scripts/write-tools-fallback.js --write

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process';
import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

loadEnv({ path: '.env.local' });

const WRITE_FLAG = '--write';
const DATA_FILE = path.resolve('data/index.js');

const CATEGORY_RENAMES = { 'AI Writing': 'Writing' };
const NEW_CATEGORY_META = {
  Writing: {
    icon: '✍️',
    description:
      'AI writing tools for drafting, editing, research, and creating high-quality content with the help of artificial intelligence.',
  },
};

const REQUIRED_FIELDS = ['slug', 'name', 'category', 'desc', 'website', 'rating', 'price'];

function printUsage() {
  console.log('Usage: node scripts/write-tools-fallback.js --write');
  console.log('Regenerates data/index.js tools + categories from Supabase. Creates a timestamped backup first.');
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function findLineIndex(lines, predicate, fromIndex = 0) {
  for (let i = fromIndex; i < lines.length; i++) {
    if (predicate(lines[i])) return i;
  }
  return -1;
}

function freshImport(filePath) {
  const url = pathToFileURL(filePath);
  url.searchParams.set('t', Date.now().toString() + Math.random().toString(36).slice(2));
  return import(url.href);
}

function serializeTool(id, doc) {
  const j = (v, fallback) => JSON.stringify(v === undefined || v === null ? fallback : v);
  return [
    '  {',
    `    id: ${id},`,
    `    slug: ${j(doc.slug, '')},`,
    `    name: ${j(doc.name, '')},`,
    `    category: ${j(doc.category, '')},`,
    `    badge: ${j(doc.badge, null)},`,
    `    rating: ${doc.rating === undefined || doc.rating === null ? 'null' : JSON.stringify(doc.rating)},`,
    `    price: ${j(doc.price, '')},`,
    `    priceTier: ${j(doc.priceTier, '')},`,
    `    desc: ${j(doc.desc, '')},`,
    `    longDesc: ${j(doc.longDesc, '')},`,
    `    tags: ${JSON.stringify(doc.tags ?? [])},`,
    `    affiliateLink: ${j(doc.affiliateLink, '')},`,
    `    website: ${j(doc.website, '')},`,
    `    hot: ${doc.hot ? 'true' : 'false'},`,
    `    featured: ${doc.featured ? 'true' : 'false'},`,
    `    pros: ${JSON.stringify(doc.pros ?? [])},`,
    `    cons: ${JSON.stringify(doc.cons ?? [])},`,
    `    useCases: ${JSON.stringify(doc.useCases ?? [])},`,
    `    seoKeywords: ${JSON.stringify(doc.seoKeywords ?? [])},`,
    `    alternatives: ${JSON.stringify(doc.alternatives ?? [])},`,
    '  },',
  ].join('\n');
}

function serializeCategory(cat) {
  if (cat.name === 'All') {
    return `  { name: "All", icon: ${JSON.stringify(cat.icon)}, count: ${cat.count} },`;
  }
  return [
    '  {',
    `    name: ${JSON.stringify(cat.name)}, icon: ${JSON.stringify(cat.icon)}, count: ${cat.count},`,
    `    description: ${JSON.stringify(cat.description)},`,
    '  },',
  ].join('\n');
}

async function main() {
  if (!process.argv.includes(WRITE_FLAG)) {
    printUsage();
    process.exit(0);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error('ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or a usable key in .env.local.');
    process.exit(1);
  }
  console.log(`Using ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SUPABASE_SERVICE_ROLE_KEY' : 'NEXT_PUBLIC_SUPABASE_ANON_KEY (fallback)'} for read access.`);

  const supabase = createClient(supabaseUrl, supabaseKey);

  let publishedRows;
  try {
    // Uses the flat `status` column (confirmed via schema inspection to
    // exist and to match doc->>'status' on all 100 rows), not a JSON-path
    // filter -- avoids depending on unverified supabase-js JSON-path query
    // syntax for a write-path script.
    const { data, error } = await supabase.from('tools').select('id, doc').eq('status', 'published');
    if (error) { console.error('ERROR: Supabase query failed:', error.message); process.exit(1); }
    publishedRows = data || [];
  } catch (err) {
    console.error('ERROR: Unexpected error querying Supabase:', err.message);
    process.exit(1);
  }

  // Guard: an unexpectedly empty result (a silently-misbehaving filter, an
  // RLS change, a transient API issue) must never be allowed to regenerate
  // data/index.js as an empty tools array. The post-write verification
  // below compares the written file against slugToDoc.size -- if THIS is
  // already 0, that check would trivially pass (0 === 0) and let a wipe
  // through. Fail fast here instead, before any file is touched.
  if (publishedRows.length === 0) {
    console.error('ERROR: Supabase returned 0 published tools. Aborting -- refusing to regenerate data/index.js as an empty fallback. No writes made.');
    process.exit(1);
  }

  if (!fs.existsSync(DATA_FILE)) {
    console.error(`ERROR: ${DATA_FILE} does not exist.`);
    process.exit(1);
  }

  const { tools: staticTools, categories: staticCategories } = await freshImport(DATA_FILE);

  const slugToExistingId = new Map();
  for (const t of staticTools) {
    if (t && typeof t.slug === 'string' && !slugToExistingId.has(t.slug)) slugToExistingId.set(t.slug, t.id);
  }
  const maxExistingId = staticTools.reduce((m, t) => (typeof t.id === 'number' && t.id > m ? t.id : m), 0);

  const slugToDoc = new Map();
  for (const row of publishedRows) {
    const doc = row.doc || {};
    if (typeof doc.slug === 'string' && doc.slug.length > 0 && !slugToDoc.has(doc.slug)) {
      slugToDoc.set(doc.slug, doc);
    }
  }

  const existingSlugsInOrder = staticTools.map((t) => t.slug).filter((s) => slugToDoc.has(s));
  const newSlugs = [...slugToDoc.keys()].filter((s) => !slugToExistingId.has(s)).sort();

  let nextId = maxExistingId + 1;
  const idAssignments = new Map();
  for (const s of existingSlugsInOrder) idAssignments.set(s, slugToExistingId.get(s));
  for (const s of newSlugs) { idAssignments.set(s, nextId); nextId += 1; }

  const orderedSlugs = [...existingSlugsInOrder, ...newSlugs];
  const newToolsArrayText = 'export const tools = [\n' +
    orderedSlugs.map((s) => serializeTool(idAssignments.get(s), slugToDoc.get(s))).join('\n') +
    '\n];';

  const liveCategoryCounts = new Map();
  for (const doc of slugToDoc.values()) {
    if (typeof doc.category === 'string' && doc.category.length > 0) {
      liveCategoryCounts.set(doc.category, (liveCategoryCounts.get(doc.category) || 0) + 1);
    }
  }

  const staticCategoryByName = new Map(staticCategories.filter((c) => c.name !== 'All').map((c) => [c.name, c]));
  const newCategoryEntries = [];
  for (const cat of staticCategories.filter((c) => c.name !== 'All')) {
    if (liveCategoryCounts.has(cat.name)) {
      newCategoryEntries.push({ name: cat.name, icon: cat.icon, description: cat.description, count: liveCategoryCounts.get(cat.name) });
    }
  }
  for (const [liveName, meta] of Object.entries(NEW_CATEGORY_META)) {
    if (liveCategoryCounts.has(liveName) && !staticCategoryByName.has(liveName)) {
      newCategoryEntries.push({ name: liveName, icon: meta.icon, description: meta.description, count: liveCategoryCounts.get(liveName) });
    }
  }
  const allEntry = { name: 'All', icon: (staticCategories.find((c) => c.name === 'All') || {}).icon || '🔍', count: slugToDoc.size };
  const newCategoriesArrayText = 'export const categories = [\n' +
    [allEntry, ...newCategoryEntries].map(serializeCategory).join('\n') +
    '\n];';

  const rawText = fs.readFileSync(DATA_FILE, 'utf8');
  const lines = rawText.split('\n');

  const toolsStart = findLineIndex(lines, (l) => l.trim().startsWith('export const tools = ['));
  if (toolsStart === -1) { console.error('ERROR: could not find "export const tools = [" anchor. Aborting -- no writes made.'); process.exit(1); }

  const blogPostsStart = findLineIndex(lines, (l) => l.trim().startsWith('export const blogPosts'), toolsStart + 1);
  if (blogPostsStart === -1) { console.error('ERROR: could not find "export const blogPosts" anchor after tools. Aborting -- no writes made.'); process.exit(1); }

  let toolsEnd = -1;
  for (let i = blogPostsStart - 1; i > toolsStart; i--) {
    if (lines[i].trim() === '];') { toolsEnd = i; break; }
  }
  if (toolsEnd === -1) { console.error('ERROR: could not find closing "];" for tools array before blogPosts. Aborting -- no writes made.'); process.exit(1); }

  const categoriesStart = findLineIndex(lines, (l) => l.trim().startsWith('export const categories = ['), blogPostsStart + 1);
  if (categoriesStart === -1) { console.error('ERROR: could not find "export const categories = [" anchor. Aborting -- no writes made.'); process.exit(1); }

  const siteConfigStart = findLineIndex(lines, (l) => l.trim().startsWith('export const siteConfig'), categoriesStart + 1);
  if (siteConfigStart === -1) { console.error('ERROR: could not find "export const siteConfig" anchor after categories. Aborting -- no writes made.'); process.exit(1); }

  let categoriesEnd = -1;
  for (let i = siteConfigStart - 1; i > categoriesStart; i--) {
    if (lines[i].trim() === '];') { categoriesEnd = i; break; }
  }
  if (categoriesEnd === -1) { console.error('ERROR: could not find closing "];" for categories array before siteConfig. Aborting -- no writes made.'); process.exit(1); }

  console.log('Anchors validated:');
  console.log(`  tools:      lines ${toolsStart + 1}-${toolsEnd + 1}`);
  console.log(`  blogPosts starts: line ${blogPostsStart + 1} (untouched)`);
  console.log(`  categories: lines ${categoriesStart + 1}-${categoriesEnd + 1}`);
  console.log(`  siteConfig starts: line ${siteConfigStart + 1} (untouched)`);

  const newLines = [
    ...lines.slice(0, toolsStart),
    newToolsArrayText,
    ...lines.slice(toolsEnd + 1, categoriesStart),
    newCategoriesArrayText,
    ...lines.slice(categoriesEnd + 1),
  ];
  const newFileText = newLines.join('\n');

  const backupPath = `${DATA_FILE}.bak-${timestamp()}`;
  fs.copyFileSync(DATA_FILE, backupPath);
  console.log(`Backup created: ${backupPath}`);

  // Atomic write: write to a temp file in the same directory (same
  // filesystem, so the rename below is atomic), then rename over the
  // target. If the process crashes mid-write, DATA_FILE is left fully
  // untouched -- the crash only leaves an incomplete temp file, never a
  // corrupted data/index.js. fs.renameSync is atomic at the OS level
  // (POSIX rename(2)); a direct fs.writeFileSync(DATA_FILE, ...) is not.
  const tmpPath = `${DATA_FILE}.tmp-${timestamp()}-${process.pid}`;
  try {
    fs.writeFileSync(tmpPath, newFileText, 'utf8');
    fs.renameSync(tmpPath, DATA_FILE);
  } catch (err) {
    try { fs.unlinkSync(tmpPath); } catch { /* tmp file may not exist yet, ignore */ }
    console.error('ERROR: Failed to write/rename the temp file. DATA_FILE was not touched:', err.message);
    process.exit(1);
  }
  console.log(`Wrote ${DATA_FILE} (atomic rename)`);

  let verifyOk = true;
  const problems = [];

  try {
    execSync(`node --check "${DATA_FILE}"`, { stdio: 'pipe' });
    console.log('node --check: PASS');
  } catch (err) {
    verifyOk = false;
    problems.push(`node --check failed: ${err.stderr ? err.stderr.toString() : err.message}`);
  }

  if (verifyOk) {
    try {
      const fresh = await freshImport(DATA_FILE);
      const freshTools = fresh.tools;
      const freshCategories = fresh.categories;

      if (!Array.isArray(freshTools) || freshTools.length !== slugToDoc.size) {
        verifyOk = false;
        problems.push(`tools count mismatch: expected ${slugToDoc.size}, got ${Array.isArray(freshTools) ? freshTools.length : 'not an array'}`);
      }

      const seenSlugs = new Set();
      const dupSlugs = [];
      for (const t of freshTools || []) {
        if (seenSlugs.has(t.slug)) dupSlugs.push(t.slug); else seenSlugs.add(t.slug);
      }
      if (dupSlugs.length > 0) { verifyOk = false; problems.push(`duplicate slugs in written file: ${dupSlugs.join(', ')}`); }

      const missing = [];
      for (const t of freshTools || []) {
        const miss = REQUIRED_FIELDS.filter((f) => t[f] === undefined || t[f] === null || t[f] === '');
        if (miss.length > 0) missing.push(`${t.slug || '(no slug)'}: ${miss.join(',')}`);
      }
      if (missing.length > 0) { verifyOk = false; problems.push(`tools missing required fields: ${missing.join(' | ')}`); }

      const expectedCategoryCount = newCategoryEntries.length + 1;
      if (!Array.isArray(freshCategories) || freshCategories.length !== expectedCategoryCount) {
        verifyOk = false;
        problems.push(`categories count mismatch: expected ${expectedCategoryCount}, got ${Array.isArray(freshCategories) ? freshCategories.length : 'not an array'}`);
      }

      if (verifyOk) {
        console.log(`Re-import verification: PASS (tools: ${freshTools.length}, categories: ${freshCategories.length}, duplicates: 0, missing-fields: 0)`);
      }
    } catch (err) {
      verifyOk = false;
      problems.push(`re-import of written file threw: ${err.message}`);
    }
  }

  if (!verifyOk) {
    console.error('VERIFICATION FAILED. Restoring backup automatically.');
    problems.forEach((p) => console.error(`  - ${p}`));
    fs.copyFileSync(backupPath, DATA_FILE);
    console.error(`Restored ${DATA_FILE} from ${backupPath}. No net change was left in place.`);
    process.exit(1);
  }

  console.log();
  console.log('=== Summary ===');
  console.log(`Tools written: ${slugToDoc.size} (preserved IDs: ${existingSlugsInOrder.length}, new IDs: ${newSlugs.length}, range ${maxExistingId + 1}-${nextId - 1})`);
  console.log(`Categories written: ${newCategoryEntries.length + 1} (including "All")`);
  console.log(`Backup: ${backupPath}`);
  console.log();
  console.log('Next steps (run manually, not executed by this script):');
  console.log('  git diff -- data/index.js');
  console.log('Do not commit or deploy until this diff has been reviewed.');
}

main().catch((err) => {
  console.error('ERROR: Unhandled error:', err && err.message ? err.message : err);
  process.exit(1);
});
