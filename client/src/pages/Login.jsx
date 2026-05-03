import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await authLogin(login, password);
      const roleRoutes = {
        customer: '/dashboard',
        support: '/dashboard',
        auditor: '/auditor',
        admin: '/admin',
      };
      navigate(roleRoutes[user.role] || '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-v2-wrapper">
      {/* Left - Promo Side */}
      <div className="auth-v2-promo">
        <div className="auth-v2-promo-bg">
          <img
            src="/img/auth-background.png"
            alt="Natanz Cloud"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
        <div className="auth-v2-promo-overlay" />
        <div className="auth-v2-promo-logo">
          <svg width="44" height="44" viewBox="0 0 44 44">
            <rect width="44" height="44" rx="8" fill="rgba(255,255,255,0.15)" />
            <text x="22" y="30" fontFamily="Inter, Arial" fontSize="22" fontWeight="700" fill="white" textAnchor="middle">N</text>
          </svg>
        </div>
      </div>

      {/* Right - Form Side */}
      <div className="auth-v2-content">
        <div className="auth-v2-card">
          <div className="auth-v2-form-container">
            {/* Title */}
            <div className="auth-v2-title-section">
              <h2>Natanz Customer Portal</h2>
            </div>

            {/* SSO Buttons */}
            <div className="auth-v2-sso-section">
              <button type="button" className="auth-v2-sso-btn" onClick={() => {}}>
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
                </svg>
                <span>Continue with Google</span>
              </button>
              <button type="button" className="auth-v2-sso-btn" onClick={() => {}}>
                <svg width="18" height="18" viewBox="0 0 16 16" fill="#24292f">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/>
                </svg>
                <span>Continue with GitHub</span>
              </button>
            </div>

            {/* OR Divider */}
            <div className="auth-v2-divider">
              <hr /><span>OR</span><hr />
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="auth-v2-email-section">
              {error && <div className="alert alert-error">{error}</div>}
              <div className="auth-v2-field">
                <label>Username or Email <span className="required-sign">*</span></label>
                <input
                  type="text"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  placeholder="Enter your username or email"
                  autoComplete="username"
                  required
                />
              </div>
              <div className="auth-v2-field">
                <label>Password <span className="required-sign">*</span></label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </div>
              <button type="submit" className="auth-v2-submit-btn" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <hr className="auth-v2-separator" />

            {/* Sign Up Link */}
            <div className="auth-v2-footer-link">
              Don't have an account?&nbsp;<Link to="/register">Sign Up</Link>
            </div>
          </div>
        </div>

        {/* Consent */}
        <div className="auth-v2-consent">
          <p>By signing in, I confirm my consent to the <a href="#" onClick={(e) => e.preventDefault()}>processing of my personal data</a> in accordance with the accepted policy.</p>
        </div>
      </div>
    </div>
  );
}
