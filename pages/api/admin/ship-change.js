// pages/api/admin/ship-change.js
//
// Approve & Ship MVP — final step of the pipeline:
//   Detect -> Review -> Approve -> Suggested Value -> Admin Confirm/Edit -> Ship
//
// Only two change_category values are auto-ship-eligible in the MVP:
//   "pricing" -> tools.price
//   "status"  -> tools.badge
// All other categories are rejected here (server-side enforcement, not
// just a UI restriction) because they would require free-text
// desc/longDesc edits that are unsafe to auto-apply from AI-classified
// diff fragments.
//
// The admin-confirmed value (not the raw diff fragment) is what gets
// written, since diffSnapshots() returns word-level fragments (e.g.
// "$25/month") that may not match the full production format (e.g.
// "Free / $25mo").
//
// tools and tool_changes are doc-jsonb tables (see lib/cms/_base.js) --
// price/badge/confirmed_value all live inside the doc column, so this
// route goes through getOneByField()/update() rather than writing to
// top-level SQL columns directly.

import { requireAuth } from '../../../lib/supabaseAdmin';
import { getOneByField, update } from '../../../lib/cms/_base';

const CATEGORY_TO_COLUMN = {
  pricing: 'price',
  status: 'badge',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await requireAuth(req);
  if (auth.error) {
    return res.status(403).json({ error: auth.error });
  }

  const { changeId, confirmedValue } = req.body || {};
  if (
    typeof changeId !== 'string' ||
    !changeId.trim() ||
    typeof confirmedValue !== 'string' ||
    !confirmedValue.trim()
  ) {
    return res.status(400).json({ error: 'changeId and confirmedValue are required (non-empty strings)' });
  }

  const { data: change, error: fetchErr } = await getOneByField('tool_changes', 'id', changeId);
  if (fetchErr || !change) {
    return res.status(404).json({ error: 'Change not found' });
  }

  if (change.status !== 'confirmed') {
    return res.status(400).json({ error: `Change status is "${change.status}", must be "confirmed" to ship` });
  }

  const column = CATEGORY_TO_COLUMN[change.change_category];
  if (!column) {
    return res.status(400).json({
      error: `change_category "${change.change_category}" is not auto-ship-eligible in this MVP -- requires manual edit`,
    });
  }

  const slug = change.tool_slug;
  if (!slug) {
    return res.status(400).json({ error: 'Change record is missing tool_slug' });
  }

  const { data: tool, error: toolErr } = await getOneByField('tools', 'slug', slug);
  if (toolErr || !tool) {
    return res.status(404).json({ error: `Tool "${slug}" not found` });
  }

  // 1. Write the confirmed value to the live tools table.
  const shipResult = await update('tools', tool.id, { [column]: confirmedValue.trim() }, { userId: auth.uid });
  if (shipResult.error) {
    return res.status(500).json({ error: `Failed to update tools table: ${shipResult.error}` });
  }

  // 2. Mark the change as shipped, recording the confirmed value
  //    (which may differ from the raw suggested newValue) for audit.
  const shippedAt = new Date().toISOString();
  const auditResult = await update('tool_changes', changeId, {
    status: 'shipped',
    confirmed_value: confirmedValue.trim(),
    shipped_at: shippedAt,
    shipped_by: auth.uid || null,
  }, { userId: auth.uid });

  if (auditResult.error) {
    // The tools table write already succeeded -- do not report this as a
    // full failure, but surface it so the audit trail gap is visible.
    return res.status(207).json({
      warning: `tools.${column} updated successfully, but tool_changes status update failed: ${auditResult.error}`,
      slug,
      column,
      confirmedValue: confirmedValue.trim(),
    });
  }

  return res.status(200).json({
    ok: true,
    slug,
    column,
    confirmedValue: confirmedValue.trim(),
    shippedAt,
  });
}
