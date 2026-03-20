import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import catIllustration from '../assets/images/Loginimage5.png';
import logoImage from '../assets/images/logo1.png';

const Register = ({ setIsAuthenticated, setUser }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear field error as user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const errors = {};

    // Full name — letters and spaces only, 2–50 chars
    const nameTrimmed = formData.username.trim();
    if (!nameTrimmed) {
      errors.username = 'Full name is required';
    } else if (nameTrimmed.length < 2) {
      errors.username = 'Name must be at least 2 characters';
    } else if (nameTrimmed.length > 50) {
      errors.username = 'Name must be 50 characters or less';
    } else if (!/^[a-zA-Z\s]+$/.test(nameTrimmed)) {
      errors.username = 'Name can only contain letters and spaces';
    }

    // Email format
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    // Password strength
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      errors.password = 'Password must contain at least one uppercase letter';
    } else if (!/(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain at least one number';
    } else if (!/[^a-zA-Z0-9]/.test(formData.password)) {
        errors.password = 'Password must contain at least one special character (!@#$%^&* etc.)';
    }

    // Confirm password
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!agreeToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy');
      return;
    }

    // Run frontend validation
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const registerResponse = await fetch('http://localhost:8000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password
        }),
      });

      const registerData = await registerResponse.json();

      if (!registerResponse.ok || !registerData.success) {
        setError(registerData.detail || 'Registration failed. Email may already exist.');
        setLoading(false);
        return;
      }

      const loginResponse = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email.trim().toLowerCase(), password: formData.password }),
      });

      const loginData = await loginResponse.json();

      if (loginResponse.ok && loginData.success) {
        localStorage.setItem('user', JSON.stringify(loginData.user));
        setUser(loginData.user);
        setIsAuthenticated(true);
        navigate('/dashboard');
      } else {
        setError('Registration successful, but auto-login failed. Please log in manually.');
        navigate('/login');
      }
    } catch (err) {
      console.error(err);
      setError('Cannot connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Password strength indicator ───────────────────────────────────────────
  const getPasswordStrength = (pwd) => {
    if (!pwd) return null;
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;
    if (score <= 2) return { label: 'Weak', color: '#ef4444', width: '33%' };
    if (score <= 3) return { label: 'Fair', color: '#f59e0b', width: '60%' };
    return { label: 'Strong', color: '#22c55e', width: '100%' };
  };

  const strength = getPasswordStrength(formData.password);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Serif+Display&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; margin: 0; padding: 0; }

        .reg-root {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .reg-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url(${catIllustration});
          background-size: cover;
          background-position: center center;
          background-repeat: no-repeat;
          z-index: 0;
        }

        .reg-overlay {
          position: fixed;
          inset: 0;
          z-index: 1;
          background: linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.18) 50%, rgba(0,0,0,0.38) 100%);
        }

        .reg-card {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 560px;
          background: rgba(255, 255, 255, 0.13);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 32px;
          padding: 48px 56px 44px;
          box-shadow: 0 8px 40px rgba(0, 0, 0, 0.35), 0 1px 0 rgba(255,255,255,0.18) inset;
          animation: cardIn 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
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

        .card-logo { display: flex; justify-content: center; margin-bottom: 20px; }
        .card-logo img { height: 48px; width: auto; filter: drop-shadow(0 2px 10px rgba(0,0,0,0.35)); }

        .card-heading {
          font-family: 'DM Serif Display', serif;
          font-size: 38px; font-weight: 400; color: #ffffff;
          letter-spacing: -0.5px; line-height: 1.15; margin-bottom: 6px;
          text-align: center; text-shadow: 0 1px 8px rgba(0,0,0,0.55), 0 3px 20px rgba(0,0,0,0.35);
        }

        .card-sub {
          font-size: 20px; color: #ffffff; font-weight: 400; margin-bottom: 26px;
          text-align: center; text-shadow: 0 1px 8px rgba(0,0,0,0.5);
        }

        .error-msg {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(248, 113, 113, 0.45);
          border-radius: 12px; padding: 11px 15px; font-size: 13.5px;
          color: #fecaca; font-weight: 500; margin-bottom: 18px;
          text-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }

        .field { margin-bottom: 16px; }

        .field-label {
          display: block; font-size: 17px; font-weight: 700; color: #000000;
          letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px;
        }

        .field-input {
          width: 100%; padding: 11px 4px; background: transparent; border: none;
          border-bottom: 1.5px solid rgba(255, 255, 255, 0.45); border-radius: 0;
          font-family: 'DM Sans', sans-serif; font-size: 17px; font-weight: 400;
          color: #000000; outline: none; transition: border-color 0.2s;
        }
        .field-input.has-error { border-bottom-color: rgba(248, 113, 113, 0.8); }
        .field-input::placeholder { color: rgba(255, 255, 255, 0.67); }
        .field-input:focus { border-bottom-color: rgba(255, 255, 255, 0.95); box-shadow: 0 1px 0 rgba(255,255,255,0.95); }

        .field-error {
          font-size: 12px; color: #fca5a5; font-weight: 500;
          margin-top: 5px; display: block;
        }

        .password-strength-bar {
          margin-top: 8px; height: 3px;
          background: rgba(255,255,255,0.15); border-radius: 2px; overflow: hidden;
        }
        .password-strength-fill {
          height: 100%; border-radius: 2px;
          transition: width 0.3s ease, background-color 0.3s ease;
        }
        .password-strength-label {
          font-size: 11px; font-weight: 600; margin-top: 4px; display: block;
        }

        .terms-row {
          display: flex; align-items: flex-start; gap: 10px; margin: 8px 0 20px;
        }
        .terms-row input[type="checkbox"] {
          width: 20px; height: 20px; accent-color: #a78bfa;
          margin-top: 3px; flex-shrink: 0; cursor: pointer;
        }
        .terms-text { font-size: 16px; color: rgba(255, 255, 255, 0.9); font-weight: 500; line-height: 1.55; }
        .terms-text a { color: #4c406e; font-weight: 700; text-decoration: underline; text-underline-offset: 2px; transition: opacity 0.15s; }
        .terms-text a:hover { opacity: 0.72; }

        .submit-btn {
          width: 100%; padding: 15px; background: rgba(255, 255, 255, 0.95);
          color: #0d0820; border: none; border-radius: 16px;
          font-family: 'DM Sans', sans-serif; font-size: 16px; font-weight: 700;
          letter-spacing: 0.2px; cursor: pointer;
          transition: background 0.18s, transform 0.14s, box-shadow 0.18s;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.22);
        }
        .submit-btn:hover { background: #ffffff; transform: translateY(-1px); box-shadow: 0 8px 28px rgba(0, 0, 0, 0.28); }
        .submit-btn:active { transform: scale(0.98); }
        .submit-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

        .login-line {
          text-align: center; margin-top: 16px; font-size: 15px;
          color: rgba(255, 255, 255, 0.9); font-weight: 500; text-shadow: 0 1px 6px rgba(0,0,0,0.45);
        }
        .login-line a { color: #4c406e; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
        .login-line a:hover { opacity: 0.67; }

        .divider { display: flex; align-items: center; gap: 14px; margin: 20px 0 16px; }
        .divider-line { flex: 1; height: 1px; background: rgba(255, 255, 255, 0.2); }
        .divider-label { font-size: 12px; font-weight: 700; color: rgba(255, 255, 255, 0.55); letter-spacing: 1.2px; }

        .footer { text-align: center; font-size: 12px; color: rgba(255, 255, 255, 0.35); margin-top: 20px; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner {
          display: inline-block; width: 18px; height: 18px;
          border: 2px solid rgba(13,8,32,0.2); border-top-color: #0d0820;
          border-radius: 50%; animation: spin 0.7s linear infinite;
          margin-right: 10px; vertical-align: middle;
        }
      `}</style>

      <div className="reg-root">
        <div className="reg-overlay" />
        <div className="reg-card">
          <div className="card-accent" />

          <div className="card-logo">
            <img src={logoImage} alt="PadaiSathi" />
          </div>

          <h1 className="card-heading">Create Account</h1>
          <p className="card-sub">Join our learning community</p>

          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={handleSubmit} noValidate>

            {/* Full Name */}
            <div className="field">
              <label className="field-label">Full Name</label>
              <input
                type="text"
                name="username"
                className={`field-input${fieldErrors.username ? ' has-error' : ''}`}
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your full name"
              />
              {fieldErrors.username && <span className="field-error">⚠ {fieldErrors.username}</span>}
            </div>

            {/* Email */}
            <div className="field">
              <label className="field-label">Email</label>
              <input
                type="email"
                name="email"
                className={`field-input${fieldErrors.email ? ' has-error' : ''}`}
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
              />
              {fieldErrors.email && <span className="field-error">⚠ {fieldErrors.email}</span>}
            </div>

            {/* Password */}
            <div className="field">
              <label className="field-label">Password</label>
              <input
                type="password"
                name="password"
                className={`field-input${fieldErrors.password ? ' has-error' : ''}`}
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 6 chars, uppercase, number, symbol"
              />
              {/* Password strength bar */}
              {formData.password && strength && (
                <>
                  <div className="password-strength-bar">
                    <div
                      className="password-strength-fill"
                      style={{ width: strength.width, background: strength.color }}
                    />
                  </div>
                  <span className="password-strength-label" style={{ color: strength.color }}>
                    {strength.label} password
                  </span>
                </>
              )}
              {fieldErrors.password && <span className="field-error">⚠ {fieldErrors.password}</span>}
            </div>

            {/* Confirm Password */}
            <div className="field">
              <label className="field-label">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                className={`field-input${fieldErrors.confirmPassword ? ' has-error' : ''}`}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
              />
              {fieldErrors.confirmPassword && <span className="field-error">⚠ {fieldErrors.confirmPassword}</span>}
            </div>

            <div className="terms-row">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
              />
              <span className="terms-text">
                I agree to the{' '}
                <a href="/terms">Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy">Privacy Policy</a>
              </span>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? <><span className="spinner" />Creating Account...</> : 'Create Account'}
            </button>
          </form>

          <p className="login-line">
            Already have an account? <Link to="/login">Login here</Link>
          </p>

          <div className="divider">
            <div className="divider-line" />
            <span className="divider-label">OR</span>
            <div className="divider-line" />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center py-3.5 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition text-gray-200 text-sm">
              <span className="mr-2 text-blue-400 font-bold text-xl">f</span>
              Facebook
            </button>
            <button
              onClick={() => window.location.href = 'http://localhost:8000/api/auth/google/login'}
              className="flex items-center justify-center py-3.5 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition text-gray-200 text-sm"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
          </div>

          <p className="footer">© PadaiSathi. All rights reserved.</p>
        </div>
      </div>
    </>
  );
};

export default Register;