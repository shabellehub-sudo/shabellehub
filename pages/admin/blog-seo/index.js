// pages/admin/blog-seo/index.js — Bulk SEO Manager for Blog Posts
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import AdminLayout from '../../../components/admin/AdminLayout';
import { AdminCard, Button, ErrorBanner, EmptyState } from '../../../components/admin/ui';
import { listPostsSEOSummary, updatePostSEO } from '../../../lib/cms/posts';
import { isSupabaseConfigured as isFirebaseConfigured } from '../../../lib/supabase';
import { useAuth } from '../../../lib/cms/useAuth';

function CharCount({ value, max }) {
  const len = (value || '').length;
  const color = len === 0 ? '#6b82a8' : len > max ? '#ff8080' : '#00d084';
  return <span style={{ fontSize: 11, color, marginLeft: 6 }}>{len}/{max}</span>;
}

function SEORow({ post, onSave }) {
  const [seoTitle, setSeoTitle]   = useState(post.seo_title || '');
  const [seoDesc,  setSeoDesc]    = useState(post.seo_description || '');
  const [saving,   setSaving]     = useState(false);
  const [saved,    setSaved]      = useState(false);
  const [err,      setErr]        = useState(null);

  const dirty = seoTitle !== (post.seo_title || '') || seoDesc !== (post.seo_description || '');

  async function save() {
    setSaving(true); setErr(null); setSaved(false);
    const { error } = await onSave(post.id, { seo_title: seoTitle, seo_description: seoDesc });
    setSaving(false);
    if (error) { setErr(error); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ borderBottom: '1px solid #14213a', padding: '14px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <Link href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer"
             style={{ color: '#e8f0ff', fontWeight: 700, fontSize: 13.5, textDecoration: 'none' }}>
            {post.title}
          </Link>
          <code style={{ display: 'block', fontSize: 11, color: '#6b82a8', marginTop: 3 }}>
            /blog/{post.slug}
          </code>
        </div>
        {dirty ? (
          <Button onClick={save} disabled={saving} style={{ fontSize: 12, padding: '5px 12px' }}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        ) : saved ? (
          <span style={{ fontSize: 12, color: '#00d084', fontWeight: 600 }}>✓ Saved</span>
        ) : null}
      </div>
      {err && <p style={{ color: '#ff8080', fontSize: 12, marginBottom: 8 }}>{err}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <label>
          <div style={{ fontSize: 11.5, color: '#9fb3d4', fontWeight: 600, marginBottom: 4 }}>
            SEO Title <CharCount value={seoTitle} max={60} />
            {!seoTitle && <span style={{ color: '#ffc147', marginLeft: 6, fontSize: 11 }}>missing</span>}
          </div>
          <input
            value={seoTitle}
            onChange={e => setSeoTitle(e.target.value)}
            placeholder={post.title}
            style={{ width: '100%', background: '#080d1a', border: '1px solid #2a3d5c', borderRadius: 6, padding: '8px 10px', color: '#e8f0ff', fontSize: 13, boxSizing: 'border-box' }}
          />
        </label>
        <label>
          <div style={{ fontSize: 11.5, color: '#9fb3d4', fontWeight: 600, marginBottom: 4 }}>
            Meta Description <CharCount value={seoDesc} max={160} />
            {!seoDesc && <span style={{ color: '#ffc147', marginLeft: 6, fontSize: 11 }}>missing</span>}
          </div>
          <textarea
            value={seoDesc}
            onChange={e => setSeoDesc(e.target.value)}
            rows={2}
            style={{ width: '100%', background: '#080d1a', border: '1px solid #2a3d5c', borderRadius: 6, padding: '8px 10px', color: '#e8f0ff', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
          />
        </label>
      </div>
    </div>
  );
}

export default function BlogSEOPage() {
  const auth    = useAuth();
  const [posts,   setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [filter,  setFilter]  = useState('all'); // 'all' | 'missing'

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await listPostsSEOSummary();
    setPosts(data || []);
    setError(error);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = useCallback(async (id, payload) => {
    return updatePostSEO(id, payload, auth.user?.uid);
  }, [auth.user?.uid]);

  const filtered = filter === 'missing'
    ? posts.filter(p => !p.seo_title || !p.seo_description)
    : posts;

  const missingCount = posts.filter(p => !p.seo_title || !p.seo_description).length;

  return (
    <AdminLayout title="Blog SEO Manager">
      <ErrorBanner message={error} />

      {/* Summary bar */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 10, padding: '12px 18px' }}>
          <div style={{ fontSize: 11, color: '#6b82a8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Published Posts</div>
          <div style={{ fontFamily: 'Space Grotesk', fontSize: 24, fontWeight: 800, color: '#14FFF4' }}>{posts.length}</div>
        </div>
        <div style={{ background: '#0f1829', border: '1px solid #1a2d4a', borderRadius: 10, padding: '12px 18px' }}>
          <div style={{ fontSize: 11, color: '#6b82a8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Missing SEO</div>
          <div style={{ fontFamily: 'Space Grotesk', fontSize: 24, fontWeight: 800, color: missingCount > 0 ? '#ffc147' : '#00d084' }}>{missingCount}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
          <button onClick={() => setFilter('all')} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', border: '1px solid #2a3d5c', background: filter === 'all' ? 'rgba(20,255,244,0.1)' : 'transparent', color: filter === 'all' ? '#14FFF4' : '#9fb3d4' }}>All Posts</button>
          <button onClick={() => setFilter('missing')} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', border: '1px solid #2a3d5c', background: filter === 'missing' ? 'rgba(255,193,71,0.1)' : 'transparent', color: filter === 'missing' ? '#ffc147' : '#9fb3d4' }}>Missing Only ({missingCount})</button>
        </div>
      </div>

      {!isFirebaseConfigured() ? (
        <EmptyState message="Firebase not configured." sub="Add environment variables to get started." />
      ) : loading ? (
        <p style={{ color: '#6b82a8' }}>Loading…</p>
      ) : filtered.length === 0 ? (
        <EmptyState message={filter === 'missing' ? 'All posts have SEO metadata! 🎉' : 'No published posts yet.'} />
      ) : (
        <AdminCard>
          {filtered.map(post => (
            <SEORow key={post.id} post={post} onSave={handleSave} />
          ))}
        </AdminCard>
      )}
    </AdminLayout>
  );
}
