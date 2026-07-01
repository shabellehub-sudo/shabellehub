import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { AdminCard, Button, TextInput, TextArea, Select, ErrorBanner, EmptyState } from '../../../components/admin/ui';
import { listAuthors, createAuthor, updateAuthor, deleteAuthor } from '../../../lib/cms/authors';
import { isSupabaseConfigured as isFirebaseConfigured } from '../../../lib/supabase';

const emptyForm = {
  id: null, slug: '', name: '', title: '', roles: ['author'],
  short_bio: '', bio: '', avatar_initials: '', expertise: '', credentials: '',
  location: '', same_as: '',
};

function slugify(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function AdminAuthorsPage() {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  const load = useCallback(async () => {
    if (!isFirebaseConfigured()) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await listAuthors();
    setAuthors(data);
    setError(error);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function startEdit(a) {
    setForm({
      id: a.id, slug: a.slug, name: a.name, title: a.title || '', roles: a.roles || ['author'],
      short_bio: a.short_bio || '', bio: a.bio || '', avatar_initials: a.avatar_initials || '',
      expertise: (a.expertise || []).join(', '), credentials: (a.credentials || []).join(', '),
      location: a.location || '', same_as: (a.same_as || []).join(', '),
    });
    setSlugTouched(true);
    setEditing(true);
  }

  function startCreate() {
    setForm(emptyForm);
    setSlugTouched(false);
    setEditing(true);
  }

  function handleNameChange(value) {
    setForm(f => ({ ...f, name: value, slug: slugTouched ? f.slug : slugify(value) }));
  }

  function toggleRole(role) {
    setForm(f => ({
      ...f,
      roles: f.roles.includes(role) ? f.roles.filter(r => r !== role) : [...f.roles, role],
    }));
  }

  async function handleSave() {
    const payload = {
      slug: form.slug, name: form.name, title: form.title || null, roles: form.roles,
      short_bio: form.short_bio || null, bio: form.bio || null, avatar_initials: form.avatar_initials || null,
      expertise: form.expertise.split(',').map(s => s.trim()).filter(Boolean),
      credentials: form.credentials.split(',').map(s => s.trim()).filter(Boolean),
      location: form.location || null,
      same_as: form.same_as.split(',').map(s => s.trim()).filter(Boolean),
    };
    const result = form.id ? await updateAuthor(form.id, payload) : await createAuthor(payload);
    if (result.error) { setError(result.error); return; }
    setEditing(false);
    load();
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete author "${name}"? Posts referencing them will keep their data but lose the link.`)) return;
    const result = await deleteAuthor(id);
    if (result.error) { setError(result.error); return; }
    load();
  }

  return (
    <AdminLayout title="Authors">
      <ErrorBanner message={error} />

      {editing ? (
        <AdminCard style={{ marginBottom: 20, maxWidth: 560 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{form.id ? 'Edit author' : 'New author'}</h3>
          <TextInput label="Name" value={form.name} onChange={(e) => handleNameChange(e.target.value)} />
          <TextInput label="Slug" value={form.slug} onChange={(e) => { setSlugTouched(true); setForm(f => ({ ...f, slug: slugify(e.target.value) })); }} />
          <TextInput label="Title" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Senior AI Writer" />

          <div style={{ marginBottom: 14 }}>
            <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#9fb3d4', marginBottom: 6 }}>Roles</span>
            <label style={{ marginRight: 16, fontSize: 13, color: '#e8f0ff' }}>
              <input type="checkbox" checked={form.roles.includes('author')} onChange={() => toggleRole('author')} /> Author
            </label>
            <label style={{ fontSize: 13, color: '#e8f0ff' }}>
              <input type="checkbox" checked={form.roles.includes('reviewer')} onChange={() => toggleRole('reviewer')} /> Reviewer
            </label>
          </div>

          <TextInput label="Avatar Initials" value={form.avatar_initials} onChange={(e) => setForm(f => ({ ...f, avatar_initials: e.target.value }))} placeholder="e.g. AB" />
          <TextArea label="Short Bio" rows={2} value={form.short_bio} onChange={(e) => setForm(f => ({ ...f, short_bio: e.target.value }))} />
          <TextArea label="Full Bio" rows={5} value={form.bio} onChange={(e) => setForm(f => ({ ...f, bio: e.target.value }))} />
          <TextInput label="Expertise (comma-separated)" value={form.expertise} onChange={(e) => setForm(f => ({ ...f, expertise: e.target.value }))} />
          <TextInput label="Credentials (comma-separated)" value={form.credentials} onChange={(e) => setForm(f => ({ ...f, credentials: e.target.value }))} />
          <TextInput label="Location" value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))} />
          <TextInput label="Social links (comma-separated URLs)" value={form.same_as} onChange={(e) => setForm(f => ({ ...f, same_as: e.target.value }))} />

          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={handleSave}>Save</Button>
            <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </AdminCard>
      ) : (
        <Button onClick={startCreate} style={{ marginBottom: 16 }}>+ New Author</Button>
      )}

      {!isFirebaseConfigured() ? (
        <EmptyState message="No database connection." sub="Configure Firebase to manage authors." />
      ) : loading ? (
        <p style={{ color: '#6b82a8' }}>Loading…</p>
      ) : authors.length === 0 ? (
        <EmptyState message="No authors yet." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {authors.map(a => (
            <AdminCard key={a.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{a.name}</div>
                  <div style={{ color: '#14FFF4', fontSize: 12 }}>{a.title}</div>
                  <div style={{ color: '#6b82a8', fontSize: 11, marginTop: 4 }}>{(a.roles || []).join(', ')} · /{a.slug}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button variant="secondary" onClick={() => startEdit(a)} style={{ fontSize: 11, padding: '5px 9px' }}>Edit</Button>
                  <Button variant="danger" onClick={() => handleDelete(a.id, a.name)} style={{ fontSize: 11, padding: '5px 9px' }}>Delete</Button>
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
