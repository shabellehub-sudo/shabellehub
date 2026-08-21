// scripts/run-monitoring.js
import { getSupabaseAdmin } from '../lib/supabaseAdmin.js';
import { runMonitoringBatch } from '../lib/monitoring/runCheck.js';

async function execute() {
  console.log(`[${new Date().toISOString()}] Starting GitHub Actions Full Monitoring Sweep...`);
  
  const db = getSupabaseAdmin();

  // 1. Load ALL published tools for full cadence execution
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
  console.log(`Loaded ALL ${allSlugs.length} published tools. Executing Full Sweep...`);

  // 2. Fetch cursor state (Tracks overall cycle boundary)
  const { data: cursorRow } = await db
    .from('monitoring_cursor')
    .select('id, doc')
    .limit(1)
    .maybeSingle();

  const lastIndex = cursorRow?.doc?.last_index ?? 0;
  const startIndex = lastIndex % allSlugs.length;

  // Re-order batch array starting from current cursor to end, then wrap around
  const reorderedBatch = [
    ...allSlugs.slice(startIndex),
    ...allSlugs.slice(0, startIndex)
  ];

  console.log(`Executing continuous sweep for ${reorderedBatch.length} tools...`);

  // 3. Execute monitoring batch for all tools
  const { runId, results } = await runMonitoringBatch(reorderedBatch);

  // 4. Batch-Level Atomic Cursor State Commit
  const processedCount = results && Array.isArray(results) ? results.length : 0;
  const nextIndex = (startIndex + processedCount) % allSlugs.length;

  if (cursorRow) {
    await db.from('monitoring_cursor').update({ doc: { last_index: nextIndex } }).eq('id', cursorRow.id);
  } else {
    await db.from('monitoring_cursor').insert({ doc: { last_index: nextIndex } });
  }

  console.log(`[${runId}] Full Sweep Completed: Processed ${processedCount}/${reorderedBatch.length} tools.`);
  console.log(`Cursor advanced from ${startIndex} to ${nextIndex}.`);
  process.exit(0);
}

execute().catch((err) => {
  console.error('Fatal Monitoring Execution Error:', err);
  process.exit(1);
});
