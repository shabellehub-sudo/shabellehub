import { useEffect, useLayoutEffect, useRef, useState } from 'react';

// SSR has no layout effects, so fall back to useEffect there (avoids the
// React warning); on the client we want useLayoutEffect specifically so
// the reset-to-0 below happens before paint, with no visible flash.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * useCountUp — animates a number from 0 to `target` once, starting when
 * the returned ref scrolls into view. Native IntersectionObserver +
 * requestAnimationFrame, no animation library.
 *
 * Ease-out cubic gives a natural "quick start, gentle finish" feel
 * instead of a linear tick-up.
 *
 * SSR/hydration note: initial state is `target`, not 0, so the
 * server-rendered HTML and the first client render both show the real
 * value (no hydration mismatch, real stats visible to crawlers/no-JS).
 * A layout effect then resets to 0 client-side, before the browser
 * paints, so JS-enabled users still see the original 0 → target
 * count-up animation with no visible flash of the final value first.
 */
export function useCountUp(target, { duration = 1200, decimals = 0 } = {}) {
  const ref = useRef(null);
  const [value, setValue] = useState(target);
  const startedRef = useRef(false);

  useIsomorphicLayoutEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    setValue(0);
  }, []);

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
