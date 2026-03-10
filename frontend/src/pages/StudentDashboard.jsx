import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import Navbar from '../components/Navbar';
import ChickenImage from '../assets/images/chickenicon.png';

const AVATARS = [
  { id: 'avatar1',  img: '/avatars/avatar1.jpeg',  label: 'Student',             bg: 'from-green-400 to-green-600' },
  { id: 'avatar2',  img: '/avatars/avatar2.jpeg',  label: 'Wizard',              bg: 'from-pink-400 to-pink-600' },
  { id: 'avatar3',  img: '/avatars/avatar3.jpeg',  label: 'Nerd',                bg: 'from-blue-400 to-blue-600' },
  { id: 'avatar4',  img: '/avatars/avatar12.jpeg', label: 'Gamer',               bg: 'from-purple-400 to-purple-600' },
  { id: 'avatar5',  img: '/avatars/avatar5.jpeg',  label: 'Champion',            bg: 'from-gray-600 to-gray-800' },
  { id: 'avatar6',  img: '/avatars/avatar4.jpeg',  label: 'Artist',              bg: 'from-amber-400 to-orange-500' },
  { id: 'avatar7',  img: '/avatars/avatar6.jpeg',  label: 'Ballerina Cappucina', bg: 'from-cyan-400 to-cyan-600' },
  { id: 'avatar8',  img: '/avatars/avatar7.jpeg',  label: 'Cappuccino Assassino',bg: 'from-lime-400 to-lime-600' },
  { id: 'avatar9',  img: '/avatars/avatar8.jpeg',  label: 'Tralalero Tralala',   bg: 'from-red-400 to-orange-500' },
  { id: 'avatar10', img: '/avatars/avatar9.jpeg',  label: 'Harry Potter',        bg: 'from-yellow-400 to-yellow-500' },
  { id: 'avatar11', img: '/avatars/avatar10.jpeg', label: 'One Piece',           bg: 'from-sky-300 to-indigo-400' },
  { id: 'avatar12', img: '/avatars/avatar11.jpeg', label: 'Roblux',              bg: 'from-yellow-500 to-amber-600' },
];

const CUSTOM_AVATAR_KEY = 'user_custom_avatar';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [username, setUsername]       = useState('');
  const [myEmail, setMyEmail]         = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [yourRank, setYourRank]       = useState(null);
  const [userAvatar, setUserAvatar]   = useState('avatar1');
  const [customImg, setCustomImg]     = useState(null);
  const [friendsOnly, setFriendsOnly] = useState(false);   // ← NEW
  const [leaderLoading, setLeaderLoading] = useState(false);
  const [userStats, setUserStats]     = useState({
    points: 0, streak: 0, documents: 0, summaries: 0,
    notebooks: 0, flashcards: 0, quizzes: 0, videos: 0,
  });
  const [badges, setBadges]           = useState([]);
  const [earnedCount, setEarnedCount] = useState(0);
  const [showAllBadges, setShowAllBadges] = useState(false);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) { window.location.href = '/login'; return; }
    setUsername(storedUser.username);
    setMyEmail(storedUser.email);
    setUserAvatar(storedUser.avatar || 'avatar1');

    const savedCustom = localStorage.getItem(CUSTOM_AVATAR_KEY);
    if (savedCustom) setCustomImg(savedCustom);

    setUserStats(prev => ({
      ...prev,
      points: storedUser.points || 0,
      streak: storedUser.streak || 0,
    }));
    fetchLeaderboard(storedUser.email, false);
    fetchStats(storedUser.email);
    fetchBadges(storedUser.email);
  }, []);

  // Re-fetch leaderboard when toggle changes
  useEffect(() => {
    if (myEmail) fetchLeaderboard(myEmail, friendsOnly);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friendsOnly, myEmail]);

  const fetchLeaderboard = async (email, fo) => {
    setLeaderLoading(true);
    try {
      const res  = await fetch(
        `http://localhost:8000/api/leaderboard?email=${email}&friends_only=${fo}`
      );
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
      setYourRank(data.your_rank);
    } catch (err) { console.error('Leaderboard error:', err); }
    setLeaderLoading(false);
  };

  const fetchStats = async (email) => {
    try {
      const res  = await fetch(`http://localhost:8000/api/my-stats?email=${email}`);
      const data = await res.json();
      setUserStats(prev => ({
        ...prev,
        documents:  data.documents  || 0,
        summaries:  data.summaries  || 0,
        notebooks:  data.notebooks  || 0,
        flashcards: data.flashcards || 0,
        quizzes:    data.quizzes    || 0,
        videos:     data.videos     || 0,
      }));
    } catch (err) { console.error('Stats error:', err); }
  };

  const fetchBadges = async (email) => {
    try {
      const res  = await fetch(`http://localhost:8000/api/my-badges?email=${email}`);
      const data = await res.json();
      setBadges(data.badges || []);
      setEarnedCount(data.earned_count || 0);
    } catch (err) { console.error('Badges error:', err); }
  };

  // ── Avatar resolver ──────────────────────────────────────────────────────
  const resolveAvatar = (entry) => {
    const avatarId = entry?.avatar || 'avatar1';
    const isMe = entry?.is_you === true;

    if (avatarId === 'custom') {
      return {
        img: isMe && customImg ? customImg : null,
        bg: 'from-indigo-400 to-purple-500',
      };
    }

    const preset = AVATARS.find(a => a.id === avatarId) || AVATARS[0];
    return { img: preset.img, bg: preset.bg };
  };

  // Podium order: [2nd, 1st, 3rd]
  const top3 = leaderboard.slice(0, 3);
  const podiumOrder = [top3[1], top3[0], top3[2]];

  // ── Avatar components ────────────────────────────────────────────────────
  const PodiumAvatar = ({ entry, size = 'md' }) => {
    if (!entry) return null;
    const { img, bg } = resolveAvatar(entry);
    const sizeClass = size === 'lg' ? 'w-24 h-24' : 'w-20 h-20';
    const borderColor = entry.is_you ? 'border-purple-500' : 'border-white';
    return (
      <div className={`${sizeClass} rounded-full bg-gradient-to-br ${bg} overflow-hidden border-4 ${borderColor} shadow-lg flex-shrink-0`}>
        {img
          ? <img src={img} alt="avatar" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-white text-2xl">👤</div>
        }
      </div>
    );
  };

  const RowAvatar = ({ entry }) => {
    if (!entry) return null;
    const { img, bg } = resolveAvatar(entry);
    const borderColor = entry.is_you ? 'border-purple-500' : 'border-gray-300';
    return (
      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${bg} overflow-hidden flex-shrink-0 border-2 ${borderColor}`}>
        {img
          ? <img src={img} alt="avatar" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-white text-sm">👤</div>
        }
      </div>
    );
  };

  const myEntry = useMemo(() => ({
    avatar: userAvatar,
    is_you: true,
  }), [userAvatar]);

  return (
    <div className="min-h-screen bg-gray-200">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Welcome Section */}
        <div className="bg-gray-300 rounded-3xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <img src={ChickenImage} alt="Chicken" className="w-48 h-48 object-contain" />
            <div className="flex-1 ml-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Hello {username}!</h1>
              <p className="text-gray-700 mb-6">Ready to continue your learning journey?</p>
              <div className="bg-white rounded-2xl p-4 max-w-md">
                <h3 className="font-semibold text-gray-900 mb-3">Keep learning to earn more points! 🎯</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-orange-400 to-pink-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min((userStats.points / 500) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-700">{userStats.points} pts</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Left Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-8 border-4 border-black text-center">
              <div className="text-6xl mb-4">🔥</div>
              <p className="text-xl mb-2">
                You're on a <span className="text-5xl font-bold mx-2">{userStats.streak}</span> day streak!
              </p>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-3xl">📊</span>
                <h3 className="text-xl font-bold text-gray-900">Quick Statistics</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: '📄', count: userStats.documents,  label: 'Documents' },
                  { icon: '📝', count: userStats.summaries,  label: 'Summaries' },
                  { icon: '📇', count: userStats.flashcards, label: 'Flashcards' },
                  { icon: '❓', count: userStats.quizzes,    label: 'Quizzes' },
                  { icon: '🎬', count: userStats.videos,     label: 'Videos' },
                ].map(({ icon, count, label }) => (
                  <div key={label} className="bg-white rounded-2xl p-6 border-4 border-black text-center">
                    <div className="text-4xl mb-2">{icon}</div>
                    <div className="text-4xl font-bold text-gray-900 mb-1">{count}</div>
                    <div className="text-sm text-gray-600">{label}</div>
                  </div>
                ))}
                <div className="bg-white rounded-2xl p-6 border-4 border-black text-center">
                  <BookOpen className="w-10 h-10 mx-auto mb-2 text-green-700" />
                  <div className="text-4xl font-bold text-gray-900 mb-1">{userStats.notebooks}</div>
                  <div className="text-sm text-gray-600">Notebooks</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Leaderboard */}
            <div className="bg-white rounded-3xl p-8 border-4 border-black">

              {/* Header + Toggle */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">🏆 Leaderboard</h3>

                {/* Friends-only toggle */}
                <div className="flex items-center bg-gray-100 rounded-full p-1 border-2 border-black">
                  <button
                    onClick={() => setFriendsOnly(false)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
                      !friendsOnly ? 'bg-black text-white' : 'text-gray-600'
                    }`}
                  >
                    🌍 Global
                  </button>
                  <button
                    onClick={() => setFriendsOnly(true)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
                      friendsOnly ? 'bg-black text-white' : 'text-gray-600'
                    }`}
                  >
                    👯 Friends
                  </button>
                </div>
              </div>

              {leaderLoading ? (
                <div className="text-center py-10 text-gray-400 font-semibold animate-pulse">
                  Loading…
                </div>
              ) : (
                <>
                  {/* Friends-only empty state */}
                  {friendsOnly && leaderboard.length <= 1 && (
                    <div className="text-center py-8 mb-4">
                      <p className="text-4xl mb-2">👯</p>
                      <p className="font-bold text-gray-700">No friends yet!</p>
                      <p className="text-sm text-gray-500 mb-3">Add friends to see the friends leaderboard.</p>
                      <button
                        onClick={() => navigate('/friends')}
                        className="bg-black text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-gray-800 transition"
                      >
                        + Find Friends
                      </button>
                    </div>
                  )}

                  {/* Podium */}
                  {leaderboard.length > 0 && (
                    <div className="flex items-end justify-center space-x-4 mb-6">
                      {/* 2nd */}
                      {podiumOrder[0] && (
                        <div className="text-center">
                          <div className="mb-2 flex justify-center">
                            <PodiumAvatar entry={podiumOrder[0]} />
                          </div>
                          <p className="text-xs font-bold text-gray-700 w-24 truncate mx-auto">
                            {podiumOrder[0].is_you ? 'You' : podiumOrder[0].username}
                          </p>
                          <p className="text-xs text-gray-500">{podiumOrder[0].points} pts</p>
                          <div className="w-24 h-20 bg-gray-300 rounded-t-xl flex items-center justify-center font-bold text-2xl mt-1">2</div>
                        </div>
                      )}
                      {/* 1st */}
                      {podiumOrder[1] && (
                        <div className="text-center">
                          <div className="text-2xl mb-1">👑</div>
                          <div className="mb-2 flex justify-center">
                            <PodiumAvatar entry={podiumOrder[1]} size="lg" />
                          </div>
                          <p className="text-xs font-bold text-gray-700 w-28 truncate mx-auto">
                            {podiumOrder[1].is_you ? 'You' : podiumOrder[1].username}
                          </p>
                          <p className="text-xs text-gray-500">{podiumOrder[1].points} pts</p>
                          <div className="w-28 h-32 bg-yellow-400 rounded-t-xl flex items-center justify-center font-bold text-3xl mt-1">1</div>
                        </div>
                      )}
                      {/* 3rd */}
                      {podiumOrder[2] && (
                        <div className="text-center">
                          <div className="mb-2 flex justify-center">
                            <PodiumAvatar entry={podiumOrder[2]} />
                          </div>
                          <p className="text-xs font-bold text-gray-700 w-24 truncate mx-auto">
                            {podiumOrder[2].is_you ? 'You' : podiumOrder[2].username}
                          </p>
                          <p className="text-xs text-gray-500">{podiumOrder[2].points} pts</p>
                          <div className="w-24 h-16 bg-orange-300 rounded-t-xl flex items-center justify-center font-bold text-2xl mt-1">3</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Full list */}
                  <div className="space-y-3">
                    {leaderboard.slice(0, 10).map((entry) => (
                      <div key={entry.rank} className={`flex items-center space-x-3 p-3 rounded-xl border-2 ${
                        entry.is_you ? 'bg-purple-50 border-purple-500' : 'bg-white border-black'
                      }`}>
                        <span className="font-bold text-lg w-8">{entry.rank}.</span>
                        <RowAvatar entry={entry} />
                        <span className="font-semibold text-gray-900 flex-1 truncate">{entry.username}</span>
                        <span className="font-bold text-purple-600">{entry.points} pts</span>
                        {entry.is_you && (
                          <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full">You</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Your position if outside top 10 */}
                  {yourRank > 10 && (
                    <div className="mt-3 p-3 bg-purple-50 border-2 border-purple-500 rounded-xl flex items-center space-x-3">
                      <span className="font-bold text-lg w-8">{yourRank}.</span>
                      <RowAvatar entry={myEntry} />
                      <span className="font-semibold text-gray-900 flex-1">{username}</span>
                      <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full">Your Position</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Badges */}
            <div className="bg-white rounded-3xl p-8 border-4 border-black">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-3xl">🏅</span>
                  <h3 className="text-xl font-bold text-gray-900">Your Badges</h3>
                </div>
                <span className="bg-black text-white text-xs font-bold px-3 py-1 rounded-full">
                  {earnedCount} / {badges.length}
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-3 mb-6 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 h-full rounded-full transition-all duration-700"
                  style={{ width: badges.length ? `${(earnedCount / badges.length) * 100}%` : '0%' }}
                />
              </div>

              {earnedCount === 0 ? (
                <div className="text-center py-8">
                  <p className="text-5xl mb-3">🔒</p>
                  <p className="text-gray-500 font-medium">No badges earned yet!</p>
                  <p className="text-gray-400 text-sm mt-1">Start learning to unlock your first badge.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {badges.filter(b => b.earned).map((badge) => (
                    <div
                      key={badge.id}
                      title={`Earned: ${new Date(badge.earned_at).toLocaleDateString()}`}
                      className="rounded-2xl p-4 border-4 border-black bg-white text-center"
                    >
                      <img src={`/badges/${badge.id}.jpeg`} alt={badge.name} className="w-14 h-14 object-contain mx-auto mb-2" />
                      <div className="text-xs font-bold text-gray-900 leading-tight">{badge.name}</div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowAllBadges(prev => !prev)}
                className="w-full py-2 rounded-xl border-2 border-black text-sm font-bold text-gray-700 hover:bg-gray-100 transition"
              >
                {showAllBadges ? '▲ Hide locked badges' : `▼ See all badges (${badges.length - earnedCount} locked)`}
              </button>

              {showAllBadges && (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {badges.filter(b => !b.earned).map((badge) => (
                    <div
                      key={badge.id}
                      title={`🔒 ${badge.description}`}
                      className="rounded-2xl p-4 border-4 border-gray-200 bg-gray-100 text-center opacity-50"
                    >
                      <img src={`/badges/${badge.id}.png`} alt={badge.name} className="w-14 h-14 object-contain mx-auto mb-2 grayscale" />
                      <div className="text-xs font-bold text-gray-500 leading-tight">{badge.name}</div>
                      <div className="text-xs text-gray-400 mt-1">🔒 {badge.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      <footer className="text-center py-6 text-gray-600 text-sm mt-8">
        © PadaiSathi All rights reserved.
      </footer>
    </div>
  );
};

export default StudentDashboard;