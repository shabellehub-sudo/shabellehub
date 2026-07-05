import styles from './HeroVisual.module.css';

/**
 * HeroVisual — the ambient background + floating proof cards behind the
 * hero copy. Two pieces:
 *  1. Aurora mesh: two soft radial blobs (cyan + violet) that drift slowly
 *     via CSS transform animation — GPU-cheap, paused under
 *     prefers-reduced-motion (handled globally in tokens.css).
 *  2. Floating cards: real featured-tool data (name, category, rating),
 *     shown as glass cards on wide screens. On narrow screens these
 *     collapse into a compact horizontal strip so they never crowd the
 *     search box or headline on mobile.
 *
 * `tools` should be the 3 top-rated featured tools, passed from the page.
 */
export default function HeroVisual({ tools = [] }) {
  return (
    <div className={styles.wrap} aria-hidden="true">
      <div className={styles.aurora}>
        <span className={styles.blobCyan} />
        <span className={styles.blobViolet} />
      </div>

      {tools.length > 0 && (
        <>
          {/* Desktop: floating glass cards positioned around the hero */}
          <div className={styles.floaters}>
            {tools.slice(0, 3).map((tool, i) => (
              <div key={tool.id} className={styles.floater} data-index={i}>
                <span className={styles.floaterInitial}>{tool.name.charAt(0)}</span>
                <div className={styles.floaterBody}>
                  <span className={styles.floaterName}>{tool.name}</span>
                  <span className={styles.floaterMeta}>
                    {tool.category} · ★ {tool.rating}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile: compact strip, same data, no absolute positioning */}
          <div className={styles.strip}>
            {tools.slice(0, 3).map((tool) => (
              <div key={tool.id} className={styles.stripItem}>
                <span className={styles.stripInitial}>{tool.name.charAt(0)}</span>
                <span className={styles.stripName}>{tool.name}</span>
                <span className={styles.stripRating}>★ {tool.rating}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
