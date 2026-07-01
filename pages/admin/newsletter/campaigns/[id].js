// pages/admin/newsletter/campaigns/[id].js — Phase 7B
// /admin/newsletter/campaigns/[id] — edit, schedule, send, view analytics

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout from '../../../../components/admin/AdminLayout';
import {
  AdminCard, Button, ErrorBanner, StatCard,
} from '../../../../components/admin/ui';
import { useAuth } from '../../../../lib/cms/useAuth';

const STATUS_STYLE = {
  draft:     { color: '#9fb3d4', bg: 'rgba(155,179,212,0.1)' },
  scheduled: { color: '#ffc147', bg: 'rgba(255,193,71,0.1)'  },
  sent:      { color: '#00d084', bg: 'rgba(0,208,132,0.1)'   },
  cancelled: { color: '#ff8080', bg: 'rgba(255,128,128,0.1)' },
};

function fmtDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
function pct(part, total) {
  if (!total) return '0.0%';
  return ((part / total) * 100).toFixed(1) + '%';
}

export default function CampaignDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const auth   = useAuth();

  const [campaign,    setCampaign]    = useState(null);
  const [newsletter,  setNewsletter]  = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [actionMsg,   setActionMsg]   = useState(null);

  // Edit fields
  const [subject,     setSubject]     = useState('');
  const [scheduleAt,  setScheduleAt]  = useState('');
  const [showSchedule, setShowSchedule] = useState(false);
  const [showPreview,  setShowPreview]  = useState(false);
  const [previewHtml,  setPreviewHtml]  = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!id || !auth.user) return;
    load();
  }, [id, auth.user]);

  async function load() {
    setLoading(true); setError(null);
    try {
      const token = await auth.user.getIdToken();
      const res   = await fetch(`/api/admin/newsletter/campaigns/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body  = await res.json();
      if (!res.ok) { setError(body.error); setLoading(false); return; }
      const cam = body.data;
      setCampaign(cam);
      setSubject(cam.subject || '');

      // Load newsletter content
      if (cam.newsletterId) {
        const nlRes  = await fetch(`/api/admin/newsletter/newsletters/${cam.newsletterId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const nlBody = await nlRes.json();
        if (nlRes.ok) setNewsletter(nlBody.data);
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  async function handleSaveSubject() {
    if (!subject.trim()) return;
    setSaving(true); setError(null);
    try {
      const token = await auth.user.getIdToken();
      const res   = await fetch(`/api/admin/newsletter/campaigns/${id}`, {
        method:  'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ subject: subject.trim() }),
      });
      const body  = await res.json();
      if (res.ok) { setCampaign(body.data); setActionMsg('Subject saved.'); setTimeout(() => setActionMsg(null), 2000); }
      else setError(body.error);
    } catch (err) { setError(err.message); }
    setSaving(false);
  }

  async function handleAction(action) {
    setSaving(true); setError(null); setActionMsg(null);
    try {
      const token   = await auth.user.getIdToken();
      const payload = { campaignId: id, action };
      if (action === 'schedule') {
        if (!scheduleAt) { setError('Please pick a date/time.'); setSaving(false); return; }
        payload.scheduledAt = new Date(scheduleAt).toISOString();
      }
      const res  = await fetch('/api/admin/newsletter/send', {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) { setError(body.error); setSaving(false); return; }

      if (action === 'send') {
        setPreviewHtml(body.data?.previewHtml || '');
        setActionMsg(`✅ Campaign sent to ${body.data.recipientCount} subscribers.`);
        await load();
      } else if (action === 'schedule') {
        setActionMsg(`📅 Scheduled for ${fmtDateTime(payload.scheduledAt)}.`);
        setShowSchedule(false);
        await load();
      } else if (action === 'cancel') {
        setActionMsg('Campaign cancelled.');
        await load();
      }
    } catch (err) { setError(err.message); }
    setSaving(false);
  }

  if (loading) {
    return (
      <AdminLayout title="Campaign" requiredRole="editor">
        <p style={{ color: '#6b82a8', fontSize: 13 }}>Loading campaign…</p>
      </AdminLayout>
    );
  }
  if (!campaign) {
    return (
      <AdminLayout title="Campaign not found" requiredRole="editor">
        <ErrorBanner message={error || 'Campaign not found.'} />
      </AdminLayout>
    );
  }

  const ss        = STATUS_STYLE[campaign.status] || STATUS_STYLE.draft;
  const isSent    = campaign.status === 'sent';
  const isDraft   = campaign.status === 'draft';
  const isScheduled = campaign.status === 'scheduled';
  const isMutable = isDraft || isScheduled;

  return (
    <AdminLayout title="Campaign Detail" requiredRole="editor">
      <ErrorBanner message={error} />

      {actionMsg && (
        <div style={{
          background: 'rgba(0,208,132,0.1)', border: '1px solid rgba(0,208,132,0.3)',
          borderRadius: 8, padding: '12px 16px', color: '#00d084', fontSize: 13, marginBottom: 16,
        }}>
          {actionMsg}
        </div>
      )}

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <Link href="/admin/newsletter/campaigns" style={{ color: '#6b82a8', fontSize: 13, textDecoration: 'none' }}>
          ← Campaigns
        </Link>
        <span style={{
          background: ss.bg, color: ss.color,
          fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
          padding: '3px 10px', borderRadius: 5, letterSpacing: 0.4,
        }}>
          {campaign.status}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

        {/* Left: Main content */}
        <div>
          {/* Subject edit */}
          <AdminCard style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#6b82a8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
              Subject Line
            </p>
            {isMutable ? (
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  style={{
                    flex: 1, background: '#080d1a', border: '1px solid #2a3d5c',
                    borderRadius: 8, padding: '10px 12px', color: '#e8f0ff', fontSize: 14,
                  }}
                />
                <Button onClick={handleSaveSubject} disabled={saving || subject === campaign.subject} style={{ flexShrink: 0, fontSize: 13 }}>
                  Save
                </Button>
              </div>
            ) : (
              <p style={{ color: '#e8f0ff', fontSize: 15, fontWeight: 600 }}>{campaign.subject}</p>
            )}
          </AdminCard>

          {/* Newsletter content preview */}
          <AdminCard style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#6b82a8', textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>
                Newsletter Content
              </p>
              {newsletter && (
                <Link
                  href={`/admin/newsletter/templates?edit=${newsletter.id}`}
                  style={{ fontSize: 12, color: '#14FFF4', textDecoration: 'none', fontWeight: 600 }}
                >
                  {isMutable ? 'Edit Template ↗' : 'View Template ↗'}
                </Link>
              )}
            </div>
            {newsletter ? (
              <div>
                <p style={{ color: '#e8f0ff', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                  {newsletter.subject}
                </p>
                {newsletter.previewText && (
                  <p style={{ color: '#6b82a8', fontSize: 13, marginBottom: 8 }}>{newsletter.previewText}</p>
                )}
                <p style={{ color: '#3d5470', fontSize: 12 }}>
                  {newsletter.content_blocks?.length || 0} content block{newsletter.content_blocks?.length !== 1 ? 's' : ''}
                </p>
              </div>
            ) : (
              <p style={{ color: '#6b82a8', fontSize: 13 }}>Newsletter content not found.</p>
            )}
          </AdminCard>

          {/* Sent analytics */}
          {isSent && (
            <AdminCard>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#6b82a8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>
                Campaign Analytics
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
                <StatCard label="Recipients"  value={campaign.recipientCount?.toLocaleString() || '0'} accent="#14FFF4" />
                <StatCard label="Opens"       value={String(campaign.opens  || 0)} accent="#00d084" />
                <StatCard label="Open Rate"   value={pct(campaign.opens,  campaign.recipientCount)} accent="#ffc147" />
                <StatCard label="Clicks"      value={String(campaign.clicks || 0)} accent="#a78bfa" />
                <StatCard label="Click Rate"  value={pct(campaign.clicks, campaign.recipientCount)} accent="#a78bfa" />
              </div>
              <p style={{ color: '#3d5470', fontSize: 12, marginTop: 14 }}>
                Sent {fmtDateTime(campaign.sentAt)}. Analytics update as recipients open and click.
              </p>
            </AdminCard>
          )}
        </div>

        {/* Right: Action panel */}
        <div>
          <AdminCard style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#6b82a8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>
              Actions
            </p>

            {isDraft && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Send now */}
                <Button
                  onClick={() => {
                    if (window.confirm(`Send this campaign to all active subscribers now?`)) handleAction('send');
                  }}
                  disabled={saving}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {saving ? 'Sending…' : '🚀 Send Now'}
                </Button>

                {/* Schedule */}
                <Button
                  variant="secondary"
                  onClick={() => setShowSchedule(v => !v)}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  📅 Schedule Send
                </Button>
                {showSchedule && (
                  <div>
                    <input
                      type="datetime-local"
                      value={scheduleAt}
                      onChange={e => setScheduleAt(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      style={{
                        width: '100%', background: '#080d1a', border: '1px solid #2a3d5c',
                        borderRadius: 8, padding: '9px 12px', color: '#e8f0ff', fontSize: 13,
                        marginBottom: 8, boxSizing: 'border-box',
                      }}
                    />
                    <Button onClick={() => handleAction('schedule')} disabled={saving || !scheduleAt} style={{ width: '100%' }}>
                      {saving ? 'Scheduling…' : 'Confirm Schedule'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {isScheduled && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ padding: '10px 12px', background: 'rgba(255,193,71,0.08)', border: '1px solid rgba(255,193,71,0.2)', borderRadius: 8 }}>
                  <p style={{ color: '#ffc147', fontSize: 12, fontWeight: 600, margin: 0 }}>
                    Scheduled for {fmtDateTime(campaign.scheduledAt)}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => { if (window.confirm('Cancel this scheduled send?')) handleAction('cancel'); }}
                  disabled={saving}
                  style={{ width: '100%' }}
                >
                  Cancel Schedule
                </Button>
                <Button
                  onClick={() => { if (window.confirm('Send immediately instead of waiting?')) handleAction('send'); }}
                  disabled={saving}
                  style={{ width: '100%' }}
                >
                  {saving ? 'Sending…' : '🚀 Send Now Instead'}
                </Button>
              </div>
            )}

            {isSent && (
              <div style={{ padding: '10px 12px', background: 'rgba(0,208,132,0.08)', border: '1px solid rgba(0,208,132,0.2)', borderRadius: 8 }}>
                <p style={{ color: '#00d084', fontSize: 12, fontWeight: 600, margin: 0 }}>
                  ✓ Sent {fmtDateTime(campaign.sentAt)}
                </p>
              </div>
            )}

            {campaign.status === 'cancelled' && (
              <p style={{ color: '#ff8080', fontSize: 13 }}>This campaign was cancelled.</p>
            )}
          </AdminCard>

          {/* Meta info */}
          <AdminCard>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#6b82a8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
              Details
            </p>
            {[
              ['Created',  fmtDateTime(campaign.created_at)],
              ['Updated',  fmtDateTime(campaign.updated_at)],
              ['Campaign ID', id],
            ].map(([label, value]) => (
              <div key={label} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: '#3d5470', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 12, color: '#9fb3d4', wordBreak: 'break-all' }}>{value}</div>
              </div>
            ))}
          </AdminCard>
        </div>
      </div>

      {/* Email preview modal */}
      {showPreview && previewHtml && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 20,
        }}>
          <div style={{
            background: '#fff', borderRadius: 12,
            width: '100%', maxWidth: 680, height: '85vh',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 16px', borderBottom: '1px solid #e5e7eb', flexShrink: 0,
            }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>Email Preview</span>
              <button onClick={() => setShowPreview(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#6b7280' }}>✕</button>
            </div>
            <iframe
              srcDoc={previewHtml}
              style={{ flex: 1, border: 'none', borderRadius: '0 0 12px 12px' }}
              title="Email Preview"
            />
          </div>
        </div>
      )}

      {/* Preview button (after send) */}
      {isSent && previewHtml && (
        <div style={{ marginTop: 16 }}>
          <Button variant="secondary" onClick={() => setShowPreview(true)}>
            Preview Sent Email
          </Button>
        </div>
      )}
    </AdminLayout>
  );
}
