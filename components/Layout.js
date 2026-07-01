import { useState } from 'react';
import Link from 'next/link';
import { ComplianceBanner } from './compliance';
import { useRouter } from 'next/router';
import { categories } from '../data';
import { categoryToSlug } from '../lib/categories';
import NewsletterSignupForm from './newsletter/SignupForm';

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
// FIX #12: removed redundant role="navigation" — <nav> element implies it.
// FIX #11: currentYear moved to a module-level constant so the value is
//          identical on SSR and client, eliminating any edge-case mismatch
//          when a deployment straddles midnight on January 1.
const CURRENT_YEAR = new Date().getFullYear();

export function Navbar({ favoriteCount = 0 }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const links = [
    { href: '/',        label: 'Home' },
    { href: '/tools',   label: 'Directory' },
    { href: '/blog',    label: 'Blog' },
    { href: '/about',   label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  const isActive = href =>
    href === '/' ? router.pathname === '/' : router.pathname.startsWith(href);

  return (
    <nav
      aria-label="Main navigation"
      style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(8,13,26,0.97)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #1a2d4a', padding: '0 20px',
      }}
    >
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64,
      }}>

        {/* Logo */}
        <Link
          href="/"
          aria-label="Shabelle Hub home"
          style={{
            fontFamily: 'Space Grotesk, sans-serif', fontSize: 20,
            fontWeight: 800, color: '#e8f0ff', textDecoration: 'none',
          }}
        >
          Shabelle<span style={{ color: '#14FFF4' }}>Hub</span>
        </Link>

        {/* Desktop nav — hidden below 768px via .nav-desktop in globals.css */}
        <div className="nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? 'page' : undefined}
              style={{
                padding: '8px 14px', fontSize: 14, fontWeight: 500,
                color: isActive(l.href) ? '#14FFF4' : '#6b82a8',
                textDecoration: 'none', borderRadius: 8, transition: 'color 0.2s',
              }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/tools?saved=true"
            style={{
              marginLeft: 8,
              background: 'rgba(20,255,244,0.08)', color: '#14FFF4',
              border: '1px solid rgba(20,255,244,0.25)', borderRadius: 10,
              padding: '7px 14px', fontSize: 13, fontWeight: 700, textDecoration: 'none',
            }}
          >
            ❤️{favoriteCount > 0 ? ` Saved (${favoriteCount})` : ' Saved'}
          </Link>
        </div>

        {/* Hamburger — .nav-hamburger shown on mobile via globals.css */}
        <button
          className="nav-hamburger"
          onClick={() => setOpen(o => !o)}
          style={{
            background: 'none', border: '1px solid #1a2d4a', borderRadius: 8,
            width: 42, height: 42, display: 'none',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 5, cursor: 'pointer',
          }}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          <span style={{ display: 'block', width: 18, height: 2, background: '#e8f0ff', borderRadius: 2, transition: 'all 0.3s', transform: open ? 'translateY(7px) rotate(45deg)' : 'none' }} />
          <span style={{ display: 'block', width: 18, height: 2, background: '#e8f0ff', borderRadius: 2, transition: 'all 0.3s', opacity: open ? 0 : 1 }} />
          <span style={{ display: 'block', width: 18, height: 2, background: '#e8f0ff', borderRadius: 2, transition: 'all 0.3s', transform: open ? 'translateY(-7px) rotate(-45deg)' : 'none' }} />
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div
          id="mobile-menu"
          style={{
            background: '#080d1a', borderTop: '1px solid #1a2d4a',
            padding: '8px 0 20px', display: 'flex', flexDirection: 'column',
          }}
        >
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              aria-current={isActive(l.href) ? 'page' : undefined}
              style={{
                padding: '12px 20px', fontSize: 15, fontWeight: 500,
                color: isActive(l.href) ? '#14FFF4' : '#e8f0ff',
                textDecoration: 'none',
              }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/tools?saved=true"
            onClick={() => setOpen(false)}
            style={{
              margin: '8px 20px 0',
              background: 'rgba(20,255,244,0.08)', color: '#14FFF4',
              border: '1px solid rgba(20,255,244,0.25)', borderRadius: 10,
              padding: '11px 16px', fontSize: 14, fontWeight: 700,
              textDecoration: 'none', display: 'block', textAlign: 'center',
            }}
          >
            ❤️ Saved Tools ({favoriteCount})
          </Link>
        </div>
      )}
    </nav>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
export function Footer() {
  // FIX #11: CURRENT_YEAR is a module-level constant (computed once at server
  // boot), not inside the component body. This guarantees the value is
  // identical between SSR and hydration — no mismatch risk at midnight Jan 1.
  return (
    <footer style={{ background: '#0c1522', borderTop: '1px solid #1a2d4a', padding: '36px 20px', marginTop: 'auto' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Top row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'space-between', marginBottom: 28 }}>

          {/* Brand */}
          <div style={{ maxWidth: 260 }}>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 800, color: '#e8f0ff', marginBottom: 8 }}>
              Shabelle<span style={{ color: '#14FFF4' }}>Hub</span>
            </div>
            <p style={{ color: '#6b82a8', fontSize: 13, lineHeight: 1.65 }}>
              Shabelle Hub helps users discover, compare, and choose the best AI tools
              through independent reviews, rankings, and expert insights.
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              {['AI Directory', 'AI Reviews', 'AI Comparison'].map(tag => (
                <span key={tag} style={{
                  fontSize: 11, color: '#14FFF4',
                  background: 'rgba(20,255,244,0.08)', border: '1px solid rgba(20,255,244,0.2)',
                  borderRadius: 6, padding: '3px 9px',
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div style={{ maxWidth: 260 }}>
            <h4 style={{ fontSize: 11, fontWeight: 700, color: '#e8f0ff', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              Newsletter
            </h4>
            <p style={{ color: '#6b82a8', fontSize: 13, lineHeight: 1.55, marginBottom: 14 }}>
              Weekly AI tool reviews and picks.
            </p>
            <NewsletterSignupForm source="footer" variant="compact" />
          </div>

          {/* Directory */}
          <nav aria-label="Footer directory links">
            <h4 style={{ fontSize: 11, fontWeight: 700, color: '#e8f0ff', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              Directory
            </h4>
            {categories.filter(c => c.name !== 'All').map(c => (
              <Link
                key={c.name}
                href={`/tools/category/${categoryToSlug(c.name)}`}
                style={{ display: 'block', color: '#6b82a8', fontSize: 13, marginBottom: 6, textDecoration: 'none' }}
              >
                {c.name}
              </Link>
            ))}
          </nav>

          {/* Platform */}
          <nav aria-label="Footer platform links">
            <h4 style={{ fontSize: 11, fontWeight: 700, color: '#e8f0ff', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              Platform
            </h4>
            {[
              { href: '/about',               label: 'About' },
              { href: '/team',                label: 'Our Team' },
              { href: '/blog',                label: 'AI Insights Blog' },
              { href: '/faq',                 label: 'FAQ' },
              { href: '/contact',             label: 'Contact' },
              { href: '/editorial-standards', label: 'Editorial Standards' },
              { href: '/review-methodology',  label: 'Review Methodology' },
              { href: '/content-policy',      label: 'Content Policy' },
              { href: '/site-transparency',   label: 'Site Transparency' },
              { href: '/privacy',             label: 'Privacy Policy' },
              { href: '/terms',               label: 'Terms of Service' },
              { href: '/affiliate-disclosure', label: 'Affiliate Disclosure' },
              { href: '/advertising-disclosure', label: 'Advertising Disclosure' },
            ].map(l => (
              <Link
                key={l.href}
                href={l.href}
                style={{ display: 'block', color: '#6b82a8', fontSize: 13, marginBottom: 6, textDecoration: 'none' }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom */}
        <div style={{ borderTop: '1px solid #1a2d4a', paddingTop: 20 }}>
          <p style={{ color: '#6b82a8', fontSize: 12, marginBottom: 12 }}>
            © {CURRENT_YEAR} Shabelle Hub. All rights reserved. Independent AI Discovery Platform.
          </p>
          <ComplianceBanner />
        </div>
      </div>
    </footer>
  );
}
