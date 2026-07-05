import styles from './Badge.module.css';

/**
 * Badge — small status/label pill.
 * tone: 'accent' | 'violet' | 'gold' | 'neutral'
 * Used for: "Editor's Choice", category tags, "New", ratings context.
 */
export default function Badge({ children, tone = 'neutral', icon, className = '' }) {
  const classes = [styles.badge, styles[tone], className].filter(Boolean).join(' ');
  return (
    <span className={classes}>
      {icon && <span aria-hidden="true" className={styles.icon}>{icon}</span>}
      {children}
    </span>
  );
}
