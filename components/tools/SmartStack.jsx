import Link from 'next/link';
import { StarRating } from '../ui';

/**
 * SmartStack — Phase 4.4 UI for the Phase 4.3 stackMatcher data layer
 * (lib/stackMatcher.js -> getComplementaryStack(), computed at build
 * time in pages/tools/[slug].js getStaticProps). Pure presentational
 * component, no data fetching. Renders nothing if neither
 * complementary role produced a match (e.g. unmapped category).
 */
export default function SmartStack({ stack }) {
  if (!stack || (!stack.asset && !stack.distribution)) return null;

  const { primary, asset, distribution } = stack;
  const slots = [
    { label: 'Creation', tool: primary, isPrimary: true },
    { label: 'Asset', tool: asset },
    { label: 'Distribution', tool: distribution },
  ].filter((s) => s.tool);

  return (
    <section aria-label="Complete Your AI Stack" style={{ marginBottom: 28 }}>
      <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
        ⚡ Complete Your AI Stack
      </h3>
      <p style={{ color: '#8ba3ca', fontSize: 13, marginBottom: 16 }}>
        Tools that pair well with <span className="notranslate">{primary.name}</span> in a real workflow.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
        {slots.map(({ label, tool, isPrimary }) => {
          const card = (
            <div style={{
              background: '#0f1829',
              border: isPrimary ? '1px solid rgba(20,255,244,0.35)' : '1px solid #1a2d4a',
              borderRadius: 12, padding: 16, height: '100%',
            }}>
              <div style={{ color: '#14FFF4', fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
                {label}
              </div>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#e8f0ff', marginBottom: 6 }}>
                <span className="notranslate">{tool.name}</span>
              </div>
              <StarRating rating={tool.rating} size={12} />
              <div style={{ color: '#8ba3ca', fontSize: 12, marginTop: 6 }}>{tool.price}</div>
            </div>
          );
          return isPrimary ? (
            <div key={tool.slug}>{card}</div>
          ) : (
            <Link key={tool.slug} href={`/tools/${tool.slug}`} style={{ textDecoration: 'none' }}>
              {card}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
