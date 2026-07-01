// components/admin/blocks/HeadingBlock.js
const LEVELS = [1, 2, 3, 4];

export default function HeadingBlock({ block, onChange }) {
  const S = {
    row: { display: 'flex', gap: 10, alignItems: 'center' },
    levelBtn: (active) => ({
      padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer',
      border: active ? '1px solid #14FFF4' : '1px solid #1a2d4a',
      background: active ? 'rgba(20,255,244,0.1)' : 'transparent',
      color: active ? '#14FFF4' : '#6b82a8',
    }),
    input: {
      flex: 1, background: '#080d1a', border: '1px solid #1a2d4a', borderRadius: 8,
      padding: '10px 12px', fontSize: 14, color: '#e8f0ff',
      fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, outline: 'none',
    },
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {LEVELS.map(l => (
          <button
            key={l} type="button"
            style={S.levelBtn(block.level === l)}
            onClick={() => onChange({ ...block, level: l })}
          >
            H{l}
          </button>
        ))}
      </div>
      <input
        style={S.input}
        value={block.text || ''}
        onChange={e => onChange({ ...block, text: e.target.value })}
        placeholder={`Heading ${block.level || 2}…`}
      />
    </div>
  );
}
