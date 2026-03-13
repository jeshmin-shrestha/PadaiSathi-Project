// ─── pages/AdminDashboard.jsx ─────────────────────────────────────────────────
// Orchestrator only — data fetching, state, tab routing.
// All rendering is delegated to tab components.

import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import AdminNavbar from '../components/AdminNavbar';
import OverviewTab  from '../components/admin/tabs/OverviewTab';
import AnalyticsTab from '../components/admin/tabs/AnalyticsTab';
import StudentsTab  from '../components/admin/tabs/StudentsTab';
import ReportsTab   from '../components/admin/tabs/ReportsTab';
import AdminIcon from '../assets/images/adminicon.png';
import { API } from '../constants';

const TABS = [
  { id: 'overview',  label: '📊 Overview'  },
  { id: 'analytics', label: '📈 Analytics' },
  { id: 'users',     label: '👥 Students'  },
  { id: 'reports',   label: '📋 Reports'   },
];

const AdminDashboard = ({ user, setIsAuthenticated }) => {
  const [health,     setHealth]     = useState(null);
  const [users,      setUsers]      = useState([]);
  const [stats,      setStats]      = useState(null);
  const [weekly,     setWeekly]     = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab,  setActiveTab]  = useState('overview');
  const [deletingId, setDeletingId] = useState(null);

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

  const students   = users.filter(u => u.role !== 'admin');
  const adminCount = users.filter(u => u.role === 'admin').length;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-200">
      <AdminNavbar user={user} setIsAuthenticated={setIsAuthenticated} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="bg-gray-300 rounded-3xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <img src={AdminIcon} alt="Admin" className="w-28 h-28 object-contain flex-shrink-0" />
            <div className="flex-1">
              <h1 className="text-3xl font-black text-gray-900 mb-1">Admin Dashboard</h1>
              <p className="text-gray-600">
                Welcome back, <span className="font-bold text-gray-900">{user?.username}</span>
                {health && (
                  <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-bold">
                    ● Live
                  </span>
                )}
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
              className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-black rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 flex-shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Tab bar */}
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

        {/* Tab content */}
        {loading ? (
          <div className="flex items-center justify-center py-40">
            <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === 'overview'  && <OverviewTab  stats={stats} health={health} students={students} adminCount={adminCount} />}
            {activeTab === 'analytics' && <AnalyticsTab stats={stats} weekly={weekly} students={students} />}
            {activeTab === 'users'     && <StudentsTab  students={students} adminCount={adminCount} onDelete={handleDelete} deletingId={deletingId} />}
            {activeTab === 'reports'   && <ReportsTab   stats={stats} weekly={weekly} students={students} />}
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