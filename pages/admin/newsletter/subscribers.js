// pages/admin/newsletter/subscribers.js — Phase 7A
// /admin/newsletter/subscribers — Subscriber list with search, filter, delete, bulk delete, CSV export

import { useEffect, useState } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { StatCard, AdminCard, Button, ErrorBanner, EmptyState } from '../../../components/admin/ui';
import { useAuth } from '../../../lib/cms/useAuth';
import { authedFetch } from '../../../lib/cms/apiHelpers';

const STATUS_COLORS = {
  active:       '#00d084',
  unsubscribed: '#ff8080',
  bounced:      '#ffc147',
};

const STATUS_OPTIONS = ['all', 'active', 'unsubscribed', 'bounced'];
const SOURCE_OPTIONS = ['all', 'homepage', 'footer', 'blog', 'popup', 'other'];

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function SubscribersPage() {
  const auth = useAuth();

  const [subscribers, setSubscribers] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  const [search,        setSearch]        = useState('');
  const [filterStatus,  setFilterStatus]  = useState('all');
  const [filterSource,  setFilterSource]  = useState('all');
  const [selected,      setSelected]      = useState(new Set());
  const [deleting,      setDeleting]      = useState(null);
  const [bulkDeleting,  setBulkDeleting]  = useState(false);

  async function load() {
    setLoading(true); setError(null); setSelected(new Set());
    const params = new URLSearchParams();
    if (filterStatus !== 'all') params.set('status', filterStatus);
    if (filterSource !== 'all') params.set('source', filterSource);
    const { ok, data, error: err } = await authedFetch(auth.user, `/api/admin/newsletter/subscribers?${params}`);
    if (!ok) { setError(err); } else { setSubscribers(data || []); }
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (auth.user) load(); }, [auth.user, filterStatus, filterSource]);

  const filtered = subscribers.filter(s =>
    !search || s.email.toLowerCase().includes(search.toLowerCase())
  );
  const counts = {
    total:        subscribers.length,
    active:       subscribers.filter(s => s.status === 'active').length,
    unsubscribed: subscribers.filter(s => s.status === 'unsubscribed').length,
  };

  const allVisibleIds = filtered.map(s => s.id);
  const allSelected   = allVisibleIds.length > 0 && allVisibleIds.every(id => selected.has(id));

  function toggleAll() {
    if (allSelected) {
      setSelected(prev => { const n = new Set(prev); allVisibleIds.forEach(id => n.delete(id)); return n; });
    } else {
      setSelected(prev => { const n = new Set(prev); allVisibleIds.forEach(id => n.add(id)); return n; });
    }
  }
  function toggleOne(id) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function handleDelete(id, email) {
    if (!window.confirm(`Delete subscriber "${email}"? This cannot be undone.`)) return;
    setDeleting(id);
    const { ok, error: err } = await authedFetch(auth.user, `/api/admin/newsletter/subscribers?id=${id}`, { method: 'DELETE' });
    if (ok) {
      setSubscribers(prev => prev.filter(s => s.id !== id));
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
    } else {
      setError(err);
    }
    setDeleting(null);
  }

  async function handleBulkDelete() {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (!window.confirm(`Delete ${ids.length} subscriber(s)? This cannot be undone.`)) return;
    setBulkDeleting(true);
    const { ok, error: err } = await authedFetch(auth.user, '/api/admin/newsletter/subscribers', {
      method: 'POST',
      body: JSON.stringify({ action: 'bulk_delete', ids }),
    });
    if (ok) {
      setSubscribers(prev => prev.filter(s => !ids.includes(s.id)));
      setSelected(new Set());
    } else {
      setError(err);
    }
    setBulkDeleting(false);
  }

  function handleExportCSV() {
    const rows = [
      ['email', 'status', 'source', 'tags', 'confirmed', 'created_at'],
      ...filtered.map(s => [
        s.email, s.status, s.source || '',
        (s.tags || []).join(';'), s.confirmed ? 'true' : 'false', s.created_at || '',
      ]),
    ];
    const csv  = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const inputStyle = {
    background: '#080d1a', border: '1px solid #2a3d5c', borderRadius: 8,
    padding: '9px 12px', color: '#e8f0ff', fontSize: 13,
  };

  return (
    <AdminLayout title="Newsletter Subscribers" requiredRole="editor">
      <ErrorBanner message={error} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12, marginBottom: 24 }}>
        <StatCard label="Total"        value={loading ? '—' : counts.total}        accent="#14FFF4" />
        <StatCard label="Active"       value={loading ? '—' : counts.active}       accent="#00d084" />
        <StatCard label="Unsubscribed" value={loading ? '—' : counts.unsubscribed} accent="#ff8080" />
      </div>

      <AdminCard style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="search" placeholder="Search email…" value={search}
            onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, flex: '1 1 200px' }} />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={inputStyle}>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s === 'all' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <select value={filterSource} onChange={e => setFilterSource(e.target.value)} style={inputStyle}>
            {SOURCE_OPTIONS.map(s => (
              <option key={s} value={s}>{s === 'all' ? 'All sources' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <Button onClick={handleExportCSV} variant="secondary" style={{ fontSize: 13, padding: '9px 14px' }}>⬇ Export CSV</Button>
          <Button onClick={load} variant="secondary" style={{ fontSize: 13, padding: '9px 14px' }}>↺ Refresh</Button>
        </div>
        {selected.size > 0 && auth.isAdmin && (
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: '#9fb3d4', fontSize: 13 }}>{selected.size} selected</span>
            <Button onClick={handleBulkDelete} disabled={bulkDeleting} variant="danger" style={{ fontSize: 12, padding: '7px 14px' }}>
              {bulkDeleting ? 'Deleting…' : `Delete ${selected.size} selected`}
            </Button>
            <button onClick={() => setSelected(new Set())}
              style={{ background: 'none', border: 'none', color: '#6b82a8', fontSize: 12, cursor: 'pointer' }}>
              Clear selection
            </button>
          </div>
        )}
      </AdminCard>

      {loading ? (
        <AdminCard><p style={{ color: '#6b82a8', fontSize: 13 }}>Loading subscribers…</p></AdminCard>
      ) : filtered.length === 0 ? (
        <EmptyState message="No subscribers found."
          sub={search ? 'Try clearing your search.' : 'Subscribers will appear here once the first signup occurs.'} />
      ) : (
        <AdminCard style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a2d4a' }}>
                {auth.isAdmin && (
                  <th style={{ padding: '12px 16px', textAlign: 'left', width: 36 }}>
                    <input type="checkbox" checked={allSelected} onChange={toggleAll}
                      style={{ cursor: 'pointer', accentColor: '#14FFF4' }} />
                  </th>
                )}
                {['Email', 'Status', 'Source', 'Tags', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#6b82a8', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #1a2d4a' : 'none', background: selected.has(s.id) ? 'rgba(20,255,244,0.03)' : 'transparent' }}>
                  {auth.isAdmin && (
                    <td style={{ padding: '12px 16px' }}>
                      <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleOne(s.id)}
                        style={{ cursor: 'pointer', accentColor: '#14FFF4' }} />
                    </td>
                  )}
                  <td style={{ padding: '12px 16px', color: '#e8f0ff', fontWeight: 500 }}>{s.email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      background: `${STATUS_COLORS[s.status] || '#9fb3d4'}18`,
                      color: STATUS_COLORS[s.status] || '#9fb3d4',
                      fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                      padding: '3px 8px', borderRadius: 5, letterSpacing: 0.4,
                    }}>{s.status}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#9fb3d4' }}>{s.source || '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#6b82a8' }}>
                    {(s.tags || []).length > 0 ? s.tags.join(', ') : <span style={{ opacity: 0.4 }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b82a8' }}>{fmtDate(s.created_at)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {auth.isAdmin && (
                      <button onClick={() => handleDelete(s.id, s.email)} disabled={deleting === s.id}
                        style={{ background: 'none', border: '1px solid rgba(255,80,80,0.3)', color: '#ff8080', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: deleting === s.id ? 'wait' : 'pointer', fontWeight: 600 }}>
                        {deleting === s.id ? '…' : 'Delete'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '12px 16px', borderTop: '1px solid #1a2d4a', color: '#6b82a8', fontSize: 12 }}>
            Showing {filtered.length} of {subscribers.length} subscriber{subscribers.length !== 1 ? 's' : ''}
            {search && ` matching "${search}"`}
          </div>
        </AdminCard>
      )}
    </AdminLayout>
  );
}
