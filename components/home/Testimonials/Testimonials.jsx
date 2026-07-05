import { motion } from 'framer-motion';
import { testimonials } from '../../../data/testimonials';
import GlassCard from '../../shared/GlassCard/GlassCard';
import SectionHeader from '../../shared/SectionHeader/SectionHeader';
import { StarRating } from '../../ui';
import { fadeUp, staggerContainer, revealOnScroll } from '../../../lib/motion';
import styles from './Testimonials.module.css';

/**
 * Testimonials — social-proof grid, three-up on desktop. Uses the same
 * GlassCard primitive as ToolCard/EditorsChoice so hover treatment stays
 * consistent across the homepage rather than introducing a new card style.
 */
export default function Testimonials() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <SectionHeader icon="💬" title="What Our Readers Say" />

        <motion.div
          className={styles.grid}
          {...revealOnScroll}
          variants={staggerContainer(0.08)}
        >
          {testimonials.map((t) => (
            <motion.div key={t.id} variants={fadeUp}>
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
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
