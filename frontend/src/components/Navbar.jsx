// components/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logoImage from '../assets/images/reading-cat.png';

const AVATARS = [
  { id: 'avatar1',  img: '/avatars/avatar1.jpeg',  bg: 'from-green-400 to-green-600' },
  { id: 'avatar2',  img: '/avatars/avatar2.jpeg',  bg: 'from-pink-400 to-pink-600' },
  { id: 'avatar3',  img: '/avatars/avatar3.jpeg',  bg: 'from-blue-400 to-blue-600' },
  { id: 'avatar4',  img: '/avatars/avatar12.jpeg', bg: 'from-purple-400 to-purple-600' },
  { id: 'avatar5',  img: '/avatars/avatar5.jpeg',  bg: 'from-gray-600 to-gray-800' },
  { id: 'avatar6',  img: '/avatars/avatar4.jpeg',  bg: 'from-amber-400 to-orange-500' },
  { id: 'avatar7',  img: '/avatars/avatar6.jpeg',  bg: 'from-cyan-400 to-cyan-600' },
  { id: 'avatar8',  img: '/avatars/avatar7.jpeg',  bg: 'from-lime-400 to-lime-600' },
  { id: 'avatar9',  img: '/avatars/avatar8.jpeg',  bg: 'from-red-400 to-orange-500' },
  { id: 'avatar10', img: '/avatars/avatar9.jpeg',  bg: 'from-yellow-400 to-yellow-500' },
  { id: 'avatar11', img: '/avatars/avatar10.jpeg', bg: 'from-sky-300 to-indigo-400' },
  { id: 'avatar12', img: '/avatars/avatar11.jpeg', bg: 'from-yellow-500 to-amber-600' },
];

const CUSTOM_AVATAR_KEY = 'user_custom_avatar';
const API = 'http://localhost:8000';

const Navbar = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const dropRef   = useRef(null);

  const [userAvatar,    setUserAvatar]    = useState(null);
  const [customImg,     setCustomImg]     = useState(null);
  const [pendingCount,  setPendingCount]  = useState(0);
  const [requests,      setRequests]      = useState([]);
  const [showDrop,      setShowDrop]      = useState(false);
  const [respondingId,  setRespondingId]  = useState(null);

  // ── Load avatar on every route change ────────────────────────────────────
  useEffect(() => {
    const stored  = JSON.parse(localStorage.getItem('user'));
    const avatarId = stored?.avatar || 'avatar1';
    if (avatarId === 'custom') {
      const base64 = localStorage.getItem(CUSTOM_AVATAR_KEY);
      setCustomImg(base64 || null);
      setUserAvatar({ id: 'custom', bg: 'from-indigo-400 to-purple-500' });
    } else {
      setCustomImg(null);
      const found = AVATARS.find(a => a.id === avatarId) || AVATARS[0];
      setUserAvatar(found);
    }
  }, [location]);

  // ── Poll for pending friend requests every 30s ────────────────────────
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

    load();                               // immediate
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [location]);   // re-register when route changes (user might have just logged in)

  // ── Close dropdown when clicking outside ─────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setShowDrop(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Accept / Decline from dropdown ────────────────────────────────────
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
      // Remove from local list immediately
      setRequests(prev => prev.filter(r => r.friendship_id !== friendship_id));
      setPendingCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
    setRespondingId(null);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Left: Logo */}
        <div className="flex items-center space-x-4">
          <div className="w-24 h-24 flex items-center justify-center overflow-hidden">
            <img
              src={logoImage}
              alt="PadaiSathi Logo"
              className="h-full w-auto object-contain hover:opacity-90 transition-opacity cursor-pointer"
              onClick={() => navigate('/dashboard')}
            />
          </div>
          <div className="flex items-center">
            <span className="pr-0.5 font-extrabold text-gray-900 text-lg">Padai</span>
            <span className="px-0 py-0.5 bg-gray-300 rounded-full font-extrabold text-gray-900 text-lg">Sathi</span>
          </div>
        </div>

        {/* Right: Nav links + bell + avatar */}
        <div className="flex items-center space-x-4 md:space-x-6">

          {[
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'Notebooks', path: '/notebook'  },
            { label: 'Summary',   path: '/summary'   },
            { label: 'Video',     path: '/video'      },
            { label: 'Flashcard', path: '/flashcards' },
            { label: 'Quiz',      path: '/quiz'       },
            { label: 'Friends',   path: '/friends'    },
          ].map(({ label, path }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`px-5 py-2.5 rounded-2xl font-medium transition ${
                isActive(path)
                  ? 'bg-gray-400 text-gray-800'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-300'
              }`}
            >
              {label}
            </button>
          ))}

          {/* ── Notification Bell ──────────────────────────────────────── */}
          <div className="relative" ref={dropRef}>
            <button
              onClick={() => setShowDrop(prev => !prev)}
              className="relative w-11 h-11 flex items-center justify-center rounded-2xl hover:bg-gray-300 transition"
              aria-label="Notifications"
            >
              {/* Bell SVG */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6 text-gray-700"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>

              {/* Red badge */}
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-extrabold rounded-full flex items-center justify-center leading-none shadow">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </button>

            {/* ── Dropdown panel ────────────────────────────────────────── */}
            {showDrop && (
              <div className="absolute right-0 mt-2 w-80 bg-white border-4 border-black rounded-2xl shadow-2xl z-50 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b-2 border-gray-200 bg-gray-50">
                  <span className="font-extrabold text-gray-900 text-sm">
                    🔔 Friend Requests
                  </span>
                  {pendingCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {pendingCount} new
                    </span>
                  )}
                </div>

                {/* Request list */}
                <div className="max-h-72 overflow-y-auto">
                  {requests.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <p className="text-3xl mb-2">📭</p>
                      <p className="text-sm font-medium">No pending requests</p>
                    </div>
                  ) : (
                    requests.map(r => (
                      <div
                        key={r.friendship_id}
                        className="flex items-center space-x-3 px-4 py-3 border-b border-gray-100 last:border-0"
                      >
                        {/* Mini avatar */}
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-black flex-shrink-0">
                          <img
                            src={AVATARS.find(a => a.id === r.from_avatar)?.img || AVATARS[0].img}
                            alt="avatar"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Name + email */}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-sm truncate">{r.from_username}</p>
                          <p className="text-xs text-gray-400 truncate">{r.from_email}</p>
                        </div>

                        {/* Buttons */}
                        <div className="flex space-x-1 flex-shrink-0">
                          <button
                            disabled={respondingId === r.friendship_id}
                            onClick={() => respond(r.friendship_id, 'accept')}
                            className="bg-black text-white text-xs px-3 py-1.5 rounded-full font-bold hover:bg-gray-800 transition disabled:opacity-50"
                          >
                            ✓
                          </button>
                          <button
                            disabled={respondingId === r.friendship_id}
                            onClick={() => respond(r.friendship_id, 'decline')}
                            className="bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-full font-bold hover:bg-gray-300 transition disabled:opacity-50"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer: link to full Friends page */}
                <div className="px-4 py-3 border-t-2 border-gray-200 bg-gray-50">
                  <button
                    onClick={() => { setShowDrop(false); navigate('/friends'); }}
                    className="w-full text-center text-xs font-bold text-gray-600 hover:text-black transition"
                  >
                    View all friends →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Profile avatar button ─────────────────────────────────── */}
          <button
            onClick={() => navigate('/profile')}
            className={`w-12 h-12 rounded-full overflow-hidden border-2 transition ml-2 ${
              isActive('/profile') ? 'border-black' : 'border-gray-400 hover:border-gray-700'
            } bg-gradient-to-br ${userAvatar?.bg || 'from-gray-600 to-gray-800'}`}
          >
            {customImg
              ? <img src={customImg}      alt="Your avatar" className="w-full h-full object-cover" />
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