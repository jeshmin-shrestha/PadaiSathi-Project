import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  Users, FileText, Video, BookOpen, Trash2, Shield,
  Search, RefreshCw, TrendingUp, Activity, Star
} from 'lucide-react';
import AdminIcon from '../assets/images/adminicon.png';

const API = 'http://127.0.0.1:8000';
const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

const generateWeekData = (base) =>
  ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => ({
    day,
    value: Math.max(0, base + Math.floor(Math.random() * 15) - 3 + i),
  }));

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="bg-white rounded-2xl border-2 border-black p-5 flex items-center space-x-4 h-full">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-2xl font-bold text-gray-900 truncate">{value ?? '—'}</p>
      <p className="text-sm font-medium text-gray-500 truncate">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>}
    </div>
  </div>
);

const AdminDashboard = ({ user, setIsAuthenticated }) => {
  const navigate = useNavigate();

  const [health, setHealth]           = useState(null);
  const [users, setUsers]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [deletingId, setDeletingId]   = useState(null);
  const [activeTab, setActiveTab]     = useState('overview');
  const [refreshing, setRefreshing]   = useState(false);
  const [contentData, setContentData] = useState([]);
  const [weekData, setWeekData]       = useState([]);
  const [pieData, setPieData]         = useState([]);

  const fetchAll = async () => {
    setRefreshing(true);
    try {
      const [healthRes, usersRes] = await Promise.all([
        fetch(`${API}/api/health`),
        fetch(`${API}/api/users`),
      ]);
      const healthData = await healthRes.json();
      const usersData  = await usersRes.json();

      setHealth(healthData);
      setUsers(usersData.users || []);

      setContentData([
        { name: 'Documents', count: healthData.documents || 0 },
        { name: 'Summaries', count: healthData.summaries || 0 },
        { name: 'Videos',    count: healthData.videos    || 0 },
      ]);

      const students = (usersData.users || []).filter(u => u.role !== 'admin').length;
      const admins   = (usersData.users || []).filter(u => u.role === 'admin').length;
      setPieData([
        { name: 'Students', value: students },
        { name: 'Admins',   value: admins },
      ]);

      setWeekData(generateWeekData(healthData.users || 1));
    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleDelete = async (userId, username) => {
    if (!window.confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    setDeletingId(userId);
    try {
      await fetch(`${API}/api/users/${userId}`, { method: 'DELETE' });
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch {
      alert('Could not delete user — add DELETE /api/users/:id to your backend.');
    } finally {
      setDeletingId(null);
    }
  };

  const handlePromote = async (userId, username) => {
    if (!window.confirm(`Promote "${username}" to admin?`)) return;
    try {
      await fetch(`${API}/api/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin' }),
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: 'admin' } : u));
    } catch {
      alert('Could not promote user — add PUT /api/users/:id/role to your backend.');
    }
  };

  const filteredUsers  = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );
  const studentCount = users.filter(u => u.role !== 'admin').length;
  const adminCount   = users.filter(u => u.role === 'admin').length;
  const totalPoints  = users.reduce((s, u) => s + (u.points || 0), 0);
  const topUsers     = [...users].sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 8)
                         .map(u => ({ name: u.username, points: u.points || 0 }));

  const TABS = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'users',    label: '👥 Users'    },
    { id: 'activity', label: '📈 Activity'  },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-200">
      <AdminNavbar user={user} setIsAuthenticated={setIsAuthenticated} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* ── HEADER WITH IMAGE ── */}
        <div className="bg-gray-300 rounded-3xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            {/* Image */}
            <img src={AdminIcon} alt="Admin" className="w-32 h-32 object-contain flex-shrink-0" />

            {/* Middle section */}
            <div className="flex-1 w-full ml-4 lg:ml-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center lg:text-left">Admin Panel</h1>
              <p className="text-gray-600 mb-4 text-center lg:text-left">
                Welcome back, <span className="font-semibold text-gray-900">{user?.username}</span>
              </p>
              
            </div>

            {/* Right buttons */}
            <div className="flex flex-row lg:flex-col items-center lg:items-end gap-3 flex-shrink-0">
              <button
                onClick={fetchAll}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-white border-2 border-black rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <span className="px-4 py-2 bg-gray-800 text-white text-sm font-bold rounded-full uppercase tracking-wider whitespace-nowrap">
                🔐 Admin Access
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-2xl font-semibold transition text-sm ${
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
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={Users}    label="Total Users"  value={health?.users}     color="bg-indigo-500" sub={`${studentCount} students · ${adminCount} admins`} />
                  <StatCard icon={FileText} label="Documents"    value={health?.documents} color="bg-emerald-500" />
                  <StatCard icon={BookOpen} label="Summaries"    value={health?.summaries} color="bg-amber-500" />
                  <StatCard icon={Video}    label="Videos"       value={health?.videos}    color="bg-rose-500" />
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white rounded-3xl border-2 border-black p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Content Breakdown</h2>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={contentData} barSize={44}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 13 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                          {contentData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-3xl border-2 border-black p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">User Roles</h2>
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%" cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                          labelLine={false}
                        >
                          {pieData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border-2 border-black p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">System Health</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'API Status',          status: health ? 'Online'    : 'Unknown' },
                      { label: 'Database',             status: health ? 'Connected' : 'Unknown' },
                      { label: 'Storage',              status: 'Available' },
                      { label: 'Total Points Earned',  status: `${totalPoints.toLocaleString()} pts` },
                    ].map(({ label, status }) => (
                      <div key={label} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-500 truncate">{label}</p>
                          <p className="text-sm font-semibold text-gray-800 truncate">{status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: `${users.length} Total`,    color: 'bg-gray-800 text-white' },
                    { label: `${studentCount} Students`, color: 'bg-green-100 text-green-700 border border-green-300' },
                    { label: `${adminCount} Admins`,     color: 'bg-gray-200 text-gray-700 border border-gray-400' },
                  ].map(({ label, color }) => (
                    <span key={label} className={`px-3 py-1.5 rounded-full text-xs font-bold ${color}`}>{label}</span>
                  ))}
                </div>

                <div className="bg-white rounded-2xl border-2 border-black px-4 py-3 flex items-center space-x-3">
                  <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search by username or email…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 outline-none text-gray-800 text-sm bg-transparent min-w-0"
                  />
                  <span className="text-xs text-gray-400 whitespace-nowrap">{filteredUsers.length} result{filteredUsers.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="bg-white rounded-3xl border-2 border-black overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="bg-gray-100 border-b-2 border-black">
                        {['User', 'Email', 'Role', 'Points', 'Streak', 'Actions'].map((h, i) => (
                          <th key={h} className={`px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider ${i === 5 ? 'text-right' : 'text-left'}`}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u, i) => (
                        <tr key={u.id} className={`border-b border-gray-100 transition hover:bg-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                {u.username.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-semibold text-gray-900 truncate">{u.username}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-[200px]">{u.email}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                              u.role === 'admin' ? 'bg-gray-800 text-white' : 'bg-green-100 text-green-700'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-purple-600 whitespace-nowrap">🏆 {u.points}</td>
                          <td className="px-6 py-4 text-sm font-bold text-orange-500 whitespace-nowrap">🔥 {u.streak}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              {u.role !== 'admin' && (
                                <button
                                  onClick={() => handlePromote(u.id, u.username)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition border border-gray-300 whitespace-nowrap"
                                >
                                  <Shield className="w-3.5 h-3.5" />
                                  <span>Promote</span>
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(u.id, u.username)}
                                disabled={deletingId === u.id || u.email === user?.email}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition border border-red-200 disabled:opacity-40 whitespace-nowrap"
                                title={u.email === user?.email ? "Can't delete yourself" : 'Delete user'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>{deletingId === u.id ? 'Deleting…' : 'Delete'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-16 text-center text-gray-400 text-sm">
                            No users found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl border-2 border-black p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-1">Weekly Activity</h2>
                  <p className="text-xs text-gray-400 mb-4">Estimated daily active sessions this week</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={weekData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="day" tick={{ fontSize: 13 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} dot={{ r: 5, fill: '#6366f1' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-3xl border-2 border-black p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Top Users by Points</h2>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={topUsers} barSize={32}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="points" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-3xl border-2 border-black p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Recently Joined Users</h2>
                  <div className="space-y-3">
                    {[...users].slice(-5).reverse().map(u => (
                      <div key={u.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{u.username}</p>
                          <p className="text-xs text-gray-500 truncate">{u.email}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs font-bold text-purple-600 whitespace-nowrap">🏆 {u.points}</span>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                            u.role === 'admin' ? 'bg-gray-800 text-white' : 'bg-green-100 text-green-700'
                          }`}>{u.role}</span>
                        </div>
                      </div>
                    ))}
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