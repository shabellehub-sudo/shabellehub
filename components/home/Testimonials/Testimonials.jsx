import { testimonials } from '../../../data/testimonials';
import GlassCard from '../../shared/GlassCard/GlassCard';
import SectionHeader from '../../shared/SectionHeader/SectionHeader';
import { StarRating } from '../../ui';
import { useRevealOnScroll } from '../../../hooks/useRevealOnScroll';
import styles from './Testimonials.module.css';

/**
 * Testimonials — social-proof grid, three-up on desktop. Uses the same
 * GlassCard primitive as ToolCard/EditorsChoice so hover treatment stays
 * consistent across the homepage rather than introducing a new card style.
 *
 * Framer Motion removed (Phase 5 perf follow-up): the staggered
 * scroll-reveal now runs on a single IntersectionObserver watching the
 * grid container (useRevealOnScroll), with each card's stagger delay
 * set via a CSS custom property instead of framer-motion's
 * staggerContainer/staggerChildren. Same 0.08s-per-card stagger,
 * 0.1s initial delay, as the original.
 */
export default function Testimonials() {
  const [gridRef, isVisible] = useRevealOnScroll();

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <SectionHeader icon="💬" title="What Our Readers Say" />

        <div ref={gridRef} className={styles.grid}>
          {testimonials.map((t, i) => (
            <div
              key={t.id}
              className={`revealOnScroll ${isVisible ? 'revealVisible' : ''}`}
              style={{ '--reveal-delay': `${0.1 + i * 0.08}s` }}
            >
              <GlassCard className={styles.card}>
                <StarRating rating={t.rating} size={14} />
                <p className={styles.quote}>&ldquo;{t.quote}&rdquo;</p>
                <div className={styles.person}>
                  <span className={styles.avatar} aria-hidden="true">{t.avatarInitial}</span>
                  <div>
                    <div className={styles.name}>{t.name}</div>
                    <div className={styles.role}>{t.role} · {t.company}</div>
                  </div>
                </div>
              </GlassCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
