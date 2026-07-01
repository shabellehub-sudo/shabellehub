// ─── SHARED ADMIN UI PRIMITIVES ──────────────────────────────────────────────

export function AdminCard({ children, style = {} }) {
  return (
    <div style={{ background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 12, padding: 20, ...style }}>
      {children}
    </div>
  );
}

export function StatCard({ label, value, accent = '#14FFF4' }) {
  return (
    <AdminCard style={{ minWidth: 140 }}>
      <div style={{ fontSize: 12, color: '#6b82a8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 800, color: accent }}>{value}</div>
    </AdminCard>
  );
}

export function StatusBadge({ status }) {
  const colors = {
    published: { bg: 'rgba(0,208,132,0.12)', fg: '#00d084' },
    draft: { bg: 'rgba(155,165,190,0.12)', fg: '#9fb3d4' },
    scheduled: { bg: 'rgba(255,193,71,0.12)', fg: '#ffc147' },
    unpublished: { bg: 'rgba(255,80,80,0.12)', fg: '#ff8080' },
  };
  const c = colors[status] || colors.draft;
  return (
    <span style={{
      background: c.bg, color: c.fg, fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
      padding: '3px 8px', borderRadius: 5, letterSpacing: 0.4,
    }}>
      {status}
    </span>
  );
}

export function Button({ children, variant = 'primary', ...props }) {
  const variants = {
    primary: { background: '#14FFF4', color: '#080d1a', border: 'none' },
    secondary: { background: 'transparent', color: '#e8f0ff', border: '1px solid #2a3d5c' },
    danger: { background: 'rgba(255,80,80,0.12)', color: '#ff8080', border: '1px solid rgba(255,80,80,0.3)' },
  };
  return (
    <button
      {...props}
      style={{
        ...variants[variant],
        padding: '9px 16px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer',
        ...(props.style || {}),
      }}
    >
      {children}
    </button>
  );
}

export function TextInput({ label, ...props }) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      {label && <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#9fb3d4', marginBottom: 6 }}>{label}</span>}
      <input
        {...props}
        style={{
          width: '100%', background: '#080d1a', border: '1px solid #2a3d5c', borderRadius: 8,
          padding: '10px 12px', color: '#e8f0ff', fontSize: 14, ...(props.style || {}),
        }}
      />
    </label>
  );
}

export function TextArea({ label, ...props }) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      {label && <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#9fb3d4', marginBottom: 6 }}>{label}</span>}
      <textarea
        {...props}
        style={{
          width: '100%', background: '#080d1a', border: '1px solid #2a3d5c', borderRadius: 8,
          padding: '10px 12px', color: '#e8f0ff', fontSize: 14, fontFamily: 'inherit', resize: 'vertical',
          ...(props.style || {}),
        }}
      />
    </label>
  );
}

export function Select({ label, children, ...props }) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      {label && <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#9fb3d4', marginBottom: 6 }}>{label}</span>}
      <select
        {...props}
        style={{
          width: '100%', background: '#080d1a', border: '1px solid #2a3d5c', borderRadius: 8,
          padding: '10px 12px', color: '#e8f0ff', fontSize: 14, ...(props.style || {}),
        }}
      >
        {children}
      </select>
    </label>
  );
}

export function EmptyState({ message, sub }) {
  return (
    <AdminCard style={{ textAlign: 'center', padding: '48px 20px' }}>
      <p style={{ color: '#9fb3d4', fontSize: 14, marginBottom: sub ? 6 : 0 }}>{message}</p>
      {sub && <p style={{ color: '#6b82a8', fontSize: 12.5 }}>{sub}</p>}
    </AdminCard>
  );
}

export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: 8, padding: '10px 14px', color: '#ff8080', fontSize: 13, marginBottom: 16 }}>
      {message}
    </div>
  );
}
