import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, RadialBarChart, RadialBar, Legend
} from 'recharts';
import {
  Users, FileText, Video, BookOpen, Trash2,
  Search, RefreshCw, Zap, MessageSquare, Award, TrendingUp, Clock, Database
} from 'lucide-react';
import AdminIcon from '../assets/images/adminicon.png';

const API = 'http://127.0.0.1:8000';

const PALETTE = {
  indigo:  '#6366f1',
  emerald: '#10b981',
  amber:   '#f59e0b',
  rose:    '#f43f5e',
  sky:     '#0ea5e9',
  violet:  '#8b5cf6',
  lime:    '#84cc16',
};
const PIE_COLORS = Object.values(PALETTE);

// ── Reusable stat card ────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, sub, trend }) => (
  <div className="bg-white rounded-2xl border-2 border-black p-5 flex flex-col justify-between h-full min-h-[110px]">
    <div className="flex items-start justify-between mb-2">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      {trend !== undefined && (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div>
      <p className="text-2xl font-black text-gray-900 leading-none">{value ?? '—'}</p>
      <p className="text-xs font-semibold text-gray-500 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ── Custom tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border-2 border-black rounded-xl px-3 py-2 shadow-lg text-xs font-bold">
      <p className="text-gray-500 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const AdminDashboard = ({ user, setIsAuthenticated }) => {
  const navigate = useNavigate();

  const [health,      setHealth]      = useState(null);
  const [users,       setUsers]       = useState([]);
  const [stats,       setStats]       = useState(null);
  const [weekly,      setWeekly]      = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [deletingId,  setDeletingId]  = useState(null);
  const [activeTab,   setActiveTab]   = useState('overview');
  const [refreshing,  setRefreshing]  = useState(false);
  const [weeklyMetric, setWeeklyMetric] = useState('total_actions'); // which line to highlight

  const fetchAll = async () => {
    setRefreshing(true);
    try {
      const [healthRes, usersRes, statsRes, weeklyRes] = await Promise.all([
        fetch(`${API}/api/health`),
        fetch(`${API}/api/users`),
        fetch(`${API}/api/admin/stats`),
        fetch(`${API}/api/admin/weekly-activity`),
      ]);
      setHealth(await healthRes.json());
      const ud = await usersRes.json();
      setUsers(ud.users || []);
      setStats(await statsRes.json());
      setWeekly(await weeklyRes.json());
    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleDelete = async (userId, username) => {
    if (!window.confirm(`Permanently delete "${username}"? This cannot be undone.`)) return;
    setDeletingId(userId);
    try {
      await fetch(`${API}/api/users/${userId}`, { method: 'DELETE' });
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch {
      alert('Add DELETE /api/users/:id to your backend first.');
    } finally {
      setDeletingId(null);
    }
  };

  // Only show students in the user table
  const students = users.filter(u => u.role !== 'admin');
  const filtered = students.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const studentCount = students.length;
  const adminCount   = users.filter(u => u.role === 'admin').length;

  // Chart data derived from stats
  const contentBarData = stats ? [
    { name: 'Docs',       count: stats.content.documents,  fill: PALETTE.indigo  },
    { name: 'Summaries',  count: stats.content.summaries,  fill: PALETTE.emerald },
    { name: 'Flashcards', count: stats.content.flashcards, fill: PALETTE.amber   },
    { name: 'Quizzes',    count: stats.content.quizzes,    fill: PALETTE.rose    },
    { name: 'Videos',     count: stats.content.videos,     fill: PALETTE.sky     },
    { name: 'Notebooks',  count: stats.content.notebooks,  fill: PALETTE.violet  },
  ] : [];

  const avgPerUserData = stats ? [
    { name: 'Docs/user',       value: stats.avg_per_user.documents  },
    { name: 'Summaries/user',  value: stats.avg_per_user.summaries  },
    { name: 'Flashcards/user', value: stats.avg_per_user.flashcards },
    { name: 'Quizzes/user',    value: stats.avg_per_user.quizzes    },
  ] : [];

  const TABS = [
    { id: 'overview',  label: '📊 Overview'   },
    { id: 'analytics', label: '📈 Analytics'  },
    { id: 'users',     label: '👥 Students'   },
    { id: 'reports',   label: '📋 Reports'    },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-200">
      <AdminNavbar user={user} setIsAuthenticated={setIsAuthenticated} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* ── HEADER ── */}
        <div className="bg-gray-300 rounded-3xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <img src={AdminIcon} alt="Admin" className="w-28 h-28 object-contain flex-shrink-0" />
            <div className="flex-1">
              <h1 className="text-3xl font-black text-gray-900 mb-1">Admin Dashboard</h1>
              <p className="text-gray-600">
                Welcome back, <span className="font-bold text-gray-900">{user?.username}</span>
                {health && <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-bold">● Live</span>}
              </p>
              {stats && (
                <div className="flex flex-wrap gap-4 mt-3 text-sm">
                  <span className="text-gray-700">👩‍🎓 <b>{stats.student_count}</b> students</span>
                  <span className="text-gray-700">⭐ <b>{stats.total_points.toLocaleString()}</b> total pts</span>
                  <span className="text-gray-700">📊 <b>{stats.avg_points}</b> avg pts/student</span>
                  <span className="text-gray-700">🔥 <b>{stats.avg_streak}</b> avg streak days</span>
                </div>
              )}
            </div>
            <button
              onClick={fetchAll}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-white border-2 border-black rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 flex-shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-2xl font-bold transition text-sm ${
                activeTab === tab.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border-2 border-black text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-40">
            <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>

            {/* ══════════════════════════════════════════════════════════════
                OVERVIEW TAB
            ══════════════════════════════════════════════════════════════ */}
            {activeTab === 'overview' && (
              <div className="space-y-6">

                {/* Top KPI cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={Users}    label="Total Students"  value={studentCount}               color="bg-indigo-500"  sub={`+ ${adminCount} admin(s)`} />
                  <StatCard icon={FileText} label="Documents"       value={stats?.content.documents}   color="bg-emerald-500" sub={`${stats?.avg_per_user.documents} avg/student`} />
                  <StatCard icon={BookOpen} label="Summaries"       value={stats?.content.summaries}   color="bg-amber-500"   sub={`${stats?.avg_per_user.summaries} avg/student`} />
                  <StatCard icon={Video}    label="Videos"          value={stats?.content.videos}      color="bg-rose-500" />
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={Zap}          label="Flashcards"    value={stats?.content.flashcards} color="bg-violet-500" sub={`${stats?.avg_per_user.flashcards} avg/student`} />
                  <StatCard icon={MessageSquare} label="Quizzes"       value={stats?.content.quizzes}    color="bg-sky-500"    sub={`${stats?.avg_per_user.quizzes} avg/student`} />
                  <StatCard icon={BookOpen}      label="Notebooks"     value={stats?.content.notebooks}  color="bg-lime-600" />
                  <StatCard icon={Award}         label="Total Points"  value={stats?.total_points?.toLocaleString()} color="bg-amber-600" sub={`${stats?.avg_points} avg`} />
                </div>

                {/* Content breakdown bar chart */}
                <div className="bg-white rounded-3xl border-2 border-black p-6">
                  <h2 className="text-lg font-black text-gray-900 mb-1">Content Created — All Time</h2>
                  <p className="text-xs text-gray-400 mb-4">Total items generated across the platform</p>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={contentBarData} barSize={38}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {contentBarData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* System health */}
                <div className="bg-white rounded-3xl border-2 border-black p-6">
                  <h2 className="text-lg font-black text-gray-900 mb-4">⚡ System Health</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'API',      status: health ? '✅ Online'    : '❌ Down',   ok: !!health },
                      { label: 'Database', status: health ? '✅ Connected' : '❌ Error',  ok: !!health },
                      { label: 'Storage',  status: '✅ Available',                        ok: true     },
                      { label: 'Last Sync',status: new Date().toLocaleTimeString(),        ok: true     },
                    ].map(({ label, status, ok }) => (
                      <div key={label} className={`p-3 rounded-xl border-2 ${ok ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                        <p className="text-xs font-bold text-gray-500 mb-1">{label}</p>
                        <p className="text-sm font-black text-gray-800">{status}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}


            {/* ══════════════════════════════════════════════════════════════
                ANALYTICS TAB
            ══════════════════════════════════════════════════════════════ */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">

                {/* ── WEEKLY ACTIVITY SUMMARY CARDS ── */}
                {weekly && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Actions This Week',    value: weekly.totals.total_actions,   icon: '⚡', color: 'bg-indigo-500' },
                      { label: 'Avg Active/Day',        value: weekly.totals.avg_daily_active, icon: '👩‍🎓', color: 'bg-emerald-500' },
                      { label: 'Summaries This Week',   value: weekly.totals.summaries,        icon: '📝', color: 'bg-amber-500'   },
                      { label: 'Peak Day',              value: weekly.totals.peak_day,         icon: '📈', color: 'bg-rose-500'    },
                    ].map(({ label, value, icon, color }) => (
                      <div key={label} className="bg-white rounded-2xl border-2 border-black p-4 flex flex-col gap-2">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${color}`}>{icon}</div>
                        <p className="text-2xl font-black text-gray-900 leading-none">{value ?? '—'}</p>
                        <p className="text-xs font-semibold text-gray-500">{label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── WEEKLY TOTAL ACTIONS AREA CHART ── */}
                <div className="bg-white rounded-3xl border-2 border-black p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <h2 className="text-lg font-black text-gray-900">📅 Weekly Student Activity</h2>
                      <p className="text-xs text-gray-400 mt-0.5">All actions taken by students over the past 7 days</p>
                    </div>
                    {/* Metric toggle pills */}
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: 'total_actions', label: 'All Actions',  color: '#6366f1' },
                        { key: 'active_students', label: 'Active Students', color: '#10b981' },
                        { key: 'summaries',    label: 'Summaries',    color: '#f59e0b' },
                        { key: 'flashcards',   label: 'Flashcards',   color: '#8b5cf6' },
                      ].map(m => (
                        <button
                          key={m.key}
                          onClick={() => setWeeklyMetric(m.key)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition border-2 ${
                            weeklyMetric === m.key
                              ? 'border-black text-white'
                              : 'border-gray-200 text-gray-500 bg-white hover:border-gray-400'
                          }`}
                          style={weeklyMetric === m.key ? { backgroundColor: m.color, borderColor: m.color } : {}}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={weekly?.days || []}>
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="day" tick={{ fontSize: 12, fontWeight: 700 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey={weeklyMetric}
                        name={weeklyMetric.replace('_', ' ')}
                        stroke="#6366f1"
                        strokeWidth={3}
                        fill="url(#areaGrad)"
                        dot={{ r: 5, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 7 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* ── MULTI-LINE BREAKDOWN ── */}
                <div className="bg-white rounded-3xl border-2 border-black p-6">
                  <h2 className="text-lg font-black text-gray-900 mb-1">📊 Activity Breakdown by Type</h2>
                  <p className="text-xs text-gray-400 mb-4">Compare documents, summaries, flashcards, quizzes and videos side-by-side</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={weekly?.days || []} barSize={10}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="day" tick={{ fontSize: 12, fontWeight: 700 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
                      <Bar dataKey="documents"  name="Docs"       fill={PALETTE.indigo}  radius={[3,3,0,0]} />
                      <Bar dataKey="summaries"  name="Summaries"  fill={PALETTE.emerald} radius={[3,3,0,0]} />
                      <Bar dataKey="flashcards" name="Flashcards" fill={PALETTE.amber}   radius={[3,3,0,0]} />
                      <Bar dataKey="quizzes"    name="Quizzes"    fill={PALETTE.rose}    radius={[3,3,0,0]} />
                      <Bar dataKey="videos"     name="Videos"     fill={PALETTE.sky}     radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">

                  {/* Points distribution */}
                  <div className="bg-white rounded-3xl border-2 border-black p-6">
                    <h2 className="text-lg font-black text-gray-900 mb-1">Points Distribution</h2>
                    <p className="text-xs text-gray-400 mb-4">How many students fall in each range</p>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={stats?.points_dist} barSize={36}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="range" tick={{ fontSize: 11, fontWeight: 600 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" name="Students" fill={PALETTE.indigo} radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Avg content per student */}
                  <div className="bg-white rounded-3xl border-2 border-black p-6">
                    <h2 className="text-lg font-black text-gray-900 mb-1">Avg Content per Student</h2>
                    <p className="text-xs text-gray-400 mb-4">How engaged is the average student?</p>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={avgPerUserData} layout="vertical" barSize={22}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} width={100} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" name="Avg" fill={PALETTE.emerald} radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                </div>

                {/* Top 10 students leaderboard */}
                <div className="bg-white rounded-3xl border-2 border-black p-6">
                  <h2 className="text-lg font-black text-gray-900 mb-1">🏆 Top 10 Students by Points</h2>
                  <p className="text-xs text-gray-400 mb-4">The highest performing students on the platform</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={stats?.top_users?.map(u => ({ name: u.name, points: u.points }))} barSize={30}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="points" name="Points" fill={PALETTE.amber} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Streak analysis */}
                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-3xl border-2 border-black p-6 lg:col-span-2">
                    <h2 className="text-lg font-black text-gray-900 mb-1">🔥 Top Streakers</h2>
                    <p className="text-xs text-gray-400 mb-4">Students with the longest consecutive learning streaks</p>
                    <div className="space-y-3">
                      {[...students]
                        .sort((a, b) => (b.streak || 0) - (a.streak || 0))
                        .slice(0, 6)
                        .map((u, i) => (
                          <div key={u.id} className="flex items-center gap-3">
                            <span className="w-6 text-sm font-black text-gray-400">{i + 1}</span>
                            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                              {u.username.charAt(0).toUpperCase()}
                            </div>
                            <span className="flex-1 font-semibold text-gray-800 text-sm truncate">{u.username}</span>
                            <div className="flex items-center gap-1">
                              <div
                                className="h-2 bg-orange-400 rounded-full"
                                style={{ width: `${Math.min((u.streak || 0) * 3, 120)}px` }}
                              />
                              <span className="text-xs font-black text-orange-500 w-16 text-right">🔥 {u.streak}d</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border-2 border-black p-6">
                    <h2 className="text-lg font-black text-gray-900 mb-4">📊 Key Averages</h2>
                    <div className="space-y-4">
                      {[
                        { label: 'Avg Points',      value: stats?.avg_points,      icon: '⭐', color: 'text-amber-600' },
                        { label: 'Avg Streak (days)',value: stats?.avg_streak,      icon: '🔥', color: 'text-orange-500' },
                        { label: 'Docs per Student', value: stats?.avg_per_user.documents,  icon: '📄', color: 'text-indigo-600' },
                        { label: 'Quizzes per Student', value: stats?.avg_per_user.quizzes, icon: '❓', color: 'text-sky-600' },
                      ].map(({ label, value, icon, color }) => (
                        <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                          <span className="text-xs text-gray-500 font-medium">{icon} {label}</span>
                          <span className={`text-lg font-black ${color}`}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}


            {/* ══════════════════════════════════════════════════════════════
                STUDENTS TAB  (no Promote button — only Delete)
            ══════════════════════════════════════════════════════════════ */}
            {activeTab === 'users' && (
              <div className="space-y-4">

                <div className="flex flex-wrap gap-3 items-center">
                  <span className="px-3 py-1.5 bg-gray-800 text-white text-xs font-black rounded-full">{studentCount} Students</span>
                  <span className="px-3 py-1.5 bg-gray-200 border border-gray-400 text-gray-700 text-xs font-black rounded-full">{adminCount} Admins (hidden from platform)</span>
                </div>

                <div className="bg-white rounded-2xl border-2 border-black px-4 py-3 flex items-center space-x-3">
                  <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search by username or email…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 outline-none text-gray-800 text-sm bg-transparent"
                  />
                  <span className="text-xs text-gray-400 whitespace-nowrap">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="bg-white rounded-3xl border-2 border-black overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="bg-gray-100 border-b-2 border-black">
                        {['Student', 'Email', 'Points', 'Streak', 'Action'].map((h, i) => (
                          <th key={h} className={`px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider ${i === 4 ? 'text-right' : 'text-left'}`}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((u, i) => (
                        <tr key={u.id} className={`border-b border-gray-100 hover:bg-gray-50 transition ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-black flex-shrink-0">
                                {u.username.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-bold text-gray-900 truncate">{u.username}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-[200px]">{u.email}</td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-black text-purple-600">⭐ {u.points}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-black text-orange-500">🔥 {u.streak}d</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDelete(u.id, u.username)}
                              disabled={deletingId === u.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition border border-red-200 disabled:opacity-40 ml-auto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{deletingId === u.id ? 'Deleting…' : 'Delete'}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-16 text-center text-gray-400 text-sm">
                            No students found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}


            {/* ══════════════════════════════════════════════════════════════
                REPORTS TAB
            ══════════════════════════════════════════════════════════════ */}
            {activeTab === 'reports' && (
              <div className="space-y-6">

                {/* Weekly Activity Report */}
                {weekly && (
                  <div className="bg-white rounded-3xl border-2 border-black p-6">
                    <h2 className="text-lg font-black text-gray-900 mb-1">📅 This Week's Activity Report</h2>
                    <p className="text-xs text-gray-400 mb-4">Day-by-day student engagement for the past 7 days</p>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[600px]">
                        <thead>
                          <tr className="border-b-2 border-black">
                            {['Day', 'Date', 'Active Students', 'Docs', 'Summaries', 'Flashcards', 'Quizzes', 'Videos', 'Total'].map((h, i) => (
                              <th key={h} className={`pb-3 text-xs font-black text-gray-500 uppercase tracking-wider ${i === 0 ? 'text-left' : 'text-center'}`}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {weekly.days.map((d, i) => (
                            <tr key={d.date} className={`border-b border-gray-100 last:border-0 ${d.total_actions === Math.max(...weekly.days.map(x => x.total_actions)) && d.total_actions > 0 ? 'bg-indigo-50' : ''}`}>
                              <td className="py-2.5 font-black text-gray-800">{d.day}</td>
                              <td className="py-2.5 text-center text-xs text-gray-400">{d.date.slice(5)}</td>
                              <td className="py-2.5 text-center font-bold text-emerald-600">{d.active_students}</td>
                              <td className="py-2.5 text-center text-sm font-semibold text-gray-700">{d.documents}</td>
                              <td className="py-2.5 text-center text-sm font-semibold text-gray-700">{d.summaries}</td>
                              <td className="py-2.5 text-center text-sm font-semibold text-gray-700">{d.flashcards}</td>
                              <td className="py-2.5 text-center text-sm font-semibold text-gray-700">{d.quizzes}</td>
                              <td className="py-2.5 text-center text-sm font-semibold text-gray-700">{d.videos}</td>
                              <td className="py-2.5 text-center font-black text-indigo-600">{d.total_actions}</td>
                            </tr>
                          ))}
                          {/* Totals row */}
                          <tr className="border-t-2 border-black bg-gray-50">
                            <td className="py-2.5 font-black text-gray-900" colSpan={2}>📊 Week Total</td>
                            <td className="py-2.5 text-center font-black text-emerald-700">{weekly.totals.avg_daily_active}/day</td>
                            <td className="py-2.5 text-center font-black text-gray-900">{weekly.totals.documents}</td>
                            <td className="py-2.5 text-center font-black text-gray-900">{weekly.totals.summaries}</td>
                            <td className="py-2.5 text-center font-black text-gray-900">{weekly.totals.flashcards}</td>
                            <td className="py-2.5 text-center font-black text-gray-900">{weekly.totals.quizzes}</td>
                            <td className="py-2.5 text-center font-black text-gray-900">{weekly.totals.videos}</td>
                            <td className="py-2.5 text-center font-black text-indigo-700">{weekly.totals.total_actions}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-gray-400 mt-3">🔵 Highlighted row = most active day of the week</p>
                  </div>
                )}

                {/* Summary report cards */}
                <div className="grid md:grid-cols-2 gap-6">

                  <div className="bg-white rounded-3xl border-2 border-black p-6">
                    <h2 className="text-lg font-black text-gray-900 mb-4">📋 Platform Summary Report</h2>
                    <div className="space-y-3">
                      {[
                        { label: 'Total Students Registered', value: studentCount },
                        { label: 'Total Documents Uploaded',  value: stats?.content.documents },
                        { label: 'Total Summaries Generated', value: stats?.content.summaries },
                        { label: 'Total Flashcards Created',  value: stats?.content.flashcards },
                        { label: 'Total Quizzes Attempted',   value: stats?.content.quizzes },
                        { label: 'Total Videos Generated',    value: stats?.content.videos },
                        { label: 'Total Notebooks',           value: stats?.content.notebooks },
                        { label: 'Total Points Earned',       value: stats?.total_points?.toLocaleString() },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                          <span className="text-sm text-gray-600 font-medium">{label}</span>
                          <span className="text-sm font-black text-gray-900">{value ?? '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border-2 border-black p-6">
                    <h2 className="text-lg font-black text-gray-900 mb-4">🎯 Engagement Report</h2>
                    <div className="space-y-3 mb-6">
                      {[
                        { label: 'Avg Points per Student',     value: stats?.avg_points },
                        { label: 'Avg Streak (days)',           value: `${stats?.avg_streak} days` },
                        { label: 'Avg Documents per Student',  value: stats?.avg_per_user.documents },
                        { label: 'Avg Summaries per Student',  value: stats?.avg_per_user.summaries },
                        { label: 'Avg Flashcards per Student', value: stats?.avg_per_user.flashcards },
                        { label: 'Avg Quizzes per Student',    value: stats?.avg_per_user.quizzes },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                          <span className="text-sm text-gray-600 font-medium">{label}</span>
                          <span className="text-sm font-black text-gray-900">{value ?? '—'}</span>
                        </div>
                      ))}
                    </div>

                    {/* Engagement health bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                        <span>Platform Engagement Score</span>
                        <span>{Math.min(Math.round((stats?.avg_points || 0) / 20), 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(Math.round((stats?.avg_points || 0) / 20), 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recently joined students */}
                <div className="bg-white rounded-3xl border-2 border-black p-6">
                  <h2 className="text-lg font-black text-gray-900 mb-4">🆕 Recently Joined Students</h2>
                  <div className="space-y-3">
                    {[...students].slice(-8).reverse().map(u => (
                      <div key={u.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-sm truncate">{u.username}</p>
                          <p className="text-xs text-gray-500 truncate">{u.email}</p>
                        </div>
                        <div className="flex gap-3 flex-shrink-0 text-xs font-black">
                          <span className="text-purple-600">⭐ {u.points}</span>
                          <span className="text-orange-500">🔥 {u.streak}d</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top performers table */}
                <div className="bg-white rounded-3xl border-2 border-black p-6">
                  <h2 className="text-lg font-black text-gray-900 mb-4">🏅 Top 10 Performers</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-black">
                          {['Rank', 'Student', 'Points', 'Streak'].map((h, i) => (
                            <th key={h} className={`pb-3 text-xs font-black text-gray-500 uppercase tracking-wider ${i === 0 ? 'text-center w-12' : 'text-left'}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {stats?.top_users?.map((u, i) => (
                          <tr key={i} className="border-b border-gray-100 last:border-0">
                            <td className="py-3 text-center">
                              <span className={`font-black text-lg ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-700' : 'text-gray-400'}`}>
                                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                              </span>
                            </td>
                            <td className="py-3 font-bold text-gray-900">{u.name}</td>
                            <td className="py-3 font-black text-purple-600">⭐ {u.points}</td>
                            <td className="py-3 font-black text-orange-500">🔥 {u.streak}d</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

          </>
        )}
      </div>

      <footer className="text-center py-6 text-gray-600 text-sm mt-8 border-t border-gray-300">
        © PadaiSathi All rights reserved.
      </footer>
    </div>
  );
};

export default AdminDashboard;