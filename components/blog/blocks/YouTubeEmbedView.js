// components/blog/blocks/YouTubeEmbedView.js
import { extractYouTubeId } from '../../../lib/cms/blocks';

export default function YouTubeEmbedView({ block }) {
  const videoId = block?.videoId || extractYouTubeId(block?.url || '');
  if (!videoId) return null;

  return (
    <div style={{ margin: '28px 0' }}>
      <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 12, background: '#080d1a' }}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?loading=lazy`}
          title={block?.title || 'YouTube video'}
          frameBorder="0"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        />
      </div>
      {block?.title && (
        <p style={{ fontSize: 12, color: '#6b82a8', marginTop: 8, textAlign: 'center', fontStyle: 'italic' }}>
          {block.title}
        </p>
      )}
    </div>
  );
}
