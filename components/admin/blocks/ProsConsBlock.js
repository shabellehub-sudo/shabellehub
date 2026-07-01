// components/admin/blocks/ProsConsBlock.js
const inp = {
  flex: 1, background: '#080d1a', border: '1px solid #1a2d4a', borderRadius: 6,
  padding: '7px 10px', fontSize: 13, color: '#e8f0ff', outline: 'none',
  fontFamily: 'Inter, sans-serif',
};

function ListEditor({ items, onChange, addLabel, color }) {
  function set(i, val) { const n = [...items]; n[i] = val; onChange(n); }
  function remove(i)   { onChange(items.filter((_, j) => j !== i)); }
  function add()       { onChange([...items, '']); }

  return (
    <div>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
          <span style={{ color, fontSize: 14, fontWeight: 800, flexShrink: 0, width: 14 }}>
            {color === '#00d084' ? '+' : '–'}
          </span>
          <input style={inp} value={item} onChange={e => set(i, e.target.value)} placeholder={addLabel} />
          <button type="button" onClick={() => remove(i)} style={{ background: 'none', border: 'none', color: '#ff4d6d', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>×</button>
        </div>
      ))}
      <button type="button" onClick={add} style={{
        padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', marginTop: 2,
        background: `${color}18`, border: `1px solid ${color}44`, color,
      }}>
        + Add
      </button>
    </div>
  );
}

export default function ProsConsBlock({ block, onChange }) {
  function update(key, val) { onChange({ ...block, [key]: val }); }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#6b82a8', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 5 }}>Title (optional)</span>
        <input
          style={{ ...inp, flex: 'unset', width: '100%', boxSizing: 'border-box' }}
          value={block.title || ''}
          onChange={e => update('title', e.target.value)}
          placeholder="e.g. Jasper AI — Pros & Cons"
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#00d084', marginBottom: 8 }}>✅ Pros</span>
          <ListEditor items={block.pros || ['']} onChange={v => update('pros', v)} addLabel="Add a pro…" color="#00d084" />
        </div>
        <div>
          <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#ff4d6d', marginBottom: 8 }}>❌ Cons</span>
          <ListEditor items={block.cons || ['']} onChange={v => update('cons', v)} addLabel="Add a con…" color="#ff4d6d" />
        </div>
      </div>
    </div>
  );
}
