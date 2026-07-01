// pages/admin/tools/index.js — Tools management list
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import AdminLayout from '../../../components/admin/AdminLayout';
import {
  AdminCard, Button, TextInput, Select,
  StatusBadge, EmptyState, ErrorBanner, StatCard,
} from '../../../components/admin/ui';
import {
  listTools, bulkDeleteTools, bulkUpdateTools, getToolCounts,
} from '../../../lib/cms/tools';
import { useAuth } from '../../../lib/cms/useAuth';
import { isSupabaseConfigured as isFirebaseConfigured } from '../../../lib/supabase';

const CATEGORIES = [
  'All', 'Chatbots', 'Coding', 'Image Generation', 'Video Generation',
  'Audio & Voice', 'Writing', 'Research', 'Productivity', 'Marketing',
  'Design', 'Data & Analytics', 'Education', 'Customer Support', 'SEO', 'Other',
];

export default function AdminToolsPage() {
  const auth = useAuth();
  const [tools, setTools]       = useState([]);
  const [counts, setCounts]     = useState({ total: 0, published: 0, draft: 0, featured: 0 });
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [catFilter, setCatFilter]       = useState('');
  const [selected, setSelected] = useState(new Set());
  const [bulkAction, setBulkAction]     = useState('');
  const [bulkWorking, setBulkWorking]   = useState(false);

  const load = useCallback(async () => {
    if (!isFirebaseConfigured()) { setLoading(false); return; }
    setLoading(true);
    const [toolsRes, countsRes] = await Promise.all([
      listTools({
        status:   statusFilter || undefined,
        category: catFilter && catFilter !== 'All' ? catFilter : undefined,
        search:   search || undefined,
      }),
      getToolCounts(),
    ]);
    setTools(toolsRes.data);
    setCounts(countsRes.data || counts);
    setError(toolsRes.error);
    setLoading(false);
    setSelected(new Set());
  }, [search, statusFilter, catFilter]);

  useEffect(() => { load(); }, [load]);

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === tools.length) setSelected(new Set());
    else setSelected(new Set(tools.map(t => t.id)));
  }

  async function handleBulkAction() {
    if (!bulkAction || selected.size === 0) return;
    if (!window.confirm(`Apply "${bulkAction}" to ${selected.size} tool(s)?`)) return;
    setBulkWorking(true);
    const ids = [...selected];
    let result;
    if (bulkAction === 'delete') {
      result = await bulkDeleteTools(ids);
    } else if (bulkAction === 'publish') {
      result = await bulkUpdateTools(ids, { status: 'published' }, auth.user?.uid);
    } else if (bulkAction === 'unpublish') {
      result = await bulkUpdateTools(ids, { status: 'unpublished' }, auth.user?.uid);
    } else if (bulkAction === 'draft') {
      result = await bulkUpdateTools(ids, { status: 'draft' }, auth.user?.uid);
    } else if (bulkAction === 'feature') {
      result = await bulkUpdateTools(ids, { featured: true }, auth.user?.uid);
    } else if (bulkAction === 'unfeature') {
      result = await bulkUpdateTools(ids, { featured: false }, auth.user?.uid);
    }
    setBulkWorking(false);
    if (result?.error) { setError(result.error); return; }
    setBulkAction('');
    load();
  }

  return (
    <AdminLayout title="AI Tools">
      {/* Stat row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12, marginBottom: 24 }}>
        <StatCard label="Total"     value={counts.total}     />
        <StatCard label="Published" value={counts.published} accent="#00d084" />
        <StatCard label="Drafts"    value={counts.draft}     accent="#9fb3d4" />
        <StatCard label="Featured"  value={counts.featured}  accent="#ffc147" />
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextInput
          placeholder="Search name, slug, tag…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: 0, minWidth: 220, flex: 1 }}
        />
        <Select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ marginBottom: 0, minWidth: 140 }}
        >
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="unpublished">Unpublished</option>
        </Select>
        <Select
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
          style={{ marginBottom: 0, minWidth: 160 }}
        >
          {CATEGORIES.map(c => <option key={c} value={c === 'All' ? '' : c}>{c}</option>)}
        </Select>
        <Link href="/admin/tools/new">
          <Button>+ New Tool</Button>
        </Link>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div style={{
          display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14,
          background: 'rgba(20,255,244,0.06)', border: '1px solid rgba(20,255,244,0.2)',
          borderRadius: 8, padding: '10px 14px',
        }}>
          <span style={{ fontSize: 13, color: '#14FFF4', fontWeight: 600 }}>
            {selected.size} selected
          </span>
          <Select
            value={bulkAction}
            onChange={e => setBulkAction(e.target.value)}
            style={{ marginBottom: 0, minWidth: 160, padding: '6px 10px' }}
          >
            <option value="">Bulk action…</option>
            <option value="publish">Publish</option>
            <option value="unpublish">Unpublish</option>
            <option value="draft">Set to Draft</option>
            <option value="feature">Mark Featured</option>
            <option value="unfeature">Remove Featured</option>
            <option value="delete">Delete</option>
          </Select>
          <Button
            onClick={handleBulkAction}
            disabled={!bulkAction || bulkWorking}
            variant={bulkAction === 'delete' ? 'danger' : 'secondary'}
            style={{ padding: '7px 14px', fontSize: 13 }}
          >
            {bulkWorking ? 'Working…' : 'Apply'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setSelected(new Set())}
            style={{ padding: '7px 14px', fontSize: 13 }}
          >
            Clear
          </Button>
        </div>
      )}

      <ErrorBanner message={error} />

      {!isFirebaseConfigured() ? (
        <EmptyState message="Firebase not configured." sub="Add environment variables to manage tools via Firestore." />
      ) : loading ? (
        <p style={{ color: '#6b82a8', fontSize: 13 }}>Loading…</p>
      ) : tools.length === 0 ? (
        <EmptyState
          message="No tools found."
          sub={search || statusFilter || catFilter ? 'Try adjusting your filters.' : 'Create your first tool to get started.'}
        />
      ) : (
        <AdminCard style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a2d4a', background: '#0c1522' }}>
                <th style={{ padding: '11px 14px', width: 36 }}>
                  <input
                    type="checkbox"
                    checked={selected.size > 0 && selected.size === tools.length}
                    onChange={toggleAll}
                    style={{ accentColor: '#14FFF4', cursor: 'pointer' }}
                  />
                </th>
                <th style={{ padding: '11px 14px', color: '#6b82a8', fontWeight: 600, textAlign: 'left' }}>Tool</th>
                <th style={{ padding: '11px 14px', color: '#6b82a8', fontWeight: 600, textAlign: 'left' }}>Category</th>
                <th style={{ padding: '11px 14px', color: '#6b82a8', fontWeight: 600, textAlign: 'left' }}>Status</th>
                <th style={{ padding: '11px 14px', color: '#6b82a8', fontWeight: 600, textAlign: 'left' }}>Rating</th>
                <th style={{ padding: '11px 14px', color: '#6b82a8', fontWeight: 600, textAlign: 'left' }}>Flags</th>
                <th style={{ padding: '11px 14px' }}></th>
              </tr>
            </thead>
            <tbody>
              {tools.map(tool => (
                <tr
                  key={tool.id}
                  style={{
                    borderBottom: '1px solid #14213a',
                    background: selected.has(tool.id) ? 'rgba(20,255,244,0.04)' : 'transparent',
                  }}
                >
                  <td style={{ padding: '10px 14px' }}>
                    <input
                      type="checkbox"
                      checked={selected.has(tool.id)}
                      onChange={() => toggleSelect(tool.id)}
                      style={{ accentColor: '#14FFF4', cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {tool.logo_url && (
                        <img src={tool.logo_url} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'contain', background: '#14213a' }} />
                      )}
                      <div>
                        <Link href={`/admin/tools/${tool.id}`} style={{ color: '#e8f0ff', fontWeight: 600, textDecoration: 'none', fontSize: 13.5 }}>
                          {tool.name}
                        </Link>
                        <div style={{ color: '#6b82a8', fontSize: 11, fontFamily: 'monospace', marginTop: 1 }}>/{tool.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#9fb3d4' }}>{tool.category || '—'}</td>
                  <td style={{ padding: '10px 14px' }}><StatusBadge status={tool.status || 'draft'} /></td>
                  <td style={{ padding: '10px 14px', color: '#ffc147', fontWeight: 600 }}>
                    {tool.rating ? `★ ${Number(tool.rating).toFixed(1)}` : '—'}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {tool.featured && <span title="Featured" style={{ fontSize: 13 }}>⭐</span>}
                      {tool.hot      && <span title="Trending" style={{ fontSize: 13 }}>🔥</span>}
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                    <Link href={`/admin/tools/${tool.id}`}>
                      <Button variant="secondary" style={{ padding: '5px 12px', fontSize: 12 }}>Edit</Button>
                    </Link>
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
