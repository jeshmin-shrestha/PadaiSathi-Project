import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { API } from '../constants';
import catIllustration from '../assets/images/LoginImage5.png';
import logoImage from '../assets/images/logo0111.png';
import successImage from '../assets/images/SuccessImage.jpeg';
const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const tokenValid                    = !!token;

  const getPasswordStrength = (pwd) => {
    if (!pwd) return null;
    let score = 0;
    if (pwd.length >= 6)          score++;
    if (pwd.length >= 10)         score++;
    if (/[A-Z]/.test(pwd))        score++;
    if (/\d/.test(pwd))           score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;
    if (score <= 2) return { label: 'Weak',   color: '#ef4444', width: '33%'  };
    if (score <= 3) return { label: 'Fair',   color: '#f59e0b', width: '60%'  };
    return              { label: 'Strong', color: '#22c55e', width: '100%' };
  };

  const strength = getPasswordStrength(password);

  const validate = () => {
    const errors = {};
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[A-Z])/.test(password)) {
      errors.password = 'Must contain at least one uppercase letter';
    } else if (!/(?=.*\d)/.test(password)) {
      errors.password = 'Must contain at least one number';
    } else if (!/[^a-zA-Z0-9]/.test(password)) {
      errors.password = 'Must contain at least one special character (!@#$%^&* etc.)';
    }
    if (!confirm) {
      errors.confirm = 'Please confirm your password';
    } else if (password !== confirm) {
      errors.confirm = 'Passwords do not match';
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const errors = validate();
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }

    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/reset-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, new_password: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'Reset failed. The link may have expired.');
      } else {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 6000);
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
        .rp-root {
          min-height: 100vh; width: 100%; display: flex; align-items: center;
          justify-content: center; padding: 32px; font-family: 'DM Sans', sans-serif;
          position: relative; overflow: hidden;
        }
        .rp-root::before {
          content: ''; position: fixed; inset: 0;
          background-image: url(${catIllustration});
          background-size: cover; background-position: center;
          background-repeat: no-repeat; z-index: 0;
        }
        .rp-overlay { position:fixed;inset:0;z-index:1;background:linear-gradient(135deg,rgba(0,0,0,0.3) 0%,rgba(0,0,0,0.18) 50%,rgba(0,0,0,0.38) 100%); }
        .rp-card {
          position:relative;z-index:2;width:100%;max-width:480px;
          background:rgba(255,255,255,0.13);backdrop-filter:blur(33px);
          border:1px solid rgba(255,255,255,0.25);border-radius:32px;
          padding:56px 52px 48px;
          box-shadow:0 8px 40px rgba(0,0,0,0.35),0 1px 0 rgba(255,255,255,0.18) inset;
          animation:cardIn 0.55s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes cardIn { from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);} }
        .rp-accent { position:absolute;top:0;left:32px;right:32px;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.6) 40%,rgba(200,180,255,0.7) 60%,transparent); }
        .rp-logo { display:flex;justify-content:center;margin-bottom:24px; }
        .rp-logo img { height:48px;width:auto;filter:drop-shadow(0 2px 10px rgba(0,0,0,0.35)); }
        .rp-heading { font-family:'DM Serif Display',serif;font-size:36px;font-weight:400;color:#fff;text-align:center;margin-bottom:8px;text-shadow:0 1px 8px rgba(0,0,0,0.55); }
        .rp-sub { font-size:15px;color:rgba(255,255,255,0.85);text-align:center;margin-bottom:32px;line-height:1.5; }
        .error-msg { background:rgba(239,68,68,0.2);border:1px solid rgba(248,113,113,0.45);border-radius:12px;padding:12px 15px;font-size:13.5px;color:#fecaca;font-weight:500;margin-bottom:18px; }
        .field { margin-bottom:18px; }
        .field-label { display:block;font-size:14px;font-weight:700;color:#000;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px; }
        .field-input { width:100%;padding:12px 4px;background:transparent;border:none;border-bottom:1.5px solid rgba(255,255,255,0.45);border-radius:0;font-family:'DM Sans',sans-serif;font-size:16px;color:#fff;outline:none;transition:border-color 0.2s; }
        .field-input.has-error { border-bottom-color:rgba(248,113,113,0.8); }
        .field-input::placeholder { color:rgba(255,255,255,0.38); }
        .field-input:focus { border-bottom-color:rgba(255,255,255,0.95);box-shadow:0 1px 0 rgba(255,255,255,0.95); }
        .field-error { font-size:12px;color:#fca5a5;font-weight:500;margin-top:5px;display:block; }
        .strength-bar { margin-top:8px;height:3px;background:rgba(255,255,255,0.15);border-radius:2px;overflow:hidden; }
        .strength-fill { height:100%;border-radius:2px;transition:width 0.3s,background 0.3s; }
        .strength-label { font-size:11px;font-weight:600;margin-top:4px;display:block; }
        .submit-btn { width:100%;padding:15px;background:rgba(255,255,255,0.95);color:#0d0820;border:none;border-radius:16px;font-family:'DM Sans',sans-serif;font-size:16px;font-weight:700;cursor:pointer;transition:background 0.18s,transform 0.14s;box-shadow:0 4px 20px rgba(0,0,0,0.22);margin-top:8px; }
        .submit-btn:hover { background:#fff;transform:translateY(-1px); }
        .submit-btn:disabled { opacity:0.45;cursor:not-allowed;transform:none; }
        .back-link { display:block;text-align:center;margin-top:20px;font-size:14px;color:rgba(255,255,255,0.8); }
        .back-link a { color:#4c406e;font-weight:700;text-decoration:underline; }
        .footer { text-align:center;font-size:12px;color:rgba(255,255,255,0.3);margin-top:24px; }
        @keyframes spin { to{transform:rotate(360deg);} }
        .spinner { display:inline-block;width:16px;height:16px;border:2px solid rgba(13,8,32,0.2);border-top-color:#0d0820;border-radius:50%;animation:spin 0.7s linear infinite;margin-right:8px;vertical-align:middle; }
      `}</style>

      <div className="rp-root">
        <div className="rp-overlay" />
        <div className="rp-card">
          <div className="rp-accent" />
          <div className="rp-logo"><img src={logoImage} alt="PadaiSathi" /></div>

          {/* Invalid / missing token */}
          {!tokenValid && (
            <div style={{textAlign:'center',padding:'12px 0'}}>
              <div style={{fontSize:'48px',marginBottom:'16px'}}>🔗</div>
              <h2 style={{color:'#fff',fontSize:'22px',fontWeight:'700',marginBottom:'10px'}}>Invalid or Expired Link</h2>
              <p style={{color:'rgba(255,255,255,0.75)',fontSize:'14px',lineHeight:'1.6',marginBottom:'20px'}}>
                This password reset link has expired or is invalid.<br />Please request a new one.
              </p>
              <Link to="/forgot-password" style={{color:'#a78bfa',fontWeight:'700',textDecoration:'underline'}}>
                Request a new link
              </Link>
            </div>
          )}

          {/* Success */}
          {tokenValid && success && (
            <div style={{textAlign:'center',padding:'12px 0'}}>
              <img 
                src={successImage} 
                alt="Success" 
                style={{
                  width: '120px',
                  height: '120px',
                  objectFit: 'cover',
                  borderRadius: '50%',
                  display: 'block',
                  margin: '0 auto 16px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                }} 
              />
              <h2 style={{color:'#fff',fontSize:'22px',fontWeight:'700',marginBottom:'10px'}}>Password Reset!</h2>
              <p style={{color:'rgba(255,255,255,0.75)',fontSize:'14px',lineHeight:'1.6'}}>
                Your password has been updated successfully.<br />Redirecting you to login...
              </p>
            </div>
          )}

          {/* Form */}
          {tokenValid && !success && (
            <>
              <h1 className="rp-heading">Reset Password</h1>
              <p className="rp-sub">Enter your new password below.</p>

              {error && <div className="error-msg">{error}</div>}

              <form onSubmit={handleSubmit} noValidate>
                <div className="field">
                  <label className="field-label">New Password</label>
                  <input
                    type="password"
                    className={`field-input${fieldErrors.password ? ' has-error' : ''}`}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({...p, password:''})); }}
                    placeholder="Min 6 chars, uppercase, number, symbol"
                  />
                  {/* Password requirements hint */}
                    <div style={{
                    marginTop: '10px',
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    }}>
                    <p style={{fontSize:'11px', color:'rgba(255,255,255,0.6)', fontWeight:'600', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.8px'}}>
                        Password must have:
                    </p>
                    {[
                        { rule: /.{6,}/,          label: 'At least 6 characters' },
                        { rule: /[A-Z]/,          label: 'One uppercase letter (A-Z)' },
                        { rule: /\d/,             label: 'One number (0-9)' },
                        { rule: /[^a-zA-Z0-9]/,  label: 'One special character (!@#$%^&*)' },
                    ].map(({ rule, label }) => (
                        <div key={label} style={{display:'flex', alignItems:'center', gap:'7px', marginBottom:'3px'}}>
                        <span style={{
                            fontSize: '12px',
                            color: rule.test(password) ? '#22c55e' : 'rgba(255,255,255,0.35)',
                            transition: 'color 0.2s',
                        }}>
                            {rule.test(password) ? '✓' : '○'}
                        </span>
                        <span style={{
                            fontSize: '12px',
                            color: rule.test(password) ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.4)',
                            transition: 'color 0.2s',
                        }}>
                            {label}
                        </span>
                        </div>
    ))}
    </div>
                  {password && strength && (
                    <>
                      <div className="strength-bar">
                        <div className="strength-fill" style={{width: strength.width, background: strength.color}} />
                      </div>
                      <span className="strength-label" style={{color: strength.color}}>{strength.label} password</span>
                    </>
                  )}
                  {fieldErrors.password && <span className="field-error">⚠ {fieldErrors.password}</span>}
                </div>

                <div className="field">
                  <label className="field-label">Confirm Password</label>
                  <input
                    type="password"
                    className={`field-input${fieldErrors.confirm ? ' has-error' : ''}`}
                    value={confirm}
                    onChange={e => { setConfirm(e.target.value); setFieldErrors(p => ({...p, confirm:''})); }}
                    placeholder="Repeat your new password"
                  />
                  {fieldErrors.confirm && <span className="field-error">⚠ {fieldErrors.confirm}</span>}
                </div>

                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? <><span className="spinner" />Resetting...</> : 'Reset Password'}
                </button>
              </form>
            </>
          )}

          <p className="back-link"><Link to="/login">← Back to Login</Link></p>
          <p className="footer">© PadaiSathi. All rights reserved.</p>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;