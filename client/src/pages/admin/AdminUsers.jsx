import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import api from '../../api';
import { HiOutlineSearch } from 'react-icons/hi';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ role: '', search: '' });
  const [toast, setToast] = useState(null);

  function loadUsers() {
    setLoading(true);
    const params = {};
    if (filters.role) params.role = filters.role;
    if (filters.search) params.search = filters.search;
    api.get('/admin/users', { params })
      .then((res) => setUsers(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadUsers(); }, []);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function changeRole(userId, newRole) {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      showToast(`Role changed to ${newRole}`);
      loadUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to change role.', 'error');
    }
  }

  async function toggleStatus(userId, currentActive) {
    try {
      await api.put(`/admin/users/${userId}/status`, { is_active: currentActive ? 0 : 1 });
      showToast(currentActive ? 'User deactivated.' : 'User activated.');
      loadUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to change status.', 'error');
    }
  }

  return (
    <>
      <Header title="User Management" />
      <div className="page-content">
        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

        <div className="page-toolbar">
          <div className="filter-group">
            <select className="form-select" value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
              <option value="">All Roles</option>
              <option value="customer">Customer</option>
              <option value="support">Support</option>
              <option value="auditor">Auditor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <form className="search-box" onSubmit={(e) => { e.preventDefault(); loadUsers(); }}>
              <HiOutlineSearch className="search-icon" />
              <input type="text" placeholder="Search users..." value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
            </form>
            <button className="btn btn-primary" onClick={loadUsers}>Search</button>
          </div>
        </div>

        {loading ? <div className="spinner" /> : (
          <div className="cases-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 500 }}>{u.full_name || u.username}</span>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>@{u.username}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: '#64748b' }}>{u.email}</td>
                    <td>
                      <select
                        className="form-select role-select-inline"
                        value={u.role}
                        disabled={u.id === 'admin-00000000-0000-0000-0000-000000000001'}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                      >
                        <option value="customer">Customer</option>
                        <option value="support">Support</option>
                        <option value="auditor">Auditor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <button
                        className={`status-toggle ${u.is_active ? 'active' : 'inactive'}`}
                        disabled={u.id === 'admin-00000000-0000-0000-0000-000000000001'}
                        onClick={() => toggleStatus(u.id, u.is_active)}
                      >
                        {u.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="td-date">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="td-date">{u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}</td>
                    <td>
                      {u.id !== 'admin-00000000-0000-0000-0000-000000000001' && (
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Manage above</span>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
