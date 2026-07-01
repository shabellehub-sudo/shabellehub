import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { AdminCard, Button, TextInput, TextArea, ErrorBanner, EmptyState } from '../../components/admin/ui';
import { getSettings, updateSettings } from '../../lib/cms/settings';
import { useAuth } from '../../lib/cms/useAuth';
import { isSupabaseConfigured as isFirebaseConfigured } from '../../lib/supabase';

const emptyForm = {
  site_title: '', site_description: '', ga_measurement_id: '', adsense_client_id: '',
  social_twitter: '', social_linkedin: '', default_seo_title_suffix: '', default_seo_description: '',
};

export default function AdminSettingsPage() {
  const auth = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured()) { setLoading(false); return; }
    (async () => {
      const { data, error } = await getSettings();
      if (data) {
        setForm({
          site_title: data.site_title || '', site_description: data.site_description || '',
          ga_measurement_id: data.ga_measurement_id || '', adsense_client_id: data.adsense_client_id || '',
          social_twitter: data.social_twitter || '', social_linkedin: data.social_linkedin || '',
          default_seo_title_suffix: data.default_seo_title_suffix || '', default_seo_description: data.default_seo_description || '',
        });
      }
      setError(error);
      setLoading(false);
    })();
  }, []);

  async function handleSave() {
    setSaved(false);
    const { error } = await updateSettings(form, auth.user?.id);
    if (error) { setError(error); return; }
    setSaved(true);
  }

  return (
    <AdminLayout title="Settings" requiredRole="admin">
      <ErrorBanner message={error} />

      <div style={{
        background: 'rgba(255,193,71,0.08)', border: '1px solid rgba(255,193,71,0.3)', borderRadius: 8,
        padding: '12px 16px', color: '#ffc147', fontSize: 13, marginBottom: 20, lineHeight: 1.6,
      }}>
        These settings are stored in the CMS database for future use. They are <strong>not</strong> currently
        wired into the live site&rsquo;s <code>NEXT_PUBLIC_GA_MEASUREMENT_ID</code> /{' '}
        <code>NEXT_PUBLIC_ADSENSE_CLIENT_ID</code> environment variables — connecting them requires a
        deliberate deploy-time sync step, intentionally not built automatically so the validated Phase 7B
        Analytics/AdSense infrastructure isn&rsquo;t altered as a side effect of this panel.
      </div>

      {!isFirebaseConfigured() ? (
        <EmptyState message="No database connection." sub="Configure Firebase to manage settings." />
      ) : loading ? (
        <p style={{ color: '#6b82a8' }}>Loading…</p>
      ) : (
        <AdminCard style={{ maxWidth: 560 }}>
          {saved && <div style={{ background: 'rgba(0,208,132,0.1)', border: '1px solid rgba(0,208,132,0.3)', borderRadius: 8, padding: '10px 14px', color: '#00d084', fontSize: 13, marginBottom: 16 }}>Settings saved.</div>}

          <TextInput label="Site Title" value={form.site_title} onChange={(e) => setForm(f => ({ ...f, site_title: e.target.value }))} />
          <TextArea label="Site Description" rows={2} value={form.site_description} onChange={(e) => setForm(f => ({ ...f, site_description: e.target.value }))} />
          <TextInput label="Google Analytics Measurement ID" value={form.ga_measurement_id} onChange={(e) => setForm(f => ({ ...f, ga_measurement_id: e.target.value }))} placeholder="G-XXXXXXXXXX" />
          <TextInput label="AdSense Client ID" value={form.adsense_client_id} onChange={(e) => setForm(f => ({ ...f, adsense_client_id: e.target.value }))} placeholder="ca-pub-XXXXXXXXXXXXXXXX" />
          <TextInput label="Twitter / X URL" value={form.social_twitter} onChange={(e) => setForm(f => ({ ...f, social_twitter: e.target.value }))} />
          <TextInput label="LinkedIn URL" value={form.social_linkedin} onChange={(e) => setForm(f => ({ ...f, social_linkedin: e.target.value }))} />
          <TextInput label="Default SEO Title Suffix" value={form.default_seo_title_suffix} onChange={(e) => setForm(f => ({ ...f, default_seo_title_suffix: e.target.value }))} />
          <TextArea label="Default Meta Description" rows={2} value={form.default_seo_description} onChange={(e) => setForm(f => ({ ...f, default_seo_description: e.target.value }))} />

          <Button onClick={handleSave}>Save Settings</Button>
        </AdminCard>
      )}
    </AdminLayout>
  );
}
