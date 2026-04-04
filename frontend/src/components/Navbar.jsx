// ─── components/Navbar.jsx ───────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, BellOff } from 'lucide-react';
import logoImage from '../assets/images/reading-cat.png';
import { API, AVATARS, CUSTOM_AVATAR_KEY, STUDENT_NAV_LINKS } from '../constants';

// ── Shared primitives ─────────────────────────────────────────────────────────

export const NavBrand = ({ onLogoClick }) => (
  <div className="flex items-center space-x-3 cursor-pointer" onClick={onLogoClick}>
    <div className="w-14 h-14 flex items-center justify-center overflow-hidden flex-shrink-0">
      <img
        src={logoImage}
        alt="PadaiSathi Logo"
        className="h-full w-auto object-contain hover:opacity-80 transition-opacity"
      />
    </div>
    <span
      className="text-gray-900 text-lg tracking-tight select-none"
      style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800 }}
    >
      Padai
      <span style={{
        background: 'rgba(186,220,255,0.7)',
        borderRadius: '999px',
        padding: '2px 10px',
        marginLeft: '2px',
      }}>Sathi</span>
    </span>
  </div>
);

export const NavButton = ({ onClick, active, children, className = '', id }) => (
  <button
    id={id}
    onClick={onClick}
    className={`
      flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-semibold transition-all
      ${active ? 'text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-blue-50'}
      ${className}
    `}
    style={active ? { background: 'rgba(90,120,180,0.85)' } : {}}
  >
    {children}
  </button>
);

// ── Student Navbar ─────────────────────────────────────────────────────────────

const Navbar = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const dropRef   = useRef(null);

  const [userAvatar,   setUserAvatar]   = useState(null);
  const [customImg,    setCustomImg]    = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [requests,     setRequests]     = useState([]);
  const [showDrop,     setShowDrop]     = useState(false);
  const [respondingId, setRespondingId] = useState(null);

  const refreshAvatar = () => {
    const stored   = JSON.parse(localStorage.getItem('user'));
    const avatarId = stored?.avatar || 'avatar1';
    if (avatarId && avatarId.startsWith('https://')) {
      setCustomImg(avatarId);
      setUserAvatar({ id: 'custom', bg: 'from-indigo-400 to-purple-500' });
    } else if (avatarId === 'custom') {
      setCustomImg(localStorage.getItem(CUSTOM_AVATAR_KEY) || null);
      setUserAvatar({ id: 'custom', bg: 'from-indigo-400 to-purple-500' });
    } else {
      setCustomImg(null);
      setUserAvatar(AVATARS.find(a => a.id === avatarId) || AVATARS[0]);
    }
  };

  useEffect(() => {
    refreshAvatar();
  }, [location]);

  useEffect(() => {
    window.addEventListener('avatar-updated', refreshAvatar);
    return () => window.removeEventListener('avatar-updated', refreshAvatar);
  }, []);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('user'));
    if (!stored?.email) return;

    const load = async () => {
      try {
        const res  = await fetch(`${API}/api/friend-requests?email=${stored.email}`);
        const data = await res.json();
        setRequests(data.requests || []);
        setPendingCount(data.count  || 0);
      } catch { /* silently ignore */ }
    };

    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [location]);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setShowDrop(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const respond = async (friendship_id, action) => {
    const stored = JSON.parse(localStorage.getItem('user'));
    if (!stored?.email) return;
    setRespondingId(friendship_id);
    try {
      await fetch(`${API}/api/friend-respond`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ friendship_id, email: stored.email, action }),
      });
      setRequests(prev => prev.filter(r => r.friendship_id !== friendship_id));
      setPendingCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
    setRespondingId(null);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Sora:wght@400;600;700;800&display=swap');
        .pad-nav * { font-family: 'Nunito', sans-serif; }
        .pad-nav {
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(175,215,255,0.45);
        }
        .pad-drop {
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(175,215,255,0.5);
          border-radius: 18px;
          box-shadow: 0 8px 32px rgba(100,150,220,0.12);
        }
      `}</style>

      <nav className="pad-nav shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">

          <NavBrand onLogoClick={() => navigate('/dashboard')} />

          <div className="flex items-center gap-2">

            {STUDENT_NAV_LINKS.map(({ label, path, id }) => (
              <NavButton key={path} onClick={() => navigate(path)} active={isActive(path)} id={id || undefined}>
                {label}
              </NavButton>
            ))}

            {/* Notification Bell */}
            <div className="relative ml-1" ref={dropRef}>
              <button
                onClick={() => setShowDrop(prev => !prev)}
                className="relative w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-blue-50 transition"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-extrabold rounded-full flex items-center justify-center leading-none shadow">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </button>

              {showDrop && (
                <div className="absolute right-0 mt-2 w-80 pad-drop z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-blue-100"
                    style={{ background: 'rgba(235,245,255,0.7)' }}>
                    <span className="font-bold text-gray-800 text-sm flex items-center gap-2">
                      <Bell className="w-4 h-4 text-blue-400" /> Friend Requests
                    </span>
                    {pendingCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {pendingCount} new
                      </span>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto">
                    {requests.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <BellOff className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm font-medium">No pending requests</p>
                      </div>
                    ) : (
                      requests.map(r => (
                        <div key={r.friendship_id}
                          className="flex items-center gap-3 px-4 py-3 border-b border-blue-50 last:border-0">
                          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-blue-100 flex-shrink-0">
                            <img
                              src={AVATARS.find(a => a.id === r.from_avatar)?.img || AVATARS[0].img}
                              alt="avatar"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 text-sm truncate">{r.from_username}</p>
                            <p className="text-xs text-gray-400 truncate">{r.from_email}</p>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              disabled={respondingId === r.friendship_id}
                              onClick={() => respond(r.friendship_id, 'accept')}
                              className="bg-blue-500 text-white text-xs px-3 py-1.5 rounded-full font-bold hover:bg-blue-600 transition disabled:opacity-50"
                            >✓</button>
                            <button
                              disabled={respondingId === r.friendship_id}
                              onClick={() => respond(r.friendship_id, 'decline')}
                              className="bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-full font-bold hover:bg-gray-200 transition disabled:opacity-50"
                            >✕</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="px-4 py-3 border-t border-blue-100" style={{ background: 'rgba(235,245,255,0.7)' }}>
                    <button
                      onClick={() => { setShowDrop(false); navigate('/friends'); }}
                      className="w-full text-center text-xs font-bold text-blue-600 hover:text-blue-800 transition"
                    >
                      View all friends →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile avatar */}
            <button
              onClick={() => navigate('/profile')}
              className={`w-10 h-10 rounded-full overflow-hidden border-2 transition ml-1 ${
                isActive('/profile') ? 'border-blue-400' : 'border-blue-200 hover:border-blue-400'
              } bg-gradient-to-br ${userAvatar?.bg || 'from-gray-600 to-gray-800'}`}
            >
              {customImg
                ? <img src={customImg}       alt="Your avatar" className="w-full h-full object-cover" />
                : userAvatar?.img
                  ? <img src={userAvatar.img} alt="Your avatar" className="w-full h-full object-cover" />
                  : null
              }
            </button>

          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
