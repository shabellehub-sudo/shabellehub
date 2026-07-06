import styles from './BackgroundGlow.module.css';


export default function BackgroundGlow({ variant = 'section', className = '' }) {
  return (
    <div aria-hidden="true" className={[styles.glow, styles[variant], className].filter(Boolean).join(' ')}>
      <span className={styles.orbA} />
      <span className={styles.orbB} />
    </div>
  );
}
