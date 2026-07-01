// components/admin/MediaPicker.js
// Modal picker: browse existing media, search, upload new, return selected URL.
// Reuses lib/cms/media.js — no new Firebase calls.

import { useState, useEffect, useRef, useCallback } from 'react';
import { listMedia, uploadMedia } from '../../lib/cms/media';
import { useAuth } from '../../lib/cms/useAuth';

const S = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(8,13,26,0.88)',
    zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 20,
  },
  modal: {
    background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 14,
    width: '100%', maxWidth: 860, maxHeight: '85vh',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px', borderBottom: '1px solid #1a2d4a', flexShrink: 0,
  },
  searchRow: {
    display: 'flex', gap: 10, padding: '12px 20px', borderBottom: '1px solid #1a2d4a',
    flexShrink: 0, flexWrap: 'wrap',
  },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: 10, padding: 20, overflowY: 'auto', flex: 1,
  },
  thumb: (selected) => ({
    borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
    border: selected ? '2px solid #14FFF4' : '2px solid transparent',
    background: '#080d1a', transition: 'border-color 0.12s',
    position: 'relative',
  }),
  footer: {
    display: 'flex', gap: 10, padding: '14px 20px',
    borderTop: '1px solid #1a2d4a', justifyContent: 'flex-end', flexShrink: 0,
  },
  btn: (v) => {
    const map = {
      primary:   { background: '#14FFF4', color: '#080d1a', border: 'none' },
      secondary: { background: 'transparent', color: '#e8f0ff', border: '1px solid #2a3d5c' },
    };
    return {
      ...map[v || 'secondary'], padding: '8px 18px', borderRadius: 8,
      fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
    };
  },
  input: {
    background: '#080d1a', border: '1px solid #2a3d5c', borderRadius: 8,
    padding: '8px 12px', fontSize: 13, color: '#e8f0ff', fontFamily: 'Inter, sans-serif',
    outline: 'none',
  },
};

export default function MediaPicker({ onSelect, onClose, currentUrl = '' }) {
  const auth     = useAuth();
  const [items,     setItems]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [selected,  setSelected]  = useState(null); // { id, public_url, alt_text }
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState(null);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: e } = await listMedia({ search: search || undefined, limit: 120 });
    setItems(data || []);
    if (e) setError(e);
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  // Keyboard: Escape closes
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError(null);
    const { data, error: uploadErr } = await uploadMedia(file, { userId: auth.user?.uid });
    setUploading(false);
    e.target.value = '';
    if (uploadErr) { setError(uploadErr); return; }
    setSelected(data);
    load();
  }

  function handleConfirm() {
    if (!selected) return;
    onSelect({ url: selected.public_url, alt: selected.alt_text || '', id: selected.id });
  }

  // Pre-select the item that matches the current URL
  useEffect(() => {
    if (currentUrl && items.length) {
      const match = items.find(i => i.public_url === currentUrl);
      if (match) setSelected(match);
    }
  }, [currentUrl, items]);

  return (
    <div style={S.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={S.modal}>
        <div style={S.header}>
          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 15, fontWeight: 700, color: '#e8f0ff' }}>
            Media Library
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b82a8', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        <div style={S.searchRow}>
          <input
            style={{ ...S.input, flex: 1, minWidth: 200 }}
            placeholder="Search by filename…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button style={S.btn('secondary')} onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? 'Uploading…' : '+ Upload'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
        </div>

        {error && (
          <div style={{ padding: '8px 20px', color: '#ff8080', fontSize: 12 }}>{error}</div>
        )}

        <div style={S.grid}>
          {loading ? (
            <p style={{ color: '#6b82a8', fontSize: 13, gridColumn: '1/-1' }}>Loading…</p>
          ) : items.length === 0 ? (
            <p style={{ color: '#6b82a8', fontSize: 13, gridColumn: '1/-1' }}>No media found.</p>
          ) : items.map(item => (
            <div
              key={item.id}
              style={S.thumb(selected?.id === item.id)}
              onClick={() => setSelected(item)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.public_url}
                alt={item.alt_text || item.file_name}
                style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
              />
              {selected?.id === item.id && (
                <div style={{
                  position: 'absolute', top: 4, right: 4,
                  background: '#14FFF4', color: '#080d1a',
                  borderRadius: '50%', width: 20, height: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800,
                }}>✓</div>
              )}
              <div style={{ padding: '6px 8px', fontSize: 10, color: '#6b82a8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.file_name}
              </div>
            </div>
          ))}
        </div>

        <div style={S.footer}>
          {selected && (
            <span style={{ fontSize: 12, color: '#9fb3d4', alignSelf: 'center', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Selected: {selected.file_name || selected.public_url}
            </span>
          )}
          <button style={S.btn('secondary')} onClick={onClose}>Cancel</button>
          <button style={S.btn('primary')} onClick={handleConfirm} disabled={!selected}>
            Insert Image
          </button>
        </div>
      </div>
    </div>
  );
}
