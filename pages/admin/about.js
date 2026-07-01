// pages/admin/about.js — Phase 4: About Page CMS
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { AdminCard, Button, TextInput, TextArea, ErrorBanner } from '../../components/admin/ui';
import { getPage, updatePage, ABOUT_DEFAULTS } from '../../lib/cms/pages';
import { useAuth } from '../../lib/cms/useAuth';

const TABS = ['Hero & Story', 'Values', 'CTA', 'SEO'];

export default function AboutPageCMS() {
  const auth   = useAuth();
  const [tab,  setTab]  = useState('Hero & Story');
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState(null);

  useEffect(() => {
    getPage('about').then(r => {
      if (r.error) setError(r.error);
      else setData(r.data ?? { ...ABOUT_DEFAULTS });
    });
  }, []);

  async function save() {
    setSaving(true); setSaved(false); setError(null);
    const r = await updatePage('about', data, auth.user?.uid);
    setSaving(false);
    if (r.error) { setError(r.error); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const set = (k, v) => setData(d => ({ ...d, [k]: v }));

  if (!data) return <AdminLayout title="About Page"><p style={{ color: '#6b82a8', fontSize: 14 }}>{error || 'Loading…'}</p></AdminLayout>;

  return (
    <AdminLayout title="About Page" requiredRole="editor">
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

      {tab === 'Hero & Story' && (
        <div style={{ maxWidth: 720, display: 'grid', gap: 16 }}>
          <AdminCard>
            <p style={{ fontSize: 12.5, fontWeight: 700, color: '#9fb3d4', marginBottom: 12, textTransform: 'uppercase' }}>Hero Section</p>
            <TextInput label="Page title" value={data.heroTitle ?? ''} onChange={e => set('heroTitle', e.target.value)} />
            <TextArea label="Subtitle" rows={2} value={data.heroSubtitle ?? ''} onChange={e => set('heroSubtitle', e.target.value)} />
          </AdminCard>
          <AdminCard>
            <p style={{ fontSize: 12.5, fontWeight: 700, color: '#9fb3d4', marginBottom: 12, textTransform: 'uppercase' }}>Our Mission</p>
            <TextInput label="Section heading" value={data.missionTitle ?? ''} onChange={e => set('missionTitle', e.target.value)} />
            <TextArea label="Mission text" rows={4} value={data.missionText ?? ''} onChange={e => set('missionText', e.target.value)} />
          </AdminCard>
          <AdminCard>
            <p style={{ fontSize: 12.5, fontWeight: 700, color: '#9fb3d4', marginBottom: 12, textTransform: 'uppercase' }}>Our Story</p>
            <TextInput label="Section heading" value={data.storyTitle ?? ''} onChange={e => set('storyTitle', e.target.value)} />
            <TextArea label="Story text" rows={4} value={data.storyText ?? ''} onChange={e => set('storyText', e.target.value)} />
          </AdminCard>
          <AdminCard>
            <ToggleRow label="Show team section" description="Display the team grid (pulled from Authors with author role)." value={data.teamEnabled ?? true} onChange={v => set('teamEnabled', v)} />
            <TextInput label="Team section heading" value={data.teamTitle ?? ''} onChange={e => set('teamTitle', e.target.value)} />
          </AdminCard>
        </div>
      )}

      {tab === 'Values' && (
        <div style={{ maxWidth: 720, display: 'grid', gap: 16 }}>
          <AdminCard>
            <TextInput label="Values section heading" value={data.valuesTitle ?? ''} onChange={e => set('valuesTitle', e.target.value)} />
          </AdminCard>
          {(data.values ?? ABOUT_DEFAULTS.values).map((v, i) => (
            <AdminCard key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#e8f0ff' }}>Value {i + 1}</span>
                <button onClick={() => set('values', (data.values ?? []).filter((_, j) => j !== i))}
                  style={{ background: 'none', border: 'none', color: '#ff8080', cursor: 'pointer', fontSize: 13 }}>Remove</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: 10 }}>
                <TextInput label="Icon" value={v.icon ?? ''} onChange={e => {
                  const vals = (data.values ?? []).map((x, j) => j === i ? { ...x, icon: e.target.value } : x);
                  set('values', vals);
                }} style={{ textAlign: 'center' }} />
                <TextInput label="Title" value={v.title ?? ''} onChange={e => {
                  const vals = (data.values ?? []).map((x, j) => j === i ? { ...x, title: e.target.value } : x);
                  set('values', vals);
                }} />
              </div>
              <TextArea label="Description" rows={2} value={v.description ?? ''} onChange={e => {
                const vals = (data.values ?? []).map((x, j) => j === i ? { ...x, description: e.target.value } : x);
                set('values', vals);
              }} />
            </AdminCard>
          ))}
          <Button variant="secondary" onClick={() => set('values', [...(data.values ?? []), { icon: '⭐', title: '', description: '' }])}>+ Add Value</Button>
        </div>
      )}

      {tab === 'CTA' && (
        <div style={{ maxWidth: 720, display: 'grid', gap: 16 }}>
          <AdminCard>
            <p style={{ fontSize: 12.5, fontWeight: 700, color: '#9fb3d4', marginBottom: 12, textTransform: 'uppercase' }}>Call-to-Action Section</p>
            <TextInput label="Heading" value={data.ctaTitle ?? ''} onChange={e => set('ctaTitle', e.target.value)} />
            <TextArea label="Supporting text" rows={2} value={data.ctaText ?? ''} onChange={e => set('ctaText', e.target.value)} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <TextInput label="Button text" value={data.ctaButtonText ?? ''} onChange={e => set('ctaButtonText', e.target.value)} />
              <TextInput label="Button URL" value={data.ctaButtonUrl ?? ''} onChange={e => set('ctaButtonUrl', e.target.value)} />
            </div>
          </AdminCard>
        </div>
      )}

      {tab === 'SEO' && (
        <div style={{ maxWidth: 720, display: 'grid', gap: 16 }}>
          <AdminCard>
            <TextInput label="Meta title" value={data.seoTitle ?? ''} onChange={e => set('seoTitle', e.target.value)} />
            <TextArea label="Meta description" rows={3} value={data.seoDescription ?? ''} onChange={e => set('seoDescription', e.target.value)} />
          </AdminCard>
        </div>
      )}

      <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 14 }}>
        <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save About Page'}</Button>
        {saved && <span style={{ color: '#00d084', fontSize: 13, fontWeight: 600 }}>✓ Saved</span>}
      </div>
    </AdminLayout>
  );
}

function ToggleRow({ label, description, value, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#e8f0ff' }}>{label}</div>
        {description && <div style={{ fontSize: 12, color: '#6b82a8' }}>{description}</div>}
      </div>
      <div onClick={() => onChange(!value)} style={{
        width: 38, height: 20, borderRadius: 10, position: 'relative', cursor: 'pointer',
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
    </div>
  );
}
