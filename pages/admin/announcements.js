// pages/admin/announcements.js — Phase 4: Announcement Banner CMS
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { AdminCard, Button, TextInput, TextArea, ErrorBanner, StatusBadge } from '../../components/admin/ui';
import {
  listAnnouncements, createAnnouncement,
  updateAnnouncement, deleteAnnouncement,
} from '../../lib/cms/announcements';
import { useAuth } from '../../lib/cms/useAuth';

const TYPE_COLORS = {
  info:    { bg: 'rgba(20,255,244,0.1)',  fg: '#14FFF4' },
  warning: { bg: 'rgba(255,193,71,0.1)', fg: '#ffc147' },
  success: { bg: 'rgba(0,208,132,0.1)',  fg: '#00d084' },
  promo:   { bg: 'rgba(180,100,255,0.1)',fg: '#b464ff' },
};

export default function AnnouncementsCMS() {
  const auth = useAuth();
  const [items,   setItems]   = useState([]);
  const [editing, setEditing] = useState(null); // null | 'new' | id
  const [form,    setForm]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);

  async function load() {
    setLoading(true);
    const r = await listAnnouncements();
    setLoading(false);
    if (r.error) setError(r.error);
    else setItems(r.data ?? []);
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setForm({ text: '', type: 'info', enabled: false, dismissible: true, ctaText: '', ctaUrl: '', startsAt: '', endsAt: '' });
    setEditing('new');
  }

  function openEdit(item) {
    setForm({ ...item, startsAt: item.startsAt ? item.startsAt.slice(0,16) : '', endsAt: item.endsAt ? item.endsAt.slice(0,16) : '' });
    setEditing(item.id);
  }

  async function save() {
    setSaving(true); setError(null);
    const payload = {
      ...form,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      endsAt:   form.endsAt   ? new Date(form.endsAt).toISOString()   : null,
    };
    let r;
    if (editing === 'new') {
      r = await createAnnouncement(payload, auth.user?.uid);
    } else {
      r = await updateAnnouncement(editing, payload, auth.user?.uid);
    }
    setSaving(false);
    if (r.error) { setError(r.error); return; }
    setEditing(null);
    setForm(null);
    load();
  }

  async function remove(id) {
    if (!window.confirm('Delete this announcement?')) return;
    const r = await deleteAnnouncement(id);
    if (r.error) { setError(r.error); return; }
    setItems(prev => prev.filter(i => i.id !== id));
  }

  async function quickToggle(item) {
    const r = await updateAnnouncement(item.id, { enabled: !item.enabled }, auth.user?.uid);
    if (r.error) { setError(r.error); return; }
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, enabled: !i.enabled } : i));
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <AdminLayout title="Announcements" requiredRole="editor">
      <ErrorBanner message={error} />

      {editing ? (
        /* ── Edit / New form ── */
        <div style={{ maxWidth: 720 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <button onClick={() => { setEditing(null); setForm(null); }} style={{ background: 'none', border: 'none', color: '#9fb3d4', cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>←</button>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 700, color: '#e8f0ff', margin: 0 }}>
              {editing === 'new' ? 'New Announcement' : 'Edit Announcement'}
            </h2>
          </div>

          <div style={{ display: 'grid', gap: 16 }}>
            <AdminCard>
              <TextArea label="Announcement text" rows={3} value={form.text ?? ''} onChange={e => set('text', e.target.value)} />
              <label style={{ display: 'block', marginBottom: 14 }}>
                <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#9fb3d4', marginBottom: 6 }}>Type</span>
                <select value={form.type ?? 'info'} onChange={e => set('type', e.target.value)}
                  style={{ background: '#080d1a', border: '1px solid #2a3d5c', borderRadius: 8, padding: '10px 12px', color: '#e8f0ff', fontSize: 14, width: '100%' }}>
                  <option value="info">ℹ️ Info</option>
                  <option value="warning">⚠️ Warning</option>
                  <option value="success">✅ Success</option>
                  <option value="promo">🎉 Promo</option>
                </select>
              </label>

              {/* Preview */}
              {form.text && (
                <div style={{
                  background: TYPE_COLORS[form.type]?.bg ?? TYPE_COLORS.info.bg,
                  border: `1px solid ${TYPE_COLORS[form.type]?.fg ?? '#14FFF4'}40`,
                  borderRadius: 8, padding: '10px 16px', fontSize: 13.5,
                  color: TYPE_COLORS[form.type]?.fg ?? '#14FFF4', marginBottom: 14,
                }}>
                  {form.text} {form.ctaText && <a style={{ textDecoration: 'underline', color: 'inherit', marginLeft: 8 }}>{form.ctaText}</a>}
                </div>
              )}
            </AdminCard>

            <AdminCard>
              <p style={{ fontSize: 12.5, fontWeight: 700, color: '#9fb3d4', marginBottom: 12, textTransform: 'uppercase' }}>CTA (optional)</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <TextInput label="CTA button text" value={form.ctaText ?? ''} onChange={e => set('ctaText', e.target.value)} />
                <TextInput label="CTA URL" value={form.ctaUrl ?? ''} onChange={e => set('ctaUrl', e.target.value)} />
              </div>
            </AdminCard>

            <AdminCard>
              <p style={{ fontSize: 12.5, fontWeight: 700, color: '#9fb3d4', marginBottom: 12, textTransform: 'uppercase' }}>Scheduling & Visibility</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <label style={{ display: 'block' }}>
                  <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#9fb3d4', marginBottom: 6 }}>Start date/time (optional)</span>
                  <input type="datetime-local" value={form.startsAt ?? ''} onChange={e => set('startsAt', e.target.value)}
                    style={{ width: '100%', background: '#080d1a', border: '1px solid #2a3d5c', borderRadius: 8, padding: '10px 12px', color: '#e8f0ff', fontSize: 13, colorScheme: 'dark' }} />
                </label>
                <label style={{ display: 'block' }}>
                  <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#9fb3d4', marginBottom: 6 }}>End date/time (optional)</span>
                  <input type="datetime-local" value={form.endsAt ?? ''} onChange={e => set('endsAt', e.target.value)}
                    style={{ width: '100%', background: '#080d1a', border: '1px solid #2a3d5c', borderRadius: 8, padding: '10px 12px', color: '#e8f0ff', fontSize: 13, colorScheme: 'dark' }} />
                </label>
              </div>
              <ToggleRow label="Enabled" description="Show this announcement on the site." value={form.enabled} onChange={v => set('enabled', v)} />
              <ToggleRow label="Dismissible" description="Allow visitors to close the banner." value={form.dismissible} onChange={v => set('dismissible', v)} />
            </AdminCard>
          </div>

          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Announcement'}</Button>
            <Button variant="secondary" onClick={() => { setEditing(null); setForm(null); }}>Cancel</Button>
          </div>
        </div>
      ) : (
        /* ── List view ── */
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <p style={{ color: '#6b82a8', fontSize: 13 }}>Only one announcement is shown at a time (the most recently created enabled one).</p>
            <Button onClick={openNew}>+ New Announcement</Button>
          </div>

          {loading && <p style={{ color: '#6b82a8', fontSize: 14 }}>Loading…</p>}

          {!loading && items.length === 0 && (
            <AdminCard style={{ textAlign: 'center', padding: '48px 20px' }}>
              <p style={{ color: '#9fb3d4', fontSize: 14, marginBottom: 6 }}>No announcements yet.</p>
              <p style={{ color: '#6b82a8', fontSize: 12.5 }}>Create one to show a banner at the top of your site.</p>
            </AdminCard>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map(item => {
              const tc = TYPE_COLORS[item.type] ?? TYPE_COLORS.info;
              return (
                <AdminCard key={item.id} style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ background: tc.bg, color: tc.fg, fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase' }}>{item.type}</span>
                        {item.enabled
                          ? <span style={{ background: 'rgba(0,208,132,0.12)', color: '#00d084', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase' }}>Live</span>
                          : <span style={{ background: 'rgba(100,120,150,0.12)', color: '#6b82a8', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase' }}>Off</span>
                        }
                        {item.dismissible && <span style={{ color: '#6b82a8', fontSize: 11 }}>dismissible</span>}
                      </div>
                      <p style={{ fontSize: 13.5, color: '#e8f0ff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.text || <em style={{ color: '#4a5d7a' }}>No text</em>}</p>
                      {(item.startsAt || item.endsAt) && (
                        <p style={{ fontSize: 11.5, color: '#6b82a8', marginTop: 4 }}>
                          {item.startsAt ? `From ${new Date(item.startsAt).toLocaleDateString()}` : ''}{item.endsAt ? ` → ${new Date(item.endsAt).toLocaleDateString()}` : ''}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => quickToggle(item)} style={{
                        background: item.enabled ? 'rgba(255,80,80,0.1)' : 'rgba(0,208,132,0.1)',
                        border: 'none', borderRadius: 6, padding: '5px 11px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        color: item.enabled ? '#ff8080' : '#00d084',
                      }}>{item.enabled ? 'Disable' : 'Enable'}</button>
                      <button onClick={() => openEdit(item)} style={{ background: 'rgba(20,255,244,0.08)', border: '1px solid rgba(20,255,244,0.2)', color: '#14FFF4', borderRadius: 6, padding: '5px 11px', fontSize: 12, cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => remove(item.id)} style={{ background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', color: '#ff8080', borderRadius: 6, padding: '5px 11px', fontSize: 12, cursor: 'pointer' }}>Delete</button>
                    </div>
                  </div>
                </AdminCard>
              );
            })}
          </div>
        </div>
      )}
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
