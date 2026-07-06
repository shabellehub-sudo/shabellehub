// components/blog/blocks/ImageBlockView.js
export default function ImageBlockView({ block }) {
  if (!block?.url) return null;

  const maxWidth = block.width === 'full' ? '100%'
    : block.width === 'wide' ? 860
    : 620;
  const align = block.alignment === 'left' ? 'flex-start'
    : block.alignment === 'right' ? 'flex-end'
    : 'center';

  return (
    <figure style={{ margin: '28px 0', display: 'flex', flexDirection: 'column', alignItems: align }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={block.url}
        alt={block.alt || ''}
        loading="lazy"
        decoding="async"
        style={{ maxWidth: '100%', width: maxWidth, borderRadius: 10, display: 'block' }}
      />
      {block.caption && (
        <figcaption style={{ fontSize: 12, color: '#6b82a8', marginTop: 8, textAlign: 'center', fontStyle: 'italic' }}>
          {block.caption}
        </figcaption>
      )}
    </figure>
  );
}
