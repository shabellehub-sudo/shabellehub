import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import AdminLayout from '../../../components/admin/AdminLayout';
import { AdminCard, Button, StatusBadge, EmptyState, ErrorBanner, TextInput, Select } from '../../../components/admin/ui';
import { listPosts, deletePost } from '../../../lib/cms/posts';
import { isSupabaseConfigured as isFirebaseConfigured } from '../../../lib/supabase';

export default function AdminPostsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    if (!isFirebaseConfigured()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await listPosts({ status: status || undefined, search: search || undefined });
    setPosts(data);
    setError(error);
    setLoading(false);
  }, [status, search]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id, title) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    const { error } = await deletePost(id);
    if (error) { setError(error); return; }
    load();
  }

  return (
    <AdminLayout title="Posts">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 10, flex: 1, maxWidth: 480 }}>
          <TextInput placeholder="Search by title…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: 0 }} />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} style={{ marginBottom: 0, minWidth: 140 }}>
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
            <option value="unpublished">Unpublished</option>
          </Select>
        </div>
        <Link href="/admin/posts/new"><Button>+ New Post</Button></Link>
      </div>

      <ErrorBanner message={error} />

      {!isFirebaseConfigured() ? (
        <EmptyState message="No database connection." sub="Configure Firebase to manage posts here." />
      ) : loading ? (
        <p style={{ color: '#6b82a8' }}>Loading…</p>
      ) : posts.length === 0 ? (
        <EmptyState message="No posts found." sub="Create your first post to get started." />
      ) : (
        <AdminCard style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a2d4a', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', color: '#6b82a8', fontWeight: 600 }}>Title</th>
                <th style={{ padding: '12px 16px', color: '#6b82a8', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 16px', color: '#6b82a8', fontWeight: 600 }}>Category</th>
                <th style={{ padding: '12px 16px', color: '#6b82a8', fontWeight: 600 }}>Author</th>
                <th style={{ padding: '12px 16px', color: '#6b82a8', fontWeight: 600 }}>Updated</th>
                <th style={{ padding: '12px 16px' }}></th>
              </tr>
            </thead>
            <tbody>
              {posts.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #14213a' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                    <Link href={`/admin/posts/${p.id}`} style={{ color: '#e8f0ff', textDecoration: 'none' }}>{p.title}</Link>
                  </td>
                  <td style={{ padding: '12px 16px' }}><StatusBadge status={p.status} /></td>
                  <td style={{ padding: '12px 16px', color: '#9fb3d4' }}>{p.category?.name || '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#9fb3d4' }}>{p.author?.name || '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#6b82a8' }}>{new Date(p.updated_at).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <Button variant="danger" onClick={() => handleDelete(p.id, p.title)} style={{ padding: '5px 10px', fontSize: 12 }}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminCard>
      )}
    </AdminLayout>
  );
}
