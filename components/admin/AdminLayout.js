// components/admin/AdminLayout.js — Mobile Responsive with Hamburger Menu
import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useRequireAuth } from '../../lib/cms/useAuth';
import { isSupabaseConfigured as isFirebaseConfigured } from '../../lib/supabase';

const NAV_SECTIONS = [
  {
    section: null,
    items: [
      { href: '/admin', label: 'Overview', icon: '📊' },
    ],
  },
  {
    section: 'Content',
    items: [
      { href: '/admin/tools',      label: 'Tools',      icon: '🛠️' },
      { href: '/admin/posts',      label: 'Posts',      icon: '📝' },
      { href: '/admin/categories', label: 'Categories', icon: '🗂️' },
      { href: '/admin/tags',       label: 'Tags',       icon: '🏷️' },
      { href: '/admin/media',      label: 'Media',      icon: '🖼️' },
      { href: '/admin/authors',    label: 'Authors',    icon: '🧑‍💼' },
      { href: '/admin/blog-seo',   label: 'Blog SEO',   icon: '🔍' },
    ],
  },
  {
    section: 'Website',
    items: [
      { href: '/admin/homepage',      label: 'Homepage',      icon: '🏠' },
      { href: '/admin/navigation',    label: 'Navigation',    icon: '🔗' },
      { href: '/admin/footer',        label: 'Footer',        icon: '⬇️' },
      { href: '/admin/announcements', label: 'Announcements', icon: '📣' },
      { href: '/admin/about',         label: 'About Page',    icon: '💡' },
      { href: '/admin/contact',       label: 'Contact Page',  icon: '📬' },
    ],
  },
  {
    section: 'Monetisation',
    items: [
      { href: '/admin/affiliates', label: 'Affiliates', icon: '🔗' },
    ],
  },
  {
    section: 'Marketing',
    items: [
      { href: '/admin/newsletter/subscribers', label: 'Subscribers', icon: '👥' },
      { href: '/admin/newsletter/campaigns',   label: 'Campaigns',   icon: '📨' },
      { href: '/admin/newsletter/templates',   label: 'Templates',   icon: '✉️'  },
    ],
  },
  {
    section: 'Admin',
    adminOnly: true,
    items: [
      { href: '/admin/site-settings', label: 'Site Settings', icon: '🌐' },
      { href: '/admin/users',         label: 'Users',         icon: '🔐' },
      { href: '/admin/settings',      label: 'Settings',      icon: '⚙️' },
    ],
  },
];

function isActive(href, pathname) {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(href + '/');
}

export default function AdminLayout({ children, title, requiredRole = 'editor' }) {
  const router       = useRouter();
  const auth         = useRequireAuth(requiredRole);
  const signingOut   = useRef(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [router.pathname]);

  // Close sidebar on outside click
  useEffect(() => {
    if (!sidebarOpen) return;
    function handleClick(e) {
      if (!e.target.closest('#admin-sidebar') && !e.target.closest('#hamburger-btn')) {
        setSidebarOpen(false);
      }
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [sidebarOpen]);

  async function handleSignOut() {
    if (signingOut.current) return;
    signingOut.current = true;
    await auth.signOut();
    router.replace('/admin/login');
  }

  if (auth.status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080d1a' }}>
        <p style={{ color: '#6b82a8', fontFamily: 'Inter, sans-serif', fontSize: 14 }}>Loading…</p>
      </div>
    );
  }

  const sidebarContent = (
    <>
      {/* Logo + close button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <Link href="/admin" style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 800, fontSize: 15, color: '#14FFF4',
          textDecoration: 'none',
        }}>
          Shabelle Hub
        </Link>
        {/* Mobile close button */}
        <button
          onClick={() => setSidebarOpen(false)}
          style={{
            display: 'none',
            background: 'none', border: 'none', color: '#6b82a8',
            fontSize: 20, cursor: 'pointer', padding: '0 4px',
            lineHeight: 1,
          }}
          className="sidebar-close-btn"
          aria-label="Close menu"
        >
          ✕
        </button>
      </div>

      <nav style={{ flex: 1 }}>
        {NAV_SECTIONS.filter(s => !s.adminOnly || auth.isAdmin).map(s => (
          <div key={s.section || 'main'} style={{ marginBottom: s.section ? 16 : 4 }}>
            {s.section && (
              <div style={{
                fontSize: 10, fontWeight: 700, color: '#3d5470',
                textTransform: 'uppercase', letterSpacing: 0.8,
                padding: '0 12px', marginBottom: 4, marginTop: 8,
              }}>
                {s.section}
              </div>
            )}
            {s.items.map(n => {
              const active = isActive(n.href, router.pathname);
              return (
                <Link key={n.href} href={n.href} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 8, marginBottom: 1,
                  textDecoration: 'none', fontSize: 13, fontWeight: 600,
                  color:      active ? '#14FFF4' : '#9fb3d4',
                  background: active ? 'rgba(20,255,244,0.08)' : 'transparent',
                  transition: 'background 0.12s, color 0.12s',
                }}>
                  <span aria-hidden="true" style={{ fontSize: 15 }}>{n.icon}</span>
                  {n.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {auth.status === 'authenticated' && (
        <div style={{ paddingTop: 16, borderTop: '1px solid #1a2d4a' }}>
          <div style={{ fontSize: 11, color: '#14FFF4', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
            {auth.role}
          </div>
          <div style={{ fontSize: 12, color: '#6b82a8', marginBottom: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {auth.user?.email}
          </div>
          <button onClick={handleSignOut} style={{
            background: 'none', border: '1px solid #2a3d5c', color: '#9fb3d4',
            borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Sign out
          </button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* ── Responsive styles ── */}
      <style>{`
        /* Mobile top bar */
        .admin-topbar {
          display: none;
        }
        /* Sidebar close button */
        .sidebar-close-btn {
          display: none !important;
        }
        /* Overlay */
        .sidebar-overlay {
          display: none;
        }

        @media (max-width: 768px) {
          .admin-topbar {
            display: flex !important;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            background: #0a0f1e;
            border-bottom: 1px solid #1a2d4a;
            position: sticky;
            top: 0;
            z-index: 100;
          }
          .admin-desktop-sidebar {
            display: none !important;
          }
          .admin-mobile-sidebar {
            display: flex !important;
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            width: 260px;
            z-index: 200;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
          }
          .admin-mobile-sidebar.open {
            transform: translateX(0);
          }
          .sidebar-close-btn {
            display: block !important;
          }
          .sidebar-overlay {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.6);
            z-index: 199;
          }
          .admin-main {
            padding: 16px !important;
          }
        }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', background: '#080d1a', color: '#e8f0ff', fontFamily: 'Inter, sans-serif' }}>

        {/* ── Desktop Sidebar ── */}
        <aside className="admin-desktop-sidebar" style={{
          width: 220, flexShrink: 0, borderRight: '1px solid #1a2d4a',
          padding: '20px 14px', display: 'flex', flexDirection: 'column',
          position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
        }}>
          {sidebarContent}
        </aside>

        {/* ── Mobile Overlay ── */}
        {sidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── Mobile Sidebar ── */}
        <aside
          id="admin-sidebar"
          className={`admin-mobile-sidebar${sidebarOpen ? ' open' : ''}`}
          style={{
            background: '#0a0f1e',
            borderRight: '1px solid #1a2d4a',
            padding: '20px 14px',
            flexDirection: 'column',
            overflowY: 'auto',
          }}
        >
          {sidebarContent}
        </aside>

        {/* ── Main Content ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* Mobile Top Bar */}
          <div className="admin-topbar">
            <button
              id="hamburger-btn"
              onClick={() => setSidebarOpen(v => !v)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '4px 8px', borderRadius: 6,
                color: '#14FFF4', fontSize: 22, lineHeight: 1,
              }}
              aria-label="Open menu"
            >
              ☰
            </button>
            <span style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 800, fontSize: 15, color: '#14FFF4',
            }}>
              {title || 'Shabelle Hub'}
            </span>
            <div style={{ width: 40 }} />
          </div>

          {/* Page content */}
          <main className="admin-main" style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
            {!isFirebaseConfigured() && (
              <div style={{
                background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.3)',
                borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#ff8080',
                lineHeight: 1.6, marginBottom: 24,
              }}>
                <strong>Firebase not configured.</strong> Add environment variables to Vercel and redeploy.
              </div>
            )}

            {title && (
              <h1 style={{
                fontFamily: 'Space Grotesk, sans-serif', fontSize: 22,
                fontWeight: 800, marginBottom: 24, color: '#e8f0ff',
              }}>
                {title}
              </h1>
            )}

            {auth.status === 'no-role' ? (
              <div style={{ background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: 10, padding: 24, color: '#ff8080', fontSize: 13, lineHeight: 1.7 }}>
                <strong style={{ display: 'block', marginBottom: 8 }}>No role assigned.</strong>
                Your account (<code>{auth.user?.uid}</code>) has no role in Firestore.
                Create a document at <code>users/{auth.user?.uid}</code> and set <code>role</code> to <code>&quot;admin&quot;</code> or <code>&quot;editor&quot;</code>.
              </div>
            ) : children}
          </main>
        </div>
      </div>
    </>
  );
}
