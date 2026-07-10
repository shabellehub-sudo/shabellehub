import { useCountUp } from '../../../hooks/useCountUp';

/**
 * AnimatedCounter — renders a number that counts up from 0 once it
 * scrolls into view. Used in the homepage stats bar (Tools Reviewed,
 * Categories, Independent %, Avg Rating).
 *
 * Kept as a plain <span> with no default styling so it drops into
 * existing inline-styled or CSS-module contexts unchanged — pass
 * `className` or wrap it if you need specific typography.
 */
export default function AnimatedCounter({
  value,
  decimals = 0,
  suffix = '',
  prefix = '',
  duration = 1200,
  className,
}) {
  const [ref, display] = useCountUp(value, { duration, decimals });

  return (
    <span ref={ref} className={className}>
      {prefix}{display}{suffix}
    </span>
  );
}
