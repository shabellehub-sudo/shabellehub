// components/admin/blocks/CalloutBlock.js
const TYPES = [
  { value: 'info',    label: 'ℹ Info',    color: '20,255,244' },
  { value: 'success', label: '✅ Success', color: '0,208,132' },
  { value: 'warning', label: '⚠ Warning', color: '255,193,71' },
  { value: 'danger',  label: '🚨 Danger',  color: '255,77,109' },
];
const inp = {
  width: '100%', boxSizing: 'border-box',
  background: '#080d1a', border: '1px solid #1a2d4a', borderRadius: 8,
  padding: '9px 12px', fontSize: 13, color: '#e8f0ff', outline: 'none',
  fontFamily: 'Inter, sans-serif',
};

export default function CalloutBlock({ block, onChange }) {
  function update(key, val) { onChange({ ...block, [key]: val }); }
  const current = TYPES.find(t => t.value === block.type) || TYPES[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {TYPES.map(t => (
          <button key={t.value} type="button"
            onClick={() => update('type', t.value)}
            style={{
              padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: block.type === t.value ? `1px solid rgb(${t.color})` : '1px solid #1a2d4a',
              background: block.type === t.value ? `rgba(${t.color},0.1)` : 'transparent',
              color: block.type === t.value ? `rgb(${t.color})` : '#6b82a8',
            }}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={{
        background: `rgba(${current.color},0.06)`,
        border: `1px solid rgba(${current.color},0.25)`,
        borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <input style={inp} value={block.title || ''} onChange={e => update('title', e.target.value)} placeholder="Callout heading (optional)…" />
        <textarea
          style={{ ...inp, resize: 'vertical' }}
          rows={3}
          value={block.text || ''}
          onChange={e => update('text', e.target.value)}
          placeholder="Callout body text…"
        />
      </div>
    </div>
  );
}
