import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { AdminCard, Button, ErrorBanner, EmptyState } from '../../../components/admin/ui';
import { listPendingChanges, listAllChanges, reviewChange, listRecentAuditLog } from '../../../lib/cms/monitoring';
import { isSupabaseConfigured, getSupabaseClient } from '../../../lib/supabase';

const CATEGORY_LABELS = {
  status: '🔴 Status',
  model_update: '🔄 Model Update',
  pricing: '💰 Pricing',
  plan_change: '📦 Plan Change',
  limit_change: '🔢 Limit Change',
  api_change: '🔌 API Change',
  integration_change: '🔗 Integration',
  feature_added: '🆕 Feature Added',
  feature_removed: '❌ Feature Removed',
  unknown: 'Unknown',
};

export default function AdminMonitoringPage() {
  const [changes, setChanges] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scanSlug, setScanSlug] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [shippable, setShippable] = useState([]);
  const [shipValues, setShipValues] = useState({});
  const [shipping, setShipping] = useState({});

  const SHIPPABLE_CATEGORIES = new Set(['pricing', 'status']);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) { setLoading(false); return; }
    setLoading(true);
    const [changesRes, auditRes, confirmedRes] = await Promise.all([
      listPendingChanges({ lim: 50 }),
      listRecentAuditLog({ lim: 20 }),
      listAllChanges({ status: 'confirmed', lim: 50 }),
    ]);
    setChanges(changesRes.data || []);
    setAuditLog(auditRes.data || []);
    const eligible = (confirmedRes.data || []).filter((c) => c.change_category === 'pricing' || c.change_category === 'status');
    setShippable(eligible);
    setShipValues((prev) => {
      const next = { ...prev };
      for (const c of eligible) if (next[c.id] === undefined) next[c.id] = c.new_value || '';
      return next;
    });
    setError(changesRes.error || auditRes.error || confirmedRes.error || null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleReview(id, decision) {
    const result = await reviewChange(id, decision);
    if (result.error) { setError(result.error); return; }
    load();
  }

  async function handleShip(id) {
    setShipping((s) => ({ ...s, [id]: true }));
    setError(null);
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/ship-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({ changeId: id, confirmedValue: shipValues[id] || '' }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Ship failed'); return; }
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setShipping((s) => ({ ...s, [id]: false }));
    }
  }

  async function handleScanNow() {
    if (!scanSlug.trim()) return;
    setScanning(true);
    setScanResult(null);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/monitor-scan-now', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({ slugs: scanSlug.split(',').map((s) => s.trim()).filter(Boolean) }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Scan failed'); return; }
      setScanResult(json.results);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setScanning(false);
    }
  }

  const confidenceColor = { high: '#ff4d6d', medium: '#f5a623', low: '#6b82a8' };
  const sourceTypeLabel = { official: null, support: null, wikipedia: '⚠ Wikipedia source (may lag)', unofficial: '⚠ Third-party source (may lag)', ai_search: '⚠ AI search evidence (no diff history, may lag)' };

  const FAILURE_ACTIONS = new Set(['fetch_failed', 'fetch_incomplete', 'robots_disallowed', 'tool_not_found', 'no_url', 'snapshot_insert_failed', 'db_insert_failed']);
  const failingTools = (() => {
    const bySlug = {};
    for (const entry of auditLog) {
      const key = entry.tool_slug?.toLowerCase();
      if (!key) continue;
      if (!bySlug[key]) bySlug[key] = [];
      bySlug[key].push(entry);
    }
    return Object.entries(bySlug)
      .filter(([, entries]) => entries.length >= 3 && entries.slice(0, 3).every((e) => FAILURE_ACTIONS.has(e.action)))
      .map(([slug, entries]) => ({ slug, lastAction: entries[0].action, lastAt: entries[0].created_at }));
  })();

  return (
    <AdminLayout title="Tool Monitoring">
      <ErrorBanner message={error} />

      <AdminCard style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Scan Now (manual)</h3>
        <p style={{ color: '#6b82a8', fontSize: 12, marginBottom: 10 }}>
          Comma-separated tool slugs, max 5. Checks immediately instead of waiting for the daily cron cursor.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            type="text"
            value={scanSlug}
            onChange={(e) => setScanSlug(e.target.value)}
            placeholder="e.g. claude, chatgpt"
            style={{ flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 8, border: '1px solid #1a2d4a', background: '#0a0e16', color: '#e8f0ff' }}
          />
          <Button onClick={handleScanNow} disabled={scanning}>{scanning ? 'Scanning…' : 'Scan Now'}</Button>
        </div>
        {scanResult && (
          <pre style={{ marginTop: 12, fontSize: 11, color: '#6b82a8', background: '#0a0e16', padding: 10, borderRadius: 8, overflowX: 'auto' }}>
            {JSON.stringify(scanResult, null, 2)}
          </pre>
        )}
      </AdminCard>

      {failingTools.length > 0 && (
        <AdminCard style={{ marginBottom: 20, border: '1px solid #ff4d6d', background: 'rgba(255,77,109,0.06)' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#ff4d6d', marginBottom: 8 }}>
            ⚠ {failingTools.length} tool{failingTools.length > 1 ? 's' : ''} failing repeatedly
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {failingTools.map((t) => (
              <div key={t.slug} style={{ fontSize: 12, color: '#e8f0ff' }}>
                <strong>{t.slug}</strong> — last 3 checks: {t.lastAction} (most recent {new Date(t.lastAt).toLocaleString()})
              </div>
            ))}
          </div>
          <p style={{ color: '#6b82a8', fontSize: 11, marginTop: 8 }}>
            Consider checking the monitoring source URL for these tools — it may need a fallback or override.
          </p>
        </AdminCard>
      )}

      {shippable.length > 0 && (
        <AdminCard style={{ marginBottom: 20, border: '1px solid #14FFF4', background: 'rgba(20,255,244,0.05)' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#14FFF4', marginBottom: 10 }}>
            Confirmed — Ready to Ship ({shippable.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {shippable.map((c) => (
              <div key={c.id} style={{ borderBottom: '1px solid #1a2d4a', paddingBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>
                  {c.tool_slug} — {CATEGORY_LABELS[c.change_category] || c.change_category}
                </div>
                <div style={{ color: '#6b82a8', fontSize: 11, margin: '4px 0' }}>
                  {c.old_value || '(none)'} → {c.new_value || '(none)'}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    value={shipValues[c.id] ?? ''}
                    onChange={(e) => setShipValues((v) => ({ ...v, [c.id]: e.target.value }))}
                    style={{ flex: 1, minWidth: 180, padding: '6px 10px', borderRadius: 8, border: '1px solid #1a2d4a', background: '#0a0e16', color: '#e8f0ff', fontSize: 12 }}
                  />
                  <Button onClick={() => handleShip(c.id)} disabled={shipping[c.id]} style={{ fontSize: 11, padding: '5px 9px' }}>
                    {shipping[c.id] ? 'Shipping…' : 'Confirm & Ship'}
                  </Button>
                  <Button variant="danger" onClick={() => handleReview(c.id, 'dismissed')} style={{ fontSize: 11, padding: '5px 9px' }}>Dismiss</Button>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>
      )}

      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Pending Review ({changes.length})</h3>

      {!isSupabaseConfigured() ? (
        <EmptyState message="No database connection." />
      ) : loading ? (
        <p style={{ color: '#6b82a8' }}>Loading…</p>
      ) : changes.length === 0 ? (
        <EmptyState message="No pending changes." sub="Nothing flagged since the last scan." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
          {changes.map((c) => (
            <AdminCard key={c.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {c.tool_slug}{' '}
                    <span style={{ fontSize: 11, fontWeight: 700, color: confidenceColor[c.confidence] || '#6b82a8' }}>
                      {CATEGORY_LABELS[c.change_category] || c.change_category} · {c.confidence?.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ color: '#6b82a8', fontSize: 11, marginTop: 2 }}>
                    Detected {new Date(c.detected_at).toLocaleString()} ·{' '}
                    <a href={c.evidence_url} target="_blank" rel="noopener noreferrer" style={{ color: '#14FFF4' }}>source</a>
                  </div>
                  {sourceTypeLabel[c.source_type] && (
                    <div style={{ color: '#f5a623', fontSize: 11, marginTop: 4 }}>
                      {sourceTypeLabel[c.source_type]}
                    </div>
                  )}
                  {c.affected_article_slugs?.length > 0 && (
                    <div style={{ color: '#6b82a8', fontSize: 11, marginTop: 4 }}>
                      Affects: {c.affected_article_slugs.join(', ')}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button variant="secondary" onClick={() => handleReview(c.id, 'confirmed')} style={{ fontSize: 11, padding: '5px 9px' }}>Confirm</Button>
                  <Button variant="danger" onClick={() => handleReview(c.id, 'dismissed')} style={{ fontSize: 11, padding: '5px 9px' }}>Dismiss</Button>
                </div>
              </div>
              {c.ai_summary ? (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#14FFF4', border: '1px solid #14FFF4', borderRadius: 4, padding: '2px 5px', flexShrink: 0 }}>
                    {c.classified_by === 'ai_search' ? 'AI SEARCH' : 'AI'}
                  </span>
                  <p style={{ fontSize: 13, color: '#e8f0ff', margin: 0, lineHeight: 1.4 }}>{c.ai_summary}</p>
                </div>
              ) : (
                <div style={{ marginTop: 8 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#6b82a8', border: '1px solid #6b82a8', borderRadius: 4, padding: '2px 5px' }}>KEYWORD</span>
                </div>
              )}
              {c.diff_excerpt && (
                <details style={{ marginTop: 8 }}>
                  <summary style={{ cursor: 'pointer', fontSize: 11, color: '#6b82a8' }}>Show raw diff</summary>
                  <pre style={{ marginTop: 8, fontSize: 12, color: '#e8f0ff', background: '#0a0e16', padding: 10, borderRadius: 8, whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
                    {c.diff_excerpt}
                  </pre>
                </details>
              )}
            </AdminCard>
          ))}
        </div>
      )}

      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Recent Audit Log</h3>
      {auditLog.length === 0 ? (
        <EmptyState message="No monitoring runs yet." />
      ) : (
        <AdminCard>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
            {auditLog.map((a) => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1a2d4a', paddingBottom: 6 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ color: '#e8f0ff' }}>{a.tool_slug} — {a.action}</span>
                  {a.detail && (
                    <div style={{ color: '#6b82a8', fontSize: 11, marginTop: 2, wordBreak: 'break-word' }}>
                      {a.detail}
                    </div>
                  )}
                </div>
                <span style={{ color: '#6b82a8' }}>{new Date(a.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </AdminCard>
      )}
    </AdminLayout>
  );
}
