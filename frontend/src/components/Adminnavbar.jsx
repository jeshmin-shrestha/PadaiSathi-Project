// ─── components/AdminNavbar.jsx ──────────────────────────────────────────────
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ShieldCheck } from 'lucide-react';
import { NavBrand } from './Navbar';

const AdminNavbar = ({ user, setIsAuthenticated }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (!window.confirm('Are you sure you want to log out?')) return;
    localStorage.removeItem('user');
    if (setIsAuthenticated) setIsAuthenticated(false);
    window.location.href = '/login';
  };

  return (
    <nav style={{
      background: 'rgba(255,255,255,0.55)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(170,205,240,0.42)',
      position: 'sticky', top: 0, zIndex: 50,
      fontFamily: "'Nunito', sans-serif",
    }}>
      <div style={{
        maxWidth: '100%',
        padding: '0 24px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>

        {/* Left: brand + admin badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <NavBrand onLogoClick={() => navigate('/dashboard')} />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 20,
            background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.25)',
            fontSize: 10.5, fontWeight: 800, color: '#4338ca',
            letterSpacing: '0.8px', textTransform: 'uppercase',
          }}>
            <ShieldCheck size={12} />
            Admin
          </div>
        </div>

        {/* Right: user chip + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

          {/* User pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '5px 14px 5px 5px', borderRadius: 30,
            background: 'rgba(186,220,255,0.3)',
            border: '1px solid rgba(170,205,240,0.5)',
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'linear-gradient(135deg,#90c8f0,#6aaee0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 12, fontWeight: 800,
              textShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}>
              {user?.username?.charAt(0).toUpperCase() || 'A'}
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#173a5c' }}>
              {user?.username || 'Admin'}
            </span>
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 11,
              background: 'rgba(255,255,255,0.72)',
              border: '1px solid rgba(170,205,240,0.5)',
              fontSize: 12.5, fontWeight: 700, color: '#2a5a8c',
              cursor: 'pointer', fontFamily: "'Nunito',sans-serif",
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'rgba(110,175,240,0.7)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.72)'; e.currentTarget.style.borderColor = 'rgba(170,205,240,0.5)'; }}
          >
            <LogOut size={13} />
            Logout
          </button>

        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;