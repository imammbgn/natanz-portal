import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import api from '../../api';
import {
  HiOutlinePlay,
  HiOutlineClock,
  HiOutlineTerminal,
  HiOutlinePlusCircle,
  HiOutlineTrash,
} from 'react-icons/hi';

export default function AdminScripts() {
  const [scripts, setScripts] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('scripts');
  const [executing, setExecuting] = useState({});
  const [selectedOutput, setSelectedOutput] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newScript, setNewScript] = useState({ name: '', description: '', category: 'custom', command: '', timeout: 30, is_dangerous: false });
  const [toast, setToast] = useState(null);

  function load() {
    setLoading(true);
    Promise.all([
      api.get('/admin/scripts'),
      api.get('/admin/executions'),
    ]).then(([sRes, eRes]) => {
      setScripts(sRes.data.data);
      setExecutions(eRes.data.data);
    }).catch(console.error).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function executeScript(id) {
    setExecuting((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await api.post(`/admin/scripts/${id}/execute`);
      const result = res.data.data;
      setSelectedOutput(result);
      showToast(`Script ${result.status === 'completed' ? 'completed' : 'failed'}.`);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Execution failed.', 'error');
    } finally {
      setExecuting((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function deleteScript(id) {
    if (!confirm('Delete this script?')) return;
    try {
      await api.delete(`/admin/scripts/${id}`);
      showToast('Script deleted.');
      load();
    } catch (err) {
      showToast('Failed to delete.', 'error');
    }
  }

  async function handleAddScript(e) {
    e.preventDefault();
    if (!newScript.name || !newScript.command) return;
    try {
      await api.post('/admin/scripts', newScript);
      setShowAdd(false);
      setNewScript({ name: '', description: '', category: 'custom', command: '', timeout: 30, is_dangerous: false });
      showToast('Script created.');
      load();
    } catch (err) {
      showToast('Failed to create script.', 'error');
    }
  }

  const categoryColors = {
    system: '#3b82f6', monitoring: '#0ea5e9', network: '#8b5cf6',
    security: '#ef4444', maintenance: '#f59e0b', deployment: '#10b981', custom: '#6b7280',
  };

  return (
    <>
      <Header title="Script Management" />
      <div className="page-content">
        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

        {/* Tabs */}
        <div className="admin-tabs">
          <button className={`admin-tab ${activeTab === 'scripts' ? 'active' : ''}`} onClick={() => setActiveTab('scripts')}>
            <HiOutlineTerminal /> Scripts
          </button>
          <button className={`admin-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            <HiOutlineClock /> Execution History
          </button>
        </div>

        {activeTab === 'scripts' && (
          <>
            <div className="page-toolbar">
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{scripts.length} scripts available</span>
              <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
                <HiOutlinePlusCircle /> Add Script
              </button>
            </div>

            {loading ? <div className="spinner" /> : (
              <div className="scripts-grid">
                {scripts.map((s) => (
                  <div key={s.id} className="script-card">
                    <div className="script-card-header">
                      <div>
                        <h3>{s.name}</h3>
                        <span className="script-category" style={{ background: `${categoryColors[s.category] || '#6b7280'}15`, color: categoryColors[s.category] || '#6b7280' }}>
                          {s.category}
                        </span>
                        {s.is_dangerous && <span className="script-danger">DANGEROUS</span>}
                      </div>
                    </div>
                    <p className="script-desc">{s.description}</p>
                    <div className="script-meta">
                      <span>Timeout: {s.timeout}s</span>
                      <span className="mono" style={{ fontSize: '0.72rem' }}>{s.command}</span>
                    </div>
                    <div className="script-actions">
                      <button
                        className={`btn ${s.is_dangerous ? 'btn-danger' : 'btn-primary'} btn-sm`}
                        disabled={executing[s.id]}
                        onClick={() => executeScript(s.id)}
                      >
                        <HiOutlinePlay /> {executing[s.id] ? 'Running...' : 'Execute'}
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => deleteScript(s.id)}>
                        <HiOutlineTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'history' && (
          loading ? <div className="spinner" /> : (
            <div className="cases-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Script</th>
                    <th>Executed By</th>
                    <th>Status</th>
                    <th>Time</th>
                    <th>Executed At</th>
                    <th>Output</th>
                  </tr>
                </thead>
                <tbody>
                  {executions.map((ex) => (
                    <tr key={ex.id}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 500 }}>{ex.script_name}</span>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{ex.category}</span>
                        </div>
                      </td>
                      <td>{ex.username}</td>
                      <td><span className={`status-badge status-${ex.status}`}>{ex.status}</span></td>
                      <td>{ex.execution_time_ms}ms</td>
                      <td className="td-date">{new Date(ex.created_at).toLocaleString()}</td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => setSelectedOutput(ex)}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {executions.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No executions yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Output Modal */}
        {selectedOutput && (
          <div className="modal-overlay" onClick={() => setSelectedOutput(null)}>
            <div className="modal-content script-output-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Output: {selectedOutput.script_name}</h3>
                <button className="modal-close" onClick={() => setSelectedOutput(null)}>&times;</button>
              </div>
              <div className="modal-body">
                <div className="script-output-meta">
                  <span className={`status-badge status-${selectedOutput.status}`}>{selectedOutput.status}</span>
                  <span>Exit code: {selectedOutput.exit_code}</span>
                  <span>Time: {selectedOutput.execution_time_ms}ms</span>
                </div>
                <pre className="script-output-box">{selectedOutput.output || 'No output.'}</pre>
              </div>
            </div>
          </div>
        )}

        {/* Add Script Modal */}
        {showAdd && (
          <div className="modal-overlay" onClick={() => setShowAdd(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Add New Script</h3>
                <button className="modal-close" onClick={() => setShowAdd(false)}>&times;</button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleAddScript} className="modal-form">
                  <div className="auth-v2-field">
                    <label>Name</label>
                    <input type="text" value={newScript.name} onChange={(e) => setNewScript({ ...newScript, name: e.target.value })} placeholder="Script name" required />
                  </div>
                  <div className="auth-v2-field">
                    <label>Description</label>
                    <input type="text" value={newScript.description} onChange={(e) => setNewScript({ ...newScript, description: e.target.value })} placeholder="What does this script do?" />
                  </div>
                  <div className="form-row">
                    <div className="auth-v2-field">
                      <label>Category</label>
                      <select value={newScript.category} onChange={(e) => setNewScript({ ...newScript, category: e.target.value })}>
                        <option value="custom">Custom</option>
                        <option value="system">System</option>
                        <option value="monitoring">Monitoring</option>
                        <option value="network">Network</option>
                        <option value="security">Security</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="deployment">Deployment</option>
                      </select>
                    </div>
                    <div className="auth-v2-field">
                      <label>Timeout (sec)</label>
                      <input type="number" value={newScript.timeout} onChange={(e) => setNewScript({ ...newScript, timeout: Number(e.target.value) })} min={5} max={300} />
                    </div>
                  </div>
                  <div className="auth-v2-field">
                    <label>Command</label>
                    <input type="text" value={newScript.command} onChange={(e) => setNewScript({ ...newScript, command: e.target.value })} placeholder="e.g. restart_nginx" required />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={newScript.is_dangerous} onChange={(e) => setNewScript({ ...newScript, is_dangerous: e.target.checked })} />
                    Mark as dangerous script
                  </label>
                  <div className="modal-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Create Script</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
