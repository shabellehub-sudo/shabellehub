import Link from 'next/link';
import { formatDate } from '../../lib/eeat';

// ─── PERSON AVATAR ──────────────────────────────────────────────────────────
// Initials-based avatar so the site has zero dependency on uploaded photos.
export function PersonAvatar({ person, size = 44 }) {
  if (!person) return null;
  return (
    <div
      aria-hidden="true"
      style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: `${person.avatarColor}1a`,
        border: `1px solid ${person.avatarColor}55`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800,
        fontSize: Math.round(size * 0.36), color: person.avatarColor,
      }}
    >
      {person.avatarInitials}
    </div>
  );
}

// ─── EXPERTISE TAGS ─────────────────────────────────────────────────────────
export function ExpertiseTags({ items, size = 11 }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {items.map(item => (
        <span key={item} style={{
          fontSize: size, color: '#6b82a8',
          background: 'rgba(26,45,74,0.5)', border: '1px solid #1a2d4a',
          borderRadius: 5, padding: '2px 8px',
        }}>
          {item}
        </span>
      ))}
    </div>
  );
}

// ─── AUTHOR CARD ────────────────────────────────────────────────────────────
// Used on: tool pages, blog pages, /authors index, /team page.
export function AuthorCard({ person, compact = false }) {
  if (!person) return null;
  return (
    <Link
      href={`/authors/${person.slug}`}
      style={{ textDecoration: 'none', display: 'block' }}
      aria-label={`View ${person.name}'s author profile`}
    >
      <div style={{
        background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 14,
        padding: compact ? 14 : 20, display: 'flex', gap: 12, alignItems: 'flex-start',
        height: '100%',
      }}>
        <PersonAvatar person={person} size={compact ? 40 : 52} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#e8f0ff', fontSize: compact ? 14 : 16 }}>
            {person.name}
          </div>
          <div style={{ color: '#14FFF4', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
            {person.title}
          </div>
          {!compact && (
            <p style={{ color: '#6b82a8', fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}>
              {person.shortBio}
            </p>
          )}
          {!compact && <ExpertiseTags items={person.expertise?.slice(0, 3)} />}
          <span style={{ display: 'inline-block', marginTop: 10, color: '#14FFF4', fontSize: 12, fontWeight: 700 }}>
            View author profile →
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── REVIEWER CARD ──────────────────────────────────────────────────────────
// Used on: tool pages, blog pages, /reviewers index, /team page.
export function ReviewerCard({ person, compact = false }) {
  if (!person) return null;
  return (
    <Link
      href={`/reviewers/${person.slug}`}
      style={{ textDecoration: 'none', display: 'block' }}
      aria-label={`View ${person.name}'s reviewer profile`}
    >
      <div style={{
        background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 14,
        padding: compact ? 14 : 20, display: 'flex', gap: 12, alignItems: 'flex-start',
        height: '100%',
      }}>
        <PersonAvatar person={person} size={compact ? 40 : 52} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#e8f0ff', fontSize: compact ? 14 : 16 }}>
            {person.name}
          </div>
          <div style={{ color: '#00d084', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
            {person.title}
          </div>
          {!compact && (
            <p style={{ color: '#6b82a8', fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}>
              {person.shortBio}
            </p>
          )}
          {!compact && <ExpertiseTags items={person.expertise?.slice(0, 3)} />}
          <span style={{ display: 'inline-block', marginTop: 10, color: '#00d084', fontSize: 12, fontWeight: 700 }}>
            View reviewer profile →
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── GENERIC TEAM MEMBER CARD ───────────────────────────────────────────────
// Used on /team — links to /authors/[slug] or /reviewers/[slug] depending on
// the person's primary role, and shows both badges if they hold both roles.
export function TeamMemberCard({ person }) {
  if (!person) return null;
  const primaryHref = person.roles.includes('author')
    ? `/authors/${person.slug}`
    : `/reviewers/${person.slug}`;

  return (
    <div style={{ background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 16, padding: 24 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
        <PersonAvatar person={person} size={56} />
        <div>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, color: '#e8f0ff', fontSize: 17 }}>
            {person.name}
          </div>
          <div style={{ color: '#14FFF4', fontSize: 13, fontWeight: 600 }}>{person.title}</div>
        </div>
      </div>

      <p style={{ color: '#6b82a8', fontSize: 13.5, lineHeight: 1.65, marginBottom: 14 }}>
        {person.shortBio}
      </p>

      <ExpertiseTags items={person.expertise} />

      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        {person.roles.includes('author') && (
          <Link href={`/authors/${person.slug}`} style={{
            fontSize: 12, fontWeight: 800, color: '#14FFF4',
            background: 'rgba(20,255,244,0.08)', border: '1px solid rgba(20,255,244,0.25)',
            borderRadius: 8, padding: '6px 12px', textDecoration: 'none',
          }}>
            Author Profile →
          </Link>
        )}
        {person.roles.includes('reviewer') && (
          <Link href={`/reviewers/${person.slug}`} style={{
            fontSize: 12, fontWeight: 800, color: '#00d084',
            background: 'rgba(0,208,132,0.08)', border: '1px solid rgba(0,208,132,0.25)',
            borderRadius: 8, padding: '6px 12px', textDecoration: 'none',
          }}>
            Reviewer Profile →
          </Link>
        )}
      </div>

      <div style={{ display: 'none' }}>
        <Link href={primaryHref}>{person.name}</Link>
      </div>
    </div>
  );
}

// ─── TRUST BLOCK ────────────────────────────────────────────────────────────
// The core E-E-A-T component: who wrote this, who reviewed it, when it was
// last updated/reviewed, and where to read about how we work. Drop into any
// tool page, blog post, or category page.
//
// type: 'tool' | 'article' — only affects copy, not structure.
export function TrustBlock({ author, reviewer, lastUpdated, lastReviewed, type = 'article' }) {
  const subjectLabel = type === 'tool' ? 'review' : 'article';

  return (
    <section
      aria-label="Authorship and editorial review information"
      style={{
        background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 16,
        padding: 22, marginBottom: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span aria-hidden="true" style={{ fontSize: 18 }}>🛡️</span>
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 15, fontWeight: 800, color: '#e8f0ff' }}>
          Who wrote and verified this {subjectLabel}
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 16 }}>
        {author && <AuthorCard person={author} compact />}
        {reviewer && <ReviewerCard person={reviewer} compact />}
      </div>

      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 16, borderTop: '1px solid rgba(26,45,74,0.6)',
        paddingTop: 14, marginBottom: 14, fontSize: 13, color: '#6b82a8',
      }}>
        {lastUpdated && (
          <div>
            <strong style={{ color: '#e8f0ff' }}>Last updated:</strong>{' '}
            <time dateTime={lastUpdated}>{formatDate(lastUpdated)}</time>
          </div>
        )}
        {lastReviewed && (
          <div>
            <strong style={{ color: '#e8f0ff' }}>Last reviewed:</strong>{' '}
            <time dateTime={lastReviewed}>{formatDate(lastReviewed)}</time>
          </div>
        )}
      </div>

      <p style={{ color: '#6b82a8', fontSize: 12.5, lineHeight: 1.6 }}>
        This {subjectLabel} is owned and maintained by {author ? author.name : 'the Shabelle Hub editorial team'}.
        Every factual claim is independently verified by our editorial team before publishing and on a recurring
        schedule afterward. Read our{' '}
        <Link href="/editorial-standards" style={{ color: '#14FFF4' }}>Editorial Standards</Link>
        {type === 'tool' && (
          <>
            {' '}and{' '}
            <Link href="/review-methodology" style={{ color: '#14FFF4' }}>Review Methodology</Link>
          </>
        )}
        {' '}to see exactly how we work. Found something out of date?{' '}
        <Link href="/contact" style={{ color: '#14FFF4' }}>Let us know</Link>.
      </p>
    </section>
  );
}

// ─── COMPACT BYLINE ─────────────────────────────────────────────────────────
// A single-line "By X · Reviewed by Y · Updated Z" strip for use in list
// views (blog index, category index) where the full TrustBlock is too heavy.
export function CompactByline({ author, reviewer, lastUpdated, linked = true }) {
  if (!author && !reviewer && !lastUpdated) return null;
  const AuthorEl = linked
    ? <Link href={`/authors/${author?.slug}`} style={{ color: '#14FFF4', fontWeight: 600 }}>{author?.name}</Link>
    : <span style={{ color: '#14FFF4', fontWeight: 600 }}>{author?.name}</span>;
  const ReviewerEl = linked
    ? <Link href={`/reviewers/${reviewer?.slug}`} style={{ color: '#00d084', fontWeight: 600 }}>{reviewer?.name}</Link>
    : <span style={{ color: '#00d084', fontWeight: 600 }}>{reviewer?.name}</span>;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', color: '#6b82a8', fontSize: 12 }}>
      {author && <span>By {AuthorEl}</span>}
      {author && reviewer && <span aria-hidden="true" style={{ opacity: 0.4 }}>·</span>}
      {reviewer && <span>Reviewed by {ReviewerEl}</span>}
      {(author || reviewer) && lastUpdated && <span aria-hidden="true" style={{ opacity: 0.4 }}>·</span>}
      {lastUpdated && (
        <span>
          Updated <time dateTime={lastUpdated}>{formatDate(lastUpdated)}</time>
        </span>
      )}
    </div>
  );
}

// ─── EDITORIAL RESPONSIBILITY NOTICE ───────────────────────────────────────
// Short notice for category/listing pages — explains who stands behind the
// ratings shown on the page without the full TrustBlock layout.
export function EditorialResponsibilityNotice() {
  return (
    <div style={{
      background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 14,
      padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      <span aria-hidden="true" style={{ fontSize: 18 }}>🧾</span>
      <p style={{ color: '#6b82a8', fontSize: 13, lineHeight: 1.65 }}>
        <strong style={{ color: '#e8f0ff' }}>Editorial responsibility:</strong>{' '}
        Every rating and ranking on this page is produced and checked by Shabelle Hub&rsquo;s
        editorial team — see our{' '}
        <Link href="/team" style={{ color: '#14FFF4' }}>team</Link>,{' '}
        <Link href="/editorial-standards" style={{ color: '#14FFF4' }}>editorial standards</Link>, and{' '}
        <Link href="/review-methodology" style={{ color: '#14FFF4' }}>review methodology</Link>{' '}
        for details on how tools are selected, tested, and scored.
      </p>
    </div>
  );
}
