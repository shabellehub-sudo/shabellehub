// components/blog/blocks/TableBlockView.js
export default function TableBlockView({ block }) {
  const headers = block?.headers || [];
  const rows    = block?.rows    || [];
  if (!headers.length && !rows.length) return null;

  return (
    <div style={{ overflowX: 'auto', margin: '28px 0' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 14 }}>
        {block.hasHeader !== false && headers.length > 0 && (
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i} style={{
                  padding: '10px 14px', textAlign: 'left',
                  background: '#0f1829', borderBottom: '2px solid #1a2d4a',
                  fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#e8f0ff', fontSize: 13,
                  whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: '1px solid #1a2d4a', background: ri % 2 === 0 ? 'transparent' : 'rgba(26,45,74,0.3)' }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{ padding: '10px 14px', color: '#9fb3d4', verticalAlign: 'top' }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
