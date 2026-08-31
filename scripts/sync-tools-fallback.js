// scripts/sync-tools-fallback.js
//
// DRY-RUN ONLY (current version). Compares the static fallback in
// data/index.js against published tools in Supabase and reports what a
// future write-mode WOULD change: preserved/new numeric IDs, category
// additions/removals, and count updates. This version performs zero
// filesystem writes and zero database writes -- it only reads and reports.
//
// Write mode does not exist yet. It will be added as a separate,
// explicitly-approved change after this dry-run output has been reviewed.
//
// Usage: node scripts/sync-tools-fallback.js --dry-run

import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { tools as staticTools, categories as staticCategories } from '../data/index.js';

loadEnv({ path: '.env.local' });

const DRY_RUN_FLAG = '--dry-run';

// One-time, explicitly-specified normalization: the static fallback's
// "AI Writing" category is being retired in favor of "Writing", which is
// what Supabase's tools.doc.category values actually use. This is an
// operator-specified rename, not something the script infers -- future
// category changes should get their own explicit entry here rather than
// relying on fuzzy name matching.
const CATEGORY_RENAMES = {
  'AI Writing': 'Writing',
};

const NEW_CATEGORY_META = {
  Writing: {
    icon: '✍️',
    description:
      'AI writing tools for drafting, editing, research, and creating high-quality content with the help of artificial intelligence.',
  },
};

// Fields the dry-run treats as "required" for a usable tool card. This is
// a judgment call based on the fields the static tools array actually
// uses today (head -100 of data/index.js) -- not a spec pulled from
// elsewhere, so flag anything questionable rather than assuming it's exact.
const REQUIRED_FIELDS = ['slug', 'name', 'category', 'desc', 'website', 'rating', 'price'];

function printUsage() {
  console.log('Usage: node scripts/sync-tools-fallback.js --dry-run');
  console.log();
  console.log('Dry-run only in this version. Reports what a sync would change');
  console.log('without writing to data/index.js or the database.');
}

async function main() {
  const hasDryRun = process.argv.includes(DRY_RUN_FLAG);

  if (!hasDryRun) {
    printUsage();
    process.exit(0);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or a usable key in .env.local.');
    process.exit(1);
  }

  const usingServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log(`Using ${usingServiceRole ? 'SUPABASE_SERVICE_ROLE_KEY' : 'NEXT_PUBLIC_SUPABASE_ANON_KEY (fallback)'} for read access.`);

  const supabase = createClient(supabaseUrl, supabaseKey);

  let publishedRows;
  try {
    const { data, error } = await supabase
      .from('tools')
      .select('id, doc')
      .eq('doc->>status', 'published');

    if (error) {
      console.error('ERROR: Supabase query failed:', error.message);
      process.exit(1);
    }
    publishedRows = data || [];
  } catch (err) {
    console.error('ERROR: Unexpected error while querying Supabase:', err.message);
    process.exit(1);
  }

  // ─── 1. Build slug -> existing numeric id map from the static file ───
  if (!Array.isArray(staticTools)) {
    console.error('ERROR: data/index.js does not export an array named `tools`.');
    process.exit(1);
  }
  const slugToExistingId = new Map();
  const staticDuplicateSlugs = [];
  for (const t of staticTools) {
    if (!t || typeof t.slug !== 'string') continue;
    if (slugToExistingId.has(t.slug)) {
      staticDuplicateSlugs.push(t.slug);
    } else {
      slugToExistingId.set(t.slug, t.id);
    }
  }
  const maxExistingId = staticTools.reduce((max, t) => (typeof t.id === 'number' && t.id > max ? t.id : max), 0);

  // ─── 2. Published Supabase tools: dedupe slugs, check required fields ───
  const supabaseDuplicateSlugs = [];
  const missingRequiredFields = [];
  const slugToDoc = new Map();
  for (const row of publishedRows) {
    const doc = row.doc || {};
    const slug = doc.slug;
    if (typeof slug !== 'string' || slug.length === 0) {
      missingRequiredFields.push({ id: row.id, slug: '(missing)', missing: ['slug'] });
      continue;
    }
    const missing = REQUIRED_FIELDS.filter((f) => doc[f] === undefined || doc[f] === null || doc[f] === '');
    if (missing.length > 0) missingRequiredFields.push({ id: row.id, slug, missing });

    if (slugToDoc.has(slug)) {
      supabaseDuplicateSlugs.push(slug);
    } else {
      slugToDoc.set(slug, doc);
    }
  }

  // ─── 3/4. Preserve existing IDs for matching slugs; assign new IDs sequentially ───
  const idPreserved = [];
  const idsToAssign = [];
  let nextId = maxExistingId + 1;
  for (const slug of slugToDoc.keys()) {
    if (slugToExistingId.has(slug)) {
      idPreserved.push({ slug, id: slugToExistingId.get(slug) });
    } else {
      idsToAssign.push({ slug, id: nextId });
      nextId += 1;
    }
  }

  // ─── 5/6. Category counts from fetched tool data (never hardcoded) ───
  const liveCategoryCounts = new Map();
  for (const doc of slugToDoc.values()) {
    const rawCategory = doc.category;
    if (typeof rawCategory !== 'string' || rawCategory.length === 0) continue;
    liveCategoryCounts.set(rawCategory, (liveCategoryCounts.get(rawCategory) || 0) + 1);
  }

  // ─── 7. Categories to keep (preserve icon/description), add, remove ───
  const staticCategoryByName = new Map(
    staticCategories.filter((c) => c.name !== 'All').map((c) => [c.name, c])
  );

  const categoriesToKeep = [];
  const categoriesToAdd = [];
  const categoryNamesWithNoMeta = [];

  for (const [liveName, count] of liveCategoryCounts.entries()) {
    if (staticCategoryByName.has(liveName)) {
      const existing = staticCategoryByName.get(liveName);
      categoriesToKeep.push({ name: liveName, icon: existing.icon, description: existing.description, oldCount: existing.count, newCount: count });
      continue;
    }
    if (NEW_CATEGORY_META[liveName]) {
      categoriesToAdd.push({ name: liveName, ...NEW_CATEGORY_META[liveName], count });
      continue;
    }
    // Live category with no static metadata and no explicit rename/new-meta
    // entry -- the script does not invent an icon/description for it.
    categoryNamesWithNoMeta.push({ name: liveName, count });
  }

  const categoriesToRemove = [...staticCategoryByName.keys()].filter(
    (name) => !liveCategoryCounts.has(name) && CATEGORY_RENAMES[name] === undefined
  );
  // Categories that were explicitly renamed (e.g. "AI Writing" -> "Writing")
  // and have zero remaining live tools under the old name are also removed,
  // reported separately so the rename is visible rather than silent.
  const categoriesRenamedAway = Object.entries(CATEGORY_RENAMES).filter(
    ([oldName]) => staticCategoryByName.has(oldName) && !liveCategoryCounts.has(oldName)
  );

  // ─── DB vs fallback differences ───
  const missingFromStatic = [...slugToDoc.keys()].filter((slug) => !slugToExistingId.has(slug)).sort();
  const staticOrphans = [...slugToExistingId.keys()].filter((slug) => !slugToDoc.has(slug)).sort();

  // ─── Report ───
  console.log();
  console.log('=== sync-tools-fallback: DRY RUN (no writes performed) ===');
  console.log();
  console.log(`Published tools in Supabase: ${slugToDoc.size}`);
  console.log(`Tools currently in data/index.js: ${staticTools.length}`);
  console.log();

  console.log(`Duplicate slugs in Supabase (published): ${supabaseDuplicateSlugs.length}`);
  supabaseDuplicateSlugs.forEach((s) => console.log(`  - ${s}`));
  console.log(`Duplicate slugs in data/index.js: ${staticDuplicateSlugs.length}`);
  staticDuplicateSlugs.forEach((s) => console.log(`  - ${s}`));
  console.log();

  console.log(`Published tools missing required fields (${REQUIRED_FIELDS.join(', ')}): ${missingRequiredFields.length}`);
  missingRequiredFields.forEach((m) => console.log(`  - ${m.slug} (id: ${m.id}) missing: ${m.missing.join(', ')}`));
  console.log();

  console.log(`IDs preserved (existing slug match): ${idPreserved.length}`);
  console.log(`New IDs that would be assigned (starting at ${maxExistingId + 1}): ${idsToAssign.length}`);
  idsToAssign.forEach((x) => console.log(`  - ${x.slug} -> id ${x.id}`));
  console.log();

  console.log('=== Category changes ===');
  console.log(`Categories kept (name match, count recalculated):`);
  categoriesToKeep.forEach((c) =>
    console.log(`  - ${c.name}: ${c.oldCount} -> ${c.newCount}${c.oldCount !== c.newCount ? '  [CHANGED]' : ''}`)
  );
  console.log(`Categories to ADD: ${categoriesToAdd.length}`);
  categoriesToAdd.forEach((c) => console.log(`  - ${c.name} (icon: ${c.icon}, count: ${c.count})`));
  console.log(`Categories to REMOVE (zero live tools, no rename target): ${categoriesToRemove.length}`);
  categoriesToRemove.forEach((n) => console.log(`  - ${n}`));
  console.log(`Categories renamed away (old name retired): ${categoriesRenamedAway.length}`);
  categoriesRenamedAway.forEach(([oldName, newName]) => console.log(`  - "${oldName}" -> "${newName}"`));
  if (categoryNamesWithNoMeta.length > 0) {
    console.log(`WARNING: live categories with no static metadata and no rename/new-meta entry (script will NOT invent icon/description): ${categoryNamesWithNoMeta.length}`);
    categoryNamesWithNoMeta.forEach((c) => console.log(`  - ${c.name} (count: ${c.count})`));
  }
  console.log();

  console.log(`Published tools missing from static fallback: ${missingFromStatic.length}`);
  missingFromStatic.forEach((slug) => console.log(`  - ${slug}`));
  console.log();
  console.log(`Static fallback orphans (not published in Supabase): ${staticOrphans.length}`);
  staticOrphans.forEach((slug) => console.log(`  - ${slug}`));
  console.log();
  console.log('Dry run complete. No files or database rows were modified.');
}

main().catch((err) => {
  console.error('ERROR: Unhandled error:', err && err.message ? err.message : err);
  process.exit(1);
});
