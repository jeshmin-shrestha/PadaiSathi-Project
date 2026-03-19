import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Flame,
  BarChart3,
  FileText,
  FileCheck,
  Layers,
  HelpCircle,
  Video,
  Award,
  Trophy,
  Users,
  Globe,
  Crown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Lock,
  Medal,
  Star,
  Zap,
  TrendingUp,
  Sparkles,
  Target,
  Activity,
  UserPlus,
} from 'lucide-react';
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
  
  // User data
  const [username, setUsername] = useState('');
  const [myEmail, setMyEmail] = useState('');
  const [userAvatar, setUserAvatar] = useState('avatar1');
  const [customImg, setCustomImg] = useState(null);
  
  // Stats
  const [userStats, setUserStats] = useState({
    points: 0, streak: 0, documents: 0, summaries: 0,
    notebooks: 0, flashcards: 0, quizzes: 0, videos: 0,
  });
  
  // Leaderboard
  const [leaderboard, setLeaderboard] = useState([]);
  const [yourRank, setYourRank] = useState(null);
  const [friendsOnly, setFriendsOnly] = useState(false);
  const [leaderLoading, setLeaderLoading] = useState(true);
  
  // Badges
  const [badges, setBadges] = useState([]);
  const [earnedCount, setEarnedCount] = useState(0);
  const [showAllBadges, setShowAllBadges] = useState(false);
  
  // Weekly Report
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [monthOffset, setMonthOffset] = useState(0);
  const [reportLoading, setReportLoading] = useState(true);
  
  // Loading states
  const [initialLoad, setInitialLoad] = useState(true);

  // Fetch functions (unchanged)
  const fetchLeaderboard = useCallback(async (email, fo) => {
    if (!email) return;
    setLeaderLoading(true);
    try {
      const res = await fetch(
        `http://localhost:8000/api/leaderboard?email=${email}&friends_only=${fo}`
      );
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
      setYourRank(data.your_rank);
    } catch (err) {
      console.error('Leaderboard error:', err);
    } finally {
      setLeaderLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async (email) => {
    if (!email) return;
    try {
      const res = await fetch(`http://localhost:8000/api/my-stats?email=${email}`);
      const data = await res.json();
      setUserStats(prev => ({
        ...prev,
        documents: data.documents || 0,
        summaries: data.summaries || 0,
        notebooks: data.notebooks || 0,
        flashcards: data.flashcards || 0,
        quizzes: data.quizzes || 0,
        videos: data.videos || 0,
      }));
    } catch (err) {
      console.error('Stats error:', err);
    }
  }, []);

  const fetchBadges = useCallback(async (email) => {
    if (!email) return;
    try {
      const res = await fetch(`http://localhost:8000/api/my-badges?email=${email}`);
      const data = await res.json();
      console.log('Badges API response:', data);
      setBadges(data.badges || []);
      setEarnedCount(data.earned_count || 0);
    } catch (err) {
      console.error('Badges error:', err);
    }
  }, []);

  const fetchWeeklyReport = useCallback(async (email, offset = 0) => {
    if (!email) return;
    setReportLoading(true);
    try {
      const res = await fetch(
        `http://localhost:8000/api/my-activity-summary?email=${email}&week_offset=${offset}`
      );
      const data = await res.json();
      setWeeklyReport(data);
    } catch (err) {
      console.error('Activity summary error:', err);
    } finally {
      setReportLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) {
      window.location.href = '/login';
      return;
    }

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

    Promise.all([
      fetchLeaderboard(storedUser.email, false),
      fetchStats(storedUser.email),
      fetchBadges(storedUser.email),
      fetchWeeklyReport(storedUser.email),
    ]).finally(() => {
      setInitialLoad(false);
    });
  }, []);

  useEffect(() => {
    if (!myEmail || initialLoad) return;
    fetchLeaderboard(myEmail, friendsOnly);
  }, [friendsOnly, myEmail, fetchLeaderboard, initialLoad]);

  useEffect(() => {
    if (!myEmail || initialLoad) return;
    fetchWeeklyReport(myEmail, monthOffset);
  }, [monthOffset, myEmail, fetchWeeklyReport, initialLoad]);

  const resolveAvatar = useCallback((entry) => {
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
  }, [customImg]);

  const top3 = leaderboard.slice(0, 3);
  const podiumOrder = [top3[1], top3[0], top3[2]];

  const PodiumAvatar = ({ entry, size = 'md' }) => {
    if (!entry) return null;
    const { img, bg } = resolveAvatar(entry);
    const sizeClass = size === 'lg' ? 'w-24 h-24' : 'w-20 h-20';
    const borderColor = entry.is_you ? 'border-[#6a88be]' : 'border-white';
    return (
      <div className={`${sizeClass} rounded-full bg-gradient-to-br ${bg} overflow-hidden border-4 ${borderColor} shadow-lg flex-shrink-0`}>
        {img ? (
          <img src={img} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-2xl">👤</div>
        )}
      </div>
    );
  };

  const RowAvatar = ({ entry }) => {
    if (!entry) return null;
    const { img, bg } = resolveAvatar(entry);
    const borderColor = entry.is_you ? 'border-[#6a88be]' : 'border-gray-300';
    return (
      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${bg} overflow-hidden flex-shrink-0 border-2 ${borderColor}`}>
        {img ? (
          <img src={img} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-sm">👤</div>
        )}
      </div>
    );
  };

  const myEntry = useMemo(() => ({
    avatar: userAvatar,
    is_you: true,
  }), [userAvatar]);

  // Helper to generate shades of #6a88be based on intensity
  const getHeatmapColor = (actions, max) => {
    if (actions === 0) return '#e5e7eb'; // gray for no activity
    const intensity = actions / max;
    // Use opacity or lightness variations of #6a88be
    if (intensity <= 0.2) return '#d4e0f5'; // very light
    if (intensity <= 0.4) return '#b2c7e8'; // light
    if (intensity <= 0.6) return '#8fa6d4'; // medium-light
    if (intensity <= 0.8) return '#6a88be'; // base
    return '#3a5a8c'; // dark
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      {/* Main container – reduced width and padding for better balance */}
      <div className="max-w-7xl mx-auto px-6 py-6 lg:px-8">

        {/* Welcome Section – with chicken sticking out bottom-left and bouncing */}
        <div className="relative bg-gray-300 rounded-3xl shadow-lg p-8 mb-10 overflow-visible">
          {/* Chicken image – absolutely positioned, partially outside, with bounce animation */}
          <img
            src={ChickenImage}
            alt="Chicken mascot"
            className="absolute -bottom-8 -left-2 w-60 h-60 sm:w-58 sm:h-58 lg:w-56 lg:h-56 object-contain -translate-x-[10%] translate-y-[0%] animate-bounce"
            style={{ animationDuration: '2s' }}
          />

          {/* Text + progress bar – padded to avoid overlap */}
          <div className="md:pl-48 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Hello {username}!
            </h1>
            <p className="text-gray-700 text-lg mb-6">
              Ready to continue your learning journey?
            </p>

            {/* Progress bar */}
            <div className="max-w-md mx-auto md:mx-0 bg-gray-200 rounded-2xl p-5 border border-gray-300 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center justify-center md:justify-start">
                <Target className="w-5 h-5 mr-2 text-[#6a88be]" />
                Keep learning to earn more points!
              </h3>

              <div className="flex items-center space-x-4">
                <div className="flex-1 bg-gray-300 rounded-full h-3.5 overflow-hidden shadow-inner">
                  <div
                    className="bg-gradient-to-r from-[#6a88be] to-[#9fc383] h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min((userStats.points / 500) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-base font-bold text-gray-800 whitespace-nowrap">
                  {userStats.points} pts
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Left Column */}
          <div className="space-y-6">

            {/* Streak */}
            <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
              <Flame className="w-16 h-16 mx-auto mb-4 text-orange-500" strokeWidth={1.5} />
              <p className="text-xl text-gray-700">
                You're on a <span className="text-6xl font-bold text-[#6a88be] mx-2">{userStats.streak}</span> day streak!
              </p>
            </div>

            {/* Quick Statistics */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <BarChart3 className="w-6 h-6 text-gray-700" />
                <h3 className="text-xl font-bold text-gray-900">Quick Statistics</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: FileText,   count: userStats.documents,  label: 'Documents' },
                  { icon: FileCheck,  count: userStats.summaries,  label: 'Summaries' },
                  { icon: Layers,     count: userStats.flashcards, label: 'Flashcards' },
                  { icon: HelpCircle, count: userStats.quizzes,    label: 'Quizzes' },
                  { icon: Video,      count: userStats.videos,     label: 'Videos' },
                ].map(({ icon: Icon, count, label }) => (
                  <div key={label} className="bg-white rounded-2xl shadow-lg p-6 text-center">
                    <Icon className="w-10 h-10 mx-auto mb-2 text-[#6a88be]" strokeWidth={1.5} />
                    <div className="text-4xl font-bold text-gray-900 mb-1">{count}</div>
                    <div className="text-sm text-gray-600">{label}</div>
                  </div>
                ))}
                <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
                  <BookOpen className="w-10 h-10 mx-auto mb-2 text-[#9fc383]" strokeWidth={1.5} />
                  <div className="text-4xl font-bold text-gray-900 mb-1">{userStats.notebooks}</div>
                  <div className="text-sm text-gray-600">Notebooks</div>
                </div>
              </div>
            </div>

            {/* Monthly activity heatmap */}
            {weeklyReport?.daily_activity && (
              <div className="bg-white rounded-3xl shadow-lg p-6">

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-gray-700" />
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 leading-tight">
                        Activity Heatmap
                      </h3>
                      {weeklyReport.date_range && (
                        <p className="text-xs text-gray-500">
                          {new Date(weeklyReport.date_range.start + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          {' – '}
                          {new Date(weeklyReport.date_range.end + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setMonthOffset(prev => prev - 1)}
                      className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition"
                      title="Previous 30 days"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setMonthOffset(prev => Math.min(prev + 1, 0))}
                      disabled={monthOffset === 0}
                      className={`w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center transition ${
                        monthOffset === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-300'
                      }`}
                      title="Next 30 days"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    {monthOffset < 0 && (
                      <button
                        onClick={() => setMonthOffset(0)}
                        className="text-xs font-semibold text-[#6a88be] hover:underline ml-1"
                      >
                        Today
                      </button>
                    )}
                  </div>
                </div>

                {reportLoading ? (
                  <div className="text-center py-8 text-gray-400 text-sm animate-pulse">Loading…</div>
                ) : (() => {
                  const data = weeklyReport.daily_activity;
                  const max = Math.max(...data.map(d => d.actions), 1);

                  const firstDayOfWeek = new Date(data[0].date + 'T00:00:00').getDay();
                  const padded = [...Array(firstDayOfWeek).fill(null), ...data];
                  const weeks = [];
                  for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7));

                  return (
                    <div>
                      <div className="flex gap-1 mb-1">
                        {['S','M','T','W','T','F','S'].map((d, i) => (
                          <div key={i} className="w-7 text-center text-xs text-gray-500">{d}</div>
                        ))}
                      </div>
                      <div className="space-y-1">
                        {weeks.map((week, wi) => (
                          <div key={wi} className="flex gap-1">
                            {week.map((day, di) => (
                              <div
                                key={di}
                                title={day ? `${day.date}: ${day.actions} action${day.actions !== 1 ? 's' : ''}` : ''}
                                className="w-7 h-7 rounded transition-colors hover:ring-2 hover:ring-[#6a88be]"
                                style={{ background: day ? getHeatmapColor(day.actions, max) : 'transparent' }}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-1 mt-3 justify-end">
                        <span className="text-xs text-gray-500 mr-1">Less</span>
                        {['#e5e7eb', '#d4e0f5', '#b2c7e8', '#8fa6d4', '#6a88be', '#3a5a8c'].map(c => (
                          <div key={c} className="w-4 h-4 rounded-sm" style={{ background: c }} />
                        ))}
                        <span className="text-xs text-gray-500 ml-1">More</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Period summary – now with light blue-grey background */}
                {!reportLoading && (
                  <div className="bg-[#f0f4f8] rounded-xl p-4 border border-[#c9d9f0] mt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">
                          {weeklyReport.is_current ? 'This Month' : 'This Period'}
                        </p>
                        <p className="text-2xl font-bold text-[#6a88be]">
                          {weeklyReport.month_summary?.total_actions ?? weeklyReport.week_summary.total_actions} actions
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {weeklyReport.month_summary?.active_days ?? weeklyReport.week_summary.active_days}/30 days active
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">This week</p>
                        <p className="text-lg font-bold text-[#a5b2ab]">
                          {weeklyReport.week_summary.total_actions} actions
                        </p>
                        <div className="mt-1">
                          {weeklyReport.week_summary.active_days >= 5 ? (
                            <Flame className="w-6 h-6 text-orange-500" />
                          ) : weeklyReport.week_summary.active_days >= 3 ? (
                            <Zap className="w-6 h-6 text-yellow-500" />
                          ) : (
                            <BookOpen className="w-6 h-6 text-[#9fc383]" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recommendations – now with light blue-grey background */}
                {!reportLoading && weeklyReport.is_current && weeklyReport.recommendations?.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {weeklyReport.recommendations.map((rec, i) => (
                      <div key={i} className="flex gap-2 items-start bg-[#f0f4f8] rounded-lg p-3">
                        {rec.icon === '📚' && <BookOpen className="w-5 h-5 text-[#6a88be] flex-shrink-0" />}
                        {rec.icon === '🔥' && <Flame className="w-5 h-5 text-orange-500 flex-shrink-0" />}
                        {rec.icon === '💪' && <Zap className="w-5 h-5 text-yellow-500 flex-shrink-0" />}
                        <div>
                          <p className="text-sm font-bold text-gray-800">{rec.title}</p>
                          <p className="text-xs text-gray-600">{rec.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Leaderboard */}
            <div className="bg-white rounded-3xl shadow-lg p-8">

              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <Trophy className="w-6 h-6 mr-2 text-yellow-500" />
                  Leaderboard
                </h3>

                <div className="flex items-center bg-gray-100 rounded-full p-1">
                  <button
                    onClick={() => setFriendsOnly(false)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition ${
                      !friendsOnly ? 'bg-[#6a88be] text-white' : 'text-gray-600'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    Global
                  </button>
                  <button
                    onClick={() => setFriendsOnly(true)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition ${
                      friendsOnly ? 'bg-[#6a88be] text-white' : 'text-gray-600'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Friends
                  </button>
                </div>
              </div>

              {leaderLoading ? (
                <div className="text-center py-10 text-gray-400 font-semibold animate-pulse">
                  Loading…
                </div>
              ) : (
                <>
                  {friendsOnly && leaderboard.length <= 1 && (
                    <div className="text-center py-8 mb-4">
                      <UserPlus className="w-16 h-16 mx-auto text-gray-400 mb-3" />
                      <p className="font-bold text-gray-700">No friends yet!</p>
                      <p className="text-sm text-gray-500 mb-3">Add friends to see the friends leaderboard.</p>
                      <button
                        onClick={() => navigate('/friends')}
                        className="bg-[#6a88be] text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-[#5578a5] transition"
                      >
                        + Find Friends
                      </button>
                    </div>
                  )}

                  {/* Podium */}
                  {leaderboard.length > 0 && (
                    <div className="flex items-end justify-center space-x-4 mb-6">
                      {podiumOrder[0] && (
                        <div className="text-center">
                          <div className="mb-2 flex justify-center">
                            <PodiumAvatar entry={podiumOrder[0]} />
                          </div>
                          <p className="text-xs font-bold text-gray-700 w-24 truncate mx-auto">
                            {podiumOrder[0].is_you ? 'You' : podiumOrder[0].username}
                          </p>
                          <p className="text-xs text-gray-500">{podiumOrder[0].points} pts</p>
                          <div className="w-24 h-20 bg-gray-300 rounded-t-xl flex items-center justify-center font-bold text-2xl mt-1 text-gray-700">2</div>
                        </div>
                      )}
                      {podiumOrder[1] && (
                        <div className="text-center">
                          <Crown className="w-8 h-8 mx-auto text-yellow-500 mb-1" />
                          <div className="mb-2 flex justify-center">
                            <PodiumAvatar entry={podiumOrder[1]} size="lg" />
                          </div>
                          <p className="text-xs font-bold text-gray-700 w-28 truncate mx-auto">
                            {podiumOrder[1].is_you ? 'You' : podiumOrder[1].username}
                          </p>
                          <p className="text-xs text-gray-500">{podiumOrder[1].points} pts</p>
                          <div className="w-28 h-32 bg-yellow-400 rounded-t-xl flex items-center justify-center font-bold text-3xl mt-1 text-gray-800">1</div>
                        </div>
                      )}
                      {podiumOrder[2] && (
                        <div className="text-center">
                          <div className="mb-2 flex justify-center">
                            <PodiumAvatar entry={podiumOrder[2]} />
                          </div>
                          <p className="text-xs font-bold text-gray-700 w-24 truncate mx-auto">
                            {podiumOrder[2].is_you ? 'You' : podiumOrder[2].username}
                          </p>
                          <p className="text-xs text-gray-500">{podiumOrder[2].points} pts</p>
                          <div className="w-24 h-16 bg-orange-300 rounded-t-xl flex items-center justify-center font-bold text-2xl mt-1 text-gray-700">3</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Full list */}
                  <div className="space-y-3">
                    {leaderboard.slice(0, 10).map((entry) => (
                      <div key={entry.rank} className={`flex items-center space-x-3 p-3 rounded-xl ${
                        entry.is_you ? 'bg-[#f0f4f8] border border-[#c9d9f0]' : 'bg-white border border-gray-200'
                      }`}>
                        <span className="font-bold text-lg w-8 text-gray-600">{entry.rank}.</span>
                        <RowAvatar entry={entry} />
                        <span className="font-semibold text-gray-900 flex-1 truncate">{entry.username}</span>
                        <span className="font-bold text-[#6a88be]">{entry.points} pts</span>
                        {entry.is_you && (
                          <span className="text-xs bg-[#6a88be] text-white px-2 py-1 rounded-full">You</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Your position if outside top 10 */}
                  {yourRank > 10 && (
                    <div className="mt-3 p-3 bg-[#f0f4f8] border border-[#c9d9f0] rounded-xl flex items-center space-x-3">
                      <span className="font-bold text-lg w-8 text-gray-600">{yourRank}.</span>
                      <RowAvatar entry={myEntry} />
                      <span className="font-semibold text-gray-900 flex-1">{username}</span>
                      <span className="text-xs bg-[#6a88be] text-white px-2 py-1 rounded-full">Your Position</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Badges */}
            <div className="bg-white rounded-3xl shadow-lg p-8">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Award className="w-6 h-6 text-yellow-600" />
                  <h3 className="text-xl font-bold text-gray-900">Your Badges</h3>
                </div>
                <span className="bg-[#6a88be] text-white text-xs font-bold px-3 py-1 rounded-full">
                  {earnedCount} / {badges.length}
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-3 mb-6 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#6a88be] to-[#9fc383] h-full rounded-full transition-all duration-700"
                  style={{ width: badges.length ? `${(earnedCount / badges.length) * 100}%` : '0%' }}
                />
              </div>

              {earnedCount === 0 ? (
                <div className="text-center py-8">
                  <Lock className="w-16 h-16 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500 font-medium">No badges earned yet!</p>
                  <p className="text-gray-400 text-sm mt-1">Start learning to unlock your first badge.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {badges.filter(b => b.earned).map((badge) => (
                    <div
                      key={badge.id}
                      title={`Earned: ${new Date(badge.earned_at).toLocaleDateString()}`}
                      className="rounded-2xl p-4 border border-gray-200 bg-white text-center shadow-sm"
                    >
                      <img src={`/badges/${badge.id}.png`} alt={badge.name} className="w-20 h-20 object-contain mx-auto mb-2" />
                      <div className="text-xs font-bold text-gray-900 leading-tight">{badge.name}</div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowAllBadges(prev => !prev)}
                className="w-full py-2 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                {showAllBadges ? '▲ Hide locked badges' : `▼ See all badges (${badges.length - earnedCount} locked)`}
              </button>

              {showAllBadges && (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {badges.filter(b => !b.earned).map((badge) => (
                    <div
                      key={badge.id}
                      title={badge.description}
                      className="rounded-2xl p-4 border border-gray-200 bg-gray-50 text-center opacity-60"
                    >
                      <img src={`/badges/${badge.id}.png`} alt={badge.name} className="w-14 h-14 object-contain mx-auto mb-2 grayscale" />
                      <div className="text-xs font-bold text-gray-500 leading-tight">{badge.name}</div>
                      <div className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
                        <Lock className="w-3 h-3" /> {badge.description}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center py-6 text-gray-500 text-sm mt-8 border-t border-gray-200">
        © PadaiSathi. All rights reserved.
      </footer>
    </div>
  );
};

export default StudentDashboard;