// components/blog/blocks/ComparisonTableView.js
export default function ComparisonTableView({ block }) {
  const columns = block?.columns || [];
  const rows    = block?.rows    || [];
  if (!columns.length) return null;

  const hiCol = block.highlightColumn;

  return (
    <div style={{ margin: '32px 0' }}>
      {block.title && (
        <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 800, color: '#e8f0ff', marginBottom: 16 }}>
          {block.title}
        </h3>
      )}
      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #1a2d4a' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 14 }}>
          <thead>
            <tr>
              <th style={{ padding: '12px 16px', textAlign: 'left', background: '#080d1a', color: '#6b82a8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #1a2d4a' }}>
                —
              </th>
              {columns.map((col, i) => (
                <th key={i} style={{
                  padding: '12px 16px', textAlign: 'center',
                  background: hiCol === i ? 'rgba(20,255,244,0.08)' : '#080d1a',
                  borderBottom: `2px solid ${hiCol === i ? '#14FFF4' : '#1a2d4a'}`,
                  fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800,
                  color: hiCol === i ? '#14FFF4' : '#e8f0ff', fontSize: 13,
                  position: 'relative',
                }}>
                  {hiCol === i && (
                    <span style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)', background: '#14FFF4', color: '#080d1a', fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: '0 0 6px 6px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Best Value
                    </span>
                  )}
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} style={{ borderBottom: '1px solid rgba(26,45,74,0.5)', background: row.highlight ? 'rgba(20,255,244,0.03)' : 'transparent' }}>
                <td style={{ padding: '11px 16px', fontWeight: row.highlight ? 700 : 400, color: row.highlight ? '#e8f0ff' : '#9fb3d4', fontSize: 13 }}>
                  {row.label}
                </td>
                {(row.values || []).map((val, ci) => (
                  <td key={ci} style={{
                    padding: '11px 16px', textAlign: 'center', fontSize: 13,
                    color: hiCol === ci ? '#14FFF4' : '#9fb3d4',
                    background: hiCol === ci ? 'rgba(20,255,244,0.04)' : 'transparent',
                    fontWeight: hiCol === ci ? 600 : 400,
                  }}>
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
