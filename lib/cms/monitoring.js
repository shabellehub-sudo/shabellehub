// ─── CMS DATA ACCESS — TOOL MONITORING (SUPABASE) ────────────────────────────
import { list, update, count, getById, getOneByField } from './_base';

const CHANGES_TABLE = 'tool_changes';
const AUDIT_TABLE = 'monitoring_audit_log';
const SNAPSHOTS_TABLE = 'tool_snapshots';

export async function listPendingChanges({ lim = 100 } = {}) {
  return list(CHANGES_TABLE, {
    filters: { status: 'pending_review' },
    orderField: 'detected_at', orderDir: 'desc', lim,
  });
}

export async function listAllChanges({ status, lim = 100 } = {}) {
  return list(CHANGES_TABLE, {
    filters: { status },
    orderField: 'detected_at', orderDir: 'desc', lim,
  });
}

export async function reviewChange(id, decision, userId) {
  const allowedDecisions = new Set(['confirmed', 'dismissed']);
  if (!allowedDecisions.has(decision)) {
    return { data: null, error: `Invalid review decision: ${decision}` };
  }

  const now = new Date().toISOString();

  // Save the review first; a freshness failure must never undo it.
  const savedRes = await update(CHANGES_TABLE, id, {
    status: decision,
    reviewed_by: userId || null,
    reviewed_at: now,
    // Confirmed changes still need an editorial pass on the tool/article
    // copy. Cleared by markEditorialUpdated() once handled.
    ...(decision === 'confirmed' ? { editorial_update_needed: true } : {}),
  }, { userId });
  if (savedRes.error) return savedRes;

  // Confirmed = copy still stale -> NOT fresh yet (see markEditorialUpdated).
  if (decision !== 'dismissed') {
    return { data: savedRes.data, error: null, warning: null };
  }

  const toolSlug = savedRes.data?.tool_slug;
  if (!toolSlug || typeof toolSlug !== 'string') {
    return { data: savedRes.data, error: null,
      warning: 'Review saved, but tool freshness update failed: missing tool_slug' };
  }

  const toolRes = await getOneByField('tools', 'slug', toolSlug);
  if (toolRes.error || !toolRes.data) {
    return { data: savedRes.data, error: null,
      warning: `Review saved, but tool freshness update failed: ${toolRes.error || 'tool not found for slug ' + toolSlug}` };
  }

  const freshRes = await update('tools', toolRes.data.id, { last_reviewed_at: now }, { userId });
  if (freshRes.error) {
    return { data: savedRes.data, error: null,
      warning: `Review saved, but tool freshness update failed: ${freshRes.error}` };
  }
  return { data: savedRes.data, error: null, warning: null };
}

// Clears the editorial-update reminder once the admin has manually
// updated the relevant tool/article copy for a confirmed change.
export async function markEditorialUpdated(id, userId) {
  const changeRes = await getById(CHANGES_TABLE, id);
  if (changeRes.error || !changeRes.data) {
    return { data: null, error: changeRes.error || 'Change not found' };
  }

  const now = new Date().toISOString();
  const savedRes = await update(CHANGES_TABLE, id, {
    editorial_update_needed: false,
    editorial_updated_at: now,
  }, { userId });
  if (savedRes.error) return savedRes;

  // Only a confirmed change represents completed editorial work.
  if (!['confirmed', 'applied'].includes(changeRes.data.status)) {
    return { data: savedRes.data, error: null, warning: null };
  }

  const toolSlug = changeRes.data.tool_slug;
  if (!toolSlug || typeof toolSlug !== 'string') {
    return { data: savedRes.data, error: null,
      warning: 'Review saved, but tool freshness update failed: missing tool_slug' };
  }

  const toolRes = await getOneByField('tools', 'slug', toolSlug);
  if (toolRes.error || !toolRes.data) {
    return { data: savedRes.data, error: null,
      warning: `Review saved, but tool freshness update failed: ${toolRes.error || 'tool not found for slug ' + toolSlug}` };
  }

  const freshRes = await update('tools', toolRes.data.id, { last_reviewed_at: now }, { userId });
  if (freshRes.error) {
    return { data: savedRes.data, error: null,
      warning: `Review saved, but tool freshness update failed: ${freshRes.error}` };
  }
  return { data: savedRes.data, error: null, warning: null };
}

// Marks a confirmed change as "don't auto-ship this" without dismissing
// it or touching tools.price/badge -- for cases where the category is
// shippable (pricing/status) but the new_value text isn't a clean value
// to write (e.g. it references a different plan tier than the one the
// price field represents). The change stays confirmed/correct in the
// audit trail; it just drops out of the "Ready to Ship" queue.
export async function skipShip(id, userId) {
  return update(CHANGES_TABLE, id, {
    ship_skipped: true,
  }, { userId });
}

export async function markApplied(id, userId) {
  return update(CHANGES_TABLE, id, {
    status: 'applied',
    reviewed_by: userId || null,
    reviewed_at: new Date().toISOString(),
  }, { userId });
}

export async function getPendingCount() {
  return count(CHANGES_TABLE, { status: 'pending_review' });
}

export async function listRecentAuditLog({ lim = 100 } = {}) {
  return list(AUDIT_TABLE, {
    orderField: 'created_at', orderDir: 'desc', lim,
  });
}

export async function listAuditLogForRun(runId) {
  return list(AUDIT_TABLE, {
    filters: { run_id: runId },
    orderField: 'created_at', orderDir: 'asc', lim: 500,
  });
}

export async function listSnapshotHistory(toolSlug, { lim = 20 } = {}) {
  return list(SNAPSHOTS_TABLE, {
    filters: { tool_slug: toolSlug },
    orderField: 'fetched_at', orderDir: 'desc', lim,
  });
}
