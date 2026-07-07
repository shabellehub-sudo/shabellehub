import Link from 'next/link';
import Button from '../../shared/Button/Button';
import HeroSearch from './HeroSearch';
import HeroVisual, { HeroProofStrip } from './HeroVisual';
import styles from './Hero.module.css';

/**
 * Hero — homepage hero section.
 * `tools` is the full tools array (from data/index.js), passed down so
 * HeroSearch can filter it and HeroVisual can show the top-rated featured
 * tools as floating proof cards. Nothing here fetches its own data —
 * keeps this component testable and keeps data-shape decisions at the
 * page level, per the single-responsibility split the rest of the
 * refactor follows.
 *
 * Framer Motion removed (Phase 5 perf follow-up): it was pulled into
 * the bundle for a handful of simple fade-up-on-load animations on this
 * one component — PageSpeed flagged that as "unused JavaScript"/"legacy
 * JavaScript". The same stagger effect now runs as a pure CSS animation
 * (see .reveal in Hero.module.css), so there's no JS cost and no
 * hydration delay at all.
 *
 * Search dropdown fix: the div wrapping HeroSearch also gets
 * .searchSlot, which sets its own stacking context (z-index: 5) ranked
 * above .ctas (z-index: 1). Without this, both .reveal divs create
 * their own stacking contexts (any CSS animation on opacity/transform
 * does this) and the *later* one in the DOM — .ctas — would paint over
 * the search suggestions dropdown regardless of the dropdown's own
 * z-index, since that z-index is trapped inside its own div's context.
 */
export default function Hero({ tools = [] }) {
  const topFeatured = tools
    .filter((t) => t.featured)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  return (
    <section className={styles.hero}>
      <HeroVisual tools={topFeatured} />

      <div className={styles.content}>
        <div className={styles.reveal} style={{ '--reveal-delay': '0s' }}>
          <HeroProofStrip tools={topFeatured} />
        </div>

        <p className={`${styles.eyebrow} ${styles.reveal}`} style={{ '--reveal-delay': '0.12s' }}>
          The Ultimate 2026 AI Discovery Platform
        </p>

        {/*
          Plain h1, no reveal animation at all: Lighthouse flagged this
          as the LCP element at 6.2s when it waited on JS. It now paints
          at full opacity immediately in the server-rendered HTML.
        */}
        <h1 className={styles.headline}>
          Discover the Best
          <br />
          <span className={styles.headlineAccent}>AI Tools in One Place</span>
        </h1>

        <p className={`${styles.subhead} ${styles.reveal}`} style={{ '--reveal-delay': '0.24s' }}>
          Compare, review, and explore the world&rsquo;s top AI tools for writing, coding,
          productivity, design, video, automation, and more.
        </p>

        <div className={`${styles.reveal} ${styles.searchSlot}`} style={{ '--reveal-delay': '0.36s' }}>
          <HeroSearch tools={tools} />
        </div>

        <div className={`${styles.ctas} ${styles.reveal}`} style={{ '--reveal-delay': '0.48s' }}>
          <Button href="/tools" variant="primary" size="lg">
            Explore Tools →
          </Button>
          <Button href="/blog" variant="secondary" size="lg">
            Latest AI Reviews
          </Button>
        </div>
      </div>

      <a href="#stats" className={styles.scrollIndicator} aria-label="Scroll to statistics">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 4V20M12 20L6 14M12 20L18 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    </section>
  );
}
