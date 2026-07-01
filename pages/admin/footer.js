// pages/admin/footer.js — Phase 4: Footer CMS
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { AdminCard, Button, TextInput, TextArea, ErrorBanner } from '../../components/admin/ui';
import { getFooter, updateFooter, FOOTER_DEFAULTS } from '../../lib/cms/footer';
import { useAuth } from '../../lib/cms/useAuth';

const TABS = ['General', 'Link Columns', 'Social Links', 'Bottom Links'];

export default function FooterCMS() {
  const auth   = useAuth();
  const [tab,  setTab]   = useState('General');
  const [data, setData]  = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState(null);

  useEffect(() => {
    getFooter().then(r => {
      if (r.error) setError(r.error);
      else setData(r.data ?? { ...FOOTER_DEFAULTS });
    });
  }, []);

  async function save() {
    setSaving(true); setSaved(false); setError(null);
    const r = await updateFooter(data, auth.user?.uid);
    setSaving(false);
    if (r.error) { setError(r.error); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (!data) {
    return <AdminLayout title="Footer CMS"><p style={{ color: '#6b82a8', fontSize: 14 }}>{error || 'Loading…'}</p></AdminLayout>;
  }

  const columns  = data.columns  ?? FOOTER_DEFAULTS.columns;
  const socials  = data.socialLinks  ?? FOOTER_DEFAULTS.socialLinks;
  const bottomLinks = data.bottomLinks ?? FOOTER_DEFAULTS.bottomLinks;

  return (
    <AdminLayout title="Footer CMS" requiredRole="editor">
      <ErrorBanner message={error} />

      {/* Tabs */}
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

      {/* ── General ── */}
      {tab === 'General' && (
        <div style={{ maxWidth: 700, display: 'grid', gap: 16 }}>
          <AdminCard>
            <TextInput label="Copyright text ({year} = auto-replaced)" value={data.copyrightText ?? ''} onChange={e => setData(d => ({ ...d, copyrightText: e.target.value }))} />
            <TextArea label="Footer tagline" rows={2} value={data.tagline ?? ''} onChange={e => setData(d => ({ ...d, tagline: e.target.value }))} />
          </AdminCard>
        </div>
      )}

      {/* ── Link Columns ── */}
      {tab === 'Link Columns' && (
        <div style={{ display: 'grid', gap: 16, maxWidth: 900 }}>
          {columns.map((col, ci) => (
            <AdminCard key={ci}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <TextInput label="Column heading" value={col.heading ?? ''} style={{ marginBottom: 0, flex: 1, marginRight: 12 }}
                  onChange={e => {
                    const cols = columns.map((c, i) => i === ci ? { ...c, heading: e.target.value } : c);
                    setData(d => ({ ...d, columns: cols }));
                  }} />
                <button onClick={() => setData(d => ({ ...d, columns: columns.filter((_, i) => i !== ci) }))}
                  style={{ background: 'none', border: 'none', color: '#ff8080', cursor: 'pointer', fontSize: 13, marginTop: 18 }}>Remove column</button>
              </div>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: '#6b82a8', textTransform: 'uppercase', marginBottom: 8 }}>Links</p>
              {(col.links ?? []).map((link, li) => (
                <div key={li} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'end', marginBottom: 8 }}>
                  <TextInput label={li === 0 ? 'Label' : ''} value={link.label ?? ''} style={{ marginBottom: 0 }}
                    onChange={e => {
                      const cols = columns.map((c, i) => i !== ci ? c : {
                        ...c, links: c.links.map((l, j) => j === li ? { ...l, label: e.target.value } : l),
                      });
                      setData(d => ({ ...d, columns: cols }));
                    }} />
                  <TextInput label={li === 0 ? 'URL' : ''} value={link.url ?? ''} style={{ marginBottom: 0 }}
                    onChange={e => {
                      const cols = columns.map((c, i) => i !== ci ? c : {
                        ...c, links: c.links.map((l, j) => j === li ? { ...l, url: e.target.value } : l),
                      });
                      setData(d => ({ ...d, columns: cols }));
                    }} />
                  <button onClick={() => {
                    const cols = columns.map((c, i) => i !== ci ? c : { ...c, links: c.links.filter((_, j) => j !== li) });
                    setData(d => ({ ...d, columns: cols }));
                  }} style={{ background: 'none', border: 'none', color: '#ff8080', cursor: 'pointer', fontSize: 18, padding: '0 4px', marginBottom: 14 }}>×</button>
                </div>
              ))}
              <Button variant="secondary" style={{ fontSize: 12, padding: '5px 12px', marginTop: 4 }} onClick={() => {
                const cols = columns.map((c, i) => i !== ci ? c : { ...c, links: [...(c.links ?? []), { label: '', url: '/' }] });
                setData(d => ({ ...d, columns: cols }));
              }}>+ Add link</Button>
            </AdminCard>
          ))}
          <Button variant="secondary" onClick={() => {
            setData(d => ({ ...d, columns: [...columns, { id: `col${Date.now()}`, heading: 'New Column', links: [] }] }));
          }}>+ Add Column</Button>
        </div>
      )}

      {/* ── Social Links ── */}
      {tab === 'Social Links' && (
        <div style={{ maxWidth: 680, display: 'grid', gap: 10 }}>
          {socials.map((s, i) => (
            <AdminCard key={i} style={{ padding: '14px 18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '36px 140px 1fr 80px', gap: 12, alignItems: 'end' }}>
                <TextInput label={i === 0 ? 'Icon' : ''} value={s.icon ?? ''} style={{ marginBottom: 0, textAlign: 'center' }}
                  onChange={e => {
                    const soc = socials.map((x, j) => j === i ? { ...x, icon: e.target.value } : x);
                    setData(d => ({ ...d, socialLinks: soc }));
                  }} />
                <TextInput label={i === 0 ? 'Platform' : ''} value={s.platform ?? ''} style={{ marginBottom: 0 }}
                  onChange={e => {
                    const soc = socials.map((x, j) => j === i ? { ...x, platform: e.target.value } : x);
                    setData(d => ({ ...d, socialLinks: soc }));
                  }} />
                <TextInput label={i === 0 ? 'URL' : ''} value={s.url ?? ''} style={{ marginBottom: 0 }}
                  onChange={e => {
                    const soc = socials.map((x, j) => j === i ? { ...x, url: e.target.value } : x);
                    setData(d => ({ ...d, socialLinks: soc }));
                  }} />
                <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6, paddingTop: i === 0 ? 18 : 0 }}>
                  <Toggle value={s.enabled} label="" onChange={v => {
                    const soc = socials.map((x, j) => j === i ? { ...x, enabled: v } : x);
                    setData(d => ({ ...d, socialLinks: soc }));
                  }} />
                  <span style={{ fontSize: 12, color: '#6b82a8' }}>{s.enabled ? 'On' : 'Off'}</span>
                </div>
              </div>
            </AdminCard>
          ))}
          <Button variant="secondary" onClick={() => {
            setData(d => ({ ...d, socialLinks: [...socials, { platform: '', url: '', icon: '🔗', enabled: false }] }));
          }}>+ Add Social</Button>
        </div>
      )}

      {/* ── Bottom Links ── */}
      {tab === 'Bottom Links' && (
        <div style={{ maxWidth: 640, display: 'grid', gap: 10 }}>
          <p style={{ color: '#6b82a8', fontSize: 13, marginBottom: 4 }}>These appear in the footer bottom bar alongside the copyright.</p>
          {bottomLinks.map((link, i) => (
            <AdminCard key={i} style={{ padding: '12px 16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'end' }}>
                <TextInput label={i === 0 ? 'Label' : ''} value={link.label ?? ''} style={{ marginBottom: 0 }}
                  onChange={e => {
                    const bl = bottomLinks.map((l, j) => j === i ? { ...l, label: e.target.value } : l);
                    setData(d => ({ ...d, bottomLinks: bl }));
                  }} />
                <TextInput label={i === 0 ? 'URL' : ''} value={link.url ?? ''} style={{ marginBottom: 0 }}
                  onChange={e => {
                    const bl = bottomLinks.map((l, j) => j === i ? { ...l, url: e.target.value } : l);
                    setData(d => ({ ...d, bottomLinks: bl }));
                  }} />
                <button onClick={() => setData(d => ({ ...d, bottomLinks: bottomLinks.filter((_, j) => j !== i) }))}
                  style={{ background: 'none', border: 'none', color: '#ff8080', cursor: 'pointer', fontSize: 18, marginBottom: 14 }}>×</button>
              </div>
            </AdminCard>
          ))}
          <Button variant="secondary" onClick={() => setData(d => ({ ...d, bottomLinks: [...bottomLinks, { label: '', url: '/' }] }))}>+ Add Link</Button>
        </div>
      )}

      {/* Save */}
      <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 14 }}>
        <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Footer'}</Button>
        {saved && <span style={{ color: '#00d084', fontSize: 13, fontWeight: 600 }}>✓ Saved</span>}
      </div>
    </AdminLayout>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div onClick={() => onChange(!value)} style={{
      width: 34, height: 18, borderRadius: 9, position: 'relative',
      background: value ? 'rgba(20,255,244,0.3)' : '#1a2d4a',
      border: value ? '1px solid rgba(20,255,244,0.5)' : '1px solid #2a3d5c',
      transition: 'background 0.15s', cursor: 'pointer', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 2, left: value ? 16 : 2,
        width: 12, height: 12, borderRadius: 6,
        background: value ? '#14FFF4' : '#6b82a8',
        transition: 'left 0.15s',
      }} />
    </div>
  );
}
