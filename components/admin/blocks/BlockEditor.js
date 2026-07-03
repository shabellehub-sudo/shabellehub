// components/admin/blocks/ComparisonTableBlock.js
const inp = {
  background: '#080d1a', border: '1px solid #1a2d4a', borderRadius: 6,
  padding: '6px 8px', fontSize: 12, color: '#e8f0ff', outline: 'none',
  fontFamily: 'Inter, sans-serif', width: '100%', boxSizing: 'border-box',
};
const btn = (accent) => ({
  padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
  background: `rgba(${accent},0.08)`, border: `1px solid rgba(${accent},0.25)`,
  color: `rgb(${accent})`,
});

export default function ComparisonTableBlock({ block, onChange }) {
  const columns = block.columns || ['Tool', 'Feature', 'Price'];
  const rows    = block.rows    || [{ label: '', values: columns.map(() => ''), highlight: false }];

  function update(key, val) { onChange({ ...block, [key]: val }); }

  function setColumn(i, val) {
    const next = [...columns]; next[i] = val;
    update('columns', next);
  }
  function addColumn() {
    const next = [...columns, `Feature ${columns.length}`];
    update('columns', next);
    update('rows', rows.map(r => ({ ...r, values: [...r.values, ''] })));
  }
  function removeColumn(i) {
    if (columns.length <= 1) return;
    update('columns', columns.filter((_, ci) => ci !== i));
    update('rows', rows.map(r => ({ ...r, values: r.values.filter((_, ci) => ci !== i) })));
    if (block.highlightColumn === i) update('highlightColumn', null);
  }
  function addRow() {
    update('rows', [...rows, { label: '', values: columns.map(() => ''), highlight: false }]);
  }
  function removeRow(i) {
    update('rows', rows.filter((_, ri) => ri !== i));
  }
  function setRow(i, key, val) {
    update('rows', rows.map((r, ri) => ri === i ? { ...r, [key]: val } : r));
  }
  function setCell(ri, ci, val) {
    update('rows', rows.map((r, i) =>
      i === ri ? { ...r, values: r.values.map((v, j) => j === ci ? val : v) } : r
    ));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#6b82a8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Title</span>
        <input style={{ ...inp, marginTop: 5 }} value={block.title || ''} onChange={e => update('title', e.target.value)} placeholder="e.g. AI Writing Tools Comparison" />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" style={btn('20,255,244')} onClick={addColumn}>+ Column</button>
        <button type="button" style={btn('20,255,244')} onClick={addRow}>+ Row</button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ padding: '4px', fontSize: 11, color: '#6b82a8', textAlign: 'left', width: 130 }}>Label</th>
              {columns.map((col, i) => (
                <th key={i} style={{ padding: '4px' }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <input style={{ ...inp, fontWeight: 700 }} value={col} onChange={e => setColumn(i, e.target.value)} />
                    <button type="button" onClick={() => update('highlightColumn', block.highlightColumn === i ? null : i)}
                      title="Mark as best value"
                      style={{ background: 'none', border: 'none', fontSize: 14, cursor: 'pointer', color: block.highlightColumn === i ? '#ffc147' : '#3d5470' }}>★</button>
                    {columns.length > 1 && (
                      <button type="button" onClick={() => removeColumn(i)} style={{ background: 'none', border: 'none', color: '#ff4d6d', cursor: 'pointer', fontSize: 14, flexShrink: 0 }}>×</button>
                    )}
                  </div>
                </th>
              ))}
              <th style={{ width: 60, fontSize: 11, color: '#6b82a8' }}>Highlight</th>
              <th style={{ width: 24 }} />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} style={{ background: row.highlight ? 'rgba(20,255,244,0.03)' : 'transparent' }}>
                <td style={{ padding: '4px', minWidth: 130 }}>
                  <input style={{ ...inp, minWidth: 120 }} value={row.label || ''} onChange={e => setRow(ri, 'label', e.target.value)} placeholder="Row label" />
                </td>
                {(row.values || []).map((val, ci) => (
                  <td key={ci} style={{ padding: '4px' }}>
                    <input style={inp} value={val} onChange={e => setCell(ri, ci, e.target.value)} placeholder="…" />
                  </td>
                ))}
                <td style={{ textAlign: 'center', padding: '4px' }}>
                  <input type="checkbox" checked={!!row.highlight} onChange={e => setRow(ri, 'highlight', e.target.checked)} style={{ accentColor: '#14FFF4' }} />
                </td>
                <td>
                  <button type="button" onClick={() => removeRow(ri)} style={{ background: 'none', border: 'none', color: '#ff4d6d', cursor: 'pointer', fontSize: 14 }}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
    }
