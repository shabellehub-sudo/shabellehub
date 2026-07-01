import { useEffect, useState, useCallback, useRef } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { AdminCard, Button, TextInput, ErrorBanner, EmptyState } from '../../../components/admin/ui';
import { listMedia, uploadMedia, deleteMedia, replaceMedia, updateMediaAltText } from '../../../lib/cms/media';
import { useAuth } from '../../../lib/cms/useAuth';
import { isSupabaseConfigured as isFirebaseConfigured } from '../../../lib/supabase';

export default function AdminMediaPage() {
  const auth = useAuth();
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const replaceInputRef = useRef(null);
  const replaceTargetRef = useRef(null);

  const load = useCallback(async () => {
    if (!isFirebaseConfigured()) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await listMedia({ search: search || undefined });
    setMedia(data);
    setError(error);
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { error } = await uploadMedia(file, { userId: auth.user?.id });
    setUploading(false);
    if (error) { setError(error); return; }
    e.target.value = '';
    load();
  }

  async function handleDelete(item) {
    if (!window.confirm(`Delete "${item.file_name}"? This cannot be undone.`)) return;
    const { error } = await deleteMedia(item.id, item.storage_path);
    if (error) { setError(error); return; }
    load();
  }

  function triggerReplace(item) {
    replaceTargetRef.current = item;
    replaceInputRef.current?.click();
  }

  async function handleReplaceFile(e) {
    const file = e.target.files?.[0];
    const target = replaceTargetRef.current;
    if (!file || !target) return;
    setUploading(true);
    const { error } = await replaceMedia(target.id, target.storage_path, file, { userId: auth.user?.id });
    setUploading(false);
    e.target.value = '';
    if (error) { setError(error); return; }
    load();
  }

  async function handleAltTextBlur(item, value) {
    if (value === item.alt_text) return;
    await updateMediaAltText(item.id, value);
  }

  function copyUrl(url) {
    navigator.clipboard?.writeText(url);
  }

  return (
    <AdminLayout title="Media Library">
      <ErrorBanner message={error} />

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextInput placeholder="Search by file name…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: 0, minWidth: 260 }} />
        <Button onClick={() => fileInputRef.current?.click()} disabled={uploading || !isFirebaseConfigured()}>
          {uploading ? 'Uploading…' : '+ Upload Image'}
        </Button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
        <input ref={replaceInputRef} type="file" accept="image/*" onChange={handleReplaceFile} style={{ display: 'none' }} />
      </div>

      {!isFirebaseConfigured() ? (
        <EmptyState message="No database connection." sub="Configure Firebase and Firebase Storage to upload files." />
      ) : loading ? (
        <p style={{ color: '#6b82a8' }}>Loading…</p>
      ) : media.length === 0 ? (
        <EmptyState message="No media uploaded yet." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {media.map(item => (
            <AdminCard key={item.id} style={{ padding: 12 }}>
              <div style={{
                width: '100%', aspectRatio: '4/3', borderRadius: 8, overflow: 'hidden',
                background: '#080d1a', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {item.mime_type?.startsWith('image/') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.public_url} alt={item.alt_text || item.file_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ color: '#6b82a8', fontSize: 12 }}>{item.file_name}</span>
                )}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, wordBreak: 'break-all' }}>{item.file_name}</div>
              <input
                defaultValue={item.alt_text || ''}
                placeholder="Alt text…"
                onBlur={(e) => handleAltTextBlur(item, e.target.value)}
                style={{ width: '100%', background: '#080d1a', border: '1px solid #2a3d5c', borderRadius: 6, padding: '6px 8px', color: '#e8f0ff', fontSize: 12, marginBottom: 8 }}
              />
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Button variant="secondary" onClick={() => copyUrl(item.public_url)} style={{ fontSize: 11, padding: '5px 8px' }}>Copy URL</Button>
                <Button variant="secondary" onClick={() => triggerReplace(item)} style={{ fontSize: 11, padding: '5px 8px' }}>Replace</Button>
                <Button variant="danger" onClick={() => handleDelete(item)} style={{ fontSize: 11, padding: '5px 8px' }}>Delete</Button>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
