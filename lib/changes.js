// lib/changes.js
// SERVER-SIDE ONLY. Import this only from getStaticProps, server routes
// (RSS, sitemap) or API code. Never import it from a component: it uses the
// privileged Supabase client (lib/supabaseAdmin.js).
import { getSupabaseAdmin } from './supabaseAdmin';
import { buildPublicChanges, isEligible } from './changes/publicData.js';

// Two queries only, merged in JS (no FK assumed). Query failures THROW:
// a failed query must never look like "no changes".
export async function getPublicChanges() {
  const db = getSupabaseAdmin();

  const q1 = await db
    .from('tool_changes')
    .select(
      'id, tool_slug, status, detected_at, priority, ' +
      'change_category:doc->>change_category, evidence_url:doc->>evidence_url, ' +
      'source_type:doc->>source_type, ai_summary:doc->>ai_summary, reviewed_at:doc->>reviewed_at'
    )
    .in('status', ['confirmed', 'shipped']);
  if (q1.error) throw new Error(`tool_changes query failed: ${q1.error.message}`);
  const changes = q1.data || [];

  const slugs = [...new Set(changes.filter(isEligible).map((c) => c.tool_slug).filter(Boolean))];
  if (slugs.length === 0) return { display: [], rss: [] }; // genuinely nothing eligible

  const q2 = await db
    .from('tools')
    .select('slug, name, logo_url:doc->>logo_url')
    .eq('status', 'published')
    .in('slug', slugs);
  if (q2.error) throw new Error(`tools query failed: ${q2.error.message}`);

  return buildPublicChanges(changes, q2.data || []);
}

// Optional section on /tools/[slug]. The tool page must never break because of
// this: on any failure it logs and returns [] (the section simply is not shown).
export async function getToolChangeHistory(slug) {
  try {
    const { display } = await getPublicChanges();
    return display.filter((c) => c.tool_slug === slug);
  } catch (err) {
    console.error('[changes] tool history unavailable:', err.message);
    return [];
  }
}
