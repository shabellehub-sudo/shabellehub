// components/admin/blocks/YouTubeBlock.js
import { extractYouTubeId } from '../../../lib/cms/blocks';

const inp = {
  width: '100%', boxSizing: 'border-box',
  background: '#080d1a', border: '1px solid #1a2d4a', borderRadius: 8,
  padding: '9px 12px', fontSize: 13, color: '#e8f0ff', outline: 'none',
  fontFamily: 'Inter, sans-serif',
};
const label = (t) => (
  <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b82a8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }}>{t}</span>
);

export default function YouTubeBlock({ block, onChange }) {
  function update(key, val) { onChange({ ...block, [key]: val }); }

  function handleUrlChange(url) {
    const id = extractYouTubeId(url);
    onChange({ ...block, url, videoId: id || '' });
  }

  const videoId = block.videoId || extractYouTubeId(block.url || '');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        {label('YouTube URL')}
        <input
          style={inp}
          value={block.url || ''}
          onChange={e => handleUrlChange(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=…"
        />
      </div>

      <div>
        {label('Title (for accessibility)')}
        <input
          style={inp}
          value={block.title || ''}
          onChange={e => update('title', e.target.value)}
          placeholder="Video title…"
        />
      </div>

      {videoId ? (
        <div style={{ background: '#080d1a', border: '1px solid #1a2d4a', borderRadius: 8, overflow: 'hidden', aspectRatio: '16/9', maxWidth: 480 }}>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}?loading=lazy`}
            title={block.title || 'YouTube video'}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        </div>
      ) : block.url ? (
        <p style={{ fontSize: 12, color: '#ff8080' }}>Could not extract video ID from URL.</p>
      ) : null}
    </div>
  );
}
