#!/usr/bin/env node

import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { tools as staticTools } from '../data/index.js';

const DRY_RUN_FLAG = '--dry-run';

function printUsage() {
  console.log('Usage: node scripts/sync-tools-fallback.mjs --dry-run');
  console.log('');
  console.log('Audit-only script. No filesystem or database writes are performed.');
}

async function main() {
  if (!process.argv.includes(DRY_RUN_FLAG)) {
    printUsage();
    process.exit(0);
  }

  loadEnv({ path: '.env.local' });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('ERROR: Missing Supabase credentials.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from('tools')
    .select('id, doc')
    .eq('status', 'published');

  if (error) {
    console.error('ERROR: Supabase query failed:', error.message);
    process.exit(1);
  }

  const publishedTools = data || [];

  if (!Array.isArray(staticTools)) {
    console.error('ERROR: data/index.js does not export tools as an array.');
    process.exit(1);
  }

  const publishedSlugs = new Set(
    publishedTools
      .map((row) => row?.doc?.slug)
      .filter((slug) => typeof slug === 'string' && slug.length > 0)
  );

  const staticSlugs = new Set(
    staticTools
      .map((tool) => tool?.slug)
      .filter((slug) => typeof slug === 'string' && slug.length > 0)
  );

  const missingFromStatic = [...publishedSlugs]
    .filter((slug) => !staticSlugs.has(slug))
    .sort();

  const orphanedStatic = [...staticSlugs]
    .filter((slug) => !publishedSlugs.has(slug))
    .sort();

  console.log('');
  console.log('=== sync-tools-fallback: DRY-RUN AUDIT ===');
  console.log(`Published Supabase tools: ${publishedSlugs.size}`);
  console.log(`Static fallback tools: ${staticSlugs.size}`);
  console.log('');

  console.log(
    `Published tools missing from static fallback: ${missingFromStatic.length}`
  );

  for (const slug of missingFromStatic) {
    console.log(`  - ${slug}`);
  }

  console.log('');

  console.log(
    `Static tools without matching published Supabase tool: ${orphanedStatic.length}`
  );

  for (const slug of orphanedStatic) {
    console.log(`  - ${slug}`);
  }

  console.log('');
  console.log('Audit complete.');
  console.log('No files or database rows were modified.');
}

main().catch((error) => {
  console.error(
    'ERROR: Unexpected audit failure:',
    error?.message || error
  );
  process.exit(1);
});

