/**
 * MobilePerformanceBadge — lightweight, presentational-only trust badge
 * highlighting ShabelleHub's mobile-first fast render optimization.
 * No data fetching, no backend calls, no monitoring logic — purely UI.
 */
export default function MobilePerformanceBadge({ label = 'Optimized for Mobile' }) {
  return (
    <div className="mobilePerfBadge">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"
          fill="#14FFF4"
        />
      </svg>
      <span>{label}</span>
      <style jsx>{`
        .mobilePerfBadge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border: 1px solid #14FFF4;
          border-radius: 999px;
          background: rgba(20, 255, 244, 0.08);
          color: #14FFF4;
          margin: 0 auto 1.5rem auto;
          font-size: 13px;
          font-weight: 500;
          font-family: 'Space Grotesk', sans-serif;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
