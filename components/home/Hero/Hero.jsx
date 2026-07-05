import { motion } from 'framer-motion';
import Link from 'next/link';
import Button from '../../shared/Button/Button';
import HeroSearch from './HeroSearch';
import HeroVisual from './HeroVisual';
import { fadeUp, staggerContainer } from '../../../lib/motion';
import styles from './Hero.module.css';

/**
 * Hero — homepage hero section.
 * `tools` is the full tools array (from data/index.js), passed down so
 * HeroSearch can filter it and HeroVisual can show the top-rated featured
 * tools as floating proof cards. Nothing here fetches its own data —
 * keeps this component testable and keeps data-shape decisions at the
 * page level, per the single-responsibility split the rest of the
 * refactor follows.
 */
export default function Hero({ tools = [] }) {
  const topFeatured = tools
    .filter((t) => t.featured)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  return (
    <section className={styles.hero}>
      <HeroVisual tools={topFeatured} />

      <motion.div
        className={styles.content}
        initial="hidden"
        animate="visible"
        variants={staggerContainer(0.12)}
      >
        <motion.p className={styles.eyebrow} variants={fadeUp}>
          The Ultimate 2026 AI Discovery Platform
        </motion.p>

        <motion.h1 className={styles.headline} variants={fadeUp}>
          Discover the Best
          <br />
          <span className={styles.headlineAccent}>AI Tools in One Place</span>
        </motion.h1>

        <motion.p className={styles.subhead} variants={fadeUp}>
          Compare, review, and explore the world&rsquo;s top AI tools for writing, coding,
          productivity, design, video, automation, and more.
        </motion.p>

        <motion.div variants={fadeUp}>
          <HeroSearch tools={tools} />
        </motion.div>

        <motion.div className={styles.ctas} variants={fadeUp}>
          <Button href="/tools" variant="primary" size="lg">
            Explore Tools →
          </Button>
          <Button href="/blog" variant="secondary" size="lg">
            Latest AI Reviews
          </Button>
        </motion.div>
      </motion.div>

      <a href="#stats" className={styles.scrollIndicator} aria-label="Scroll to statistics">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 4V20M12 20L6 14M12 20L18 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    </section>
  );
}
