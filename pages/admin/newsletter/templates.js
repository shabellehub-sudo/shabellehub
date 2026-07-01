// pages/admin/newsletter/templates.js — Phase 7B

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import {
  AdminCard, Button, TextInput, ErrorBanner, EmptyState, StatusBadge,
} from '../../../components/admin/ui';
import BlockEditor from '../../../components/admin/blocks/BlockEditor';
import { useAuth } from '../../../lib/cms/useAuth';
import { authedFetch } from '../../../lib/cms/apiHelpers';

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const emptyNl = { subject: '', previewText: '', content_blocks: [], status: 'draft' };

export default function NewsletterTemplatesPage() {
  const router = useRouter();
  const auth   = useAuth();

  const [view,        setView]        = useState('list');
  const [newsletters, setNewsletters] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [saveMsg,     setSaveMsg]     = useState(null);
  const [deleting,    setDeleting]    = useState(null);
  const [editId,      setEditId]      = useState(null);
  const [nl,          setNl]          = useState(emptyNl);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const { edit } = router.query;
    if (edit && view === 'list') openEdit(edit);
  }, [router.query]);

  const loadList = useCallback(async () => {
    if (!auth.user) return;
    setLoading(true); setError(null);
    const { ok, data, error: err } = await authedFetch(auth.user, '/api/admin/newsletter/newsletters');
    if (!ok) { setError(err); } else { setNewsletters(data || []); }
    setLoading(false);
  }, [auth.user]);

  useEffect(() => { loadList(); }, [loadList]);

  function openNew() {
    setEditId(null); setNl({ ...emptyNl }); setView('edit'); setError(null); setSaveMsg(null);
  }

  async function openEdit(id) {
    if (!auth.user) return;
    setError(null); setSaveMsg(null);
    const { ok, data, error: err } = await authedFetch(auth.user, `/api/admin/newsletter/newsletters/${id}`);
    if (!ok) { setError(err); return; }
    setEditId(id);
    setNl({
      subject:        data.subject        || '',
      previewText:    data.previewText    || '',
      content_blocks: data.content_blocks || [],
      status:         data.status         || 'draft',
    });
    setView('edit');
  }

  function update(key, value) { setNl(prev => ({ ...prev, [key]: value })); }

  async function handleSave() {
    if (!nl.subject.trim()) { setError('Subject is required.'); return; }
    setSaving(true); setError(null); setSaveMsg(null);
    const isNew  = !editId;
    const url    = isNew ? '/api/admin/newsletter/newsletters' : `/api/admin/newsletter/newsletters/${editId}`;
    const { ok, data, error: err } = await authedFetch(auth.user, url, {
      method: isNew ? 'POST' : 'PUT',
      body: JSON.stringify(nl),
    });
    if (!ok) { setError(err); setSaving(false); return; }
    if (isNew) {
      setEditId(data.id);
      router.replace({ pathname: '/admin/newsletter/templates', query: { edit: data.id } }, undefined, { shallow: true });
    }
    setSaveMsg('Saved ✓');
    setTimeout(() => setSaveMsg(null), 2000);
    loadList();
    setSaving(false);
  }

  async function handleDelete(id, subject) {
    if (!auth.isAdmin) return;
    if (!window.confirm(`Delete newsletter "${subject}"?`)) return;
    setDeleting(id);
    const { ok, error: err } = await authedFetch(auth.user, `/api/admin/newsletter/newsletters/${id}`, { method: 'DELETE' });
    if (ok) {
      setNewsletters(prev => prev.filter(n => n.id !== id));
      if (editId === id) { setView('list'); setEditId(null); setNl({ ...emptyNl }); }
    } else {
      setError(err);
    }
    setDeleting(null);
  }

  if (view === 'list') {
    return (
      <AdminLayout title="Newsletter Templates" requiredRole="editor">
        <ErrorBanner message={error} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <Button onClick={openNew}>+ New Newsletter</Button>
        </div>

        {loading ? (
          <AdminCard><p style={{ color: '#6b82a8', fontSize: 13 }}>Loading newsletters…</p></AdminCard>
        ) : newsletters.length === 0 ? (
          <EmptyState message="No newsletters yet." sub="Create a newsletter template, then use it in a campaign." />
        ) : (
          <AdminCard style={{ padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1a2d4a' }}>
                  {['Subject', 'Preview Text', 'Blocks', 'Status', 'Updated', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#3d5470', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {newsletters.map((n, i) => (
                  <tr key={n.id} style={{ borderBottom: i < newsletters.length - 1 ? '1px solid rgba(26,45,74,0.5)' : 'none' }}>
                    <td style={{ padding: '12px 16px', color: '#e8f0ff', fontWeight: 600 }}>
                      <button onClick={() => openEdit(n.id)}
                        style={{ background: 'none', border: 'none', color: '#e8f0ff', cursor: 'pointer', fontWeight: 600, fontSize: 13, textAlign: 'left', padding: 0 }}>
                        {n.subject}
                      </button>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#6b82a8', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {n.previewText || <span style={{ opacity: 0.4 }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#9fb3d4' }}>{n.content_blocks?.length || 0}</td>
                    <td style={{ padding: '12px 16px' }}><StatusBadge status={n.status || 'draft'} /></td>
                    <td style={{ padding: '12px 16px', color: '#6b82a8', fontSize: 12 }}>{fmtDate(n.updated_at)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(n.id)} style={{ padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'rgba(20,255,244,0.08)', color: '#14FFF4', border: '1px solid rgba(20,255,244,0.2)' }}>Edit</button>
                        {auth.isAdmin && (
                          <button onClick={() => handleDelete(n.id, n.subject)} disabled={deleting === n.id}
                            style={{ padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'rgba(255,80,80,0.08)', color: '#ff8080', border: '1px solid rgba(255,80,80,0.2)' }}>
                            {deleting === n.id ? '…' : 'Delete'}
                          </button>
                        )}
                      </div>
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

  return (
    <AdminLayout title={editId ? 'Edit Newsletter' : 'New Newsletter'} requiredRole="editor">
      <ErrorBanner message={error} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <button onClick={() => { setView('list'); router.replace('/admin/newsletter/templates', undefined, { shallow: true }); }}
          style={{ background: 'none', border: 'none', color: '#6b82a8', cursor: 'pointer', fontSize: 13 }}>
          ← Back to Templates
        </button>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {saveMsg && <span style={{ color: '#00d084', fontSize: 13, fontWeight: 600 }}>{saveMsg}</span>}
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editId ? 'Save Changes' : 'Create Newsletter'}</Button>
        </div>
      </div>
      <AdminCard style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <TextInput label="Subject *" value={nl.subject} onChange={e => update('subject', e.target.value)} placeholder="Your email subject line" />
          <TextInput label="Preview Text" value={nl.previewText} onChange={e => update('previewText', e.target.value)} placeholder="Short summary shown in inbox preview" />
        </div>
      </AdminCard>
      <AdminCard>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#6b82a8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>Email Content</p>
        <BlockEditor blocks={nl.content_blocks} onChange={blocks => update('content_blocks', blocks)} />
      </AdminCard>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editId ? 'Save Changes' : 'Create Newsletter'}</Button>
      </div>
    </AdminLayout>
  );
}
