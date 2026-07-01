// pages/admin/newsletter/campaigns/index.js — Phase 7B

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import AdminLayout from '../../../../components/admin/AdminLayout';
import { AdminCard, Button, ErrorBanner, EmptyState, StatCard } from '../../../../components/admin/ui';
import { useAuth } from '../../../../lib/cms/useAuth';
import { authedFetch } from '../../../../lib/cms/apiHelpers';

const STATUS_OPTIONS = ['all', 'draft', 'scheduled', 'sent', 'cancelled'];
const STATUS_STYLE = {
  draft:     { color: '#9fb3d4', bg: 'rgba(155,179,212,0.1)',  border: 'rgba(155,179,212,0.25)' },
  scheduled: { color: '#ffc147', bg: 'rgba(255,193,71,0.1)',   border: 'rgba(255,193,71,0.25)'  },
  sent:      { color: '#00d084', bg: 'rgba(0,208,132,0.1)',    border: 'rgba(0,208,132,0.25)'   },
  cancelled: { color: '#ff8080', bg: 'rgba(255,128,128,0.1)',  border: 'rgba(255,128,128,0.25)' },
};

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
function pct(part, total) {
  if (!total) return '—';
  return ((part / total) * 100).toFixed(1) + '%';
}

export default function CampaignsListPage() {
  const auth = useAuth();
  const [campaigns,  setCampaigns]  = useState([]);
  const [analytics,  setAnalytics]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [filter,     setFilter]     = useState('all');
  const [search,     setSearch]     = useState('');
  const [actioning,  setActioning]  = useState(null);

  const load = useCallback(async () => {
    if (!auth.user) return;
    setLoading(true); setError(null);
    const params = filter !== 'all' ? `?status=${filter}` : '';
    const [camResult, anaResult] = await Promise.all([
      authedFetch(auth.user, `/api/admin/newsletter/campaigns${params}`),
      authedFetch(auth.user, '/api/admin/newsletter/analytics'),
    ]);
    if (!camResult.ok) { setError(camResult.error); setLoading(false); return; }
    setCampaigns(camResult.data || []);
    if (anaResult.ok) setAnalytics(anaResult.data);
    setLoading(false);
  }, [auth.user, filter]);

  useEffect(() => { load(); }, [load]);

  const displayed = campaigns.filter(c =>
    !search || c.subject?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAction(campaign, action) {
    setActioning(campaign.id); setError(null);
    try {
      if (action === 'delete') {
        if (!window.confirm(`Delete campaign "${campaign.subject}"?`)) { setActioning(null); return; }
        const { ok, error: err } = await authedFetch(auth.user, `/api/admin/newsletter/campaigns/${campaign.id}`, { method: 'DELETE' });
        if (ok) { setCampaigns(prev => prev.filter(c => c.id !== campaign.id)); }
        else { setError(err); }
        setActioning(null); return;
      }
      if (action === 'cancel') {
        const { ok, error: err } = await authedFetch(auth.user, '/api/admin/newsletter/send', {
          method: 'POST',
          body: JSON.stringify({ campaignId: campaign.id, action: 'cancel' }),
        });
        if (ok) setCampaigns(prev => prev.map(c => c.id === campaign.id ? { ...c, status: 'cancelled' } : c));
        else setError(err);
        setActioning(null); return;
      }
      if (action === 'duplicate') {
        const nlResult = await authedFetch(auth.user, `/api/admin/newsletter/newsletters/${campaign.newsletterId}`);
        if (!nlResult.ok) { setError(nlResult.error); setActioning(null); return; }
        const nl = nlResult.data;
        const newNlResult = await authedFetch(auth.user, '/api/admin/newsletter/newsletters', {
          method: 'POST',
          body: JSON.stringify({ subject: `Copy of ${nl.subject}`, previewText: nl.previewText, content_blocks: nl.content_blocks }),
        });
        if (!newNlResult.ok) { setError(newNlResult.error); setActioning(null); return; }
        const newCamResult = await authedFetch(auth.user, '/api/admin/newsletter/campaigns', {
          method: 'POST',
          body: JSON.stringify({ newsletterId: newNlResult.data.id, subject: `Copy of ${campaign.subject}` }),
        });
        if (newCamResult.ok) setCampaigns(prev => [newCamResult.data, ...prev]);
        else setError(newCamResult.error);
        setActioning(null); return;
      }
    } catch (err) {
      setError(err.message);
    }
    setActioning(null);
  }

  const a = analytics;

  return (
    <AdminLayout title="Newsletter Campaigns" requiredRole="editor">
      <ErrorBanner message={error} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        <StatCard label="Subscribers"    value={a ? String(a.activeSubscribers) : '—'} accent="#14FFF4" />
        <StatCard label="Campaigns Sent" value={a ? String(a.campaignsSent)     : '—'} accent="#00d084" />
        <StatCard label="Open Rate"      value={a ? `${a.openRate}%`            : '—'} accent="#ffc147" />
        <StatCard label="Click Rate"     value={a ? `${a.clickRate}%`           : '—'} accent="#a78bfa" />
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {STATUS_OPTIONS.map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: filter === s ? '1px solid #14FFF4' : '1px solid #1a2d4a',
              background: filter === s ? 'rgba(20,255,244,0.1)' : 'transparent',
              color: filter === s ? '#14FFF4' : '#9fb3d4',
            }}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
          ))}
        </div>
        <input type="search" placeholder="Search subject…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: '1 1 200px', background: '#080d1a', border: '1px solid #2a3d5c', borderRadius: 8, padding: '9px 12px', color: '#e8f0ff', fontSize: 13 }} />
        <Link href="/admin/newsletter/campaigns/new">
          <Button style={{ whiteSpace: 'nowrap' }}>+ New Campaign</Button>
        </Link>
      </div>

      {loading ? (
        <AdminCard><p style={{ color: '#6b82a8', fontSize: 13 }}>Loading campaigns…</p></AdminCard>
      ) : displayed.length === 0 ? (
        <EmptyState message="No campaigns found." sub="Create your first campaign to start sending newsletters." />
      ) : (
        <AdminCard style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a2d4a' }}>
                {['Subject', 'Status', 'Recipients', 'Opens', 'Clicks', 'Sent / Scheduled', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#3d5470', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.map((c, i) => {
                const ss = STATUS_STYLE[c.status] || STATUS_STYLE.draft;
                return (
                  <tr key={c.id} style={{ borderBottom: i < displayed.length - 1 ? '1px solid rgba(26,45,74,0.5)' : 'none' }}>
                    <td style={{ padding: '12px 16px', color: '#e8f0ff', fontWeight: 600, maxWidth: 260 }}>
                      <Link href={`/admin/newsletter/campaigns/${c.id}`} style={{ color: '#e8f0ff', textDecoration: 'none' }}>{c.subject || 'Untitled'}</Link>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', padding: '3px 8px', borderRadius: 5, letterSpacing: 0.4 }}>{c.status}</span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#9fb3d4' }}>{c.status === 'sent' ? c.recipientCount?.toLocaleString() : '—'}</td>
                    <td style={{ padding: '12px 16px', color: '#9fb3d4' }}>{c.status === 'sent' ? `${c.opens || 0} (${pct(c.opens, c.recipientCount)})` : '—'}</td>
                    <td style={{ padding: '12px 16px', color: '#9fb3d4' }}>{c.status === 'sent' ? `${c.clicks || 0} (${pct(c.clicks, c.recipientCount)})` : '—'}</td>
                    <td style={{ padding: '12px 16px', color: '#6b82a8', fontSize: 12 }}>
                      {c.status === 'sent' ? fmtDate(c.sentAt) : c.status === 'scheduled' ? fmtDate(c.scheduledAt) : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {['draft', 'scheduled', 'sent'].includes(c.status) && (
                          <Link href={`/admin/newsletter/campaigns/${c.id}`} style={{ padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: 'rgba(20,255,244,0.08)', color: '#14FFF4', border: '1px solid rgba(20,255,244,0.2)', textDecoration: 'none' }}>
                            {c.status === 'sent' ? 'View' : 'Edit'}
                          </Link>
                        )}
                        <button onClick={() => handleAction(c, 'duplicate')} disabled={actioning === c.id} style={{ padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'rgba(167,139,250,0.08)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.2)' }}>
                          {actioning === c.id ? '…' : 'Dupe'}
                        </button>
                        {c.status === 'scheduled' && (
                          <button onClick={() => handleAction(c, 'cancel')} disabled={actioning === c.id} style={{ padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'rgba(255,193,71,0.08)', color: '#ffc147', border: '1px solid rgba(255,193,71,0.2)' }}>Cancel</button>
                        )}
                        {auth.isAdmin && ['draft', 'cancelled'].includes(c.status) && (
                          <button onClick={() => handleAction(c, 'delete')} disabled={actioning === c.id} style={{ padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'rgba(255,80,80,0.08)', color: '#ff8080', border: '1px solid rgba(255,80,80,0.2)' }}>Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ padding: '12px 16px', borderTop: '1px solid #1a2d4a', color: '#6b82a8', fontSize: 12 }}>
            {displayed.length} campaign{displayed.length !== 1 ? 's' : ''}{search && ` matching "${search}"`}
          </div>
        </AdminCard>
      )}

      {a?.recentCampaigns?.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#6b82a8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>Recent Campaign Performance</p>
          <AdminCard style={{ padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1a2d4a' }}>
                  {['Subject', 'Sent To', 'Opens', 'Open Rate', 'Clicks', 'Click Rate', 'Date'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#3d5470', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {a.recentCampaigns.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: i < a.recentCampaigns.length - 1 ? '1px solid rgba(26,45,74,0.4)' : 'none' }}>
                    <td style={{ padding: '10px 14px', color: '#e8f0ff', fontWeight: 500 }}>{c.subject}</td>
                    <td style={{ padding: '10px 14px', color: '#9fb3d4' }}>{c.recipientCount?.toLocaleString()}</td>
                    <td style={{ padding: '10px 14px', color: '#9fb3d4' }}>{c.opens}</td>
                    <td style={{ padding: '10px 14px', color: '#ffc147', fontWeight: 700 }}>{c.openRate}%</td>
                    <td style={{ padding: '10px 14px', color: '#9fb3d4' }}>{c.clicks}</td>
                    <td style={{ padding: '10px 14px', color: '#a78bfa', fontWeight: 700 }}>{c.clickRate}%</td>
                    <td style={{ padding: '10px 14px', color: '#6b82a8', fontSize: 12 }}>{fmtDate(c.sentAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminCard>
        </div>
      )}
    </AdminLayout>
  );
}
