// components/blog/blocks/GalleryBlockView.js
import { useState, useEffect, useCallback } from 'react';

export default function GalleryBlockView({ block }) {
  const [lightbox, setLightbox] = useState(null);
  const images  = block?.images || [];
  const cols    = block?.columns || 3;
  const layout  = block?.layout  || 'grid';

  const goPrev = useCallback(() => setLightbox(l => (l === null ? l : Math.max(0, l - 1))), []);
  const goNext = useCallback(() => setLightbox(l => (l === null ? l : Math.min(images.length - 1, l + 1))), [images.length]);
  const close  = useCallback(() => setLightbox(null), []);

  // Phase 5 (accessibility): the lightbox is keyboard-operable — Escape
  // closes it, arrow keys navigate — matching what a mouse user already
  // gets from the on-screen buttons.
  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, close, goPrev, goNext]);

  if (images.length === 0) return null;

  const gridStyle = layout === 'masonry'
    ? { columns: cols, columnGap: 12 }
    : { display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10 };

  return (
    <>
      <div style={{ ...gridStyle, margin: '28px 0' }}>
        {images.map((img, i) => (
          <figure key={i} style={{ margin: layout === 'masonry' ? '0 0 12px' : 0, breakInside: 'avoid' }}>
            {/* Phase 5 (accessibility): a real <button> around the image so
                keyboard/screen-reader users can open the lightbox too —
                an onClick handler on a bare <img> is mouse-only. */}
            <button
              type="button"
              onClick={() => setLightbox(i)}
              aria-label={img.alt ? `Open image: ${img.alt}` : `Open image ${i + 1} of ${images.length}`}
              style={{ display: 'block', width: '100%', padding: 0, border: 'none', background: 'none', cursor: 'zoom-in' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.alt || ''}
                loading="lazy"
                decoding="async"
                style={{ width: '100%', borderRadius: 8, display: 'block', objectFit: 'cover', ...(layout !== 'masonry' ? { aspectRatio: '4/3' } : {}) }}
              />
            </button>
            {img.caption && (
              <figcaption style={{ fontSize: 11, color: '#6b82a8', marginTop: 4, textAlign: 'center' }}>{img.caption}</figcaption>
            )}
          </figure>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={images[lightbox]?.alt || `Image ${lightbox + 1} of ${images.length}`}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(8,13,26,0.96)',
            zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            aria-label="Previous image"
            disabled={lightbox === 0}
            style={{ position: 'fixed', left: 20, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 44, height: 44, color: '#e8f0ff', fontSize: 20, cursor: 'pointer', opacity: lightbox === 0 ? 0.4 : 1 }}
          >‹</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[lightbox]?.url}
            alt={images[lightbox]?.alt || ''}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 10, objectFit: 'contain' }}
          />
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            aria-label="Next image"
            disabled={lightbox === images.length - 1}
            style={{ position: 'fixed', right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 44, height: 44, color: '#e8f0ff', fontSize: 20, cursor: 'pointer', opacity: lightbox === images.length - 1 ? 0.4 : 1 }}
          >›</button>
          <button
            onClick={(e) => { e.stopPropagation(); close(); }}
            aria-label="Close image viewer"
            style={{ position: 'fixed', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 36, height: 36, color: '#e8f0ff', fontSize: 18, cursor: 'pointer' }}
          >×</button>
        </div>
      )}
    </>
  );
}
