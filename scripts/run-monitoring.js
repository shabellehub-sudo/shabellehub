// scripts/run-monitoring.js
import { getSupabaseAdmin } from '../lib/supabaseAdmin.js';
import { runMonitoringBatch } from '../lib/monitoring/runCheck.js';
import { computeToolPriority, selectBatch } from '../lib/monitoring/priority.js';

const BATCH_SIZE = 40;
const RECENT_WINDOW_DAYS = 30;
const RESERVED_OVERDUE_SLOTS = 10;
const OVERDUE_THRESHOLD_DAYS = 20;

async function execute() {
  console.log(`[${new Date().toISOString()}] Starting GitHub Actions Adaptive Monitoring Sweep...`);

  const db = getSupabaseAdmin();

  const { data: toolRows, error: toolsErr } = await db
    .from('tools')
    .select('slug')
    .eq('status', 'published')
    .order('slug', { ascending: true });

  if (toolsErr || !toolRows || toolRows.length === 0) {
    console.error('Error fetching tools:', toolsErr?.message);
    process.exit(1);
  }

  const allSlugs = toolRows.map((t) => t.slug);
  console.log(`Loaded ${allSlugs.length} published tools.`);

  const since = new Date(Date.now() - RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: changeRows, error: changesErr } = await db
    .from('tool_changes')
    .select('tool_slug')
    .gte('detected_at', since);

  if (changesErr) {
    throw new Error(`Error fetching recent tool changes: ${changesErr.message}`);
  }

  const changeCountBySlug = new Map();
  for (const row of changeRows || []) {
    changeCountBySlug.set(row.tool_slug, (changeCountBySlug.get(row.tool_slug) || 0) + 1);
  }

  const { data: auditRows, error: auditErr } = await db
    .from('monitoring_audit_log')
    .select('doc')
    .gte('created_at', since);

  if (auditErr) {
    throw new Error(`Error fetching monitoring audit log: ${auditErr.message}`);
  }

  const FAILURE_ACTIONS = new Set(['fetch_failed', 'fetch_incomplete', 'tool_exception']);
  const failureCountBySlug = new Map();
  const lastCheckedBySlug = new Map();

  for (const row of auditRows || []) {
    const { tool_slug: slug, action, created_at } = row.doc || {};
    if (!slug || !created_at) continue;
    const prev = lastCheckedBySlug.get(slug);
    if (!prev || created_at > prev) {
      lastCheckedBySlug.set(slug, created_at);
    }
    if (FAILURE_ACTIONS.has(action)) {
      failureCountBySlug.set(slug, (failureCountBySlug.get(slug) || 0) + 1);
    }
  }

  const now = Date.now();
  const priorityBySlug = new Map();
  const daysSinceLastCheckBySlug = new Map();
  for (const slug of allSlugs) {
    const lastChecked = lastCheckedBySlug.get(slug) || null;
    const daysSinceLastCheck = lastChecked ? (now - new Date(lastChecked).getTime()) / (24 * 60 * 60 * 1000) : null;
    daysSinceLastCheckBySlug.set(slug, daysSinceLastCheck);
    priorityBySlug.set(slug, computeToolPriority({
      recentChangeCount: changeCountBySlug.get(slug) || 0,
      recentFailureCount: failureCountBySlug.get(slug) || 0,
      daysSinceLastCheck,
    }));
  }

  const { data: cursorRow, error: cursorReadErr } = await db
    .from('monitoring_cursor')
    .select('id, doc')
    .limit(1)
    .maybeSingle();

  if (cursorReadErr) {
    throw new Error(`Error reading monitoring cursor: ${cursorReadErr.message}`);
  }

  const lastIndex = cursorRow?.doc?.last_index ?? 0;
  const startIndex = lastIndex % allSlugs.length;

  const selectedBatch = selectBatch(allSlugs, priorityBySlug, daysSinceLastCheckBySlug, startIndex, BATCH_SIZE, {
    reservedOverdueSlots: RESERVED_OVERDUE_SLOTS,
    overdueThresholdDays: OVERDUE_THRESHOLD_DAYS,
  });

  console.log(`Selected ${selectedBatch.length}/${allSlugs.length} tools for this run (priority-weighted + overdue-guaranteed).`);

  const { runId, results } = await runMonitoringBatch(selectedBatch);

  const nextIndex = (startIndex + 1) % allSlugs.length;

  const { error: cursorErr } = cursorRow
    ? await db.from('monitoring_cursor').update({ doc: { last_index: nextIndex } }).eq('id', cursorRow.id)
    : await db.from('monitoring_cursor').insert({ doc: { last_index: nextIndex } });

  const processedCount = results && Array.isArray(results) ? results.length : 0;
  console.log(`[${runId}] Adaptive Sweep Completed: Processed ${processedCount}/${selectedBatch.length} selected tools.`);

  if (cursorErr) {
    console.error(`Cursor persistence FAILED: ${cursorErr.message} — next run will reuse startIndex=${startIndex}, not ${nextIndex}.`);
  } else {
    console.log(`Cursor tie-break seed advanced from ${startIndex} to ${nextIndex}.`);
  }
  process.exit(0);
}

execute().catch((err) => {
  console.error('Fatal Monitoring Execution Error:', err);
  process.exit(1);
});
