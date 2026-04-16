// ─── components/AdminNavbar.jsx ──────────────────────────────────────────────
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ShieldCheck, X } from 'lucide-react';
import { NavBrand } from './Navbar';

const AdminNavbar = ({ user, setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const confirmLogout = () => {
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    if (setIsAuthenticated) setIsAuthenticated(false);
    window.location.href = '/login';
  };

  return (
    <>
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

        {/* Right: logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

          {/* Logout button */}
          <button
            onClick={() => setShowLogoutModal(true)}
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

    {/* Logout Confirm Modal */}
    {showLogoutModal && (
      <>
        <div
          onClick={() => setShowLogoutModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(10,30,60,0.35)',
            backdropFilter: 'blur(4px)',
            animation: 'admFadeIn 0.15s ease',
          }}
        />
        <div style={{
          position: 'fixed', top: '50%', left: '50%', zIndex: 201,
          transform: 'translate(-50%, -50%)',
          width: '100%', maxWidth: 380,
          background: 'rgba(255,255,255,0.97)',
          border: '1px solid rgba(175,215,255,0.5)',
          borderRadius: 24,
          boxShadow: '0 20px 60px rgba(30,80,160,0.18)',
          backdropFilter: 'blur(20px)',
          animation: 'admSlideUp 0.2s cubic-bezier(0.22,1,0.36,1)',
          overflow: 'hidden',
          fontFamily: "'Nunito', sans-serif",
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #d9eeff 0%, #e8f4ff 100%)',
            borderBottom: '1px solid rgba(170,205,240,0.4)',
            padding: '18px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 700, color: '#173a5c', display: 'flex', alignItems: 'center', gap: 8 }}>
              <LogOut size={15} /> Confirm Logout
            </div>
            <button
              onClick={() => setShowLogoutModal(false)}
              style={{
                width: 28, height: 28, borderRadius: 8, border: 'none',
                background: 'rgba(170,205,240,0.4)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#4a6d8e',
              }}
            >
              <X size={13} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#173a5c', marginBottom: 6 }}>
              Are you sure you want to log out?
            </p>
            <p style={{ fontSize: 12, color: '#84a8c6', fontWeight: 500 }}>
              You will be redirected to the login page.
            </p>
          </div>

          {/* Footer */}
          <div style={{
            padding: '14px 24px',
            borderTop: '1px solid rgba(170,205,240,0.3)',
            display: 'flex', justifyContent: 'flex-end', gap: 10,
          }}>
            <button
              onClick={() => setShowLogoutModal(false)}
              style={{
                padding: '9px 20px', borderRadius: 11, border: '1px solid rgba(170,205,240,0.5)',
                background: 'rgba(255,255,255,0.8)', color: '#4a6d8e',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito',sans-serif",
              }}
            >
              Cancel
            </button>
            <button
              onClick={confirmLogout}
              style={{
                padding: '9px 20px', borderRadius: 11, border: 'none',
                background: 'linear-gradient(135deg,#6aaee0,#4a90d9)',
                color: '#fff', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: "'Nunito',sans-serif",
                boxShadow: '0 2px 10px rgba(74,144,217,0.3)',
              }}
            >
              Yes, Log Out
            </button>
          </div>
        </div>
        <style>{`
          @keyframes admFadeIn  { from { opacity: 0 } to { opacity: 1 } }
          @keyframes admSlideUp { from { opacity: 0; transform: translate(-50%, calc(-50% + 16px)) } to { opacity: 1; transform: translate(-50%, -50%) } }
        `}</style>
      </>
    )}
    </>
  );
};

export default AdminNavbar;