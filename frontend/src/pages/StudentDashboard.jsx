import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, BookOpen } from 'lucide-react';
import Navbar from '../components/Navbar';
import ChickenImage from '../assets/images/chickenicon.png';

// Avatar data - should match the one in ProfilePage.jsx
const AVATARS = [
  { id: 'avatar1',  img: '/avatars/avatar1.jpeg',  label: 'Student',  bg: 'from-green-400 to-green-600' },
  { id: 'avatar2',  img: '/avatars/avatar2.jpeg',  label: 'Wizard',  bg: 'from-pink-400 to-pink-600' },
  { id: 'avatar3',  img: '/avatars/avatar3.jpeg',  label: 'Nerd',  bg: 'from-blue-400 to-blue-600' },
  { id: 'avatar4',  img: '/avatars/avatar12.jpeg',  label: 'Gamer',  bg: 'from-purple-400 to-purple-600' },
  { id: 'avatar5',  img: '/avatars/avatar5.jpeg',  label: 'Champion',  bg: 'from-gray-600 to-gray-800' },
  { id: 'avatar6',  img: '/avatars/avatar4.jpeg',  label: 'Artist',  bg: 'from-amber-400 to-orange-500' },
  { id: 'avatar7',  img: '/avatars/avatar6.jpeg',  label: 'Ballerina Cappucina',  bg: 'from-cyan-400 to-cyan-600' },
  { id: 'avatar8',  img: '/avatars/avatar7.jpeg',  label: 'Cappuccino Assassino ',  bg: 'from-lime-400 to-lime-600' },
  { id: 'avatar9',  img: '/avatars/avatar8.jpeg',  label: 'Tralalero Tralala',  bg: 'from-red-400 to-orange-500' },
  { id: 'avatar10', img: '/avatars/avatar9.jpeg', label: 'Harry Potter', bg: 'from-yellow-400 to-yellow-500' },
  { id: 'avatar11', img: '/avatars/avatar10.jpeg', label: 'One Piece', bg: 'from-sky-300 to-indigo-400' },
  { id: 'avatar12', img: '/avatars/avatar11.jpeg', label: 'Roblux', bg: 'from-yellow-500 to-amber-600' },
];

// Helper function to get avatar by id
const getAvatarById = (avatarId) => {
  return AVATARS.find(a => a.id === avatarId) || AVATARS[0];
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [yourRank, setYourRank] = useState(null);
  const [userAvatar, setUserAvatar] = useState('avatar1');
  const [userStats, setUserStats] = useState({
    points: 0,
    streak: 0,
    videos: 0,
    quizzes: 0,
    flashcards: 0,
    notebooks: 0,
  });

  const badges = [
    { id: 1, name: 'First Steps', icon: '🦉' },
    { id: 2, name: 'Quiz Master', icon: '🏆' },
    { id: 3, name: 'Video Watcher', icon: '📚' },
    { id: 4, name: 'Speed Learner', icon: '⚡' }
  ];

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) {
      window.location.href = '/login';
      return;
    }
    setUsername(storedUser.username);
    setUserAvatar(storedUser.avatar || 'avatar1');
    setUserStats(prev => ({
      ...prev,
      points: storedUser.points || 0,
      streak: storedUser.streak || 0,
    }));
    fetchLeaderboard(storedUser.email);
    fetchStats(storedUser.email);
  }, []);

  const fetchLeaderboard = async (email) => {
    try {
      const res = await fetch(`http://localhost:8000/api/leaderboard?email=${email}`);
      const data = await res.json();
      setLeaderboard(data.leaderboard);
      setYourRank(data.your_rank);
    } catch (err) {
      console.error('Leaderboard error:', err);
    }
  };

  const fetchStats = async (email) => {
    try {
      const [docsRes, summariesRes, notebooksRes] = await Promise.all([
        fetch(`http://localhost:8000/api/my-documents?email=${email}`),
        fetch(`http://localhost:8000/api/my-summaries?email=${email}`),
        fetch(`http://localhost:8000/api/my-notebooks?email=${email}`),
      ]);
      const docs = await docsRes.json();
      const summaries = await summariesRes.json();
      const notebooks = await notebooksRes.json();

      setUserStats(prev => ({
        ...prev,
        videos: docs.documents?.length || 0,
        quizzes: summaries.summaries?.length || 0,
        notebooks: notebooks.notebooks?.length || 0,
      }));
    } catch (err) {
      console.error('Stats error:', err);
    }
  };

  // Helper to get podium order: [2nd, 1st, 3rd]
  const top3 = leaderboard.slice(0, 3);
  const podiumOrder = [top3[1], top3[0], top3[2]]; // 2nd, 1st, 3rd

  // Render avatar image component
  const AvatarImage = ({ avatarId, isYou, size = 'default' }) => {
    const avatar = getAvatarById(avatarId);
    const sizeClasses = size === 'large' ? 'w-24 h-24' : size === 'small' ? 'w-8 h-8' : 'w-20 h-20';
    
    return (
      <div className={`${sizeClasses} rounded-full bg-gradient-to-br ${avatar.bg} overflow-hidden border-4 ${isYou ? 'border-purple-500' : 'border-white'} shadow-lg`}>
        <img src={avatar.img} alt={avatar.label} className="w-full h-full object-cover" />
      </div>
    );
  };

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
            {/* Streak Card */}
            <div className="bg-white rounded-3xl p-8 border-4 border-black text-center">
              <div className="text-6xl mb-4">🔥</div>
              <p className="text-xl mb-2">
                You're on a <span className="text-5xl font-bold mx-2">{userStats.streak}</span> day streak!
              </p>
            </div>

            {/* Quick Statistics */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-3xl">📊</span>
                <h3 className="text-xl font-bold text-gray-900">Quick Statistics</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-6 border-4 border-black text-center">
                  <Video className="w-12 h-12 mx-auto mb-3" />
                  <div className="text-4xl font-bold text-gray-900 mb-1">{userStats.videos}</div>
                  <div className="text-sm text-gray-600">Documents</div>
                </div>
                <div className="bg-white rounded-2xl p-6 border-4 border-black text-center">
                  <div className="text-5xl mb-2">❓</div>
                  <div className="text-4xl font-bold text-gray-900 mb-1">{userStats.quizzes}</div>
                  <div className="text-sm text-gray-600">Summaries</div>
                </div>
                <div className="bg-white rounded-2xl p-6 border-4 border-black text-center">
                  <div className="text-5xl mb-2">📇</div>
                  <div className="text-4xl font-bold text-gray-900 mb-1">{userStats.flashcards}</div>
                  <div className="text-sm text-gray-600">Flashcards</div>
                </div>
                <div className="bg-white rounded-2xl p-6 border-4 border-black text-center">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-green-700" />
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
              <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">🏆 Leaderboard</h3>

              {/* Podium - 2nd, 1st, 3rd */}
              {leaderboard.length > 0 && (
                <div className="flex items-end justify-center space-x-4 mb-6">
                  {/* 2nd Place */}
                  {podiumOrder[0] && (
                    <div className="text-center">
                      <div className="mb-2 flex justify-center">
                        <AvatarImage avatarId={podiumOrder[0].avatar} isYou={podiumOrder[0].is_you} />
                      </div>
                      <p className="text-xs font-bold text-gray-700 w-24 truncate mx-auto">
                        {podiumOrder[0].is_you ? 'You' : podiumOrder[0].username}
                      </p>
                      <p className="text-xs text-gray-500">{podiumOrder[0].points} pts</p>
                      <div className="w-24 h-20 bg-gray-300 rounded-t-xl flex items-center justify-center font-bold text-2xl mt-1">2</div>
                    </div>
                  )}

                  {/* 1st Place */}
                  {podiumOrder[1] && (
                    <div className="text-center">
                      <div className="text-2xl mb-1">👑</div>
                      <div className="mb-2 flex justify-center">
                        <AvatarImage avatarId={podiumOrder[1].avatar} isYou={podiumOrder[1].is_you} size="large" />
                      </div>
                      <p className="text-xs font-bold text-gray-700 w-28 truncate mx-auto">
                        {podiumOrder[1].is_you ? 'You' : podiumOrder[1].username}
                      </p>
                      <p className="text-xs text-gray-500">{podiumOrder[1].points} pts</p>
                      <div className="w-28 h-32 bg-yellow-400 rounded-t-xl flex items-center justify-center font-bold text-3xl mt-1">1</div>
                    </div>
                  )}

                  {/* 3rd Place */}
                  {podiumOrder[2] && (
                    <div className="text-center">
                      <div className="mb-2 flex justify-center">
                        <AvatarImage avatarId={podiumOrder[2].avatar} isYou={podiumOrder[2].is_you} />
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

              {/* Full Leaderboard List */}
              <div className="space-y-3">
                {leaderboard.slice(0, 10).map((entry) => {
                  const avatar = getAvatarById(entry.avatar);
                  return (
                    <div key={entry.rank} className={`flex items-center space-x-3 p-3 rounded-xl border-2 ${
                      entry.is_you ? 'bg-purple-50 border-purple-500' : 'bg-white border-black'
                    }`}>
                      <span className="font-bold text-lg w-8">{entry.rank}.</span>
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatar.bg} overflow-hidden flex-shrink-0 border-2 ${entry.is_you ? 'border-purple-500' : 'border-gray-300'}`}>
                        <img src={avatar.img} alt={avatar.label} className="w-full h-full object-cover" />
                      </div>
                      <span className="font-semibold text-gray-900 flex-1 truncate">{entry.username}</span>
                      <span className="font-bold text-purple-600">{entry.points} pts</span>
                      {entry.is_you && (
                        <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full">You</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Your position if outside top 10 */}
              {yourRank > 10 && (
                <div className="mt-3 p-3 bg-purple-50 border-2 border-purple-500 rounded-xl flex items-center space-x-3">
                  <span className="font-bold text-lg w-8">{yourRank}.</span>
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarById(userAvatar).bg} overflow-hidden flex-shrink-0 border-2 border-purple-500`}>
                    <img src={getAvatarById(userAvatar).img} alt="Your avatar" className="w-full h-full object-cover" />
                  </div>
                  <span className="font-semibold text-gray-900 flex-1">{username}</span>
                  <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full">Your Position</span>
                </div>
              )}
            </div>

            {/* Badges */}
            <div className="bg-white rounded-3xl p-8 border-4 border-black">
              <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Your Badges</h3>
              <div className="text-center mb-6">
                <div className="text-6xl mb-2">🏆</div>
                <div className="text-sm text-gray-600">Total Points</div>
                <div className="text-3xl font-bold text-gray-900">{userStats.points}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {badges.map((badge) => (
                  <div key={badge.id} className="bg-gray-50 rounded-xl p-4 text-center border-2 border-gray-300">
                    <div className="text-5xl mb-2">{badge.icon}</div>
                    <div className="text-xs font-semibold text-gray-700">{badge.name}</div>
                  </div>
                ))}
              </div>
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