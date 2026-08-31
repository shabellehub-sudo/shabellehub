import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { tools } from '../data/index.js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const { data, error } = await supabase
  .from('tools')
  .select('id,doc')
  .eq('status', 'published');

if (error) {
  console.error('ERROR:', error.message);
  process.exit(1);
}

const staticSlugs = new Set(tools.map(tool => tool.slug));

for (const row of data || []) {
  const slug = row?.doc?.slug;
  const name = row?.doc?.name || '';

  if (slug && !staticSlugs.has(slug)) {
    console.log(`${slug} | ${name}`);
  }
}
