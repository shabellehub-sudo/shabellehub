// components/admin/blocks/QuoteBlock.js
const inp = {
  width: '100%', boxSizing: 'border-box',
  background: '#080d1a', border: '1px solid #1a2d4a', borderRadius: 8,
  padding: '9px 12px', fontSize: 13, color: '#e8f0ff', outline: 'none',
  fontFamily: 'Inter, sans-serif',
};

export default function QuoteBlock({ block, onChange }) {
  function update(key, val) { onChange({ ...block, [key]: val }); }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <textarea
        rows={3}
        style={{ ...inp, resize: 'vertical', lineHeight: 1.6, fontStyle: 'italic' }}
        value={block.text || ''}
        onChange={e => update('text', e.target.value)}
        placeholder="Quote text…"
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <input style={inp} value={block.author || ''} onChange={e => update('author', e.target.value)} placeholder="Author name…" />
        <input style={inp} value={block.source || ''} onChange={e => update('source', e.target.value)} placeholder="Source (optional URL or publication)…" />
      </div>
    </div>
  );
}
