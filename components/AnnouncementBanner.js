// components/AnnouncementBanner.js
// Fetches the active announcement from the API and renders it.
// Mounted in _app.js above the main Layout.
import { useEffect, useState } from 'react';
import Link from 'next/link';

const TYPE_STYLES = {
  info:    { bg: '#0c2340', border: '#14FFF4', text: '#a8e8ff', accent: '#14FFF4' },
  warning: { bg: '#2a1f00', border: '#ffc147', text: '#ffe599', accent: '#ffc147' },
  success: { bg: '#002a1a', border: '#00d084', text: '#a0ffd4', accent: '#00d084' },
  promo:   { bg: '#1a0030', border: '#b464ff', text: '#ddb0ff', accent: '#b464ff' },
};

const DISMISSED_KEY = 'sh_dismissed_announcements';

function getDismissed() {
  if (typeof window === 'undefined') return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]'));
  } catch { return new Set(); }
}

function setDismissed(id) {
  if (typeof window === 'undefined') return;
  try {
    const set = getDismissed();
    set.add(id);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...set]));
  } catch {}
}

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch('/api/cms/announcement')
      .then(r => r.json())
      .then(({ data }) => {
        if (!data) return;
        const dismissed = getDismissed();
        if (dismissed.has(data.id)) return;
        setAnnouncement(data);
        setVisible(true);
      })
      .catch(() => {});
  }, []);

  function dismiss() {
    if (announcement?.dismissible) setDismissed(announcement.id);
    setVisible(false);
  }

  if (!visible || !announcement) return null;

  const styles = TYPE_STYLES[announcement.type] ?? TYPE_STYLES.info;

  return (
    <div
      role="banner"
      style={{
        background: styles.bg,
        borderBottom: `1px solid ${styles.border}40`,
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        position: 'relative',
        zIndex: 100,
        fontSize: 13.5,
        color: styles.text,
        fontFamily: 'Inter, sans-serif',
        lineHeight: 1.5,
      }}
    >
      <span style={{ flex: 1, textAlign: 'center', maxWidth: 860 }}>
        {announcement.text}
        {announcement.ctaText && announcement.ctaUrl && (
          <>
            {' '}
            <Link href={announcement.ctaUrl} style={{
              color: styles.accent, fontWeight: 700, textDecoration: 'underline', marginLeft: 4,
            }}>
              {announcement.ctaText} →
            </Link>
          </>
        )}
      </span>

      {announcement.dismissible && (
        <button
          onClick={dismiss}
          aria-label="Dismiss announcement"
          style={{
            background: 'none', border: 'none', color: styles.text,
            cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px',
            opacity: 0.7, flexShrink: 0,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
