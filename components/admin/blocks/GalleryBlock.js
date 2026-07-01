// components/admin/blocks/GalleryBlock.js
import { useState } from 'react';
import MediaPicker from '../MediaPicker';

const fieldStyle = {
  width: '100%', boxSizing: 'border-box',
  background: '#080d1a', border: '1px solid #1a2d4a', borderRadius: 6,
  padding: '6px 10px', fontSize: 12, color: '#e8f0ff', outline: 'none',
  fontFamily: 'Inter, sans-serif',
};

export default function GalleryBlock({ block, onChange }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const images = block.images || [];

  function update(key, val) { onChange({ ...block, [key]: val }); }
  function updateImage(idx, key, val) {
    const next = images.map((img, i) => i === idx ? { ...img, [key]: val } : img);
    update('images', next);
  }
  function removeImage(idx) {
    update('images', images.filter((_, i) => i !== idx));
  }
  function addFromPicker({ url, alt }) {
    update('images', [...images, { url, alt: alt || '', caption: '' }]);
    setPickerOpen(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#9fb3d4' }}>
          Layout:
          <select value={block.layout || 'grid'} onChange={e => update('layout', e.target.value)} style={{ ...fieldStyle, width: 'auto' }}>
            <option value="grid">Grid</option>
            <option value="masonry">Masonry</option>
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#9fb3d4' }}>
          Columns:
          <select value={block.columns || 3} onChange={e => update('columns', Number(e.target.value))} style={{ ...fieldStyle, width: 'auto' }}>
            {[2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <button type="button" onClick={() => setPickerOpen(true)} style={{
          padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
          background: 'rgba(20,255,244,0.08)', border: '1px solid rgba(20,255,244,0.2)',
          color: '#14FFF4', cursor: 'pointer',
        }}>
          + Add Image
        </button>
      </div>

      {/* Images */}
      {images.length === 0 ? (
        <p style={{ fontSize: 12, color: '#3d5470' }}>No images yet. Click + Add Image.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
          {images.map((img, idx) => (
            <div key={idx} style={{ background: '#080d1a', border: '1px solid #1a2d4a', borderRadius: 8, overflow: 'hidden' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.alt || ''} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} />
              <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <input style={fieldStyle} value={img.alt || ''} onChange={e => updateImage(idx, 'alt', e.target.value)} placeholder="Alt text…" />
                <input style={fieldStyle} value={img.caption || ''} onChange={e => updateImage(idx, 'caption', e.target.value)} placeholder="Caption…" />
                <button type="button" onClick={() => removeImage(idx)} style={{ background: 'none', border: 'none', color: '#ff4d6d', fontSize: 11, cursor: 'pointer', textAlign: 'left', padding: 0 }}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pickerOpen && (
        <MediaPicker onSelect={addFromPicker} onClose={() => setPickerOpen(false)} />
      )}
    </div>
  );
}
