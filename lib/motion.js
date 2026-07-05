// lib/motion.js
// Reusable Framer Motion variants for Shabelle Hub.
// Every variant here is duration/easing-matched to styles/tokens.css
// so JS-driven motion (Framer) and CSS-driven motion (:hover, transitions)
// feel like one system instead of two competing animation styles.
//
// Requires: npm install framer-motion

export const EASE_STANDARD = [0.22, 1, 0.36, 1];
export const EASE_OUT = [0.16, 1, 0.3, 1];

// Detects prefers-reduced-motion at call time (client-side only).
// Use this to zero out durations rather than skipping animation logic,
// so layout/opacity end-states stay correct either way.
export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const dur = (seconds) => (prefersReducedMotion() ? 0 : seconds);

export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: dur(0.45), ease: EASE_STANDARD },
  },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: dur(0.35), ease: EASE_STANDARD },
  },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: dur(0.35), ease: EASE_OUT },
  },
};

// Wrap a list container with this + fadeUp on children for a
// staggered scroll-reveal (e.g. tool card grids, FAQ items).
export const staggerContainer = (staggerAmount = 0.08) => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: dur(staggerAmount),
      delayChildren: dur(0.1),
    },
  },
});

// Standard "in view" props to spread onto a motion.div:
//   <motion.div {...revealOnScroll} variants={fadeUp}>
export const revealOnScroll = {
  initial: 'hidden',
  whileInView: 'visible',
  viewport: { once: true, margin: '-80px' },
};

// Subtle hover lift for cards — pairs with --shadow-md / --glow-cyan.
export const hoverLift = {
  rest: { y: 0, transition: { duration: dur(0.2), ease: EASE_STANDARD } },
  hover: { y: -4, transition: { duration: dur(0.2), ease: EASE_STANDARD } },
};
