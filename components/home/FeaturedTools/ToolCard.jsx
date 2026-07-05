import Link from 'next/link';
import { useState } from 'react';
import { StarRating } from '../../ui';
import { openAffiliateLink } from '../../../lib/affiliate';
import Badge from '../../shared/Badge/Badge';
import Button from '../../shared/Button/Button';
import styles from './ToolCard.module.css';

/**
 * ToolCard (home) — redesigned card for the homepage Featured/Trending
 * sections, built on Phase 1 design tokens (glass surface, aurora glow,
 * shared Badge/Button). This is a SEPARATE component from
 * components/ui/ToolCard, which stays untouched since /tools and
 * /tools/category/[category] still depend on its exact behavior.
 *
 * Behavior parity with the original card is intentional: same favorite
 * toggle, same affiliate click handling (stopPropagation so it doesn't
 * trigger the card's Link), same navigation to /tools/[slug].
 */
export default function ToolCard({ tool, isFavorite, onToggleFavorite, rank }) {
  const [hovered, setHovered] = useState(false);

  const handleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite?.(tool.id);
  };

  const handleCta = (e) => {
    e.preventDefault();
    e.stopPropagation();
    openAffiliateLink(tool);
  };

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className={styles.cardLink}
      aria-label={`View ${tool.name} review`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`${styles.card} ${hovered ? styles.cardHovered : ''}`}>
        {typeof rank === 'number' && <span className={styles.rank}>#{rank}</span>}

        <div className={styles.topRow}>
          <div className={styles.identity}>
            <div className={styles.avatar}>{tool.name.charAt(0)}</div>
            <div className={styles.identityText}>
              <div className={styles.nameRow}>
                <span className={styles.name}>{tool.name}</span>
                {tool.hot && <Badge tone="hot">Hot</Badge>}
              </div>
              <span className={styles.category}>{tool.category}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFavorite}
            className={styles.favoriteBtn}
            data-active={isFavorite}
            aria-label={isFavorite ? `Unsave ${tool.name}` : `Save ${tool.name}`}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>

        {tool.badge && (
          <Badge tone="violet" className={styles.badgeChip}>{tool.badge}</Badge>
        )}

        <StarRating rating={tool.rating} />

        <p className={styles.desc}>{tool.desc}</p>

        <div className={styles.tags}>
          {tool.tags.map((t) => (
            <span key={t} className={styles.tag}>{t}</span>
          ))}
        </div>

        <div className={styles.footer}>
          <span className={styles.price}>{tool.price}</span>
          <Button
            variant="primary"
            size="sm"
            onClick={handleCta}
            ariaLabel={tool.priceTier === 'paid' ? `Visit ${tool.name}` : `Try ${tool.name} free`}
          >
            {tool.priceTier === 'paid' ? 'Visit →' : 'Try Free →'}
          </Button>
        </div>
      </div>
    </Link>
  );
}
