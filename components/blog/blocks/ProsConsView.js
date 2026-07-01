// components/blog/blocks/ProsConsView.js
export default function ProsConsView({ block }) {
  const pros = block?.pros?.filter(Boolean) || [];
  const cons = block?.cons?.filter(Boolean) || [];
  if (!pros.length && !cons.length) return null;

  return (
    <div style={{ margin: '28px 0' }}>
      {block?.title && (
        <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 17, fontWeight: 700, color: '#e8f0ff', marginBottom: 14 }}>
          {block.title}
        </h3>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
        {pros.length > 0 && (
          <div style={{ background: '#0f1829', border: '1px solid rgba(0,208,132,0.25)', borderRadius: 12, padding: '18px 20px' }}>
            <h4 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, fontWeight: 700, color: '#00d084', marginBottom: 12 }}>
              ✅ Pros
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {pros.map((p, i) => (
                <li key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, color: '#e8f0ff', fontSize: 14, lineHeight: 1.6 }}>
                  <span style={{ color: '#00d084', flexShrink: 0, fontWeight: 700 }}>+</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        )}
        {cons.length > 0 && (
          <div style={{ background: '#0f1829', border: '1px solid rgba(255,77,109,0.25)', borderRadius: 12, padding: '18px 20px' }}>
            <h4 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, fontWeight: 700, color: '#ff4d6d', marginBottom: 12 }}>
              ❌ Cons
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {cons.map((c, i) => (
                <li key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, color: '#e8f0ff', fontSize: 14, lineHeight: 1.6 }}>
                  <span style={{ color: '#ff4d6d', flexShrink: 0, fontWeight: 700 }}>–</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
