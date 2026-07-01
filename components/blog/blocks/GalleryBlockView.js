// components/blog/blocks/GalleryBlockView.js
import { useState } from 'react';

export default function GalleryBlockView({ block }) {
  const [lightbox, setLightbox] = useState(null);
  const images  = block?.images || [];
  const cols    = block?.columns || 3;
  const layout  = block?.layout  || 'grid';

  if (images.length === 0) return null;

  const gridStyle = layout === 'masonry'
    ? { columns: cols, columnGap: 12 }
    : { display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10 };

  return (
    <>
      <div style={{ ...gridStyle, margin: '28px 0' }}>
        {images.map((img, i) => (
          <figure key={i} style={{ margin: layout === 'masonry' ? '0 0 12px' : 0, breakInside: 'avoid' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.alt || ''}
              loading="lazy"
              onClick={() => setLightbox(i)}
              style={{ width: '100%', borderRadius: 8, display: 'block', cursor: 'zoom-in', objectFit: 'cover', ...(layout !== 'masonry' ? { aspectRatio: '4/3' } : {}) }}
            />
            {img.caption && (
              <figcaption style={{ fontSize: 11, color: '#6b82a8', marginTop: 4, textAlign: 'center' }}>{img.caption}</figcaption>
            )}
          </figure>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(8,13,26,0.96)',
            zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          <button
            onClick={() => setLightbox(l => Math.max(0, l - 1))}
            style={{ position: 'fixed', left: 20, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 44, height: 44, color: '#e8f0ff', fontSize: 20, cursor: 'pointer' }}
          >‹</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[lightbox]?.url}
            alt={images[lightbox]?.alt || ''}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 10, objectFit: 'contain' }}
          />
          <button
            onClick={() => setLightbox(l => Math.min(images.length - 1, l + 1))}
            style={{ position: 'fixed', right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 44, height: 44, color: '#e8f0ff', fontSize: 20, cursor: 'pointer' }}
          >›</button>
          <button
            onClick={() => setLightbox(null)}
            style={{ position: 'fixed', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 36, height: 36, color: '#e8f0ff', fontSize: 18, cursor: 'pointer' }}
          >×</button>
        </div>
      )}
    </>
  );
}
