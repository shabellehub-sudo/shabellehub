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
import { spaceGrotesk, inter } from '../lib/fonts';

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

  // useCallback + functional setState updater ([] deps is safe here since we
  // never read `favorites` directly in the closure) — this keeps the function
  // reference stable across renders, which is required for React.memo on
  // ToolCard to actually skip re-renders when an unrelated favorite toggles.
  const toggleFavorite = useCallback((id) => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  }, []);

  const favoriteCount = isMounted ? favorites.length : 0;

  if (isAdminRoute) {
    // Admin pages manage their own layout via AdminLayout component
    return (
      <div className={`${spaceGrotesk.variable} ${inter.variable}`}>
        <DefaultSeo {...defaultSEO} />
        <Analytics />
        <Component {...pageProps} />
      </div>
    );
  }

  return (
    <>
      <DefaultSeo {...defaultSEO} />
      <Analytics />
      <AdSenseScript />
      <AnnouncementBanner />
      <div
        className={`${spaceGrotesk.variable} ${inter.variable}`}
        style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
      >
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
