// pages/admin/affiliates/index.js — Affiliate Links CMS (Phase 5A)
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '../../../components/admin/AdminLayout';
import { StatCard, AdminCard, Button, ErrorBanner } from '../../../components/admin/ui';
import { useAuth } from '../../../lib/cms/useAuth';

const STATUS_COLORS = {
  active: '#00d084',
  paused: '#ffc147',
  draft:  '#9fb3d4',
};

const COMMISSION_LABELS = {
  percent:  '%',
  flat:     '$',
  variable: '~',
};

// Helper: get a fresh ID token, throws if user not ready
async function getToken(user) {
  if (!user) throw new Error('Not authenticated.');
  const token = await user.getIdToken(/* forceRefresh */ false);
  if (!token) throw new Error('Could not retrieve auth token. Please refresh the page.');
  return token;
}

// Helper: parse API response — always returns { ok, data, error }
async function parseResponse(res) {
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    return { ok: res.ok, data: json.data ?? null, error: json.error ?? null };
  } catch {
    // Response was HTML (404/500 page) — surface a readable error
    return {
      ok: false,
      data: null,
      error: `Server returned ${res.status} (${res.statusText}). Check Vercel logs.`,
    };
  }
}

export default function AffiliatesIndex() {
  const auth = useAuth();
  const [affiliates, setAffiliates] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [filter, setFilter]         = useState('all');
  const [deleting, setDeleting]     = useState(null);
  const [counts, setCounts]         = useState({ total: 0, active: 0, paused: 0, draft: 0 });

  async function load() {
    setLoading(true); setError(null);
    try {
      const token = await getToken(auth.user);
      const res   = await fetch('/api/admin/affiliates', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { ok, data, error: err } = await parseResponse(res);
      if (!ok) { setError(err); setLoading(false); return; }
      const all = data || [];
      setAffiliates(all);
      setCounts({
        total:  all.length,
        active: all.filter(a => a.status === 'active').length,
        paused: all.filter(a => a.status === 'paused').length,
        draft:  all.filter(a => a.status === 'draft').length,
      });
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (auth.user) load();
  }, [auth.user]);

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete affiliate link for "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      const token = await getToken(auth.user);
      const res   = await fetch(`/api/admin/affiliates/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const { ok, error: err } = await parseResponse(res);
      if (!ok) {
        setError(err);
      } else {
        setAffiliates(prev => prev.filter(a => a.id !== id));
        setCounts(prev => ({ ...prev, total: prev.total - 1 }));
      }
    } catch (err) {
      setError(err.message);
    }
    setDeleting(null);
  }

  async function handleStatusToggle(affiliate) {
    const newStatus = affiliate.status === 'active' ? 'paused' : 'active';
    try {
      const token = await getToken(auth.user);
      const res   = await fetch(`/api/admin/affiliates/${affiliate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      const { ok, error: err } = await parseResponse(res);
      if (!ok) {
        setError(err);
      } else {
        setAffiliates(prev =>
          prev.map(a => a.id === affiliate.id ? { ...a, status: newStatus } : a)
        );
      }
    } catch (err) {
      setError(err.message);
    }
  }

  const displayed = filter === 'all'
    ? affiliates
    : affiliates.filter(a => a.status === filter);

  return (
    <AdminLayout title="Affiliate Links">
      <ErrorBanner message={error} />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12, marginBottom: 24 }}>
        <StatCard label="Total"  value={loading ? '—' : counts.total}  accent="#14FFF4" />
        <StatCard label="Active" value={loading ? '—' : counts.active} accent="#00d084" />
        <StatCard label="Paused" value={loading ? '—' : counts.paused} accent="#ffc147" />
        <StatCard label="Draft"  value={loading ? '—' : counts.draft}  accent="#9fb3d4" />
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'active', 'paused', 'draft'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: filter === f ? '1px solid #14FFF4' : '1px solid #1a2d4a',
              background: filter === f ? 'rgba(20,255,244,0.1)' : 'transparent',
              color: filter === f ? '#14FFF4' : '#9fb3d4',
            }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <Link href="/admin/affiliates/new">
          <Button>+ New Affiliate Link</Button>
        </Link>
      </div>

      {/* Table */}
      <AdminCard style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: 24, color: '#6b82a8', fontSize: 13 }}>Loading affiliate links…</p>
        ) : displayed.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <p style={{ color: '#6b82a8', fontSize: 14, marginBottom: 16 }}>
              {filter === 'all' ? 'No affiliate links yet.' : `No ${filter} affiliate links.`}
            </p>
            <Link href="/admin/affiliates/new">
              <Button>+ Add Your First Affiliate Link</Button>
            </Link>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a2d4a' }}>
                {['Program', 'Tool Slug', 'Commission', 'Cookie', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left', fontSize: 11,
                    fontWeight: 700, color: '#3d5470', textTransform: 'uppercase', letterSpacing: 0.6,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid rgba(26,45,74,0.5)' }}>
                  {/* Program */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 700, color: '#e8f0ff', marginBottom: 2 }}>{a.programName}</div>
                    <a href={a.affiliateUrl} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 11, color: '#6b82a8', wordBreak: 'break-all' }}>
                      {a.affiliateUrl?.length > 40 ? a.affiliateUrl.slice(0, 40) + '…' : a.affiliateUrl}
                    </a>
                  </td>
                  {/* Tool slug */}
                  <td style={{ padding: '12px 16px', color: '#9fb3d4' }}>
                    {a.toolSlug
                      ? <Link href={`/tools/${a.toolSlug}`} target="_blank" style={{ color: '#14FFF4', textDecoration: 'none' }}>{a.toolSlug}</Link>
                      : <span style={{ color: '#3d5470' }}>—</span>}
                  </td>
                  {/* Commission */}
                  <td style={{ padding: '12px 16px', color: '#9fb3d4' }}>
                    {a.commissionValue != null
                      ? `${a.commissionValue}${COMMISSION_LABELS[a.commissionType] || ''}`
                      : <span style={{ color: '#3d5470' }}>—</span>}
                  </td>
                  {/* Cookie */}
                  <td style={{ padding: '12px 16px', color: '#9fb3d4' }}>
                    {a.cookieDays != null ? `${a.cookieDays}d` : <span style={{ color: '#3d5470' }}>—</span>}
                  </td>
                  {/* Status */}
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                      color: STATUS_COLORS[a.status] || '#9fb3d4',
                      background: `${STATUS_COLORS[a.status] || '#9fb3d4'}18`,
                      border: `1px solid ${STATUS_COLORS[a.status] || '#9fb3d4'}44`,
                    }}>
                      {a.status}
                    </span>
                  </td>
                  {/* Actions */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link href={`/admin/affiliates/${a.id}`} style={{
                        padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                        background: 'rgba(20,255,244,0.08)', color: '#14FFF4',
                        border: '1px solid rgba(20,255,244,0.2)', textDecoration: 'none',
                      }}>
                        Edit
                      </Link>
                      <button onClick={() => handleStatusToggle(a)} style={{
                        padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        background: 'rgba(255,193,71,0.08)', color: '#ffc147',
                        border: '1px solid rgba(255,193,71,0.2)',
                      }}>
                        {a.status === 'active' ? 'Pause' : 'Activate'}
                      </button>
                      {auth.isAdmin && (
                        <button
                          onClick={() => handleDelete(a.id, a.programName)}
                          disabled={deleting === a.id}
                          style={{
                            padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            background: 'rgba(255,77,109,0.08)', color: '#ff4d6d',
                            border: '1px solid rgba(255,77,109,0.2)',
                          }}>
                          {deleting === a.id ? '…' : 'Delete'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AdminCard>
    </AdminLayout>
  );
}
