// components/blog/blocks/CalloutBlockView.js
const CALLOUT_STYLES = {
  info:    { color: '20,255,244',  icon: 'ℹ️' },
  success: { color: '0,208,132',   icon: '✅' },
  warning: { color: '255,193,71',  icon: '⚠️' },
  danger:  { color: '255,77,109',  icon: '🚨' },
};

export default function CalloutBlockView({ block }) {
  if (!block?.text && !block?.title) return null;
  const s = CALLOUT_STYLES[block.type] || CALLOUT_STYLES.info;

  return (
    <div style={{
      margin: '28px 0',
      background: `rgba(${s.color},0.06)`,
      border: `1px solid rgba(${s.color},0.3)`,
      borderRadius: 10,
      padding: '16px 20px',
      display: 'flex',
      gap: 14,
    }}>
      <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1.4 }} aria-hidden="true">{s.icon}</span>
      <div>
        {block.title && (
          <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: `rgb(${s.color})`, fontSize: 14, marginBottom: 6 }}>
            {block.title}
          </p>
        )}
        {block.text && (
          <p style={{ color: '#9fb3d4', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
            {block.text}
          </p>
        )}
      </div>
    </div>
  );
}
