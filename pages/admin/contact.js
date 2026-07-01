// pages/admin/contact.js — Phase 4: Contact Page CMS
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { AdminCard, Button, TextInput, TextArea, ErrorBanner } from '../../components/admin/ui';
import { getPage, updatePage, CONTACT_DEFAULTS } from '../../lib/cms/pages';
import { useAuth } from '../../lib/cms/useAuth';

const TABS = ['Content', 'Contact Info', 'Form Reasons', 'SEO'];

export default function ContactPageCMS() {
  const auth   = useAuth();
  const [tab,  setTab]  = useState('Content');
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState(null);

  useEffect(() => {
    getPage('contact').then(r => {
      if (r.error) setError(r.error);
      else setData(r.data ?? { ...CONTACT_DEFAULTS });
    });
  }, []);

  async function save() {
    setSaving(true); setSaved(false); setError(null);
    const r = await updatePage('contact', data, auth.user?.uid);
    setSaving(false);
    if (r.error) { setError(r.error); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const set = (k, v) => setData(d => ({ ...d, [k]: v }));

  if (!data) return <AdminLayout title="Contact Page"><p style={{ color: '#6b82a8', fontSize: 14 }}>{error || 'Loading…'}</p></AdminLayout>;

  return (
    <AdminLayout title="Contact Page" requiredRole="editor">
      <ErrorBanner message={error} />

      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '7px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer',
            background: tab === t ? 'rgba(20,255,244,0.1)' : 'transparent',
            border: tab === t ? '1px solid rgba(20,255,244,0.4)' : '1px solid #2a3d5c',
            color: tab === t ? '#14FFF4' : '#9fb3d4',
          }}>{t}</button>
        ))}
      </div>

      {/* ── Content ── */}
      {tab === 'Content' && (
        <div style={{ maxWidth: 720, display: 'grid', gap: 16 }}>
          <AdminCard>
            <p style={{ fontSize: 12.5, fontWeight: 700, color: '#9fb3d4', marginBottom: 12, textTransform: 'uppercase' }}>Hero</p>
            <TextInput label="Page title" value={data.heroTitle ?? ''} onChange={e => set('heroTitle', e.target.value)} />
            <TextArea label="Subtitle" rows={2} value={data.heroSubtitle ?? ''} onChange={e => set('heroSubtitle', e.target.value)} />
          </AdminCard>
          <AdminCard>
            <p style={{ fontSize: 12.5, fontWeight: 700, color: '#9fb3d4', marginBottom: 12, textTransform: 'uppercase' }}>Contact Form</p>
            <ToggleRow label="Show contact form" description="Display the message form on the page." value={data.formEnabled ?? true} onChange={v => set('formEnabled', v)} />
            <TextInput label="Form section heading" value={data.formTitle ?? ''} onChange={e => set('formTitle', e.target.value)} />
            <TextInput label="Form description / expectations" value={data.formSubtitle ?? ''} onChange={e => set('formSubtitle', e.target.value)} />
            <TextInput label="Recipient email (where form submissions go)" value={data.contactEmail ?? ''} onChange={e => set('contactEmail', e.target.value)} />
          </AdminCard>
        </div>
      )}

      {/* ── Contact Info ── */}
      {tab === 'Contact Info' && (
        <div style={{ maxWidth: 720, display: 'grid', gap: 16 }}>
          <p style={{ color: '#6b82a8', fontSize: 13 }}>Info cards shown alongside the contact form.</p>
          {(data.infoCards ?? CONTACT_DEFAULTS.infoCards).map((card, i) => (
            <AdminCard key={i} style={{ padding: '14px 18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '44px 140px 1fr auto', gap: 10, alignItems: 'end' }}>
                <TextInput label={i === 0 ? 'Icon' : ''} value={card.icon ?? ''} style={{ marginBottom: 0, textAlign: 'center' }}
                  onChange={e => {
                    const cards = (data.infoCards ?? []).map((c, j) => j === i ? { ...c, icon: e.target.value } : c);
                    set('infoCards', cards);
                  }} />
                <TextInput label={i === 0 ? 'Title' : ''} value={card.title ?? ''} style={{ marginBottom: 0 }}
                  onChange={e => {
                    const cards = (data.infoCards ?? []).map((c, j) => j === i ? { ...c, title: e.target.value } : c);
                    set('infoCards', cards);
                  }} />
                <TextInput label={i === 0 ? 'Value / Text' : ''} value={card.text ?? ''} style={{ marginBottom: 0 }}
                  onChange={e => {
                    const cards = (data.infoCards ?? []).map((c, j) => j === i ? { ...c, text: e.target.value } : c);
                    set('infoCards', cards);
                  }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, paddingTop: i === 0 ? 18 : 0 }}>
                  <MiniToggle value={card.enabled} onChange={v => {
                    const cards = (data.infoCards ?? []).map((c, j) => j === i ? { ...c, enabled: v } : c);
                    set('infoCards', cards);
                  }} />
                  <span style={{ fontSize: 12, color: '#6b82a8', whiteSpace: 'nowrap' }}>{card.enabled ? 'Shown' : 'Hidden'}</span>
                </div>
              </div>
            </AdminCard>
          ))}
          <Button variant="secondary" onClick={() => set('infoCards', [...(data.infoCards ?? []), { icon: '📍', title: '', text: '', enabled: false }])}>+ Add Info Card</Button>
        </div>
      )}

      {/* ── Form Reasons ── */}
      {tab === 'Form Reasons' && (
        <div style={{ maxWidth: 640, display: 'grid', gap: 12 }}>
          <p style={{ color: '#6b82a8', fontSize: 13 }}>Options shown in the &quot;Reason for contact&quot; dropdown in the contact form.</p>
          {(data.reasons ?? CONTACT_DEFAULTS.reasons).map((reason, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'end', background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 10, padding: '12px 16px' }}>
              <TextInput label={i === 0 ? 'Label (shown to user)' : ''} value={reason.label ?? ''} style={{ marginBottom: 0 }}
                onChange={e => {
                  const reasons = (data.reasons ?? []).map((r, j) => j === i ? { ...r, label: e.target.value } : r);
                  set('reasons', reasons);
                }} />
              <TextInput label={i === 0 ? 'Value (in form data)' : ''} value={reason.value ?? ''} style={{ marginBottom: 0 }}
                onChange={e => {
                  const reasons = (data.reasons ?? []).map((r, j) => j === i ? { ...r, value: e.target.value } : r);
                  set('reasons', reasons);
                }} />
              <button onClick={() => set('reasons', (data.reasons ?? []).filter((_, j) => j !== i))}
                style={{ background: 'none', border: 'none', color: '#ff8080', cursor: 'pointer', fontSize: 18, padding: '0 4px', marginBottom: i === 0 ? 14 : 0 }}>×</button>
            </div>
          ))}
          <Button variant="secondary" onClick={() => set('reasons', [...(data.reasons ?? []), { label: '', value: '' }])}>+ Add Reason</Button>
        </div>
      )}

      {/* ── SEO ── */}
      {tab === 'SEO' && (
        <div style={{ maxWidth: 720, display: 'grid', gap: 16 }}>
          <AdminCard>
            <TextInput label="Meta title" value={data.seoTitle ?? ''} onChange={e => set('seoTitle', e.target.value)} />
            <TextArea label="Meta description" rows={3} value={data.seoDescription ?? ''} onChange={e => set('seoDescription', e.target.value)} />
          </AdminCard>
        </div>
      )}

      <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 14 }}>
        <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Contact Page'}</Button>
        {saved && <span style={{ color: '#00d084', fontSize: 13, fontWeight: 600 }}>✓ Saved</span>}
      </div>
    </AdminLayout>
  );
}

function ToggleRow({ label, description, value, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#e8f0ff' }}>{label}</div>
        {description && <div style={{ fontSize: 12, color: '#6b82a8' }}>{description}</div>}
      </div>
      <MiniToggle value={value} onChange={onChange} />
    </div>
  );
}

function MiniToggle({ value, onChange }) {
  return (
    <div onClick={() => onChange(!value)} style={{
      width: 38, height: 20, borderRadius: 10, position: 'relative', cursor: 'pointer', flexShrink: 0,
      background: value ? 'rgba(20,255,244,0.3)' : '#1a2d4a',
      border: value ? '1px solid rgba(20,255,244,0.5)' : '1px solid #2a3d5c',
      transition: 'background 0.15s',
    }}>
      <div style={{
        position: 'absolute', top: 2, left: value ? 18 : 2,
        width: 14, height: 14, borderRadius: 7,
        background: value ? '#14FFF4' : '#6b82a8', transition: 'left 0.15s',
      }} />
    </div>
  );
}
