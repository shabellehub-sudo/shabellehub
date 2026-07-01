// components/admin/blocks/TableBlock.js
const cellStyle = {
  background: '#080d1a', border: '1px solid #1a2d4a', borderRadius: 4,
  padding: '6px 8px', fontSize: 12, color: '#e8f0ff', outline: 'none',
  fontFamily: 'Inter, sans-serif', width: '100%', boxSizing: 'border-box',
};

export default function TableBlock({ block, onChange }) {
  const headers = block.headers || ['Column 1'];
  const rows    = block.rows    || [['']];

  function update(key, val) { onChange({ ...block, [key]: val }); }

  function setHeader(i, val) {
    const next = [...headers]; next[i] = val; update('headers', next);
  }
  function setCell(r, c, val) {
    const next = rows.map((row, ri) =>
      ri === r ? row.map((cell, ci) => ci === c ? val : cell) : row
    );
    update('rows', next);
  }
  function addColumn() {
    update('headers', [...headers, `Column ${headers.length + 1}`]);
    update('rows', rows.map(r => [...r, '']));
  }
  function removeColumn(i) {
    if (headers.length <= 1) return;
    update('headers', headers.filter((_, ci) => ci !== i));
    update('rows', rows.map(r => r.filter((_, ci) => ci !== i)));
  }
  function addRow() {
    update('rows', [...rows, headers.map(() => '')]);
  }
  function removeRow(i) {
    if (rows.length <= 1) return;
    update('rows', rows.filter((_, ri) => ri !== i));
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, color: '#9fb3d4', cursor: 'pointer' }}>
          <input
            type="checkbox" checked={block.hasHeader ?? true}
            onChange={e => update('hasHeader', e.target.checked)}
            style={{ accentColor: '#14FFF4' }}
          />
          Header row
        </label>
        <button type="button" onClick={addColumn} style={{ padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'rgba(20,255,244,0.08)', border: '1px solid rgba(20,255,244,0.2)', color: '#14FFF4', cursor: 'pointer' }}>+ Col</button>
        <button type="button" onClick={addRow}    style={{ padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'rgba(20,255,244,0.08)', border: '1px solid rgba(20,255,244,0.2)', color: '#14FFF4', cursor: 'pointer' }}>+ Row</button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: headers.length * 120 }}>
          {block.hasHeader !== false && (
            <thead>
              <tr>
                {headers.map((h, i) => (
                  <th key={i} style={{ padding: '4px 4px 8px' }}>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <input style={{ ...cellStyle, fontWeight: 700, color: '#14FFF4' }} value={h} onChange={e => setHeader(i, e.target.value)} placeholder={`Col ${i+1}`} />
                      {headers.length > 1 && (
                        <button type="button" onClick={() => removeColumn(i)} style={{ background: 'none', border: 'none', color: '#ff4d6d', cursor: 'pointer', fontSize: 14, flexShrink: 0 }}>×</button>
                      )}
                    </div>
                  </th>
                ))}
                <th style={{ width: 24 }} />
              </tr>
            </thead>
          )}
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci} style={{ padding: '4px' }}>
                    <input style={cellStyle} value={cell} onChange={e => setCell(ri, ci, e.target.value)} placeholder="…" />
                  </td>
                ))}
                <td style={{ width: 24, verticalAlign: 'middle' }}>
                  {rows.length > 1 && (
                    <button type="button" onClick={() => removeRow(ri)} style={{ background: 'none', border: 'none', color: '#ff4d6d', cursor: 'pointer', fontSize: 14 }}>×</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
