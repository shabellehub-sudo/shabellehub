// pages/admin/site-settings.js — Phase 4: Site Settings CMS
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { AdminCard, Button, TextInput, TextArea, ErrorBanner } from '../../components/admin/ui';
import { getSiteSettings, updateSiteSettings, SITE_SETTINGS_DEFAULTS } from '../../lib/cms/siteSettings';
import { useAuth } from '../../lib/cms/useAuth';

const TABS = ['Identity', 'Global SEO', 'Integrations', 'Features'];

export default function SiteSettingsCMS() {
  const auth   = useAuth();
  const [tab,  setTab]  = useState('Identity');
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState(null);

  useEffect(() => {
    getSiteSettings().then(r => {
      if (r.error) setError(r.error);
      else setData(r.data ?? { ...SITE_SETTINGS_DEFAULTS });
    });
  }, []);

  async function save() {
    setSaving(true); setSaved(false); setError(null);
    const r = await updateSiteSettings(data, auth.user?.uid);
    setSaving(false);
    if (r.error) { setError(r.error); return; }
    setData(r.data);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function set(key, value) { setData(d => ({ ...d, [key]: value })); }

  if (!data) {
    return <AdminLayout title="Site Settings" requiredRole="admin"><p style={{ color: '#6b82a8', fontSize: 14 }}>{error || 'Loading…'}</p></AdminLayout>;
  }

  return (
    <AdminLayout title="Site Settings" requiredRole="admin">
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

      {/* ── Identity ── */}
      {tab === 'Identity' && (
        <div style={{ maxWidth: 720, display: 'grid', gap: 16 }}>
          <AdminCard>
            <TextInput label="Site name" value={data.siteName ?? ''} onChange={e => set('siteName', e.target.value)} />
            <TextArea label="Site tagline" rows={2} value={data.siteTagline ?? ''} onChange={e => set('siteTagline', e.target.value)} />
            <TextInput label="Site URL (e.g. https://shabellehub.com)" value={data.siteUrl ?? ''} onChange={e => set('siteUrl', e.target.value)} />
          </AdminCard>
          <AdminCard>
            <p style={{ fontSize: 12.5, fontWeight: 700, color: '#9fb3d4', marginBottom: 12, textTransform: 'uppercase' }}>Logo & Favicon</p>
            <TextInput label="Logo URL" value={data.logoUrl ?? ''} onChange={e => set('logoUrl', e.target.value)} />
            <TextInput label="Logo alt text" value={data.logoAlt ?? ''} onChange={e => set('logoAlt', e.target.value)} />
            <TextInput label="Favicon URL" value={data.faviconUrl ?? ''} onChange={e => set('faviconUrl', e.target.value)} />
            <p style={{ color: '#6b82a8', fontSize: 12, marginTop: -8 }}>
              Use public paths (e.g. /logo.png) or full URLs for Storage-hosted files. Upload files via Media manager.
            </p>
          </AdminCard>
        </div>
      )}

      {/* ── Global SEO ── */}
      {tab === 'Global SEO' && (
        <div style={{ maxWidth: 720, display: 'grid', gap: 16 }}>
          <AdminCard>
            <TextInput label="Default page title" value={data.defaultTitle ?? ''} onChange={e => set('defaultTitle', e.target.value)} />
            <TextArea label="Default meta description" rows={3} value={data.defaultDescription ?? ''} onChange={e => set('defaultDescription', e.target.value)} />
            <TextInput label="Default OG image URL" value={data.defaultOgImage ?? ''} onChange={e => set('defaultOgImage', e.target.value)} />
            <TextInput label="Twitter / X handle (e.g. @shabellehub)" value={data.twitterHandle ?? ''} onChange={e => set('twitterHandle', e.target.value)} />
            <TextInput label="Google Search Console verification code" value={data.googleSiteVerification ?? ''} onChange={e => set('googleSiteVerification', e.target.value)} />
          </AdminCard>
          <AdminCard>
            <div style={{ background: 'rgba(20,255,244,0.05)', border: '1px solid rgba(20,255,244,0.15)', borderRadius: 8, padding: '12px 14px', fontSize: 12.5, color: '#6b82a8' }}>
              ℹ️ These values are used as fallbacks when individual pages don&apos;t specify their own SEO fields. Per-page SEO is managed in Blog SEO and individual posts/tools.
            </div>
          </AdminCard>
        </div>
      )}

      {/* ── Integrations ── */}
      {tab === 'Integrations' && (
        <div style={{ maxWidth: 720, display: 'grid', gap: 16 }}>
          <AdminCard>
            <p style={{ fontSize: 12.5, fontWeight: 700, color: '#9fb3d4', marginBottom: 12, textTransform: 'uppercase' }}>Analytics & Ads</p>
            <TextInput label="Google Analytics 4 Measurement ID (G-XXXXXXXX)" value={data.googleAnalyticsId ?? ''} onChange={e => set('googleAnalyticsId', e.target.value)} />
            <TextInput label="Google AdSense Publisher ID (ca-pub-XXXXXXXX)" value={data.googleAdsenseId ?? ''} onChange={e => set('googleAdsenseId', e.target.value)} />
            <p style={{ color: '#6b82a8', fontSize: 12, marginTop: -8 }}>
              These IDs override the values set in environment variables when present.
            </p>
          </AdminCard>
        </div>
      )}

      {/* ── Features ── */}
      {tab === 'Features' && (
        <div style={{ maxWidth: 720, display: 'grid', gap: 16 }}>
          <AdminCard>
            <p style={{ fontSize: 12.5, fontWeight: 700, color: '#9fb3d4', marginBottom: 16, textTransform: 'uppercase' }}>Site Features</p>
            <FeatureRow label="Cookie consent banner" description="Shows a GDPR-compliant cookie consent notice." value={data.cookieBannerEnabled ?? true} onChange={v => set('cookieBannerEnabled', v)} />
            <FeatureRow label="Newsletter signup" description="Enables newsletter opt-in forms across the site." value={data.newsletterEnabled ?? true} onChange={v => set('newsletterEnabled', v)} />
          </AdminCard>
          <AdminCard style={{ borderColor: 'rgba(255,193,71,0.3)' }}>
            <p style={{ fontSize: 12.5, fontWeight: 700, color: '#ffc147', marginBottom: 8, textTransform: 'uppercase' }}>⚠️ Maintenance Mode</p>
            <p style={{ fontSize: 13, color: '#9fb3d4', marginBottom: 14 }}>When enabled, visitors see the maintenance message instead of the site.</p>
            <FeatureRow label="Enable maintenance mode" description="" value={data.maintenanceMode ?? false} onChange={v => set('maintenanceMode', v)} />
            <TextArea label="Maintenance message" rows={2} value={data.maintenanceMessage ?? ''} onChange={e => set('maintenanceMessage', e.target.value)} />
          </AdminCard>
        </div>
      )}

      {/* Save */}
      <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 14 }}>
        <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Settings'}</Button>
        {saved && <span style={{ color: '#00d084', fontSize: 13, fontWeight: 600 }}>✓ Saved</span>}
      </div>
    </AdminLayout>
  );
}

function FeatureRow({ label, description, value, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #1a2d4a' }}>
      <div style={{ flex: 1, marginRight: 20 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#e8f0ff', marginBottom: 3 }}>{label}</div>
        {description && <div style={{ fontSize: 12.5, color: '#6b82a8' }}>{description}</div>}
      </div>
      <div onClick={() => onChange(!value)} style={{
        width: 40, height: 22, borderRadius: 11, position: 'relative', cursor: 'pointer', flexShrink: 0, marginTop: 2,
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
    </div>
  );
}
