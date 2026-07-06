import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { DefaultSeo } from 'next-seo';
import { Navbar, Footer } from '../components/Layout';
import { defaultSEO } from '../lib/seo';
import Analytics from '../components/Analytics';
import AdSenseScript from '../components/AdSenseScript';
import '../styles/globals.css';
import '../styles/tokens.css';
import AnnouncementBanner from '../components/AnnouncementBanner';

export default function App({ Component, pageProps }) {
  const router = useRouter();
  // Admin routes get no public chrome (Navbar / Footer)
  const isAdminRoute = router.pathname.startsWith('/admin');

  const [isMounted, setIsMounted] = useState(false);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    setIsMounted(true);
    try {
      const raw = localStorage.getItem('sh_favorites');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setFavorites(parsed);
      }
    } catch { /* private browsing / quota */ }
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem('sh_favorites', JSON.stringify(favorites));
    } catch { /* fail silently */ }
  }, [favorites, isMounted]);

  // Phase 5: stable reference so memo(ToolCard) actually skips re-renders.
  // Uses the functional setState form, so it never needs `favorites` as a
  // dependency and never changes identity across renders.
  const toggleFavorite = useCallback((id) => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  }, []);

  const favoriteCount = isMounted ? favorites.length : 0;

  if (isAdminRoute) {
    // Admin pages manage their own layout via AdminLayout component
    return (
      <>
        <DefaultSeo {...defaultSEO} />
        <Analytics />
        <Component {...pageProps} />
      </>
    );
  }

  return (
    <>
      <DefaultSeo {...defaultSEO} />
      <Analytics />
      <AdSenseScript />
      <AnnouncementBanner />
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar favoriteCount={favoriteCount} />
        <main id="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Component
            {...pageProps}
            favorites={isMounted ? favorites : []}
            toggleFavorite={toggleFavorite}
          />
        </main>
        <Footer />
      </div>
    </>
  );
}
