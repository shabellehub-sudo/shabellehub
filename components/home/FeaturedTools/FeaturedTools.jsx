import { Section } from '../../ui';
import SectionHeader from '../../shared/SectionHeader/SectionHeader';
import ToolCard from './ToolCard';
import ToolCardSkeleton from './ToolCardSkeleton';
import styles from './FeaturedTools.module.css';

/**
 * FeaturedTools — homepage grid section, reused for both "Featured AI
 * Tools" and "Trending Now" (pass different `tools`/`title`/`icon`).
 *
 * `loading`: when true, renders `skeletonCount` ToolCardSkeletons instead
 * of real cards. Tools data on this site is statically imported today,
 * so loading is normally false — this exists so a future client-side
 * fetch (e.g. Supabase-driven trending ranked by live view counts) can
 * flip it on without any redesign work.
 *
 * `showRank`: when true, numbers cards #1, #2, #3... (useful for a
 * "Trending Now" leaderboard feel; omit for plain featured grids).
 */
export default function FeaturedTools({
  tools = [],
  title,
  icon,
  ctaLabel = 'View all',
  ctaHref = '/tools',
  favorites = [],
  onToggleFavorite,
  loading = false,
  skeletonCount = 6,
  showRank = false,
}) {
  return (
    <Section surface>
      <SectionHeader icon={icon} title={title} ctaLabel={ctaLabel} ctaHref={ctaHref} />
      <div className={styles.grid}>
        {loading
          ? Array.from({ length: skeletonCount }).map((_, i) => (
              <ToolCardSkeleton key={i} />
            ))
          : tools.map((tool, i) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                isFavorite={favorites.includes(tool.id)}
                onToggleFavorite={onToggleFavorite}
                rank={showRank ? i + 1 : undefined}
              />
            ))}
      </div>
    </Section>
  );
}
