import React, { useState } from 'react';
import catIllustration from '../assets/images/LoginImage6.png';
import logoImage from '../assets/images/logo0111.png';
import { useNavigate, Link } from 'react-router-dom';
import { API } from '../constants';
const Login = ({ setIsAuthenticated, setUser }) => {
  const [email, setEmail] = useState('demo@padai.com');
  const [password, setPassword] = useState('Demo@123');
  const [staySignedIn, setStaySignedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        ['padai_flashcards', 'padai_quiz', 'padai_summaries', 'padai_video_job', 'padai_video'].forEach(k => localStorage.removeItem(k));
        if (staySignedIn) {
          localStorage.setItem('user', JSON.stringify(data.user));
          sessionStorage.removeItem('user');
        } else {
          sessionStorage.setItem('user', JSON.stringify(data.user));
          localStorage.removeItem('user');
        }
        setUser(data.user);
        setIsAuthenticated(true);
        navigate('/dashboard');
      } else if (response.status === 429) {
        setError('Too many login attempts. Please wait a minute and try again.');
      } else {
        setError(data.detail || 'Invalid email or password');
      }
    } catch (err) {
      setError('Cannot connect to server. Use demo credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Serif+Display&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; margin: 0; padding: 0; }

        .login-root {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow-y: auto;
        }

        @media (min-width: 480px) {
          .login-root { padding: 32px; }
        }

        .login-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url(${catIllustration});
          background-size: cover;
          background-position: center center;
          background-repeat: no-repeat;
          z-index: 0;
        }

        .login-overlay {
          position: fixed;
          inset: 0;
          z-index: 1;
          background: linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.18) 50%, rgba(0,0,0,0.38) 100%);
        }

        /* Wider card - integrated from doc9 sizing */
        .login-card {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 560px;
          background: rgba(255, 255, 255, 0.13);
          backdrop-filter: blur(33px);
          -webkit-backdrop-filter: blur(30px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 24px;
          padding: 32px 20px 28px;
          box-shadow:
            0 8px 40px rgba(0, 0, 0, 0.35),
            0 1px 0 rgba(255,255,255,0.18) inset;
          animation: cardIn 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @media (min-width: 480px) {
          .login-card {
            border-radius: 32px;
            padding: 44px 52px 40px;
          }
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .card-accent {
          position: absolute;
          top: 0; left: 32px; right: 32px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6) 40%, rgba(200,180,255,0.7) 60%, transparent);
        }

        .card-logo {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }

        .card-logo img {
          height: 44px;
          width: auto;
          filter: drop-shadow(0 2px 10px rgba(0,0,0,0.35));
        }

        .card-heading {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(24px, 6vw, 36px);
          font-weight: 400;
          color: #ffffff;
          letter-spacing: -0.5px;
          line-height: 1.15;
          margin-bottom: 6px;
          text-align: center;
          text-shadow: 0 1px 8px rgba(0,0,0,0.55), 0 3px 20px rgba(0,0,0,0.35);
        }

        .card-sub {
          font-size: clamp(13px, 3vw, 15px);
          color: #ffffff;
          font-weight: 400;
          margin-bottom: 20px;
          text-align: center;
          text-shadow: 0 1px 8px rgba(0,0,0,0.5);
        }

        @media (min-width: 480px) {
          .card-sub { margin-bottom: 28px; }
        }

        .error-msg {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(248, 113, 113, 0.45);
          border-radius: 12px;
          padding: 13px 16px;
          font-size: 14px;
          color: #fecaca;
          font-weight: 500;
          margin-bottom: 22px;
          text-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }

        .field { margin-bottom: 16px; }

        .field-label {
          display: block;
          font-size: 14px;
          font-weight: 700;
          color: #000000;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .field-input {
          width: 100%;
          padding: 11px 4px;
          background: transparent;
          border: none;
          border-bottom: 1.5px solid rgba(255, 255, 255, 0.45);
          border-radius: 0;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 400;
          color: #ffffff;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          text-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }

        .field-input::placeholder { color: rgba(255, 255, 255, 0.38); }

        .field-input:focus {
          border-bottom-color: rgba(255, 255, 255, 0.95);
          box-shadow: 0 1px 0 rgba(255,255,255,0.95);
        }

        .row-opts {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 8px 0 20px;
        }

        .stay-label {
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 15px;
          color: #ffffff;
          font-weight: 500;
          cursor: pointer;
          user-select: none;
          text-shadow: 0 1px 6px rgba(0,0,0,0.45);
        }

        .stay-label input[type="checkbox"] {
          width: 16px;
          height: 16px;
          accent-color: #a78bfa;
          cursor: pointer;
        }

        .forgot-link {
          font-size: 15px;
          color: rgb(76, 64, 110);
          font-weight: 500;
          text-decoration: none;
          transition: color 0.15s;
        
        }

        .forgot-link:hover { color: #ffffff; }

        .submit-btn {
          width: 100%;
          padding: 13px;
          background: rgba(255, 255, 255, 0.95);
          color: #0d0820;
          border: none;
          border-radius: 16px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.2px;
          cursor: pointer;
          transition: background 0.18s, transform 0.14s, box-shadow 0.18s;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.22);
        }

        .submit-btn:hover {
          background: #ffffff;
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(0, 0, 0, 0.28);
        }

        .submit-btn:active { transform: scale(0.98); }
        .submit-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

        .register-line {
          text-align: center;
          margin-top: 12px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
        }

        .register-line a {
          color:  rgb(76, 64, 110);
          font-weight: 700;
          text-decoration: underline;
        
          
        }

        .register-line a:hover { opacity: 0.72; }

        .divider {
          display: flex;
          align-items: center;
          gap: 14px;
          margin: 16px 0 14px;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: rgba(255, 255, 255, 0.2);
        }

        .divider-label {
          font-size: 12px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.55);
          letter-spacing: 1.2px;
          text-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }

        .social-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .social-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 14px;
          background: rgba(255, 255, 255, 0.1);
          border: 1.5px solid rgba(255, 255, 255, 0.22);
          border-radius: 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.92);
          cursor: pointer;
          transition: background 0.18s, border-color 0.18s, transform 0.14s;
          text-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }

        .social-btn:hover {
          background: rgba(255, 255, 255, 0.18);
          border-color: rgba(255, 255, 255, 0.35);
          transform: translateY(-1px);
        }

        .fb-dot {
          width: 22px;
          height: 22px;
          background: #1877F2;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 13px;
          font-weight: 800;
          font-style: italic;
          flex-shrink: 0;
        }

        .footer {
          text-align: center;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.35);
          margin-top: 16px;
          font-weight: 400;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner {
          display: inline-block;
          width: 18px; height: 18px;
          border: 2px solid rgba(13,8,32,0.2);
          border-top-color: #0d0820;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          margin-right: 10px;
          vertical-align: middle;
        }
      `}</style>

      <div className="login-root">
        <div className="login-overlay" />

        <div className="login-card">
          <div className="card-accent" />

          <div className="card-logo">
            <img src={logoImage} alt="PadaiSathi" />
          </div>

          <h1 className="card-heading">Welcome Back</h1>
          <p className="card-sub">You've been missed</p>

          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="field-label">Email</label>
              <input
                type="email"
                className="field-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="field">
              <label className="field-label">Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="field-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: '36px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  style={{
                    position: 'absolute', right: 4,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.6)', padding: '4px', lineHeight: 1,
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="row-opts">
              <label className="stay-label">
                <input
                  type="checkbox"
                  checked={staySignedIn}
                  onChange={(e) => setStaySignedIn(e.target.checked)}
                />
                Stay signed in
              </label>
              <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? <><span className="spinner" />Logging in...</> : 'Login'}
            </button>
          </form>

          <p className="register-line">
            Don't have an account? <a href="/register">Register here</a>
          </p>

          <div className="divider">
            <div className="divider-line" />
            <span className="divider-label">OR</span>
            <div className="divider-line" />
          </div>


            <div className="mt-6 flex justify-center">
              <button
                onClick={() => window.location.href = `${API}/api/auth/google/login`}
                className="flex items-center justify-center py-3.5 px-8 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition text-gray-200 text-sm"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>
            </div>


          <p className="footer">© PadaiSathi. All rights reserved.</p>
        </div>
      </div>
    </>
  );
};

export default Login;