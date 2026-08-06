// pages/admin/tools/[id].js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import ToolEditor from '../../../components/admin/ToolEditor';
import { getToolById } from '../../../lib/cms/tools';
import { isSupabaseConfigured } from '../../../lib/supabase';
import { ErrorBanner, EmptyState } from '../../../components/admin/ui';

export default function EditToolPage() {
  const router = useRouter();
  const { id } = router.query;
  const [tool, setTool]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    if (!id || !isSupabaseConfigured()) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const { data, error } = await getToolById(id);
      setTool(data);
      setError(error);
      setLoading(false);
    })();
  }, [id]);

  return (
    <AdminLayout title={tool ? `Edit: ${tool.name}` : 'Edit Tool'}>
      <ErrorBanner message={error} />
      {!isSupabaseConfigured() ? (
        <EmptyState message="Supabase not configured." />
      ) : loading ? (
        <p style={{ color: '#6b82a8', fontSize: 13 }}>Loading…</p>
      ) : !tool ? (
        <EmptyState message="Tool not found." sub="It may have been deleted." />
      ) : (
        <ToolEditor
          mode="edit"
          initialTool={tool}
          onSaved={(t) => {
            if (t?.deleted) { router.replace('/admin/tools'); return; }
            // Re-fetch to reflect latest saved state
            setTool(t);
          }}
        />
      )}
    </AdminLayout>
  );
}
