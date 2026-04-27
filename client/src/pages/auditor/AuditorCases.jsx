import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import api from '../../api';
import { HiOutlineSearch, HiOutlineEye } from 'react-icons/hi';

export default function AuditorCases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseDetail, setCaseDetail] = useState(null);
  const [filters, setFilters] = useState({ status: '', category: '', priority: '', search: '' });

  function loadCases() {
    setLoading(true);
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.category) params.category = filters.category;
    if (filters.priority) params.priority = filters.priority;
    if (filters.search) params.search = filters.search;

    api.get('/auditor/cases', { params })
      .then((res) => setCases(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadCases(); }, []);

  function viewCase(id) {
    api.get(`/auditor/cases/${id}`)
      .then((res) => {
        setCaseDetail(res.data.data);
        setSelectedCase(id);
      })
      .catch(console.error);
  }

  function closeDetail() {
    setSelectedCase(null);
    setCaseDetail(null);
  }

  return (
    <>
      <Header title="Cases Audit" />
      <div className="page-content">
        {selectedCase && caseDetail ? (
          <div className="audit-case-detail">
            <button className="btn btn-secondary btn-sm" onClick={closeDetail} style={{ marginBottom: 16 }}>
              &larr; Back to list
            </button>

            <div className="detail-grid">
              <div className="detail-info-card">
                <h3>Case Information</h3>
                <div className="detail-rows">
                  <div className="detail-row">
                    <span className="detail-label">Case ID</span>
                    <span className="detail-value mono">{caseDetail.id}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Subject</span>
                    <span className="detail-value">{caseDetail.title}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Description</span>
                    <span className="detail-value">{caseDetail.description}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Status</span>
                    <span className={`status-badge status-${caseDetail.status}`}>{caseDetail.status.replace('_', ' ')}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Priority</span>
                    <span className={`priority-badge priority-${caseDetail.priority}`}>{caseDetail.priority}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Category</span>
                    <span className="category-badge">{caseDetail.category}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Created</span>
                    <span className="detail-value">{new Date(caseDetail.created_at).toLocaleString()}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Updated</span>
                    <span className="detail-value">{new Date(caseDetail.updated_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="detail-info-card">
                <h3>Submitted By</h3>
                <div className="detail-rows">
                  <div className="detail-row">
                    <span className="detail-label">Username</span>
                    <span className="detail-value">{caseDetail.username}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Full Name</span>
                    <span className="detail-value">{caseDetail.full_name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email</span>
                    <span className="detail-value">{caseDetail.email}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Role</span>
                    <span className="category-badge">{caseDetail.user_role}</span>
                  </div>
                </div>

                <h3 style={{ marginTop: 24 }}>Messages ({caseDetail.messages?.length || 0})</h3>
                <div className="messages-list" style={{ marginTop: 12 }}>
                  {caseDetail.messages?.length > 0 ? (
                    caseDetail.messages.map((msg) => (
                      <div key={msg.id} className={`message-item ${msg.role !== 'customer' ? 'message-staff' : ''}`}>
                        <div className="message-header">
                          <span className="message-author">{msg.full_name || msg.username}</span>
                          <span className="message-role">{msg.role}</span>
                          <span className="message-time">{new Date(msg.created_at).toLocaleString()}</span>
                        </div>
                        <div className="message-body">{msg.message}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted" style={{ padding: '16px 0' }}>No messages in this case.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="page-toolbar">
              <div className="filter-group">
                <select className="form-select" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                  <option value="">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <select className="form-select" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
                  <option value="">All Categories</option>
                  <option value="general">General</option>
                  <option value="technical">Technical</option>
                  <option value="billing">Billing</option>
                  <option value="account">Account</option>
                  <option value="security">Security</option>
                  <option value="service">Service</option>
                </select>
                <select className="form-select" value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <form className="search-box" onSubmit={(e) => { e.preventDefault(); loadCases(); }}>
                  <HiOutlineSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search cases, users..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  />
                </form>
                <button className="btn btn-primary" onClick={loadCases}>Search</button>
              </div>
            </div>

            {loading ? (
              <div className="spinner" />
            ) : (
              <div className="cases-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Submitted By</th>
                      <th>Category</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.map((c) => (
                      <tr key={c.id}>
                        <td className="td-title">{c.title}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>{c.full_name || c.username}</span>
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{c.email}</span>
                          </div>
                        </td>
                        <td><span className="category-badge">{c.category}</span></td>
                        <td><span className={`priority-badge priority-${c.priority}`}>{c.priority}</span></td>
                        <td><span className={`status-badge status-${c.status}`}>{c.status.replace('_', ' ')}</span></td>
                        <td className="td-date">{new Date(c.created_at).toLocaleDateString()}</td>
                        <td>
                          <button className="btn btn-secondary btn-sm" onClick={() => viewCase(c.id)}>
                            <HiOutlineEye /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                    {cases.length === 0 && (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No cases found.</td></tr>
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
