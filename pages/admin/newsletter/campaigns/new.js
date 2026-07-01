// pages/admin/newsletter/campaigns/new.js — Phase 7B
// /admin/newsletter/campaigns/new — step-by-step campaign creation wizard

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout from '../../../../components/admin/AdminLayout';
import { AdminCard, Button, TextInput, TextArea, ErrorBanner } from '../../../../components/admin/ui';
import { useAuth } from '../../../../lib/cms/useAuth';

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function NewCampaignPage() {
  const router = useRouter();
  const auth   = useAuth();

  // Step: 'subject' | 'newsletter' | 'review'
  const [step,         setStep]         = useState('subject');
  const [subject,      setSubject]      = useState('');
  const [newsletters,  setNewsletters]  = useState([]);
  const [nlLoading,    setNlLoading]    = useState(false);
  const [selectedNl,   setSelectedNl]   = useState(null);
  const [nlSearch,     setNlSearch]     = useState('');
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState(null);

  // Load newsletters when step 2 is reached
  useEffect(() => {
    if (step !== 'newsletter' || !auth.user) return;
    setNlLoading(true);
    auth.user.getIdToken().then(token =>
      fetch('/api/admin/newsletter/newsletters', { headers: { Authorization: `Bearer ${token}` } })
    ).then(r => r.json()).then(body => {
      setNewsletters(body.data || []);
      setNlLoading(false);
    }).catch(() => setNlLoading(false));
  }, [step, auth.user]);

  async function handleCreate() {
    if (!subject.trim())  { setError('Subject is required.'); return; }
    if (!selectedNl)      { setError('Please select a newsletter template.'); return; }
    setSaving(true); setError(null);
    try {
      const token  = await auth.user.getIdToken();
      const res    = await fetch('/api/admin/newsletter/campaigns', {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ newsletterId: selectedNl.id, subject: subject.trim() }),
      });
      const body = await res.json();
      if (!res.ok) { setError(body.error); setSaving(false); return; }
      router.push(`/admin/newsletter/campaigns/${body.data.id}`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  const filteredNl = newsletters.filter(n =>
    !nlSearch || n.subject?.toLowerCase().includes(nlSearch.toLowerCase())
  );

  const inputStyle = {
    width: '100%', background: '#080d1a', border: '1px solid #2a3d5c',
    borderRadius: 8, padding: '10px 12px', color: '#e8f0ff', fontSize: 14, boxSizing: 'border-box',
  };

  return (
    <AdminLayout title="New Campaign" requiredRole="editor">
      <ErrorBanner message={error} />

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 28 }}>
        {[['subject', '1', 'Subject'], ['newsletter', '2', 'Content'], ['review', '3', 'Review']].map(([s, num, label], i) => {
          const done    = ['subject', 'newsletter', 'review'].indexOf(step) > i;
          const current = step === s;
          return (
            <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800,
                  background: done ? '#00d084' : current ? '#14FFF4' : '#1a2d4a',
                  color: done || current ? '#080d1a' : '#6b82a8',
                }}>
                  {done ? '✓' : num}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: current ? '#e8f0ff' : '#6b82a8' }}>{label}</span>
              </div>
              {i < 2 && <div style={{ width: 32, height: 1, background: '#1a2d4a', margin: '0 8px' }} />}
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Subject ── */}
      {step === 'subject' && (
        <AdminCard style={{ maxWidth: 600 }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 16, fontWeight: 800, marginBottom: 20, color: '#e8f0ff' }}>
            Campaign subject line
          </h2>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 12.5, fontWeight: 600, color: '#9fb3d4' }}>
            Subject *
          </label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="e.g. The 5 Best AI Writing Tools This Month"
            style={{ ...inputStyle, marginBottom: 20 }}
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter' && subject.trim()) setStep('newsletter'); }}
          />
          <p style={{ color: '#6b82a8', fontSize: 12, marginBottom: 20 }}>
            This appears as the email subject line in recipients&apos; inboxes.
          </p>
          <Button onClick={() => { if (subject.trim()) { setError(null); setStep('newsletter'); } else setError('Subject is required.'); }}>
            Continue →
          </Button>
        </AdminCard>
      )}

      {/* ── Step 2: Pick newsletter content ── */}
      {step === 'newsletter' && (
        <AdminCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 16, fontWeight: 800, color: '#e8f0ff', margin: 0 }}>
              Choose newsletter content
            </h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <a
                href="/admin/newsletter/templates"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12, color: '#14FFF4', fontWeight: 600, textDecoration: 'none' }}
              >
                + Create new template ↗
              </a>
            </div>
          </div>

          <input
            type="search"
            placeholder="Search newsletters…"
            value={nlSearch}
            onChange={e => setNlSearch(e.target.value)}
            style={{ ...inputStyle, marginBottom: 16 }}
          />

          {nlLoading ? (
            <p style={{ color: '#6b82a8', fontSize: 13 }}>Loading newsletters…</p>
          ) : filteredNl.length === 0 ? (
            <div style={{ padding: '28px 0', textAlign: 'center' }}>
              <p style={{ color: '#6b82a8', fontSize: 14, marginBottom: 12 }}>No newsletters found.</p>
              <Link href="/admin/newsletter/templates" target="_blank" rel="noopener noreferrer">
                <Button variant="secondary">Create a Newsletter Template</Button>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 10, maxHeight: 380, overflowY: 'auto' }}>
              {filteredNl.map(nl => {
                const selected = selectedNl?.id === nl.id;
                return (
                  <div
                    key={nl.id}
                    onClick={() => setSelectedNl(nl)}
                    style={{
                      padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                      border: selected ? '1px solid #14FFF4' : '1px solid #1a2d4a',
                      background: selected ? 'rgba(20,255,244,0.06)' : '#080d1a',
                      transition: 'border 0.12s, background 0.12s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#e8f0ff', fontSize: 14 }}>{nl.subject}</div>
                        {nl.previewText && (
                          <div style={{ color: '#6b82a8', fontSize: 12, marginTop: 3 }}>{nl.previewText}</div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <span style={{ fontSize: 11, color: '#3d5470' }}>
                          {nl.content_blocks?.length || 0} block{nl.content_blocks?.length !== 1 ? 's' : ''}
                        </span>
                        {selected && (
                          <span style={{ color: '#14FFF4', fontSize: 18, fontWeight: 800 }}>✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <Button variant="secondary" onClick={() => setStep('subject')}>← Back</Button>
            <Button
              onClick={() => { if (selectedNl) { setError(null); setStep('review'); } else setError('Please select a newsletter.'); }}
              disabled={!selectedNl}
            >
              Continue →
            </Button>
          </div>
        </AdminCard>
      )}

      {/* ── Step 3: Review & Create ── */}
      {step === 'review' && (
        <AdminCard style={{ maxWidth: 600 }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 16, fontWeight: 800, marginBottom: 20, color: '#e8f0ff' }}>
            Review campaign
          </h2>

          <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
            {[
              ['Subject line', subject],
              ['Newsletter',   selectedNl?.subject],
              ['Preview text', selectedNl?.previewText || '—'],
              ['Blocks',       `${selectedNl?.content_blocks?.length || 0} content blocks`],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', gap: 12, padding: '12px 14px', background: '#080d1a', border: '1px solid #1a2d4a', borderRadius: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#6b82a8', minWidth: 110 }}>{label}</span>
                <span style={{ fontSize: 13, color: '#e8f0ff' }}>{value}</span>
              </div>
            ))}
          </div>

          <p style={{ color: '#6b82a8', fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
            The campaign will be saved as a <strong style={{ color: '#ffc147' }}>draft</strong>. You can schedule or send it from the campaign detail page.
          </p>

          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" onClick={() => setStep('newsletter')}>← Back</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? 'Creating…' : 'Create Campaign'}
            </Button>
          </div>
        </AdminCard>
      )}
    </AdminLayout>
  );
}
