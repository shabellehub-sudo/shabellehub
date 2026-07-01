import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { AdminCard, Button, TextInput, TextArea, ErrorBanner, EmptyState } from '../../../components/admin/ui';
import { listCategories, createCategory, updateCategory, deleteCategory } from '../../../lib/cms/categories';
import { isSupabaseConfigured as isFirebaseConfigured } from '../../../lib/supabase';

const emptyForm = { id: null, slug: '', name: '', icon: '', description: '', seo_title: '', seo_description: '' };

function slugify(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  const load = useCallback(async () => {
    if (!isFirebaseConfigured()) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await listCategories();
    setCategories(data);
    setError(error);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function startEdit(cat) {
    setForm({
      id: cat.id, slug: cat.slug, name: cat.name, icon: cat.icon || '',
      description: cat.description || '', seo_title: cat.seo_title || '', seo_description: cat.seo_description || '',
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

  async function handleSave() {
    const payload = {
      slug: form.slug, name: form.name, icon: form.icon || null,
      description: form.description || null, seo_title: form.seo_title || null, seo_description: form.seo_description || null,
    };
    const result = form.id ? await updateCategory(form.id, payload) : await createCategory(payload);
    if (result.error) { setError(result.error); return; }
    setEditing(false);
    load();
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete category "${name}"? Posts using it will keep their data but lose the category link.`)) return;
    const result = await deleteCategory(id);
    if (result.error) { setError(result.error); return; }
    load();
  }

  return (
    <AdminLayout title="Categories">
      <ErrorBanner message={error} />

      {editing ? (
        <AdminCard style={{ marginBottom: 20, maxWidth: 480 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{form.id ? 'Edit category' : 'New category'}</h3>
          <TextInput label="Name" value={form.name} onChange={(e) => handleNameChange(e.target.value)} />
          <TextInput label="Slug" value={form.slug} onChange={(e) => { setSlugTouched(true); setForm(f => ({ ...f, slug: slugify(e.target.value) })); }} />
          <TextInput label="Icon (emoji)" value={form.icon} onChange={(e) => setForm(f => ({ ...f, icon: e.target.value }))} />
          <TextArea label="Description" rows={3} value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
          <TextInput label="SEO Title" value={form.seo_title} onChange={(e) => setForm(f => ({ ...f, seo_title: e.target.value }))} />
          <TextArea label="SEO Description" rows={2} value={form.seo_description} onChange={(e) => setForm(f => ({ ...f, seo_description: e.target.value }))} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={handleSave}>Save</Button>
            <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </AdminCard>
      ) : (
        <Button onClick={startCreate} style={{ marginBottom: 16 }}>+ New Category</Button>
      )}

      {!isFirebaseConfigured() ? (
        <EmptyState message="No database connection." sub="Configure Firebase to manage categories." />
      ) : loading ? (
        <p style={{ color: '#6b82a8' }}>Loading…</p>
      ) : categories.length === 0 ? (
        <EmptyState message="No categories yet." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {categories.map(c => (
            <AdminCard key={c.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{c.icon} {c.name}</div>
                  <div style={{ color: '#6b82a8', fontSize: 12 }}>{c.slug}</div>
                  <div style={{ color: '#6b82a8', fontSize: 12, marginTop: 4 }}>{c.posts?.[0]?.count ?? 0} posts</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button variant="secondary" onClick={() => startEdit(c)} style={{ fontSize: 11, padding: '5px 9px' }}>Edit</Button>
                  <Button variant="danger" onClick={() => handleDelete(c.id, c.name)} style={{ fontSize: 11, padding: '5px 9px' }}>Delete</Button>
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
