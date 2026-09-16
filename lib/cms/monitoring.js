// ─── CMS DATA ACCESS — TOOL MONITORING (SUPABASE) ────────────────────────────
import { list, update, count } from './_base';

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
  return update(CHANGES_TABLE, id, {
    status: decision,
    reviewed_by: userId || null,
    reviewed_at: new Date().toISOString(),
  }, { userId });
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
