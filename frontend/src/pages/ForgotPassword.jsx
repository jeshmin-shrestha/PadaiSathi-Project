import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { API } from '../constants';
import catIllustration from '../assets/images/LoginImage6.png';
import logoImage from '../assets/images/logo1.png';

const ForgotPassword = () => {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/forgot-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSent(true);
      } else {
        setError(data.detail || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Cannot connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Serif+Display&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; }
        .fp-root {
          min-height: 100vh; width: 100%; display: flex; align-items: center;
          justify-content: center; padding: 32px; font-family: 'DM Sans', sans-serif;
          position: relative; overflow: hidden;
        }
        .fp-root::before {
          content: ''; position: fixed; inset: 0;
          background-image: url(${catIllustration});
          background-size: cover; background-position: center;
          background-repeat: no-repeat; z-index: 0;
        }
        .fp-overlay { position: fixed; inset: 0; z-index: 1; background: linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.18) 50%, rgba(0,0,0,0.38) 100%); }
        .fp-card {
          position: relative; z-index: 2; width: 100%; max-width: 480px;
          background: rgba(255,255,255,0.13); backdrop-filter: blur(33px);
          border: 1px solid rgba(255,255,255,0.25); border-radius: 32px;
          padding: 56px 52px 48px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.18) inset;
          animation: cardIn 0.55s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes cardIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .fp-accent { position:absolute; top:0; left:32px; right:32px; height:1px; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.6) 40%,rgba(200,180,255,0.7) 60%,transparent); }
        .fp-logo { display:flex; justify-content:center; margin-bottom:24px; }
        .fp-logo img { height:48px; width:auto; filter:drop-shadow(0 2px 10px rgba(0,0,0,0.35)); }
        .fp-heading { font-family:'DM Serif Display',serif; font-size:36px; font-weight:400; color:#fff; text-align:center; margin-bottom:8px; text-shadow:0 1px 8px rgba(0,0,0,0.55); }
        .fp-sub { font-size:15px; color:rgba(255,255,255,0.85); text-align:center; margin-bottom:32px; line-height:1.5; }
        .error-msg { background:rgba(239,68,68,0.2); border:1px solid rgba(248,113,113,0.45); border-radius:12px; padding:12px 15px; font-size:13.5px; color:#fecaca; font-weight:500; margin-bottom:18px; }
        .success-box { background:rgba(34,197,94,0.15); border:1px solid rgba(34,197,94,0.4); border-radius:16px; padding:24px; text-align:center; }
        .success-icon { font-size:40px; margin-bottom:12px; }
        .success-title { font-size:18px; font-weight:700; color:#fff; margin-bottom:8px; }
        .success-msg { font-size:14px; color:rgba(255,255,255,0.8); line-height:1.55; }
        .field { margin-bottom:20px; }
        .field-label { display:block; font-size:14px; font-weight:700; color:#000; letter-spacing:1px; text-transform:uppercase; margin-bottom:8px; }
        .field-input { width:100%; padding:13px 4px; background:transparent; border:none; border-bottom:1.5px solid rgba(255,255,255,0.45); border-radius:0; font-family:'DM Sans',sans-serif; font-size:16px; color:#fff; outline:none; transition:border-color 0.2s; }
        .field-input::placeholder { color:rgba(255,255,255,0.38); }
        .field-input:focus { border-bottom-color:rgba(255,255,255,0.95); box-shadow:0 1px 0 rgba(255,255,255,0.95); }
        .submit-btn { width:100%; padding:15px; background:rgba(255,255,255,0.95); color:#0d0820; border:none; border-radius:16px; font-family:'DM Sans',sans-serif; font-size:16px; font-weight:700; cursor:pointer; transition:background 0.18s,transform 0.14s; box-shadow:0 4px 20px rgba(0,0,0,0.22); }
        .submit-btn:hover { background:#fff; transform:translateY(-1px); }
        .submit-btn:disabled { opacity:0.45; cursor:not-allowed; transform:none; }
        .back-link { display:block; text-align:center; margin-top:20px; font-size:14px; color:rgba(255,255,255,0.8); }
        .back-link a { color:#4c406e; font-weight:700; text-decoration:underline; }
        .footer { text-align:center; font-size:12px; color:rgba(255,255,255,0.3); margin-top:24px; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .spinner { display:inline-block; width:16px; height:16px; border:2px solid rgba(13,8,32,0.2); border-top-color:#0d0820; border-radius:50%; animation:spin 0.7s linear infinite; margin-right:8px; vertical-align:middle; }
      `}</style>

      <div className="fp-root">
        <div className="fp-overlay" />
        <div className="fp-card">
          <div className="fp-accent" />
          <div className="fp-logo"><img src={logoImage} alt="PadaiSathi" /></div>
          <h1 className="fp-heading">Forgot Password?</h1>
          <p className="fp-sub">Enter your email and we'll send you a link to reset your password.</p>

          {error && <div className="error-msg">{error}</div>}

          {sent ? (
            <div className="success-box">
              <div className="success-icon">📬</div>
              <div className="success-title">Reset link sent!</div>
              <div className="success-msg">
                If <strong style={{color:'#fff'}}>{email}</strong> is registered,
                a reset link has been sent. Please check your inbox and spam folder.
                The link expires in <strong style={{color:'#fff'}}>30 minutes</strong>.
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="field">
                <label className="field-label">Email</label>
                <input
                  type="email"
                  className="field-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? <><span className="spinner" />Sending...</> : 'Send Reset Link'}
              </button>
            </form>
          )}

          <p className="back-link"><Link to="/login">← Back to Login</Link></p>
          <p className="footer">© PadaiSathi. All rights reserved.</p>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;