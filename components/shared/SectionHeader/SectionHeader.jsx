import Link from 'next/link';
import styles from './SectionHeader.module.css';

/**
 * SectionHeader — the "⚡ Featured AI Tools ... View all →" row pattern,
 * used at the top of every homepage section. Centralizing it means a
 * spacing or typography change updates every section at once instead
 * of six hand-edited copies.
 */
export default function SectionHeader({ icon, title, ctaLabel, ctaHref }) {
  return (
    <div className={styles.header}>
      <h2 className={styles.title}>
        {icon && <span aria-hidden="true">{icon} </span>}
        {title}
      </h2>
      {ctaLabel && ctaHref && (
        <Link href={ctaHref} className={styles.cta}>
          {ctaLabel} →
        </Link>
      )}
    </div>
  );
}
