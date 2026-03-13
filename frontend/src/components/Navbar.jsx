// ─── components/Navbar.jsx ───────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logoImage from '../assets/images/reading-cat.png';
import { API, AVATARS, CUSTOM_AVATAR_KEY, STUDENT_NAV_LINKS } from '../constants';

// ── Shared primitives (used by both Navbar & AdminNavbar) ─────────────────────

/** Logo + wordmark — identical in both navbars */
export const NavBrand = ({ onLogoClick }) => (
  <div className="flex items-center space-x-3 cursor-pointer" onClick={onLogoClick}>
    <div className="w-14 h-14 flex items-center justify-center overflow-hidden flex-shrink-0">
      <img
        src={logoImage}
        alt="PadaiSathi Logo"
        className="h-full w-auto object-contain hover:opacity-80 transition-opacity"
      />
    </div>
    <span className="font-extrabold text-gray-900 text-lg tracking-tight select-none">
      Padai<span className="px-1.5 py-0.5 bg-gray-300 rounded-full ml-0.5">Sathi</span>
    </span>
  </div>
);

/** Pill nav button — active / hover states are consistent in both navbars */
export const NavButton = ({ onClick, active, children, className = '' }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-semibold transition-all
      ${active
        ? 'bg-gray-800 text-white shadow-sm'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-300'
      }
      ${className}
    `}
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

  // Load avatar on every route change
  useEffect(() => {
    const stored   = JSON.parse(localStorage.getItem('user'));
    const avatarId = stored?.avatar || 'avatar1';
    if (avatarId === 'custom') {
      setCustomImg(localStorage.getItem(CUSTOM_AVATAR_KEY) || null);
      setUserAvatar({ id: 'custom', bg: 'from-indigo-400 to-purple-500' });
    } else {
      setCustomImg(null);
      setUserAvatar(AVATARS.find(a => a.id === avatarId) || AVATARS[0]);
    }
  }, [location]);

  // Poll for pending friend requests every 30 s
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

  // Close dropdown on outside click
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
    <nav className="bg-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">

        {/* Brand */}
        <NavBrand onLogoClick={() => navigate('/dashboard')} />

        {/* Nav links + bell + avatar */}
        <div className="flex items-center gap-2">

          {STUDENT_NAV_LINKS.map(({ label, path }) => (
            <NavButton key={path} onClick={() => navigate(path)} active={isActive(path)}>
              {label}
            </NavButton>
          ))}

          {/* Notification Bell */}
          <div className="relative ml-1" ref={dropRef}>
            <button
              onClick={() => setShowDrop(prev => !prev)}
              className="relative w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-gray-300 transition"
              aria-label="Notifications"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-700" fill="none"
                viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-extrabold rounded-full flex items-center justify-center leading-none shadow">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </button>

            {/* Dropdown panel */}
            {showDrop && (
              <div className="absolute right-0 mt-2 w-80 bg-white border-2 border-gray-900 rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <span className="font-bold text-gray-900 text-sm">🔔 Friend Requests</span>
                  {pendingCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {pendingCount} new
                    </span>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto">
                  {requests.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <p className="text-3xl mb-2">📭</p>
                      <p className="text-sm font-medium">No pending requests</p>
                    </div>
                  ) : (
                    requests.map(r => (
                      <div key={r.friendship_id}
                        className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0">
                        <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-gray-900 flex-shrink-0">
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
                            className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-full font-bold hover:bg-gray-700 transition disabled:opacity-50"
                          >✓</button>
                          <button
                            disabled={respondingId === r.friendship_id}
                            onClick={() => respond(r.friendship_id, 'decline')}
                            className="bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-full font-bold hover:bg-gray-300 transition disabled:opacity-50"
                          >✕</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={() => { setShowDrop(false); navigate('/friends'); }}
                    className="w-full text-center text-xs font-bold text-gray-600 hover:text-gray-900 transition"
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
              isActive('/profile') ? 'border-gray-900' : 'border-gray-400 hover:border-gray-700'
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
  );
};

export default Navbar;