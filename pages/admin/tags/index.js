// pages/admin/tags/index.js — Tag manager (create, edit inline, delete)
import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import {
  AdminCard, Button, TextInput, ErrorBanner, EmptyState,
} from '../../../components/admin/ui';
import { listTags, createTag, updateTag, deleteTag } from '../../../lib/cms/tags';
import { isSupabaseConfigured as isFirebaseConfigured } from '../../../lib/supabase';

function slugify(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function AdminTagsPage() {
  const [tags,       setTags]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [newName,    setNewName]    = useState('');
  const [newSlug,    setNewSlug]    = useState('');
  const [slugLocked, setSlugLocked] = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [editId,     setEditId]     = useState(null);
  const [editName,   setEditName]   = useState('');
  const [editSlug,   setEditSlug]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await listTags();
    setTags(data || []);
    setError(error);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleNewNameChange(v) {
    setNewName(v);
    if (!slugLocked) setNewSlug(slugify(v));
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true); setError(null);
    const { error } = await createTag({ name: newName.trim(), slug: newSlug.trim() });
    setSaving(false);
    if (error) { setError(error); return; }
    setNewName(''); setNewSlug(''); setSlugLocked(false);
    load();
  }

  async function handleUpdate(id) {
    setSaving(true); setError(null);
    const { error } = await updateTag(id, { name: editName.trim(), slug: editSlug.trim() });
    setSaving(false);
    if (error) { setError(error); return; }
    setEditId(null);
    load();
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete tag "${name}"? Posts using this tag will lose it.`)) return;
    const { error } = await deleteTag(id);
    if (error) { setError(error); return; }
    load();
  }

  function startEdit(tag) {
    setEditId(tag.id);
    setEditName(tag.name);
    setEditSlug(tag.slug);
  }

  const rowStyle = { borderBottom: '1px solid #14213a', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px' };
  const labelStyle = { fontSize: 11, color: '#6b82a8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 };

  return (
    <AdminLayout title="Tags">
      <ErrorBanner message={error} />

      {/* ── Create form ── */}
      <AdminCard style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#e8f0ff', marginBottom: 16 }}>New Tag</h2>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 180px' }}>
            <span style={labelStyle}>Name</span>
            <input
              value={newName}
              onChange={e => handleNewNameChange(e.target.value)}
              placeholder="e.g. AI Writing"
              required
              style={{ width: '100%', background: '#080d1a', border: '1px solid #2a3d5c', borderRadius: 8, padding: '9px 12px', color: '#e8f0ff', fontSize: 14 }}
            />
          </div>
          <div style={{ flex: '1 1 180px' }}>
            <span style={labelStyle}>Slug</span>
            <input
              value={newSlug}
              onChange={e => { setNewSlug(e.target.value); setSlugLocked(true); }}
              placeholder="ai-writing"
              required
              style={{ width: '100%', background: '#080d1a', border: '1px solid #2a3d5c', borderRadius: 8, padding: '9px 12px', color: '#e8f0ff', fontSize: 14, fontFamily: 'monospace' }}
            />
          </div>
          <Button type="submit" disabled={saving || !newName.trim()}>
            {saving ? 'Adding…' : '+ Add Tag'}
          </Button>
        </form>
      </AdminCard>

      {/* ── Tag list ── */}
      {!isFirebaseConfigured() ? (
        <EmptyState message="No database connection." sub="Configure Firebase to manage tags." />
      ) : loading ? (
        <p style={{ color: '#6b82a8' }}>Loading…</p>
      ) : tags.length === 0 ? (
        <EmptyState message="No tags yet." sub="Create your first tag above." />
      ) : (
        <AdminCard style={{ padding: 0, overflow: 'hidden' }}>
          {tags.map(tag => (
            <div key={tag.id} style={rowStyle}>
              {editId === tag.id ? (
                <>
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    style={{ flex: 1, background: '#080d1a', border: '1px solid #2a3d5c', borderRadius: 6, padding: '7px 10px', color: '#e8f0ff', fontSize: 13 }}
                  />
                  <input
                    value={editSlug}
                    onChange={e => setEditSlug(e.target.value)}
                    style={{ flex: 1, background: '#080d1a', border: '1px solid #2a3d5c', borderRadius: 6, padding: '7px 10px', color: '#9fb3d4', fontSize: 13, fontFamily: 'monospace' }}
                  />
                  <Button onClick={() => handleUpdate(tag.id)} disabled={saving} style={{ padding: '6px 12px', fontSize: 12 }}>Save</Button>
                  <Button variant="secondary" onClick={() => setEditId(null)} style={{ padding: '6px 12px', fontSize: 12 }}>Cancel</Button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1, color: '#e8f0ff', fontWeight: 600, fontSize: 13.5 }}>{tag.name}</span>
                  <code style={{ flex: 1, color: '#6b82a8', fontSize: 12 }}>{tag.slug}</code>
                  <Button variant="secondary" onClick={() => startEdit(tag)} style={{ padding: '5px 10px', fontSize: 12 }}>Edit</Button>
                  <Button variant="danger" onClick={() => handleDelete(tag.id, tag.name)} style={{ padding: '5px 10px', fontSize: 12 }}>Delete</Button>
                </>
              )}
            </div>
          ))}
        </AdminCard>
      )}
    </AdminLayout>
  );
}
