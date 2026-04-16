import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserPlus, UserCheck, Search, Mail,
  Check, X, User, Flame, Star, Trash2, Loader,
} from 'lucide-react';
import { API, AVATARS } from '../constants';

const getAvatarImg = (avatarId) => {
  const found = AVATARS.find(a => a.id === avatarId);
  return found ? found.img : AVATARS[0].img;
};

const Avatar = ({ avatarId, size = 'md', className = '' }) => {
  const sizeClass = { sm: 'w-9 h-9', md: 'w-12 h-12', lg: 'w-16 h-16' }[size];
  return (
    <div className={`${sizeClass} rounded-full overflow-hidden border-2 border-blue-100 flex-shrink-0 ${className}`}>
      <img src={getAvatarImg(avatarId)} alt="avatar" className="w-full h-full object-cover" />
    </div>
  );
};

const Toast = ({ msg, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-blue-500' };

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${colors[type] || 'bg-gray-700'} text-white px-5 py-3 rounded-2xl shadow-xl font-semibold text-sm animate-bounce flex items-center gap-2`}>
      {type === 'success' && <UserCheck className="w-4 h-4 flex-shrink-0" />}
      {msg}
    </div>
  );
};

const PAD_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Sora:wght@400;600;700;800&display=swap');
  .pad-bg * { font-family: 'Nunito', sans-serif; }
  .pad-bg {
    background: radial-gradient(ellipse 85% 55% at 5% 0%, rgba(186,220,255,0.6) 0%, transparent 60%),
                radial-gradient(ellipse 70% 50% at 95% 10%, rgba(200,225,255,0.5) 0%, transparent 55%),
                radial-gradient(ellipse 60% 40% at 50% 100%, rgba(176,212,255,0.4) 0%, transparent 60%),
                #e8f1fb;
    min-height: 100vh;
  }
  .pad-card {
    background: rgba(255,255,255,0.62);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border: 1px solid rgba(175,215,255,0.38);
    border-radius: 22px;
  }
`;

export default function FriendsPage() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
  const myEmail = storedUser.email;

  const [tab, setTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const fetchFriends = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/my-friends?email=${myEmail}`);
      const data = await res.json();
      setFriends(data.friends || []);
    } catch {
      showToast('Could not load friends', 'error');
    }
  }, [myEmail]);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/friend-requests?email=${myEmail}`);
      const data = await res.json();
      setRequests(data.requests || []);
    } catch {
      showToast('Could not load requests', 'error');
    }
  }, [myEmail]);

  useEffect(() => {
    if (!myEmail) { navigate('/login'); return; }
    fetchFriends();
    fetchRequests();
  }, [myEmail, fetchFriends, fetchRequests, navigate]);

  useEffect(() => {
    if (searchQ.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/search-users?q=${encodeURIComponent(searchQ)}&email=${myEmail}`);
        const data = await res.json();
        setResults(data.users || []);
      } catch {
        showToast('Search failed', 'error');
      }
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQ, myEmail]);

  const sendRequest = async (receiverEmail) => {
    try {
      const res = await fetch(`${API}/api/friend-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_email: myEmail, receiver_email: receiverEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      showToast(data.message, 'success');
      setResults(prev => prev.map(u => (u.email === receiverEmail ? { ...u, status: 'pending' } : u)));
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const respond = async (friendship_id, action, fromUsername = null) => {
    try {
      const res = await fetch(`${API}/api/friend-respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendship_id, email: myEmail, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      const msg = fromUsername
        ? action === 'accept'
          ? `You are now friends with ${fromUsername}!`
          : `You declined ${fromUsername}'s friend request.`
        : data.message;
      showToast(msg, action === 'accept' ? 'success' : 'error');
      fetchRequests();
      fetchFriends();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const removeFriend = async (friendEmail, friendUsername) => {
    if (!window.confirm('Remove this friend?')) return;
    try {
      const res = await fetch(`${API}/api/remove-friend?email=${myEmail}&friend_email=${friendEmail}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      showToast(`${friendUsername} removed from friends.`, 'info');
      fetchFriends();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const StatusButton = ({ user }) => {
    if (user.status === 'accepted') {
      return (
        <span className="inline-flex items-center text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-full font-semibold">
          <UserCheck className="w-3.5 h-3.5 mr-1" /> Friends
        </span>
      );
    }
    if (user.status === 'pending') {
      return (
        <span className="inline-flex items-center text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-1.5 rounded-full font-semibold">
          <Loader className="w-3.5 h-3.5 mr-1 animate-spin" /> Pending
        </span>
      );
    }
    return (
      <button
        onClick={() => sendRequest(user.email)}
        className="inline-flex items-center text-xs text-white px-4 py-1.5 rounded-full font-bold transition"
        style={{ background: 'rgba(90,120,180,0.85)' }}
      >
        <UserPlus className="w-3.5 h-3.5 mr-1" /> Add
      </button>
    );
  };

  const tabs = [
    { id: 'friends',  label: `Friends (${friends.length})`,  icon: Users  },
    { id: 'requests', label: `Requests (${requests.length})`, icon: Mail   },
    { id: 'search',   label: 'Find People',                   icon: Search },
  ];

  return (
    <div className="min-h-screen pad-bg">
      <style>{PAD_STYLE}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-7xl mx-auto px-4 py-8 lg:px-8">

        {/* Page header */}
        <div className="flex items-center space-x-3 mb-6">
          <Users className="w-8 h-8 text-blue-400" />
          <h1 className="text-3xl font-bold text-gray-800" style={{ fontFamily: "'Sora', sans-serif" }}>Friends</h1>
        </div>

        {/* Tab bar */}
        <div className="pad-card p-2 mb-8 flex">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition ${
                  isActive ? 'text-gray-800 shadow-sm' : 'text-gray-500 hover:bg-blue-50'
                }`}
                style={isActive ? { background: 'rgba(255,255,255,0.9)' } : {}}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Friends tab */}
        {tab === 'friends' && (
          <div className="space-y-4">
            {friends.length === 0 ? (
              <div className="pad-card p-12 text-center">
                <User className="w-20 h-20 mx-auto text-blue-200 mb-4" />
                <p className="text-2xl font-bold text-gray-700 mb-2">No friends yet!</p>
                <p className="text-gray-500 mb-6">Search for classmates and send requests.</p>
                <button
                  onClick={() => setTab('search')}
                  className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-full font-bold transition"
                  style={{ background: 'rgba(90,120,180,0.85)' }}
                >
                  <Search className="w-4 h-4" /> Find People
                </button>
              </div>
            ) : (
              friends.map((f) => (
                <div key={f.friendship_id} className="pad-card p-5 flex items-center gap-4">
                  <Avatar avatarId={f.avatar} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 truncate text-lg">{f.username}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Flame className="w-4 h-4 text-orange-400" /> {f.streak}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400" /> {f.points} pts
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFriend(f.email, f.username)}
                    className="flex items-center gap-1 text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded-full hover:bg-red-50 transition font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Requests tab */}
        {tab === 'requests' && (
          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="pad-card p-12 text-center">
                <Mail className="w-20 h-20 mx-auto text-blue-200 mb-4" />
                <p className="text-2xl font-bold text-gray-700 mb-2">No pending requests</p>
                <p className="text-gray-500">When someone adds you, they'll appear here.</p>
              </div>
            ) : (
              requests.map((r) => (
                <div key={r.friendship_id} className="pad-card p-5 flex items-center gap-4">
                  <Avatar avatarId={r.from_avatar} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 truncate text-lg">{r.from_username}</p>
                    <p className="text-sm text-gray-400">{r.from_email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => respond(r.friendship_id, 'accept', r.from_username)}
                      className="flex items-center gap-1 text-xs bg-green-500 text-white px-4 py-1.5 rounded-full font-bold hover:bg-green-600 transition"
                    >
                      <Check className="w-3.5 h-3.5" /> Accept
                    </button>
                    <button
                      onClick={() => respond(r.friendship_id, 'decline', r.from_username)}
                      className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full font-bold hover:bg-gray-200 transition"
                    >
                      <X className="w-3.5 h-3.5" /> Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Search tab */}
        {tab === 'search' && (
          <div>
            <div className="relative mb-6">
              <input
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search by username or email…"
                className="w-full pad-card px-6 py-4 pl-14 text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-200"
                style={{ borderRadius: '22px' }}
              />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300" />
              {loading && (
                <Loader className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300 animate-spin" />
              )}
            </div>

            <div className="space-y-4">
              {searchQ.length < 2 && (
                <div className="text-center text-gray-400 text-sm py-8">
                  Type at least 2 characters to search
                </div>
              )}
              {searchResults.map((u) => (
                <div key={u.id} className="pad-card p-5 flex items-center gap-4">
                  <Avatar avatarId={u.avatar} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 truncate text-lg">{u.username}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Star className="w-4 h-4 text-yellow-400" /> {u.points} pts
                    </div>
                  </div>
                  <StatusButton user={u} />
                </div>
              ))}
              {searchQ.length >= 2 && !loading && searchResults.length === 0 && (
                <div className="text-center text-gray-400 text-sm py-8">
                  No users found for "{searchQ}"
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <footer className="text-center py-6 text-gray-500 text-sm mt-8">
        © PadaiSathi. All rights reserved.
      </footer>
    </div>
  );
}
