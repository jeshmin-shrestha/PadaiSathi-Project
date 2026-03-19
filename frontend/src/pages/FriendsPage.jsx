import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Search,
  Mail,
  Check,
  X,
  User,
  Flame,
  Star,
  Trash2,
  Loader,
} from 'lucide-react';
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
    <div className={`${sizeClass} rounded-full overflow-hidden border-2 border-gray-300 flex-shrink-0 ${className}`}>
      <img src={getAvatarImg(avatarId)} alt="avatar" className="w-full h-full object-cover" />
    </div>
  );
};

// Toast component with dashboard style
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

// ── Main Component ─────────────────────────────────────────────────────────
export default function FriendsPage() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const myEmail = storedUser.email;

  const [tab, setTab] = useState('friends');   // friends | requests | search
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  // ── Fetch friends and requests ──────────────────────────────────────────
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
    if (!myEmail) {
      navigate('/login');
      return;
    }
    fetchFriends();
    fetchRequests();
  }, [myEmail, fetchFriends, fetchRequests, navigate]);

  // ── Search users ────────────────────────────────────────────────────────
  useEffect(() => {
    if (searchQ.length < 2) {
      setResults([]);
      return;
    }
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

  // ── Send friend request ─────────────────────────────────────────────────
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
      setResults(prev =>
        prev.map(u => (u.email === receiverEmail ? { ...u, status: 'pending' } : u))
      );
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  // ── Accept / decline request ────────────────────────────────────────────
  const respond = async (friendship_id, action) => {
    try {
      const res = await fetch(`${API}/api/friend-respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendship_id, email: myEmail, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      showToast(data.message, 'success');
      fetchRequests();
      fetchFriends();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  // ── Remove friend ───────────────────────────────────────────────────────
  const removeFriend = async (friendEmail) => {
    if (!window.confirm('Remove this friend?')) return;
    try {
      const res = await fetch(`${API}/api/remove-friend?email=${myEmail}&friend_email=${friendEmail}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      showToast('Friend removed.', 'info');
      fetchFriends();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  // ── Status button for search results ────────────────────────────────────
  const StatusButton = ({ user }) => {
    if (user.status === 'accepted') {
      return (
        <span className="inline-flex items-center text-xs bg-green-100 text-green-700 border border-green-300 px-3 py-1.5 rounded-full font-semibold">
          <UserCheck className="w-3.5 h-3.5 mr-1" /> Friends
        </span>
      );
    }
    if (user.status === 'pending') {
      return (
        <span className="inline-flex items-center text-xs bg-yellow-100 text-yellow-700 border border-yellow-300 px-3 py-1.5 rounded-full font-semibold">
          <Loader className="w-3.5 h-3.5 mr-1 animate-spin" /> Pending
        </span>
      );
    }
    return (
      <button
        onClick={() => sendRequest(user.email)}
        className="inline-flex items-center text-xs bg-[#6a88be] text-white px-4 py-1.5 rounded-full font-bold hover:bg-[#5578a5] transition"
      >
        <UserPlus className="w-3.5 h-3.5 mr-1" /> Add
      </button>
    );
  };

  // ── Tab configuration with icons ────────────────────────────────────────
  const tabs = [
    { id: 'friends', label: `Friends (${friends.length})`, icon: Users },
    { id: 'requests', label: `Requests (${requests.length})`, icon: Mail },
    { id: 'search', label: 'Find People', icon: Search },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-7xl mx-auto px-4 py-8 lg:px-8">
        {/* Page header */}
        <div className="flex items-center space-x-3 mb-6">
          <Users className="w-8 h-8 text-gray-700" />
          <h1 className="text-3xl font-extrabold text-gray-900">Friends</h1>
        </div>

        {/* Tab bar – dashboard style */}
        <div className="bg-gray-300 rounded-3xl shadow-lg p-2 mb-8 flex">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition ${
                  isActive
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ── Friends tab ────────────────────────────────────────────────── */}
        {tab === 'friends' && (
          <div className="space-y-4">
            {friends.length === 0 ? (
              <div className="bg-gray-300 rounded-3xl shadow-lg p-12 text-center">
                <User className="w-20 h-20 mx-auto text-gray-500 mb-4" />
                <p className="text-2xl font-bold text-gray-900 mb-2">No friends yet!</p>
                <p className="text-gray-600 mb-6">Search for classmates and send requests.</p>
                <button
                  onClick={() => setTab('search')}
                  className="inline-flex items-center gap-2 bg-[#6a88be] text-white px-6 py-3 rounded-full font-bold hover:bg-[#5578a5] transition"
                >
                  <Search className="w-4 h-4" /> Find People
                </button>
              </div>
            ) : (
              friends.map((f) => (
                <div
                  key={f.friendship_id}
                  className="bg-gray-300 rounded-3xl shadow-lg p-5 flex items-center gap-4"
                >
                  <Avatar avatarId={f.avatar} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate text-lg">{f.username}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Flame className="w-4 h-4 text-orange-500" /> {f.streak}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" /> {f.points} pts
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFriend(f.email)}
                    className="flex items-center gap-1 text-xs text-red-600 border border-red-300 px-3 py-1.5 rounded-full hover:bg-red-50 transition font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Requests tab ──────────────────────────────────────────────── */}
        {tab === 'requests' && (
          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="bg-gray-300 rounded-3xl shadow-lg p-12 text-center">
                <Mail className="w-20 h-20 mx-auto text-gray-500 mb-4" />
                <p className="text-2xl font-bold text-gray-900 mb-2">No pending requests</p>
                <p className="text-gray-600">When someone adds you, they'll appear here.</p>
              </div>
            ) : (
              requests.map((r) => (
                <div
                  key={r.friendship_id}
                  className="bg-gray-300 rounded-3xl shadow-lg p-5 flex items-center gap-4"
                >
                  <Avatar avatarId={r.from_avatar} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate text-lg">{r.from_username}</p>
                    <p className="text-sm text-gray-500">{r.from_email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => respond(r.friendship_id, 'accept')}
                      className="flex items-center gap-1 text-xs bg-green-600 text-white px-4 py-1.5 rounded-full font-bold hover:bg-green-700 transition"
                    >
                      <Check className="w-3.5 h-3.5" /> Accept
                    </button>
                    <button
                      onClick={() => respond(r.friendship_id, 'decline')}
                      className="flex items-center gap-1 text-xs bg-gray-200 text-gray-700 px-4 py-1.5 rounded-full font-bold hover:bg-gray-300 transition"
                    >
                      <X className="w-3.5 h-3.5" /> Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Search tab ────────────────────────────────────────────────── */}
        {tab === 'search' && (
          <div>
            {/* Search input – dashboard style */}
            <div className="relative mb-6">
              <input
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search by username or email…"
                className="w-full bg-gray-300 rounded-3xl shadow-lg px-6 py-4 pl-14 text-gray-900 placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#6a88be]"
              />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              {loading && (
                <Loader className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 animate-spin" />
              )}
            </div>

            <div className="space-y-4">
              {searchQ.length < 2 && (
                <div className="text-center text-gray-500 text-sm py-8">
                  Type at least 2 characters to search
                </div>
              )}
              {searchResults.map((u) => (
                <div
                  key={u.id}
                  className="bg-gray-300 rounded-3xl shadow-lg p-5 flex items-center gap-4"
                >
                  <Avatar avatarId={u.avatar} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate text-lg">{u.username}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Star className="w-4 h-4 text-yellow-500" /> {u.points} pts
                    </div>
                  </div>
                  <StatusButton user={u} />
                </div>
              ))}
              {searchQ.length >= 2 && !loading && searchResults.length === 0 && (
                <div className="text-center text-gray-500 text-sm py-8">
                  No users found for "{searchQ}"
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <footer className="text-center py-6 text-gray-500 text-sm mt-8 border-t border-gray-200">
        © PadaiSathi. All rights reserved.
      </footer>
    </div>
  );
}