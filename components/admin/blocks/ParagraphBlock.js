// components/admin/blocks/ParagraphBlock.js
export default function ParagraphBlock({ block, onChange }) {
  return (
    <textarea
      value={block.text || ''}
      onChange={e => onChange({ ...block, text: e.target.value })}
      placeholder="Write your paragraph…"
      rows={4}
      style={{
        width: '100%', boxSizing: 'border-box', resize: 'vertical',
        background: '#080d1a', border: '1px solid #1a2d4a', borderRadius: 8,
        padding: '10px 12px', fontSize: 14, color: '#e8f0ff', lineHeight: 1.7,
        fontFamily: 'Inter, sans-serif', outline: 'none',
      }}
    />
  );
}
