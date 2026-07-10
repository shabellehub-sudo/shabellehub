import styles from './BlogCardSkeleton.module.css';

/**
 * BlogCardSkeleton — placeholder matching the homepage/blog-listing
 * card's exact layout (category+date+read-time row, title, excerpt).
 *
 * Note: blog posts on this site are fetched server-side via
 * getStaticProps (ISR), so there's no client-side loading moment on
 * the homepage or /blog today — this component has no live trigger
 * yet. It's here, matched pixel-for-pixel to the real card, ready for
 * whenever /blog gains client-side pagination or tag/category
 * filtering that re-fetches instead of filtering already-loaded data.
 */
export default function BlogCardSkeleton() {
  return (
    <div className={styles.card} aria-hidden="true">
      <div className={styles.metaRow}>
        <div className={`${styles.bone} ${styles.metaBone}`} />
        <div className={`${styles.bone} ${styles.metaBoneSmall}`} />
      </div>
      <div className={`${styles.bone} ${styles.titleLine}`} />
      <div className={`${styles.bone} ${styles.titleLineShort}`} />
      <div className={`${styles.bone} ${styles.excerptLine}`} />
      <div className={`${styles.bone} ${styles.excerptLineShort}`} />
    </div>
  );
}
