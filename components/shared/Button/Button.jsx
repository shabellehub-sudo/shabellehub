import Link from 'next/link';
import styles from './Button.module.css';

/**
 * Button — single source of truth for every CTA on the site.
 * variant: 'primary' | 'secondary' | 'ghost'
 * size:    'md' | 'lg'
 * If `href` is provided, renders a Next.js Link styled as a button.
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  onClick,
  type = 'button',
  ariaLabel,
  className = '',
  ...rest
}) {
  const classes = [styles.button, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(' ');

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={ariaLabel} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      aria-label={ariaLabel}
      {...rest}
    >
      {children}
    </button>
  );
}
