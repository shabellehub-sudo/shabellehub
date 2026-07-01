// pages/admin/navigation.js — Phase 4: Navigation CMS
// Drag-and-drop reordering uses HTML5 drag events (no extra dependencies)
import { useEffect, useState, useRef } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { AdminCard, Button, TextInput, ErrorBanner } from '../../components/admin/ui';
import { getNavigation, updateNavigation, sortNavItems } from '../../lib/cms/navigation';
import { useAuth } from '../../lib/cms/useAuth';

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

export default function NavigationCMS() {
  const auth    = useAuth();
  const [items,  setItems]  = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState(null);
  const [editing, setEditing] = useState(null); // id of item being edited inline
  const dragFrom = useRef(null);

  useEffect(() => {
    getNavigation().then(r => {
      if (r.error) setError(r.error);
      else setItems(sortNavItems(r.data?.items ?? []));
    });
  }, []);

  async function save(updatedItems) {
    const list = updatedItems ?? items;
    setSaving(true); setSaved(false); setError(null);
    const r = await updateNavigation({ items: list }, auth.user?.uid);
    setSaving(false);
    if (r.error) { setError(r.error); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function updateItem(id, patch) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it));
  }

  function removeItem(id) {
    setItems(prev => prev.filter(it => it.id !== id));
  }

  function addItem() {
    const newItem = {
      id: genId(), label: 'New Link', url: '/', enabled: true, openInNewTab: false,
      order: (items?.length ?? 0),
    };
    setItems(prev => [...(prev ?? []), newItem]);
    setEditing(newItem.id);
  }

  // ── Drag reorder ────────────────────────────────────────────────────────────
  function onDragStart(idx) { dragFrom.current = idx; }
  function onDragOver(e, idx) {
    e.preventDefault();
    if (dragFrom.current === null || dragFrom.current === idx) return;
    const next = [...items];
    const [moved] = next.splice(dragFrom.current, 1);
    next.splice(idx, 0, moved);
    const reordered = next.map((it, i) => ({ ...it, order: i }));
    dragFrom.current = idx;
    setItems(reordered);
  }
  function onDragEnd() { dragFrom.current = null; }

  if (!items) {
    return <AdminLayout title="Navigation CMS"><p style={{ color: '#6b82a8', fontSize: 14 }}>{error || 'Loading…'}</p></AdminLayout>;
  }

  return (
    <AdminLayout title="Navigation CMS" requiredRole="editor">
      <ErrorBanner message={error} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <p style={{ color: '#6b82a8', fontSize: 13 }}>
          Drag rows to reorder. Changes apply to the site header navigation.
        </p>
        <Button variant="secondary" onClick={addItem}>+ Add Item</Button>
      </div>

      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr 80px 80px 90px', gap: 10, padding: '6px 16px', fontSize: 11, fontWeight: 700, color: '#6b82a8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
        <span></span>
        <span>Label</span>
        <span>URL</span>
        <span>New Tab</span>
        <span>Enabled</span>
        <span></span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item, idx) => (
          <div key={item.id}
            draggable
            onDragStart={() => onDragStart(idx)}
            onDragOver={e => onDragOver(e, idx)}
            onDragEnd={onDragEnd}
            style={{ background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 10, padding: '12px 16px', cursor: 'grab', transition: 'border-color 0.1s' }}
          >
            {editing === item.id ? (
              /* Expanded edit form */
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <TextInput label="Label" value={item.label} onChange={e => updateItem(item.id, { label: e.target.value })} style={{ marginBottom: 0 }} />
                  <TextInput label="URL" value={item.url} onChange={e => updateItem(item.id, { url: e.target.value })} style={{ marginBottom: 0 }} />
                </div>
                <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 12 }}>
                  <Toggle label="Open in new tab" value={item.openInNewTab} onChange={v => updateItem(item.id, { openInNewTab: v })} />
                  <Toggle label="Enabled" value={item.enabled} onChange={v => updateItem(item.id, { enabled: v })} />
                </div>
                <Button variant="secondary" onClick={() => setEditing(null)} style={{ fontSize: 12, padding: '6px 14px' }}>Done</Button>
              </div>
            ) : (
              /* Collapsed row */
              <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr 80px 80px 90px', gap: 10, alignItems: 'center' }}>
                <span style={{ color: '#3d5470', fontSize: 16, userSelect: 'none' }}>⠿</span>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: item.enabled ? '#e8f0ff' : '#4a5d7a' }}>{item.label || <em style={{ color: '#4a5d7a' }}>Untitled</em>}</span>
                <span style={{ fontSize: 12.5, color: '#6b82a8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.url}</span>
                <span style={{ fontSize: 12, color: item.openInNewTab ? '#14FFF4' : '#3d5470' }}>{item.openInNewTab ? '✓' : '—'}</span>
                <span>
                  <EnabledPill enabled={item.enabled} onClick={() => updateItem(item.id, { enabled: !item.enabled })} />
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setEditing(item.id)} style={{ background: 'rgba(20,255,244,0.08)', border: '1px solid rgba(20,255,244,0.2)', color: '#14FFF4', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => removeItem(item.id)} style={{ background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', color: '#ff8080', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>✕</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <AdminCard style={{ textAlign: 'center', padding: '36px 20px' }}>
          <p style={{ color: '#6b82a8', fontSize: 14 }}>No navigation items. Add your first item above.</p>
        </AdminCard>
      )}

      {/* Save bar */}
      <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
        <Button onClick={() => save()} disabled={saving}>{saving ? 'Saving…' : 'Save Navigation'}</Button>
        {saved && <span style={{ color: '#00d084', fontSize: 13, fontWeight: 600 }}>✓ Saved</span>}
      </div>
    </AdminLayout>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
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
      <span style={{ fontSize: 13, color: '#9fb3d4' }}>{label}</span>
    </label>
  );
}

function EnabledPill({ enabled, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: enabled ? 'rgba(0,208,132,0.12)' : 'rgba(100,120,150,0.12)',
      color: enabled ? '#00d084' : '#6b82a8',
      border: 'none', borderRadius: 5, padding: '3px 9px', fontSize: 11.5,
      fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.3,
    }}>
      {enabled ? 'Live' : 'Off'}
    </button>
  );
}
