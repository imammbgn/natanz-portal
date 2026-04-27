import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useSupportDrawer } from '../components/SupportDrawer';
import api from '../api';
import { HiOutlineSupport, HiOutlineChatAlt2 } from 'react-icons/hi';

export default function Support() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const { setIsOpen } = useSupportDrawer();

  function loadCases() {
    setLoading(true);
    api.get('/support/cases')
      .then((res) => setCases(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadCases(); }, []);

  function openCase(c) {
    setSelectedCase(c);
  }

  return (
    <>
      <Header title="Support Cases" />
      <div className="page-content">
        <div className="page-toolbar">
          <h2 style={{ fontSize: '0.95rem', fontWeight: 500, color: '#64748b' }}>
            Your submitted support cases
          </h2>
          <button className="btn btn-primary" onClick={() => setIsOpen(true)}>
            <HiOutlineChatAlt2 /> New Case
          </button>
        </div>

        {loading ? (
          <div className="spinner" />
        ) : cases.length === 0 ? (
          <div className="empty-state">
            <HiOutlineSupport className="empty-icon" />
            <h3>No Support Cases</h3>
            <p>You haven't submitted any support cases yet.</p>
            <button className="btn btn-primary" onClick={() => setIsOpen(true)}>
              <HiOutlineChatAlt2 /> Submit a Case
            </button>
          </div>
        ) : selectedCase ? (
          <div className="case-view-panel">
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedCase(null)} style={{ marginBottom: 16 }}>
              &larr; Back to list
            </button>
            <div className="detail-info-card">
              <h3>{selectedCase.title}</h3>
              <div className="detail-rows" style={{ marginTop: 16 }}>
                <div className="detail-row">
                  <span className="detail-label">Status</span>
                  <span className={`status-badge status-${selectedCase.status}`}>{selectedCase.status.replace('_', ' ')}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Category</span>
                  <span className="category-badge">{selectedCase.category}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Priority</span>
                  <span className={`priority-badge priority-${selectedCase.priority}`}>{selectedCase.priority}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Description</span>
                  <span className="detail-value">{selectedCase.description}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Created</span>
                  <span className="detail-value">{new Date(selectedCase.created_at).toLocaleString()}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Updated</span>
                  <span className="detail-value">{new Date(selectedCase.updated_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="cases-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Topic</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.id} onClick={() => openCase(c)} className="table-row-link">
                    <td className="td-title">{c.title}</td>
                    <td><span className="category-badge">{c.category}</span></td>
                    <td><span className={`status-badge status-${c.status}`}>{c.status.replace('_', ' ')}</span></td>
                    <td className="td-date">{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
