import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const API = 'http://localhost:8000';

const AVATARS = [
  { id: 'avatar1',  img: '/avatars/avatar1.jpeg'  },
  { id: 'avatar2',  img: '/avatars/avatar2.jpeg'  },
  { id: 'avatar3',  img: '/avatars/avatar3.jpeg'  },
  { id: 'avatar4',  img: '/avatars/avatar12.jpeg' },
  { id: 'avatar5',  img: '/avatars/avatar5.jpeg'  },
  { id: 'avatar6',  img: '/avatars/avatar4.jpeg'  },
  { id: 'avatar7',  img: '/avatars/avatar6.jpeg'  },
  { id: 'avatar8',  img: '/avatars/avatar7.jpeg'  },
  { id: 'avatar9',  img: '/avatars/avatar8.jpeg'  },
  { id: 'avatar10', img: '/avatars/avatar9.jpeg'  },
  { id: 'avatar11', img: '/avatars/avatar10.jpeg' },
  { id: 'avatar12', img: '/avatars/avatar11.jpeg' },
];

const getAvatarImg = (avatarId) => {
  const found = AVATARS.find(a => a.id === avatarId);
  return found ? found.img : AVATARS[0].img;
};

const Avatar = ({ avatarId, size = 'md', className = '' }) => {
  const sizeClass = { sm: 'w-9 h-9', md: 'w-12 h-12', lg: 'w-16 h-16' }[size];
  return (
    <div className={`${sizeClass} rounded-full overflow-hidden border-2 border-black flex-shrink-0 ${className}`}>
      <img src={getAvatarImg(avatarId)} alt="avatar" className="w-full h-full object-cover" />
    </div>
  );
};

// ── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ msg, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = {
    success: 'bg-green-500',
    error:   'bg-red-500',
    info:    'bg-blue-500',
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${colors[type] || 'bg-gray-700'} text-white px-5 py-3 rounded-2xl shadow-xl font-semibold text-sm animate-bounce`}>
      {msg}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
export default function FriendsPage() {
  const navigate  = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const myEmail   = storedUser.email;

  const [tab, setTab]               = useState('friends');   // friends | requests | search
  const [friends, setFriends]       = useState([]);
  const [requests, setRequests]     = useState([]);
  const [searchQ, setSearchQ]       = useState('');
  const [searchResults, setResults] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [toast, setToast]           = useState(null);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchFriends = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/api/my-friends?email=${myEmail}`);
      const data = await res.json();
      setFriends(data.friends || []);
    } catch { showToast('Could not load friends', 'error'); }
  }, [myEmail]);

  const fetchRequests = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/api/friend-requests?email=${myEmail}`);
      const data = await res.json();
      setRequests(data.requests || []);
    } catch { showToast('Could not load requests', 'error'); }
  }, [myEmail]);

  useEffect(() => {
    if (!myEmail) { navigate('/login'); return; }
    fetchFriends();
    fetchRequests();
  }, [myEmail, fetchFriends, fetchRequests, navigate]);

  // ── Search ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (searchQ.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res  = await fetch(`${API}/api/search-users?q=${encodeURIComponent(searchQ)}&email=${myEmail}`);
        const data = await res.json();
        setResults(data.users || []);
      } catch { showToast('Search failed', 'error'); }
      setLoading(false);
    }, 400);
    return () => clearTimeout(t);
  }, [searchQ, myEmail]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const sendRequest = async (receiverEmail) => {
    try {
      const res  = await fetch(`${API}/api/friend-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_email: myEmail, receiver_email: receiverEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      showToast(data.message, 'success');
      // Mark as pending in results
      setResults(prev => prev.map(u =>
        u.email === receiverEmail ? { ...u, status: 'pending' } : u
      ));
    } catch (e) { showToast(e.message, 'error'); }
  };

  const respond = async (friendship_id, action) => {
    try {
      const res  = await fetch(`${API}/api/friend-respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendship_id, email: myEmail, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      showToast(data.message, 'success');
      fetchRequests();
      fetchFriends();
    } catch (e) { showToast(e.message, 'error'); }
  };

  const removeFriend = async (friendEmail) => {
    if (!window.confirm('Remove this friend?')) return;
    try {
      const res  = await fetch(
        `${API}/api/remove-friend?email=${myEmail}&friend_email=${friendEmail}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      showToast('Friend removed.', 'info');
      fetchFriends();
    } catch (e) { showToast(e.message, 'error'); }
  };

  // ── Status badge helper ───────────────────────────────────────────────────
  const StatusButton = ({ user }) => {
    if (user.status === 'accepted') return (
      <span className="text-xs bg-green-100 text-green-700 border border-green-300 px-3 py-1 rounded-full font-semibold">
        ✓ Friends
      </span>
    );
    if (user.status === 'pending') return (
      <span className="text-xs bg-yellow-100 text-yellow-700 border border-yellow-300 px-3 py-1 rounded-full font-semibold">
        ⏳ Pending
      </span>
    );
    return (
      <button
        onClick={() => sendRequest(user.email)}
        className="text-xs bg-black text-white px-4 py-1.5 rounded-full font-bold hover:bg-gray-800 transition"
      >
        + Add
      </button>
    );
  };

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'friends',  label: `Friends (${friends.length})`,    emoji: '👯' },
    { id: 'requests', label: `Requests (${requests.length})`,  emoji: '📬' },
    { id: 'search',   label: 'Find People',                    emoji: '🔍' },
  ];

  return (
    <div className="min-h-screen bg-gray-200">
      <Navbar />

      {toast && (
        <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6">👯 Friends</h1>

        {/* Tab bar */}
        <div className="flex space-x-2 mb-6 bg-white rounded-2xl p-2 border-4 border-black">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${
                tab === t.id
                  ? 'bg-black text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {/* ── Friends tab ──────────────────────────────────────────────────── */}
        {tab === 'friends' && (
          <div className="space-y-3">
            {friends.length === 0 ? (
              <div className="bg-white rounded-3xl border-4 border-black p-12 text-center">
                <p className="text-5xl mb-3">🥲</p>
                <p className="font-bold text-gray-700 text-lg">No friends yet!</p>
                <p className="text-gray-500 text-sm mt-1">Search for classmates and send requests.</p>
                <button
                  onClick={() => setTab('search')}
                  className="mt-4 bg-black text-white px-6 py-2 rounded-full font-bold hover:bg-gray-800 transition"
                >
                  Find People 🔍
                </button>
              </div>
            ) : (
              friends.map(f => (
                <div key={f.friendship_id} className="bg-white rounded-2xl border-4 border-black p-4 flex items-center space-x-4">
                  <Avatar avatarId={f.avatar} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{f.username}</p>
                    <p className="text-sm text-gray-500">
                      🔥 {f.streak}-day streak &nbsp;·&nbsp; ⭐ {f.points} pts
                    </p>
                  </div>
                  <button
                    onClick={() => removeFriend(f.email)}
                    className="text-xs text-red-500 border border-red-300 px-3 py-1 rounded-full hover:bg-red-50 transition font-semibold"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Requests tab ────────────────────────────────────────────────── */}
        {tab === 'requests' && (
          <div className="space-y-3">
            {requests.length === 0 ? (
              <div className="bg-white rounded-3xl border-4 border-black p-12 text-center">
                <p className="text-5xl mb-3">📭</p>
                <p className="font-bold text-gray-700">No pending requests</p>
                <p className="text-gray-500 text-sm mt-1">When someone adds you, they'll appear here.</p>
              </div>
            ) : (
              requests.map(r => (
                <div key={r.friendship_id} className="bg-white rounded-2xl border-4 border-black p-4 flex items-center space-x-4">
                  <Avatar avatarId={r.from_avatar} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{r.from_username}</p>
                    <p className="text-xs text-gray-400">{r.from_email}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => respond(r.friendship_id, 'accept')}
                      className="text-xs bg-green-500 text-white px-4 py-1.5 rounded-full font-bold hover:bg-green-600 transition"
                    >
                      ✓ Accept
                    </button>
                    <button
                      onClick={() => respond(r.friendship_id, 'decline')}
                      className="text-xs bg-gray-200 text-gray-700 px-4 py-1.5 rounded-full font-bold hover:bg-gray-300 transition"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Search tab ──────────────────────────────────────────────────── */}
        {tab === 'search' && (
          <div>
            <div className="relative mb-4">
              <input
                type="text"
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Search by username or email…"
                className="w-full bg-white border-4 border-black rounded-2xl px-5 py-3 font-semibold text-gray-800 placeholder-gray-400 outline-none focus:ring-4 focus:ring-purple-300"
              />
              {loading && (
                <div className="absolute right-4 top-3.5 text-gray-400 text-sm animate-spin">⟳</div>
              )}
            </div>

            <div className="space-y-3">
              {searchQ.length < 2 && (
                <div className="text-center text-gray-500 text-sm py-8">
                  Type at least 2 characters to search 🔍
                </div>
              )}
              {searchResults.map(u => (
                <div key={u.id} className="bg-white rounded-2xl border-4 border-black p-4 flex items-center space-x-4">
                  <Avatar avatarId={u.avatar} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{u.username}</p>
                    <p className="text-xs text-gray-500">⭐ {u.points} pts</p>
                  </div>
                  <StatusButton user={u} />
                </div>
              ))}
              {searchQ.length >= 2 && !loading && searchResults.length === 0 && (
                <div className="text-center text-gray-500 text-sm py-8">No users found for "{searchQ}"</div>
              )}
            </div>
          </div>
        )}
      </div>

      <footer className="text-center py-6 text-gray-600 text-sm mt-4">
        © PadaiSathi All rights reserved.
      </footer>
    </div>
  );
}