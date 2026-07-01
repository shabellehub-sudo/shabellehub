// components/blog/blocks/QuoteBlockView.js
export default function QuoteBlockView({ block }) {
  if (!block?.text) return null;

  return (
    <blockquote style={{
      margin: '28px 0', borderLeft: '3px solid #14FFF4',
      paddingLeft: 20, paddingTop: 4, paddingBottom: 4,
    }}>
      <p style={{ fontSize: 17, lineHeight: 1.75, color: '#9fb3d4', fontStyle: 'italic', margin: '0 0 10px' }}>
        &ldquo;{block.text}&rdquo;
      </p>
      {block.author && (
        <footer style={{ fontSize: 13, color: '#6b82a8' }}>
          <strong style={{ color: '#e8f0ff' }}>{block.author}</strong>
          {block.source && (
            <>
              {' — '}
              {block.source.startsWith('http')
                ? <a href={block.source} target="_blank" rel="noopener noreferrer" style={{ color: '#14FFF4' }}>{block.source}</a>
                : <span>{block.source}</span>}
            </>
          )}
        </footer>
      )}
    </blockquote>
  );
}
