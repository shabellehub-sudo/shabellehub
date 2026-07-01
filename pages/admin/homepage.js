// pages/admin/homepage.js — Phase 4: Homepage CMS
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { AdminCard, Button, TextInput, TextArea, ErrorBanner } from '../../components/admin/ui';
import { getHomepage, updateHomepage, HOMEPAGE_DEFAULTS } from '../../lib/cms/homepage';
import { useAuth } from '../../lib/cms/useAuth';

const SECTION_LABELS = ['Hero', 'Featured Tools', 'Featured Articles', 'Statistics', 'Banners'];

export default function HomepageCMS() {
  const auth    = useAuth();
  const [tab,   setTab]    = useState('Hero');
  const [data,  setData]   = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState(null);

  useEffect(() => {
    getHomepage().then(r => {
      if (r.error) setError(r.error);
      else setData(r.data);
    });
  }, []);

  async function save() {
    setSaving(true); setSaved(false); setError(null);
    const token = await auth.user?.getIdToken();
    // We use the direct Firestore write via lib
    const r = await updateHomepage(data, auth.user?.uid);
    setSaving(false);
    if (r.error) { setError(r.error); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function set(path, value) {
    setData(prev => setNestedValue({ ...prev }, path, value));
  }

  if (!data) {
    return (
      <AdminLayout title="Homepage CMS">
        <p style={{ color: '#6b82a8', fontSize: 14 }}>{error || 'Loading…'}</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Homepage CMS" requiredRole="editor">
      <ErrorBanner message={error} />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {SECTION_LABELS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '7px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer',
            background: tab === t ? 'rgba(20,255,244,0.1)' : 'transparent',
            border: tab === t ? '1px solid rgba(20,255,244,0.4)' : '1px solid #2a3d5c',
            color: tab === t ? '#14FFF4' : '#9fb3d4',
          }}>{t}</button>
        ))}
      </div>

      {/* ── Hero ── */}
      {tab === 'Hero' && (
        <div style={{ display: 'grid', gap: 16, maxWidth: 760 }}>
          <AdminCard>
            <SectionToggle label="Hero section enabled" value={data.hero?.enabled ?? true} onChange={v => set('hero.enabled', v)} />
            <TextInput label="Headline" value={data.hero?.headline ?? ''} onChange={e => set('hero.headline', e.target.value)} />
            <TextArea label="Sub-headline" rows={2} value={data.hero?.subheadline ?? ''} onChange={e => set('hero.subheadline', e.target.value)} />
            <TextInput label="Badge text (optional)" value={data.hero?.badge ?? ''} onChange={e => set('hero.badge', e.target.value)} />
          </AdminCard>
          <AdminCard>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#9fb3d4', marginBottom: 12, textTransform: 'uppercase' }}>Primary CTA</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <TextInput label="Button text" value={data.hero?.ctaText ?? ''} onChange={e => set('hero.ctaText', e.target.value)} />
              <TextInput label="Button URL" value={data.hero?.ctaUrl ?? ''} onChange={e => set('hero.ctaUrl', e.target.value)} />
            </div>
          </AdminCard>
          <AdminCard>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#9fb3d4', marginBottom: 12, textTransform: 'uppercase' }}>Secondary CTA</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <TextInput label="Button text" value={data.hero?.ctaSecondaryText ?? ''} onChange={e => set('hero.ctaSecondaryText', e.target.value)} />
              <TextInput label="Button URL" value={data.hero?.ctaSecondaryUrl ?? ''} onChange={e => set('hero.ctaSecondaryUrl', e.target.value)} />
            </div>
          </AdminCard>
          <AdminCard>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#9fb3d4', marginBottom: 12, textTransform: 'uppercase' }}>Background</p>
            <label style={{ display: 'block', marginBottom: 10 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#9fb3d4', display: 'block', marginBottom: 6 }}>Type</span>
              <select value={data.hero?.backgroundType ?? 'gradient'} onChange={e => set('hero.backgroundType', e.target.value)}
                style={{ background: '#080d1a', border: '1px solid #2a3d5c', borderRadius: 8, padding: '10px 12px', color: '#e8f0ff', fontSize: 14, width: '100%' }}>
                <option value="gradient">Gradient (default)</option>
                <option value="image">Custom image</option>
              </select>
            </label>
            {data.hero?.backgroundType === 'image' && (
              <TextInput label="Background image URL" value={data.hero?.backgroundImage ?? ''} onChange={e => set('hero.backgroundImage', e.target.value)} />
            )}
          </AdminCard>
        </div>
      )}

      {/* ── Featured Tools ── */}
      {tab === 'Featured Tools' && (
        <div style={{ display: 'grid', gap: 16, maxWidth: 760 }}>
          <AdminCard>
            <SectionToggle label="Featured tools section enabled" value={data.featuredTools?.enabled ?? true} onChange={v => set('featuredTools.enabled', v)} />
            <TextInput label="Section title" value={data.featuredTools?.title ?? ''} onChange={e => set('featuredTools.title', e.target.value)} />
            <TextArea label="Section subtitle" rows={2} value={data.featuredTools?.subtitle ?? ''} onChange={e => set('featuredTools.subtitle', e.target.value)} />
            <label style={{ display: 'block', marginBottom: 14 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#9fb3d4', display: 'block', marginBottom: 6 }}>Max tools to display</span>
              <input type="number" min={1} max={24} value={data.featuredTools?.limit ?? 6} onChange={e => set('featuredTools.limit', parseInt(e.target.value) || 6)}
                style={{ background: '#080d1a', border: '1px solid #2a3d5c', borderRadius: 8, padding: '10px 12px', color: '#e8f0ff', fontSize: 14, width: 120 }} />
            </label>
            <InfoBox>Tools are pulled automatically from Firestore (featured=true, status=published), ordered by date.</InfoBox>
          </AdminCard>
        </div>
      )}

      {/* ── Featured Articles ── */}
      {tab === 'Featured Articles' && (
        <div style={{ display: 'grid', gap: 16, maxWidth: 760 }}>
          <AdminCard>
            <SectionToggle label="Featured articles section enabled" value={data.featuredArticles?.enabled ?? true} onChange={v => set('featuredArticles.enabled', v)} />
            <TextInput label="Section title" value={data.featuredArticles?.title ?? ''} onChange={e => set('featuredArticles.title', e.target.value)} />
            <TextArea label="Section subtitle" rows={2} value={data.featuredArticles?.subtitle ?? ''} onChange={e => set('featuredArticles.subtitle', e.target.value)} />
            <label style={{ display: 'block', marginBottom: 14 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#9fb3d4', display: 'block', marginBottom: 6 }}>Max articles to display</span>
              <input type="number" min={1} max={12} value={data.featuredArticles?.limit ?? 3} onChange={e => set('featuredArticles.limit', parseInt(e.target.value) || 3)}
                style={{ background: '#080d1a', border: '1px solid #2a3d5c', borderRadius: 8, padding: '10px 12px', color: '#e8f0ff', fontSize: 14, width: 120 }} />
            </label>
            <InfoBox>Articles are pulled from Firestore (featured=true or most recent, status=published).</InfoBox>
          </AdminCard>
        </div>
      )}

      {/* ── Statistics ── */}
      {tab === 'Statistics' && (
        <div style={{ display: 'grid', gap: 16, maxWidth: 760 }}>
          <AdminCard>
            <SectionToggle label="Statistics section enabled" value={data.statistics?.enabled ?? true} onChange={v => set('statistics.enabled', v)} />
            <p style={{ fontSize: 12, fontWeight: 700, color: '#9fb3d4', marginBottom: 12, textTransform: 'uppercase' }}>Stat Items</p>
            {(data.statistics?.items ?? HOMEPAGE_DEFAULTS.statistics.items).map((item, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr auto', gap: 8, alignItems: 'end', marginBottom: 10 }}>
                <TextInput label={i === 0 ? 'Icon' : ''} value={item.icon ?? ''} onChange={e => {
                  const items = [...(data.statistics?.items ?? [])];
                  items[i] = { ...items[i], icon: e.target.value };
                  set('statistics.items', items);
                }} style={{ textAlign: 'center' }} />
                <TextInput label={i === 0 ? 'Value' : ''} value={item.value ?? ''} onChange={e => {
                  const items = [...(data.statistics?.items ?? [])];
                  items[i] = { ...items[i], value: e.target.value };
                  set('statistics.items', items);
                }} />
                <TextInput label={i === 0 ? 'Label' : ''} value={item.label ?? ''} onChange={e => {
                  const items = [...(data.statistics?.items ?? [])];
                  items[i] = { ...items[i], label: e.target.value };
                  set('statistics.items', items);
                }} />
                <button onClick={() => {
                  const items = (data.statistics?.items ?? []).filter((_, j) => j !== i);
                  set('statistics.items', items);
                }} style={{ background: 'none', border: 'none', color: '#ff8080', cursor: 'pointer', fontSize: 18, padding: '0 4px', marginBottom: 14 }}>×</button>
              </div>
            ))}
            <Button variant="secondary" onClick={() => {
              const items = [...(data.statistics?.items ?? []), { icon: '⭐', value: '', label: '' }];
              set('statistics.items', items);
            }}>+ Add Stat</Button>
          </AdminCard>
        </div>
      )}

      {/* ── Banners ── */}
      {tab === 'Banners' && (
        <div style={{ display: 'grid', gap: 16, maxWidth: 760 }}>
          {(data.banners ?? []).length === 0 && (
            <AdminCard>
              <p style={{ color: '#6b82a8', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>No homepage banners yet.</p>
            </AdminCard>
          )}
          {(data.banners ?? []).map((banner, i) => (
            <AdminCard key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#e8f0ff' }}>Banner {i + 1}</p>
                <button onClick={() => {
                  const banners = (data.banners ?? []).filter((_, j) => j !== i);
                  set('banners', banners);
                }} style={{ background: 'none', border: 'none', color: '#ff8080', cursor: 'pointer', fontSize: 13 }}>Remove</button>
              </div>
              <SectionToggle label="Enabled" value={banner.enabled ?? true} onChange={v => {
                const banners = [...(data.banners ?? [])];
                banners[i] = { ...banners[i], enabled: v };
                set('banners', banners);
              }} />
              <TextInput label="Headline" value={banner.headline ?? ''} onChange={e => {
                const banners = [...(data.banners ?? [])];
                banners[i] = { ...banners[i], headline: e.target.value };
                set('banners', banners);
              }} />
              <TextArea label="Body text" rows={2} value={banner.body ?? ''} onChange={e => {
                const banners = [...(data.banners ?? [])];
                banners[i] = { ...banners[i], body: e.target.value };
                set('banners', banners);
              }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <TextInput label="CTA text" value={banner.ctaText ?? ''} onChange={e => {
                  const banners = [...(data.banners ?? [])];
                  banners[i] = { ...banners[i], ctaText: e.target.value };
                  set('banners', banners);
                }} />
                <TextInput label="CTA URL" value={banner.ctaUrl ?? ''} onChange={e => {
                  const banners = [...(data.banners ?? [])];
                  banners[i] = { ...banners[i], ctaUrl: e.target.value };
                  set('banners', banners);
                }} />
              </div>
            </AdminCard>
          ))}
          <Button variant="secondary" onClick={() => {
            const banners = [...(data.banners ?? []), { headline: '', body: '', ctaText: '', ctaUrl: '', enabled: true }];
            set('banners', banners);
          }}>+ Add Banner</Button>
        </div>
      )}

      {/* Save bar */}
      <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 14 }}>
        <Button onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
        {saved && <span style={{ color: '#00d084', fontSize: 13, fontWeight: 600 }}>✓ Saved</span>}
      </div>
    </AdminLayout>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function SectionToggle({ label, value, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, cursor: 'pointer' }}>
      <div onClick={() => onChange(!value)} style={{
        width: 40, height: 22, borderRadius: 11, position: 'relative', cursor: 'pointer',
        background: value ? 'rgba(20,255,244,0.3)' : '#1a2d4a',
        border: value ? '1px solid rgba(20,255,244,0.5)' : '1px solid #2a3d5c',
        transition: 'background 0.15s',
      }}>
        <div style={{
          position: 'absolute', top: 2, left: value ? 20 : 2,
          width: 16, height: 16, borderRadius: 8,
          background: value ? '#14FFF4' : '#6b82a8',
          transition: 'left 0.15s',
        }} />
      </div>
      <span style={{ fontSize: 13, color: '#9fb3d4', fontWeight: 600 }}>{label}</span>
    </label>
  );
}

function InfoBox({ children }) {
  return (
    <div style={{ background: 'rgba(20,255,244,0.05)', border: '1px solid rgba(20,255,244,0.15)', borderRadius: 8, padding: '10px 14px', fontSize: 12.5, color: '#6b82a8', marginTop: 4 }}>
      ℹ️ {children}
    </div>
  );
}

// ── Deep set helper ───────────────────────────────────────────────────────────
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (cur[keys[i]] === undefined || typeof cur[keys[i]] !== 'object') {
      cur[keys[i]] = {};
    } else {
      cur[keys[i]] = { ...cur[keys[i]] };
    }
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
  return obj;
}
