import { motion } from 'framer-motion';
import Badge from '../../shared/Badge/Badge';
import Button from '../../shared/Button/Button';
import GlassCard from '../../shared/GlassCard/GlassCard';
import BackgroundGlow from '../../shared/BackgroundGlow/BackgroundGlow';
import SectionHeader from '../../shared/SectionHeader/SectionHeader';
import { StarRating } from '../../ui';
import { openAffiliateLink } from '../../../lib/affiliate';
import { fadeUp, revealOnScroll } from '../../../lib/motion';
import styles from './EditorsChoice.module.css';

/**
 * EditorsChoice — homepage spotlight for the single tool marked
 * `badge: "Editor's Choice"` in data/index.js. Falls back to the
 * highest-rated featured tool if no explicit Editor's Choice exists,
 * so this section never renders empty as the tools list changes.
 *
 * Deliberately a different visual weight from FeaturedTools' grid —
 * one large asymmetric card, not another card-in-a-grid.
 */
export default function EditorsChoice({ tools = [] }) {
  const tool =
    tools.find((t) => t.badge === "Editor's Choice") ||
    [...tools].filter((t) => t.featured).sort((a, b) => b.rating - a.rating)[0];

  if (!tool) return null;

  const handleCta = (e) => {
    e.preventDefault();
    e.stopPropagation();
    openAffiliateLink(tool);
  };

  return (
    <section className={styles.section}>
      <BackgroundGlow variant="subtle" />
      <div className={styles.inner}>
        <SectionHeader icon="🏆" title="Editor's Choice" />

        <motion.div {...revealOnScroll} variants={fadeUp}>
          <GlassCard className={styles.card}>
            <div className={styles.visual} aria-hidden="true">
              <span className={styles.avatar}>{tool.name.charAt(0)}</span>
            </div>

            <div className={styles.content}>
              <div className={styles.badgeRow}>
                <Badge tone="gold" icon="🏆">Editor&rsquo;s Choice</Badge>
                {tool.hot && <Badge tone="hot">Hot</Badge>}
              </div>

              <h3 className={styles.name}>{tool.name}</h3>
              <p className={styles.category}>{tool.category}</p>

              <div className={styles.ratingRow}>
                <StarRating rating={tool.rating} size={16} />
                <span className={styles.ratingNum}>{tool.rating}</span>
              </div>

              <p className={styles.desc}>{tool.desc}</p>

              <ul className={styles.pros}>
                {(tool.pros || []).slice(0, 3).map((p) => (
                  <li key={p}>
                    <span className={styles.check} aria-hidden="true">✓</span> {p}
                  </li>
                ))}
              </ul>

              <div className={styles.footer}>
                <span className={styles.price}>{tool.price}</span>
                <div className={styles.ctas}>
                  <Button variant="secondary" size="md" href={`/tools/${tool.slug}`}>
                    Read Full Review
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleCta}
                    ariaLabel={tool.priceTier === 'paid' ? `Visit ${tool.name}` : `Try ${tool.name} free`}
                  >
                    {tool.priceTier === 'paid' ? 'Visit →' : 'Try Free →'}
                  </Button>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </section>
  );
}
