import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { AdminCard, Button, Select, ErrorBanner, EmptyState } from '../../components/admin/ui';
import { listCmsUsers, updateUserRole } from '../../lib/cms/adminUsers';
import { useAuth } from '../../lib/cms/useAuth';
import { isSupabaseConfigured as isFirebaseConfigured } from '../../lib/supabase';

export default function AdminUsersPage() {
  const auth = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingId, setSavingId] = useState(null);

  const load = useCallback(async () => {
    if (!isFirebaseConfigured()) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await listCmsUsers();
    setUsers(data || []);
    setError(error);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleRoleChange(userId, role) {
    setSavingId(userId);
    setError(null);
    const { error } = await updateUserRole(userId, role);
    setSavingId(null);
    if (error) { setError(error); return; }
    load();
  }

  return (
    <AdminLayout title="Admin Users" requiredRole="admin">
      <div style={{
        background: 'rgba(255,193,71,0.08)', border: '1px solid rgba(255,193,71,0.3)', borderRadius: 8,
        padding: '12px 16px', color: '#ffc147', fontSize: 13, marginBottom: 20, lineHeight: 1.6,
      }}>
        New sign-ups default to <strong>editor</strong>. There is no self-service admin promotion —
        an existing admin must promote someone here. This list and every role change is verified
        server-side in <code>pages/api/admin/users/**</code> using the Supabase Admin SDK;
        it is not enforced by anything in this page&rsquo;s client-side code.
      </div>

      <ErrorBanner message={error} />

      {!isFirebaseConfigured() ? (
        <EmptyState message="No database connection." sub="Configure Firebase to manage users." />
      ) : loading ? (
        <p style={{ color: '#6b82a8' }}>Loading…</p>
      ) : users.length === 0 ? (
        <EmptyState message="No users found." sub="Users appear here automatically after they be created in Firebase Auth." />
      ) : (
        <AdminCard style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a2d4a', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', color: '#6b82a8', fontWeight: 600 }}>Email</th>
                <th style={{ padding: '12px 16px', color: '#6b82a8', fontWeight: 600 }}>Display name</th>
                <th style={{ padding: '12px 16px', color: '#6b82a8', fontWeight: 600 }}>Role</th>
                <th style={{ padding: '12px 16px', color: '#6b82a8', fontWeight: 600 }}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #14213a' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{u.email}</td>
                  <td style={{ padding: '12px 16px', color: '#9fb3d4' }}>{u.display_name || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <Select
                      value={u.role}
                      disabled={savingId === u.id}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      style={{ marginBottom: 0, minWidth: 110, padding: '6px 10px', fontSize: 12.5 }}
                    >
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </Select>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b82a8' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminCard>
      )}
    </AdminLayout>
  );
}
