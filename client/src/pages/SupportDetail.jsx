import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import { Textarea } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import api from '../api';

export default function SupportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  function loadCase() {
    setLoading(true);
    api.get(`/support/cases/${id}`)
      .then((res) => setCaseData(res.data.data))
      .catch(() => navigate('/support'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadCase(); }, [id]);

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      await api.post(`/support/cases/${id}/messages`, { message: message.trim() });
      setMessage('');
      loadCase();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <>
        <Header title="Support Case" />
        <div className="page-content"><div className="spinner" /></div>
      </>
    );
  }

  return (
    <>
      <Header title={caseData?.title || 'Support Case'} />
      <div className="page-content">
        <div className="detail-header">
          <div className="detail-breadcrumb">
            <Link to="/support">Support</Link>
            <span>/</span>
            <span>{caseData?.title}</span>
          </div>
        </div>

        <div className="case-detail-grid">
          <div className="case-detail-info">
            <div className="detail-info-card">
              <h3>Case Information</h3>
              <div className="detail-rows">
                <div className="detail-row">
                  <span className="detail-label">ID</span>
                  <span className="detail-value mono">{caseData?.id}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status</span>
                  <span className={`status-badge status-${caseData?.status}`}>{caseData?.status?.replace('_', ' ')}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Priority</span>
                  <span className={`priority-badge priority-${caseData?.priority}`}>{caseData?.priority}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Category</span>
                  <span className="category-badge">{caseData?.category}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Description</span>
                  <span className="detail-value">{caseData?.description}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Created</span>
                  <span className="detail-value">{new Date(caseData?.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="case-messages">
            <h3>Messages</h3>
            <div className="messages-list">
              {caseData?.messages?.length > 0 ? (
                caseData.messages.map((msg) => (
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
                <p className="text-muted">No messages yet.</p>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="message-form">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                rows={3}
              />
              <Button type="submit" disabled={sending || !message.trim()}>
                {sending ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
