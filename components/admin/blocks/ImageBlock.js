// components/admin/blocks/ImageBlock.js
import { useState } from 'react';
import MediaPicker from '../MediaPicker';
import ImageUploader from '../ImageUploader';

const ALIGNMENTS = ['left', 'center', 'right'];
const WIDTHS     = ['normal', 'wide', 'full'];

const fieldStyle = {
  width: '100%', boxSizing: 'border-box',
  background: '#080d1a', border: '1px solid #1a2d4a', borderRadius: 8,
  padding: '8px 12px', fontSize: 13, color: '#e8f0ff', outline: 'none',
  fontFamily: 'Inter, sans-serif',
};

const chipBtn = (active) => ({
  padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
  border: active ? '1px solid #14FFF4' : '1px solid #1a2d4a',
  background: active ? 'rgba(20,255,244,0.1)' : 'transparent',
  color: active ? '#14FFF4' : '#6b82a8',
});

const label = (text) => (
  <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b82a8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }}>
    {text}
  </span>
);

export default function ImageBlock({ block, onChange }) {
  const [pickerOpen, setPickerOpen] = useState(false);

  function set(key, val) { onChange({ ...block, [key]: val }); }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* URL row */}
      <div>
        {label('Image URL')}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            style={{ ...fieldStyle, flex: 1 }}
            value={block.url || ''}
            onChange={e => set('url', e.target.value)}
            placeholder="https://… or pick from library"
          />
          <button type="button" onClick={() => setPickerOpen(true)} style={{
            padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            background: 'rgba(20,255,244,0.08)', border: '1px solid rgba(20,255,244,0.2)',
            color: '#14FFF4', cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            Library
          </button>
        </div>
      </div>

      {/* Upload or preview */}
      {!block.url ? (
        <ImageUploader
          compact
          label="Or upload new image"
          onUploaded={media => media && set('url', media.public_url)}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={block.url} alt={block.alt || ''} style={{ maxHeight: 180, borderRadius: 8, objectFit: 'cover', maxWidth: '100%' }} />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          {label('Alt Text')}
          <input style={fieldStyle} value={block.alt || ''} onChange={e => set('alt', e.target.value)} placeholder="Describe the image…" />
        </div>
        <div>
          {label('Caption')}
          <input style={fieldStyle} value={block.caption || ''} onChange={e => set('caption', e.target.value)} placeholder="Optional caption…" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div>
          {label('Alignment')}
          <div style={{ display: 'flex', gap: 6 }}>
            {ALIGNMENTS.map(a => (
              <button key={a} type="button" style={chipBtn(block.alignment === a)} onClick={() => set('alignment', a)}>{a}</button>
            ))}
          </div>
        </div>
        <div>
          {label('Width')}
          <div style={{ display: 'flex', gap: 6 }}>
            {WIDTHS.map(w => (
              <button key={w} type="button" style={chipBtn(block.width === w)} onClick={() => set('width', w)}>{w}</button>
            ))}
          </div>
        </div>
      </div>

      {pickerOpen && (
        <MediaPicker
          currentUrl={block.url}
          onSelect={({ url, alt }) => { set('url', url); if (!block.alt && alt) set('alt', alt); setPickerOpen(false); }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
