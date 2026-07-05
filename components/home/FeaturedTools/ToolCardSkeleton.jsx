import styles from './ToolCard.module.css';
import skeletonStyles from './ToolCardSkeleton.module.css';

/**
 * ToolCardSkeleton — placeholder shown while tool data is loading
 * (e.g. a future client-side "trending" fetch). Mirrors ToolCard's
 * exact box structure so the grid doesn't jump/reflow once real
 * cards swap in.
 */
export default function ToolCardSkeleton() {
  return (
    <div className={`${styles.card} ${skeletonStyles.skeletonCard}`} aria-hidden="true">
      <div className={styles.topRow}>
        <div className={styles.identity}>
          <div className={`${skeletonStyles.bone} ${skeletonStyles.avatar}`} />
          <div className={styles.identityText}>
            <div className={`${skeletonStyles.bone} ${skeletonStyles.line} ${skeletonStyles.lineName}`} />
            <div className={`${skeletonStyles.bone} ${skeletonStyles.line} ${skeletonStyles.lineCategory}`} />
          </div>
        </div>
      </div>

      <div className={`${skeletonStyles.bone} ${skeletonStyles.line} ${skeletonStyles.lineStars}`} />

      <div className={`${skeletonStyles.bone} ${skeletonStyles.line} ${skeletonStyles.lineDescFull}`} />
      <div className={`${skeletonStyles.bone} ${skeletonStyles.line} ${skeletonStyles.lineDescShort}`} />

      <div className={styles.tags}>
        <div className={`${skeletonStyles.bone} ${skeletonStyles.tagBone}`} />
        <div className={`${skeletonStyles.bone} ${skeletonStyles.tagBone}`} />
        <div className={`${skeletonStyles.bone} ${skeletonStyles.tagBone}`} />
      </div>

      <div className={styles.footer}>
        <div className={`${skeletonStyles.bone} ${skeletonStyles.priceBone}`} />
        <div className={`${skeletonStyles.bone} ${skeletonStyles.ctaBone}`} />
      </div>
    </div>
  );
}
