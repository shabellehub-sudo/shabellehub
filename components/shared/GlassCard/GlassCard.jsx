import Link from 'next/link';
import styles from './GlassCard.module.css';

export default function GlassCard({
  children,
  href,
  padded = true,
  className = '',
  as: Tag,
  ...rest
}) {
  const classes = [styles.card, padded && styles.padded, className].filter(Boolean).join(' ');

  if (href) {
    return (
      <Link href={href} className={classes} {...rest}>
        <span className={styles.sheen} aria-hidden="true" />
        {children}
      </Link>
    );
  }

  const Component = Tag || 'div';
  return (
    <Component className={classes} {...rest}>
      <span className={styles.sheen} aria-hidden="true" />
      {children}
    </Component>
  );
}
