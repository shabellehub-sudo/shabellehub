import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { AdminCard, Button, ErrorBanner, EmptyState } from '../../../components/admin/ui';
import { listPendingChanges, reviewChange, listRecentAuditLog } from '../../../lib/cms/monitoring';
import { isSupabaseConfigured, getSupabaseClient } from '../../../lib/supabase';

export default function AdminMonitoringPage() {
  const [changes, setChanges] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scanSlug, setScanSlug] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) { setLoading(false); return; }
    setLoading(true);
    const [changesRes, auditRes] = await Promise.all([
      listPendingChanges({ lim: 50 }),
      listRecentAuditLog({ lim: 20 }),
    ]);
    setChanges(changesRes.data || []);
    setAuditLog(auditRes.data || []);
    setError(changesRes.error || auditRes.error || null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleReview(id, decision) {
    const result = await reviewChange(id, decision);
    if (result.error) { setError(result.error); return; }
    load();
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
                    <span style={{ fontSize: 11, fontWeight: 700, color: confidenceColor[c.confidence] || '#6b82a8', textTransform: 'uppercase' }}>
                      {c.change_category} · {c.confidence}
                    </span>
                  </div>
                  <div style={{ color: '#6b82a8', fontSize: 11, marginTop: 2 }}>
                    Detected {new Date(c.detected_at).toLocaleString()} ·{' '}
                    <a href={c.evidence_url} target="_blank" rel="noopener noreferrer" style={{ color: '#14FFF4' }}>source</a>
                  </div>
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
              <pre style={{ marginTop: 10, fontSize: 12, color: '#e8f0ff', background: '#0a0e16', padding: 10, borderRadius: 8, whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
                {c.diff_excerpt}
              </pre>
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
                <span style={{ color: '#e8f0ff' }}>{a.tool_slug} — {a.action}</span>
                <span style={{ color: '#6b82a8' }}>{new Date(a.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </AdminCard>
      )}
    </AdminLayout>
  );
}
