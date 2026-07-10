import { useState } from 'react';
import SectionHeader from '../../shared/SectionHeader/SectionHeader';
import ToolCard from '../FeaturedTools/ToolCard';
import { Section } from '../../ui';
import styles from './TrendingSection.module.css';

/**
 * TrendingSection — "This Week" / "Fastest Growing" tabs, driven by
 * real click data from public.tool_events (see lib/trending.js).
 *
 * Honest-by-design fallback: when the site is brand new (or the events
 * table genuinely has no data yet — this is expected for the first
 * week or two after shipping), both `trendingThisWeek` and
 * `fastestGrowing` will be empty arrays. Rather than show an empty
 * section or silently substitute fake numbers, we fall back to the
 * editorial `hot` flag and say so explicitly in the UI — no fabricated
 * "trending" claim about data that doesn't exist yet.
 */
export default function TrendingSection({
  trendingThisWeek = [],
  fastestGrowing = [],
  fallbackTools = [],
  favorites = [],
  onToggleFavorite,
}) {
  const hasRealData = trendingThisWeek.length > 0 || fastestGrowing.length > 0;
  const [tab, setTab] = useState('week');

  if (!hasRealData && fallbackTools.length === 0) return null;

  const activeList = !hasRealData
    ? fallbackTools
    : tab === 'week'
      ? trendingThisWeek
      : fastestGrowing;

  return (
    <Section surface>
      <div className={styles.headerRow}>
        <SectionHeader icon="🔥" title="Trending" ctaLabel="View all" ctaHref="/tools" />
        {hasRealData && (
          <div className={styles.tabs} role="tablist" aria-label="Trending view">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'week'}
              className={styles.tab}
              data-active={tab === 'week'}
              onClick={() => setTab('week')}
            >
              This Week
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'growing'}
              className={styles.tab}
              data-active={tab === 'growing'}
              onClick={() => setTab('growing')}
            >
              Fastest Growing
            </button>
          </div>
        )}
      </div>

      {!hasRealData && (
        <p className={styles.note}>
          Showing editor picks — usage-based trending activates once we have enough traffic data.
        </p>
      )}

      <div className={styles.grid}>
        {activeList.map((tool, i) => (
          <ToolCard
            key={tool.id}
            tool={tool}
            isFavorite={favorites.includes(tool.id)}
            onToggleFavorite={onToggleFavorite}
            rank={i + 1}
          />
        ))}
      </div>
    </Section>
  );
}
