import { useEffect, useRef, useState } from 'react';

/**
 * useCountUp — animates a number from 0 to `target` once, starting when
 * the returned ref scrolls into view. Native IntersectionObserver +
 * requestAnimationFrame, no animation library.
 *
 * Ease-out cubic gives a natural "quick start, gentle finish" feel
 * instead of a linear tick-up.
 */
export function useCountUp(target, { duration = 1200, decimals = 0 } = {}) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          const start = performance.now();

          function tick(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setValue(target * eased);
            if (progress < 1) {
              requestAnimationFrame(tick);
            } else {
              setValue(target);
            }
          }

          requestAnimationFrame(tick);
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  const display = decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));
  return [ref, display];
}
