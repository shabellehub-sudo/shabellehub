import { useEffect, useRef, useState } from 'react';

/**
 * useRevealOnScroll — native replacement for framer-motion's
 * `revealOnScroll` (whileInView) pattern from lib/motion.js. Fires once
 * per element (mirrors `viewport: { once: true }`), using the same
 * -80px rootMargin so content starts revealing slightly before it's
 * fully scrolled into view — same feel, zero animation-library JS.
 *
 * Usage:
 *   const [ref, isVisible] = useRevealOnScroll();
 *   <div ref={ref} className={`revealOnScroll ${isVisible ? 'revealVisible' : ''}`}>
 *
 * `.revealOnScroll` / `.revealVisible` are global (non-module) classes
 * defined once in styles/globals.css, shared by every component that
 * uses this hook — see the comment there for the actual CSS.
 */
export function useRevealOnScroll(margin = '-80px') {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect prefers-reduced-motion: skip the observer, just show
    // the content — no point animating something a user asked us not to.
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { rootMargin: margin, threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [margin]);

  return [ref, isVisible];
}
