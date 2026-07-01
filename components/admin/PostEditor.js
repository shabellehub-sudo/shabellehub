// components/admin/PostEditor.js — Phase 6B: Rich Block Editor
// Preserves all Phase 3 SEO, FAQ, scheduling, tags, featured image fields.
// Replaces only the article body textarea with BlockEditor.
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../lib/cms/useAuth';
import {
  createPost, updatePost, publishPost, unpublishPost,
  schedulePost, saveDraft, deletePost, toggleFeatured,
} from '../../lib/cms/posts';
import { listCategories } from '../../lib/cms/categories';
import { listAuthors }    from '../../lib/cms/authors';
import { listMedia }      from '../../lib/cms/media';
import { listTags }       from '../../lib/cms/tags';
import { AdminCard, Button, TextInput, TextArea, Select, ErrorBanner, StatusBadge } from './ui';
import BlockEditor from './blocks/BlockEditor';
import { DEFAULT_BLOCKS } from '../../lib/cms/blocks';

function slugify(title) {
  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const emptyPost = {
  title: '', slug: '', excerpt: '', content: '',
  content_blocks: [],
  category_id: '', author_id: '', reviewer_id: '',
  featured_image_id: '', tags: [], faqs: [],
  related_tool_slugs: [],
  featured: false,
  seo_title: '', seo_description: '', canonical_url: '', og_image_id: '', og_image_url: '',
};

// ── Tag chip selector ────────────────────────────────────────────────────────
function TagSelector({ allTags, selected, onChange }) {
  const toggle = (slug) =>
    onChange(selected.includes(slug) ? selected.filter(s => s !== slug) : [...selected, slug]);

  return (
    <div>
      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#9fb3d4', marginBottom: 8 }}>
        Tags
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {allTags.length === 0 && (
          <span style={{ fontSize: 12, color: '#6b82a8' }}>No tags yet — create some in Admin → Tags.</span>
        )}
        {allTags.map(tag => {
          const active = selected.includes(tag.slug);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggle(tag.slug)}
              style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                border: active ? '1px solid #14FFF4' : '1px solid #2a3d5c',
                background: active ? 'rgba(20,255,244,0.12)' : 'transparent',
                color: active ? '#14FFF4' : '#9fb3d4',
                transition: 'all 0.12s',
              }}
            >
              {tag.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── FAQ row ──────────────────────────────────────────────────────────────────
function FAQRow({ faq, index, onChange, onRemove }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
      <div style={{ flex: 1 }}>
        <input
          placeholder="Question"
          value={faq.question}
          onChange={e => onChange(index, 'question', e.target.value)}
          style={{ width: '100%', background: '#080d1a', border: '1px solid #2a3d5c', borderRadius: 8, padding: '8px 11px', color: '#e8f0ff', fontSize: 13, marginBottom: 6 }}
        />
        <textarea
          placeholder="Answer"
          value={faq.answer}
          onChange={e => onChange(index, 'answer', e.target.value)}
          rows={2}
          style={{ width: '100%', background: '#080d1a', border: '1px solid #2a3d5c', borderRadius: 8, padding: '8px 11px', color: '#e8f0ff', fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }}
        />
      </div>
      <button type="button" onClick={() => onRemove(index)} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#ff8080', cursor: 'pointer', fontSize: 18, paddingTop: 6 }}>×</button>
    </div>
  );
}

export default function PostEditor({ mode, initialPost, onSaved }) {
  const auth = useAuth();
  const [post,        setPost]        = useState(() => (mode === 'edit' && initialPost ? mapPostToForm(initialPost) : emptyPost));
  const [categories,  setCategories]  = useState([]);
  const [authors,     setAuthors]     = useState([]);
  const [media,       setMedia]       = useState([]);
  const [allTags,     setAllTags]     = useState([]);
  const [slugTouched, setSlugTouched] = useState(mode === 'edit');
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState(null);
  const [success,     setSuccess]     = useState(null);
  const [scheduledFor,setScheduledFor]= useState('');
  const [activeTab,   setActiveTab]   = useState('content'); // 'content' | 'seo' | 'faqs'

  useEffect(() => {
    (async () => {
      const [c, a, m, t] = await Promise.all([
        listCategories(), listAuthors(), listMedia({ limit: 200 }), listTags(),
      ]);
      setCategories(c.data || []);
      setAuthors(a.data || []);
      setMedia(m.data || []);
      setAllTags(t.data || []);
    })();
  }, []);

  function mapPostToForm(p) {
    return {
      ...emptyPost,
      ...p,
      category_id:       p.category_id       || p.category?.id       || '',
      author_id:         p.author_id         || p.author?.id         || '',
      reviewer_id:       p.reviewer_id       || p.reviewer?.id       || '',
      featured_image_id: p.featured_image_id || p.featured_image?.id || '',
      og_image_id:       p.og_image_id       || p.og_image?.id       || '',
      og_image_url:      p.og_image_url      || '',
      tags:              p.tags              || [],
      faqs:              p.faqs              || [],
      related_tool_slugs:p.related_tool_slugs|| [],
      featured:          p.featured          ?? false,
      // Phase 6B: load saved blocks; default to empty array for legacy posts
      content_blocks:    Array.isArray(p.content_blocks) ? p.content_blocks : [],
    };
  }

  const update = useCallback((field, value) => setPost(prev => ({ ...prev, [field]: value })), []);

  function handleTitleChange(value) {
    update('title', value);
    if (!slugTouched) update('slug', slugify(value));
  }

  function buildPayload(extra = {}) {
    const { category, author, reviewer, featured_image, og_image,
      id, created_at, updated_at, created_by, updated_by,
      status, published_at, scheduled_for, last_reviewed_at, ...rest } = post;
    const cleaned = {};
    for (const [k, v] of Object.entries(rest)) {
      // Never null-coerce arrays (tags, faqs, content_blocks, related_tool_slugs)
      cleaned[k] = (Array.isArray(v) || v !== '') ? v : null;
    }
    return { ...cleaned, ...extra };
  }

  // ── FAQ helpers ────────────────────────────────────────────────────────────
  function addFAQ() {
    update('faqs', [...post.faqs, { question: '', answer: '' }]);
  }
  function updateFAQ(idx, field, value) {
    const next = post.faqs.map((f, i) => i === idx ? { ...f, [field]: value } : f);
    update('faqs', next);
  }
  function removeFAQ(idx) {
    update('faqs', post.faqs.filter((_, i) => i !== idx));
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  async function handleAction(actionFn, successMsg) {
    setSaving(true); setError(null); setSuccess(null);
    const { data, error } = await actionFn();
    setSaving(false);
    if (error) { setError(error); return; }
    setSuccess(successMsg);
    if (onSaved) onSaved(data);
  }

  async function handleSaveDraft() {
    const payload = buildPayload();
    await handleAction(
      () => mode === 'create'
        ? createPost({ ...payload, status: 'draft' }, auth.user?.uid)
        : saveDraft(initialPost.id, payload, auth.user?.uid),
      'Draft saved.',
    );
  }

  async function handlePublish() {
    const payload = buildPayload();
    await handleAction(
      () => mode === 'create'
        ? createPost({ ...payload, status: 'published', published_at: new Date().toISOString() }, auth.user?.uid)
        : publishPost(initialPost.id, auth.user?.uid),
      'Post published!',
    );
  }

  async function handleUnpublish() {
    await handleAction(
      () => unpublishPost(initialPost.id, auth.user?.uid),
      'Post unpublished.',
    );
  }

  async function handleSchedule() {
    if (!scheduledFor) { setError('Pick a date/time to schedule.'); return; }
    const payload = buildPayload();
    await handleAction(
      () => mode === 'create'
        ? createPost({ ...payload, status: 'scheduled', scheduled_for: scheduledFor }, auth.user?.uid)
        : schedulePost(initialPost.id, scheduledFor, auth.user?.uid),
      'Post scheduled.',
    );
  }

  async function handleDelete() {
    if (!window.confirm('Delete this post permanently? This cannot be undone.')) return;
    await handleAction(
      () => deletePost(initialPost.id),
      'Post deleted.',
    );
  }

  async function handleToggleFeatured() {
    if (!initialPost?.id) return;
    await handleAction(
      () => toggleFeatured(initialPost.id, post.featured, auth.user?.uid),
      post.featured ? 'Removed from featured.' : 'Marked as featured!',
    );
    update('featured', !post.featured);
  }

  // ── Inline update for edit mode ───────────────────────────────────────────
  async function handleUpdateContent() {
    const payload = buildPayload();
    await handleAction(
      () => updatePost(initialPost.id, payload, auth.user?.uid),
      'Post updated.',
    );
  }

  const isEdit = mode === 'edit';
  const mediaOptions = media.map(m => ({ value: m.id, label: m.file_name, url: m.public_url }));

  // ── Tab styles ────────────────────────────────────────────────────────────
  const tabStyle = (t) => ({
    padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
    borderBottom: activeTab === t ? '2px solid #14FFF4' : '2px solid transparent',
    background: 'transparent', color: activeTab === t ? '#14FFF4' : '#9fb3d4',
    transition: 'color 0.12s',
  });

  return (
    <div>
      <ErrorBanner message={error} />
      {success && (
        <div style={{ background: 'rgba(0,208,132,0.1)', border: '1px solid rgba(0,208,132,0.3)', borderRadius: 8, padding: '10px 14px', color: '#00d084', fontSize: 13, marginBottom: 16 }}>
          {success}
        </div>
      )}

      {/* ── Status bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {isEdit && <StatusBadge status={initialPost?.status || post.status} />}
        {isEdit && post.featured && (
          <span style={{ background: 'rgba(255,193,71,0.12)', color: '#ffc147', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 5, textTransform: 'uppercase' }}>
            ⭐ Featured
          </span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {isEdit && (
            <Button variant="secondary" onClick={handleToggleFeatured} disabled={saving} style={{ fontSize: 12, padding: '6px 12px' }}>
              {post.featured ? 'Unfeature' : '⭐ Feature'}
            </Button>
          )}
          <Button variant="secondary" onClick={handleSaveDraft} disabled={saving} style={{ fontSize: 12, padding: '6px 12px' }}>
            {saving ? 'Saving…' : 'Save Draft'}
          </Button>
          {isEdit && initialPost?.status === 'published' ? (
            <Button variant="secondary" onClick={handleUnpublish} disabled={saving} style={{ fontSize: 12, padding: '6px 12px' }}>
              Unpublish
            </Button>
          ) : (
            <Button onClick={handlePublish} disabled={saving} style={{ fontSize: 12, padding: '6px 12px' }}>
              Publish
            </Button>
          )}
          {isEdit && (
            <Button variant="danger" onClick={handleDelete} disabled={saving} style={{ fontSize: 12, padding: '6px 12px' }}>
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a2d4a', marginBottom: 24 }}>
        <button style={tabStyle('content')} onClick={() => setActiveTab('content')}>Content</button>
        <button style={tabStyle('seo')}     onClick={() => setActiveTab('seo')}>SEO</button>
        <button style={tabStyle('faqs')}    onClick={() => setActiveTab('faqs')}>FAQs ({post.faqs?.length || 0})</button>
      </div>

      {/* ── CONTENT TAB ── */}
      {activeTab === 'content' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>
          <div>
            <AdminCard>
              <TextInput
                label="Title"
                value={post.title}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder="Post title…"
              />
              <TextInput
                label="Slug"
                value={post.slug}
                onChange={e => { update('slug', e.target.value); setSlugTouched(true); }}
                placeholder="post-slug"
                style={{ fontFamily: 'monospace', fontSize: 13 }}
              />
              <TextArea
                label="Excerpt"
                value={post.excerpt}
                onChange={e => update('excerpt', e.target.value)}
                rows={3}
                placeholder="Short summary shown in blog listing…"
              />
            </AdminCard>

            {/* ── Rich block editor ── */}
            <AdminCard style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#9fb3d4' }}>Article Body</span>
                {/* Legacy mode indicator */}
                {post.content && post.content_blocks.length === 0 && (
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: '#ffc147',
                    background: 'rgba(255,193,71,0.1)', border: '1px solid rgba(255,193,71,0.3)',
                    borderRadius: 5, padding: '2px 8px',
                  }}>
                    Legacy Markdown — add blocks to migrate
                  </span>
                )}
              </div>

              {/* Show legacy content read-only if no blocks yet */}
              {post.content && post.content_blocks.length === 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ background: 'rgba(255,193,71,0.05)', border: '1px solid rgba(255,193,71,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 10 }}>
                    <p style={{ fontSize: 12, color: '#ffc147', margin: 0 }}>
                      This post has legacy Markdown content. It will continue rendering on the frontend until you add blocks below.
                      Once you save with blocks, the legacy <code style={{ fontFamily: 'monospace', fontSize: 11 }}>content</code> field is preserved for safety.
                    </p>
                  </div>
                  <details>
                    <summary style={{ fontSize: 12, color: '#6b82a8', cursor: 'pointer', marginBottom: 6 }}>View legacy markdown</summary>
                    <pre style={{ fontSize: 11, color: '#6b82a8', background: '#080d1a', borderRadius: 6, padding: 10, overflow: 'auto', maxHeight: 180, fontFamily: 'monospace' }}>
                      {post.content}
                    </pre>
                  </details>
                </div>
              )}

              <BlockEditor
                blocks={post.content_blocks.length > 0 ? post.content_blocks : []}
                onChange={blocks => update('content_blocks', blocks)}
              />
            </AdminCard>

            {isEdit && (
              <div style={{ marginTop: 14 }}>
                <Button onClick={handleUpdateContent} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <AdminCard>
              <Select label="Category" value={post.category_id} onChange={e => update('category_id', e.target.value)}>
                <option value="">— none —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
              <Select label="Author" value={post.author_id} onChange={e => update('author_id', e.target.value)}>
                <option value="">— none —</option>
                {authors.filter(a => a.roles?.includes('author')).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </Select>
              <Select label="Reviewer" value={post.reviewer_id} onChange={e => update('reviewer_id', e.target.value)}>
                <option value="">— none —</option>
                {authors.filter(a => a.roles?.includes('reviewer')).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </Select>
            </AdminCard>

            <AdminCard>
              <TagSelector allTags={allTags} selected={post.tags || []} onChange={v => update('tags', v)} />
            </AdminCard>

            <AdminCard>
              <Select label="Featured Image" value={post.featured_image_id} onChange={e => update('featured_image_id', e.target.value)}>
                <option value="">— none —</option>
                {mediaOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </Select>
              {post.featured_image_id && (
                <img
                  src={media.find(m => m.id === post.featured_image_id)?.public_url}
                  alt="Featured preview"
                  style={{ width: '100%', borderRadius: 8, marginTop: 8, objectFit: 'cover', maxHeight: 140 }}
                />
              )}
            </AdminCard>

            <AdminCard>
              <span style={{ display: 'block', fontSize: 12, color: '#6b82a8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 12 }}>Schedule</span>
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={e => setScheduledFor(e.target.value)}
                style={{ width: '100%', background: '#080d1a', border: '1px solid #2a3d5c', borderRadius: 8, padding: '9px 12px', color: '#e8f0ff', fontSize: 13, marginBottom: 10 }}
              />
              <Button variant="secondary" onClick={handleSchedule} disabled={saving || !scheduledFor} style={{ width: '100%', fontSize: 12 }}>
                Schedule Post
              </Button>
            </AdminCard>
          </div>
        </div>
      )}

      {/* ── SEO TAB ── */}
      {activeTab === 'seo' && (
        <AdminCard>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e8f0ff', marginBottom: 16 }}>SEO & Open Graph</h3>
          <TextInput
            label="SEO Title (recommended ≤ 60 chars)"
            value={post.seo_title}
            onChange={e => update('seo_title', e.target.value)}
            placeholder={post.title || 'SEO title…'}
          />
          {post.seo_title && (
            <p style={{ fontSize: 11.5, color: post.seo_title.length > 60 ? '#ff8080' : '#00d084', marginTop: -10, marginBottom: 12 }}>
              {post.seo_title.length} / 60 chars
            </p>
          )}
          <TextArea
            label="Meta Description (recommended ≤ 160 chars)"
            value={post.seo_description}
            onChange={e => update('seo_description', e.target.value)}
            rows={3}
            placeholder="Summary shown in Google search results…"
          />
          {post.seo_description && (
            <p style={{ fontSize: 11.5, color: post.seo_description.length > 160 ? '#ff8080' : '#00d084', marginTop: -10, marginBottom: 12 }}>
              {post.seo_description.length} / 160 chars
            </p>
          )}
          <TextInput
            label="Canonical URL (optional)"
            value={post.canonical_url}
            onChange={e => update('canonical_url', e.target.value)}
            placeholder="https://shabellehub.com/blog/post-slug"
          />
          <div style={{ borderTop: '1px solid #1a2d4a', paddingTop: 16, marginTop: 4 }}>
            <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#9fb3d4', marginBottom: 10 }}>OG Image</span>
            <Select value={post.og_image_id} onChange={e => update('og_image_id', e.target.value)} style={{ marginBottom: 10 }}>
              <option value="">— none —</option>
              {mediaOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </Select>
            <TextInput
              label="Or paste OG Image URL"
              value={post.og_image_url}
              onChange={e => update('og_image_url', e.target.value)}
              placeholder="https://…"
            />
            {(post.og_image_url || (post.og_image_id && media.find(m => m.id === post.og_image_id)?.public_url)) && (
              <img
                src={post.og_image_url || media.find(m => m.id === post.og_image_id)?.public_url}
                alt="OG preview"
                style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 8, marginTop: 8 }}
              />
            )}
          </div>

          {/* SERP preview */}
          <div style={{ marginTop: 24, background: '#080d1a', borderRadius: 10, padding: 16, border: '1px solid #1a2d4a' }}>
            <p style={{ fontSize: 11, color: '#6b82a8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 10 }}>SERP Preview</p>
            <p style={{ fontSize: 16, color: '#1a73e8', marginBottom: 4, fontWeight: 600 }}>
              {post.seo_title || post.title || 'Post Title'}
            </p>
            <p style={{ fontSize: 12, color: '#00d084', marginBottom: 4 }}>
              https://shabellehub.com/blog/{post.slug || 'post-slug'}
            </p>
            <p style={{ fontSize: 13, color: '#9fb3d4', lineHeight: 1.5 }}>
              {post.seo_description || post.excerpt || 'Meta description will appear here…'}
            </p>
          </div>

          {isEdit && (
            <Button onClick={handleUpdateContent} disabled={saving} style={{ marginTop: 20 }}>
              {saving ? 'Saving…' : 'Save SEO Changes'}
            </Button>
          )}
        </AdminCard>
      )}

      {/* ── FAQS TAB ── */}
      {activeTab === 'faqs' && (
        <AdminCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e8f0ff', margin: 0 }}>FAQs (FAQ Schema)</h3>
            <Button variant="secondary" onClick={addFAQ} style={{ fontSize: 12, padding: '6px 12px' }}>+ Add FAQ</Button>
          </div>
          {post.faqs?.length === 0 && (
            <p style={{ color: '#6b82a8', fontSize: 13 }}>No FAQs yet. Add questions to generate FAQ schema for Google.</p>
          )}
          {post.faqs?.map((faq, i) => (
            <FAQRow key={i} faq={faq} index={i} onChange={updateFAQ} onRemove={removeFAQ} />
          ))}
          {isEdit && post.faqs?.length > 0 && (
            <Button onClick={handleUpdateContent} disabled={saving} style={{ marginTop: 8 }}>
              {saving ? 'Saving…' : 'Save FAQs'}
            </Button>
          )}
        </AdminCard>
      )}
    </div>
  );
}
