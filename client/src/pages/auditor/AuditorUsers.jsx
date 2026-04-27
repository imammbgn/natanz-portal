import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import api from '../../api';
import { HiOutlineSearch } from 'react-icons/hi';

export default function AuditorUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [filters, setFilters] = useState({ role: '', search: '' });

  function loadUsers() {
    setLoading(true);
    const params = {};
    if (filters.role) params.role = filters.role;
    if (filters.search) params.search = filters.search;

    api.get('/auditor/users', { params })
      .then((res) => setUsers(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadUsers(); }, []);

  function viewUser(id) {
    api.get(`/auditor/users/${id}`)
      .then((res) => {
        setUserDetail(res.data.data);
        setSelectedUser(id);
      })
      .catch(console.error);
  }

  function closeDetail() {
    setSelectedUser(null);
    setUserDetail(null);
  }

  return (
    <>
      <Header title="User Audit" />
      <div className="page-content">
        {selectedUser && userDetail ? (
          <div className="audit-case-detail">
            <button className="btn btn-secondary btn-sm" onClick={closeDetail} style={{ marginBottom: 16 }}>
              &larr; Back to list
            </button>

            <div className="detail-grid">
              <div className="detail-info-card">
                <h3>User Profile</h3>
                <div className="detail-rows">
                  <div className="detail-row">
                    <span className="detail-label">User ID</span>
                    <span className="detail-value mono">{userDetail.id}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Username</span>
                    <span className="detail-value">{userDetail.username}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Full Name</span>
                    <span className="detail-value">{userDetail.full_name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email</span>
                    <span className="detail-value">{userDetail.email}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Role</span>
                    <span className="category-badge">{userDetail.role}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Status</span>
                    <span className={`status-badge ${userDetail.is_active ? 'status-active' : 'status-inactive'}`}>
                      {userDetail.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Last Login</span>
                    <span className="detail-value">{userDetail.last_login ? new Date(userDetail.last_login).toLocaleString() : 'Never'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Created</span>
                    <span className="detail-value">{new Date(userDetail.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="detail-info-card">
                <h3>Support Cases ({userDetail.cases?.length || 0})</h3>
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {userDetail.cases?.length > 0 ? (
                    userDetail.cases.map((c) => (
                      <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>{c.title}</span>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{c.category} &middot; {new Date(c.created_at).toLocaleDateString()}</span>
                        </div>
                        <span className={`status-badge status-${c.status}`}>{c.status.replace('_', ' ')}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted">No support cases submitted.</p>
                  )}
                </div>

                <h3 style={{ marginTop: 24 }}>Project Groups ({userDetail.projects?.length || 0})</h3>
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {userDetail.projects?.length > 0 ? (
                    userDetail.projects.map((p) => (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>{p.name}</span>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{p.region} &middot; {p.environment}</span>
                        </div>
                        <span className={`status-badge status-${p.status}`}>{p.status}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted">No project groups.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
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
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  />
                </form>
                <button className="btn btn-primary" onClick={loadUsers}>Search</button>
              </div>
            </div>

            {loading ? (
              <div className="spinner" />
            ) : (
              <div className="cases-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Full Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Last Login</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td className="td-title">{u.username}</td>
                        <td>{u.full_name || '-'}</td>
                        <td style={{ fontSize: '0.82rem', color: '#64748b' }}>{u.email}</td>
                        <td><span className="category-badge">{u.role}</span></td>
                        <td>
                          <span className={`status-badge ${u.is_active ? 'status-active' : 'status-inactive'}`}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="td-date">{u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}</td>
                        <td>
                          <button className="btn btn-secondary btn-sm" onClick={() => viewUser(u.id)}>
                            View
                          </button>
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
          </>
        )}
      </div>
    </>
  );
}
