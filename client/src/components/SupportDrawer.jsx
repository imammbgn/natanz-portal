import { useState, useEffect, createContext, useContext } from 'react';
import api from '../api';
import {
  HiOutlineX,
  HiOutlineChatAlt2,
  HiOutlinePlusCircle,
  HiOutlineChevronLeft,
  HiOutlinePaperAirplane,
} from 'react-icons/hi';

const SupportDrawerContext = createContext(null);

export function SupportDrawerProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <SupportDrawerContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </SupportDrawerContext.Provider>
  );
}

export function useSupportDrawer() {
  const ctx = useContext(SupportDrawerContext);
  if (!ctx) throw new Error('useSupportDrawer must be used within SupportDrawerProvider');
  return ctx;
}

export default function SupportDrawer() {
  const { isOpen, setIsOpen } = useSupportDrawer();
  const [view, setView] = useState('menu'); // 'menu' | 'new-case'
  const [cases, setCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const [form, setForm] = useState({ category: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  function loadCases() {
    setLoadingCases(true);
    api.get('/support/cases')
      .then((res) => setCases(res.data.data))
      .catch(console.error)
      .finally(() => setLoadingCases(false));
  }

  useEffect(() => {
    if (isOpen) {
      loadCases();
      setView('menu');
      setSuccess(false);
    }
  }, [isOpen]);

  function close() {
    setIsOpen(false);
    setView('menu');
    setForm({ category: '', subject: '', message: '' });
    setSuccess(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.category || !form.subject.trim() || !form.message.trim()) return;
    setSending(true);
    try {
      await api.post('/support/cases', {
        title: form.subject,
        description: form.message,
        category: form.category,
        priority: 'medium',
      });
      setSuccess(true);
      setForm({ category: '', subject: '', message: '' });
      loadCases();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && <div className="drawer-backdrop" onClick={close} />}

      {/* Drawer */}
      <div className={`support-drawer ${isOpen ? 'support-drawer--open' : ''}`}>
        <div className="support-drawer__header">
          <div className="support-drawer__header-left">
            {view === 'new-case' && (
              <button className="drawer-back-btn" onClick={() => { setView('menu'); setSuccess(false); }}>
                <HiOutlineChevronLeft />
              </button>
            )}
            <h3>{view === 'menu' ? 'Support' : 'New Case'}</h3>
          </div>
          <button className="drawer-close-btn" onClick={close}>
            <HiOutlineX />
          </button>
        </div>

        <div className="support-drawer__body">
          {/* === MENU VIEW === */}
          {view === 'menu' && (
            <>
              <button className="support-drawer__new-case" onClick={() => setView('new-case')}>
                <HiOutlinePlusCircle className="support-drawer__new-icon" />
                <div>
                  <span className="support-drawer__new-title">Add New Case</span>
                  <span className="support-drawer__new-desc">Submit a new support request</span>
                </div>
              </button>

              <div className="support-drawer__divider">
                <span>Recent Cases</span>
              </div>

              {loadingCases ? (
                <div className="spinner" />
              ) : cases.length === 0 ? (
                <div className="support-drawer__empty">
                  <HiOutlineChatAlt2 className="support-drawer__empty-icon" />
                  <p>No support cases yet</p>
                </div>
              ) : (
                <div className="support-drawer__cases">
                  {cases.map((c) => (
                    <div key={c.id} className="support-drawer__case-item">
                      <div className="support-drawer__case-info">
                        <span className="support-drawer__case-title">{c.title}</span>
                        <span className="support-drawer__case-meta">
                          {c.category} &middot; {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <span className={`status-badge status-${c.status}`}>{c.status.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* === NEW CASE VIEW === */}
          {view === 'new-case' && (
            <>
              {success ? (
                <div className="support-drawer__success">
                  <div className="support-drawer__success-icon">
                    <svg width="48" height="48" viewBox="0 0 48 48">
                      <circle cx="24" cy="24" r="22" fill="#dcfce7" stroke="#16a34a" strokeWidth="2" />
                      <path d="M15 24l5 5 13-13" stroke="#16a34a" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h4>Case Submitted</h4>
                  <p>Your support request has been received. Our team will get back to you shortly.</p>
                  <button className="support-drawer__submit-another" onClick={() => { setSuccess(false); setForm({ category: '', subject: '', message: '' }); }}>
                    Submit Another
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="support-drawer__form">
                  <div className="support-drawer__field">
                    <label>Help Topic <span className="required-sign">*</span></label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      required
                    >
                      <option value="">Select a topic...</option>
                      <option value="general">General Inquiry</option>
                      <option value="technical">Technical Issue</option>
                      <option value="billing">Billing & Payments</option>
                      <option value="account">Account & Access</option>
                      <option value="security">Security Concern</option>
                      <option value="service">Service Request</option>
                    </select>
                  </div>

                  <div className="support-drawer__field">
                    <label>Subject <span className="required-sign">*</span></label>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      placeholder="Brief summary of your issue"
                      required
                    />
                  </div>

                  <div className="support-drawer__field">
                    <label>Message <span className="required-sign">*</span></label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Describe your issue or request in detail..."
                      rows={6}
                      required
                    />
                  </div>

                  <button type="submit" className="support-drawer__send-btn" disabled={sending}>
                    <HiOutlinePaperAirplane />
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
