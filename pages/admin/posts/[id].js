import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import PostEditor from '../../../components/admin/PostEditor';
import { getPostById } from '../../../lib/cms/posts';
import { isSupabaseConfigured as isFirebaseConfigured } from '../../../lib/supabase';
import { ErrorBanner, EmptyState } from '../../../components/admin/ui';

export default function EditPostPage() {
  const router = useRouter();
  const { id } = router.query;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id || !isFirebaseConfigured()) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const { data, error } = await getPostById(id);
      setPost(data);
      setError(error);
      setLoading(false);
    })();
  }, [id]);

  return (
    <AdminLayout title="Edit Post">
      <ErrorBanner message={error} />
      {!isFirebaseConfigured() ? (
        <EmptyState message="No database connection." sub="Configure Firebase to edit posts." />
      ) : loading ? (
        <p style={{ color: '#6b82a8' }}>Loading…</p>
      ) : !post ? (
        <EmptyState message="Post not found." />
      ) : (
        <PostEditor mode="edit" initialPost={post} onSaved={() => router.push('/admin/posts')} />
      )}
    </AdminLayout>
  );
}
