// ─── pages/AdminDashboard.jsx ─────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import {
  RefreshCw, LayoutDashboard, BarChart2,
  Users, FileText, Activity,
  Zap, BookOpen, TrendingUp,
} from 'lucide-react';
import OverviewTab, { getTrend, TrendBadge } from '../components/admin/tabs/OverviewTab';
import AnalyticsTab from '../components/admin/tabs/AnalyticsTab';
import StudentsTab  from '../components/admin/tabs/StudentsTab';
import ReportsTab   from '../components/admin/tabs/ReportsTab';
import AdminIcon    from '../assets/images/adminicon.png';
import { API }      from '../constants';

const TABS = [
  { id: 'overview',  label: 'Overview',  Icon: LayoutDashboard },
  { id: 'analytics', label: 'Analytics', Icon: BarChart2        },
  { id: 'users',     label: 'Students',  Icon: Users            },
  { id: 'reports',   label: 'Reports',   Icon: FileText         },
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
        fetch(`${API}/api/admin/stats?email=${encodeURIComponent(user.email)}`),
        fetch(`${API}/api/admin/weekly-activity?email=${encodeURIComponent(user.email)}`),
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
    setDeletingId(userId);
    try {
      const res = await fetch(`${API}/api/users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId));
      } else {
        const data = await res.json();
        alert(data.detail || 'Failed to delete user.');
      }
    } catch {
      alert('Could not connect to backend.');
    } finally {
      setDeletingId(null);
    }
  };

  const students   = users.filter(u => u.role !== 'admin');
  const adminCount = users.filter(u => u.role === 'admin').length;

  if (!user) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Sora:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .adm-root { min-height: 100vh; width: 100%; font-family: 'Nunito', sans-serif; background: #e8f1fb; position: relative; overflow-x: hidden; }

        .adm-bg {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 85% 55% at 5% 0%, rgba(186,220,255,0.6) 0%, transparent 55%),
            radial-gradient(ellipse 65% 45% at 95% 100%, rgba(200,230,255,0.45) 0%, transparent 55%),
            linear-gradient(160deg, #d9eeff 0%, #e5f0fb 45%, #f0f5fd 100%);
        }

        .adm-layout { position: relative; z-index: 1; display: flex; min-height: 100vh; }

        /* SIDEBAR */
        .adm-sidebar {
          width: 230px; flex-shrink: 0; display: flex; flex-direction: column;
          padding: 20px 14px 20px; gap: 4px;
          background: rgba(255,255,255,0.52); backdrop-filter: blur(22px);
          border-right: 1px solid rgba(170,205,240,0.45);
          min-height: 100vh; position: sticky; top: 0; height: 100vh; overflow-y: auto;
        }

        .adm-brand { display: flex; align-items: center; gap: 10px; padding: 4px 8px 18px; border-bottom: 1px solid rgba(160,200,240,0.28); margin-bottom: 10px; }
        .adm-brand img { width: 34px; height: 34px; object-fit: contain; }
        .adm-brand-name { font-family: 'Sora', sans-serif; font-size: 14px; font-weight: 700; color: #173a5c; line-height: 1.2; }
        .adm-brand-tag { font-size: 9.5px; font-weight: 700; color: #6b95b8; letter-spacing: 1.1px; text-transform: uppercase; }

        .adm-section-label { font-size: 9.5px; font-weight: 800; color: #9dbcd8; letter-spacing: 1.6px; text-transform: uppercase; padding: 12px 8px 5px; }

        .adm-nav-item {
          display: flex; align-items: center; gap: 9px; padding: 10px 13px; border-radius: 13px;
          font-size: 13.5px; font-weight: 700; cursor: pointer; transition: all 0.16s;
          border: none; width: 100%; text-align: left; color: #4a6d8e; background: transparent;
        }
        .adm-nav-item:hover { background: rgba(180,215,255,0.32); color: #163a5c; }
        .adm-nav-item.active { background: rgba(255,255,255,0.88); color: #163a5c; box-shadow: 0 2px 10px rgba(100,160,220,0.16), 0 0 0 1px rgba(155,200,245,0.38); }
        .adm-nav-item svg { width: 17px; height: 17px; flex-shrink: 0; opacity: 0.7; }
        .adm-nav-item.active svg { opacity: 1; }
        .adm-nav-item.muted { opacity: 0.55; cursor: default; pointer-events: none; }

        .adm-sidebar-footer { margin-top: auto; padding: 12px; background: rgba(255,255,255,0.58); border-radius: 15px; border: 1px solid rgba(170,210,250,0.38); display: flex; align-items: center; gap: 10px; }
        .adm-avatar-chip { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #90c8f0 0%, #6aaee0 100%); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; color: white; flex-shrink: 0; }
        .adm-avatar-name { font-size: 12.5px; font-weight: 800; color: #173a5c; }
        .adm-avatar-role { font-size: 9.5px; font-weight: 700; color: #6b9ec6; letter-spacing: 0.4px; text-transform: uppercase; }

        /* MAIN */
        .adm-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }

        .adm-topbar { display: flex; align-items: center; justify-content: space-between; padding: 16px 28px; background: rgba(255,255,255,0.48); backdrop-filter: blur(16px); border-bottom: 1px solid rgba(170,205,240,0.38); gap: 12px; flex-wrap: wrap; }
        .adm-page-title { font-family: 'Sora', sans-serif; font-size: 20px; font-weight: 700; color: #173a5c; letter-spacing: -0.3px; }
        .adm-page-date { font-size: 11.5px; color: #88aecb; font-weight: 600; margin-top: 2px; }
        .adm-topbar-actions { display: flex; align-items: center; gap: 10px; }

        .adm-live-badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 11px; background: rgba(167,243,208,0.4); border: 1px solid rgba(74,222,128,0.35); border-radius: 20px; font-size: 10.5px; font-weight: 800; color: #166534; letter-spacing: 0.4px; }
        .adm-live-dot { width: 7px; height: 7px; background: #22c55e; border-radius: 50%; animation: adm-pulse 1.8s ease-in-out infinite; }
        @keyframes adm-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.7); } }

        .adm-refresh { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: rgba(255,255,255,0.72); border: 1px solid rgba(160,200,240,0.5); border-radius: 11px; font-family: 'Nunito', sans-serif; font-size: 12.5px; font-weight: 700; color: #2a5a8c; cursor: pointer; transition: all 0.16s; }
        .adm-refresh:hover { background: #fff; border-color: rgba(110,175,240,0.65); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(100,160,220,0.14); }
        .adm-refresh:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }

        /* KPI row */
        .adm-kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; padding: 20px 28px; border-bottom: 1px solid rgba(170,205,240,0.22); }
        @media (max-width: 1100px) { .adm-kpi-row { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 700px)  { .adm-kpi-row { grid-template-columns: 1fr; } }

        .adm-kpi { background: rgba(255,255,255,0.68); backdrop-filter: blur(14px); border: 1px solid rgba(175,215,255,0.42); border-radius: 18px; padding: 16px 18px; display: flex; align-items: center; gap: 14px; box-shadow: 0 2px 10px rgba(100,160,220,0.07); transition: transform 0.15s, box-shadow 0.15s; animation: adm-rise 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        .adm-kpi:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(100,160,220,0.13); }
        .adm-kpi:nth-child(1) { animation-delay: 0.04s; }
        .adm-kpi:nth-child(2) { animation-delay: 0.08s; }
        .adm-kpi:nth-child(3) { animation-delay: 0.12s; }
        .adm-kpi:nth-child(4) { animation-delay: 0.16s; }
        @keyframes adm-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        .adm-kpi-icon { width: 42px; height: 42px; border-radius: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .adm-kpi-icon.sky   { background: rgba(186,230,255,0.55); color: #0c6fa8; }
        .adm-kpi-icon.mint  { background: rgba(167,243,208,0.5);  color: #0f7040; }
        .adm-kpi-icon.honey { background: rgba(253,220,100,0.45); color: #8a6000; }
        .adm-kpi-icon.rose  { background: rgba(255,187,200,0.5);  color: #a01840; }

        .adm-kpi-val { font-family: 'Sora', sans-serif; font-size: 24px; font-weight: 700; color: #173a5c; line-height: 1; }
        .adm-kpi-lbl { font-size: 11px; font-weight: 700; color: #84a8c6; text-transform: uppercase; letter-spacing: 0.6px; margin-top: 3px; }

        .adm-content-area { flex: 1; padding: 24px 28px 36px; }

        .adm-panel { background: rgba(255,255,255,0.62); backdrop-filter: blur(18px); border: 1px solid rgba(175,215,255,0.38); border-radius: 22px; overflow: hidden; box-shadow: 0 4px 24px rgba(100,155,215,0.09), 0 1px 0 rgba(255,255,255,0.85) inset; animation: adm-rise 0.3s cubic-bezier(0.22,1,0.36,1) both; }

        .adm-loader { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 100px 0; }
        .adm-spinner { width: 38px; height: 38px; border: 3px solid rgba(130,185,240,0.2); border-top-color: #55a5d8; border-radius: 50%; animation: adm-spin 0.7s linear infinite; }
        .adm-loader-lbl { font-size: 12.5px; font-weight: 700; color: #80aacb; letter-spacing: 0.5px; }
        @keyframes adm-spin { to { transform: rotate(360deg); } }

        .adm-footer { text-align: center; padding: 18px 28px; font-size: 11px; font-weight: 700; color: #aac6df; letter-spacing: 0.5px; border-top: 1px solid rgba(170,210,250,0.22); }

        @media (max-width: 860px) {
          .adm-sidebar { display: none; }
          .adm-content-area { padding: 18px 16px 28px; }
          .adm-topbar { padding: 14px 16px; }
          .adm-kpi-row { padding: 16px; }
        }
      `}</style>

      <div className="adm-bg" />

      <div className="adm-root">

        <div className="adm-layout">

          {/* SIDEBAR */}
          <aside className="adm-sidebar">
            <div className="adm-brand">
              <img src={AdminIcon} alt="Admin" />
              <div>
                <div className="adm-brand-name">PadaiSathi</div>
                <div className="adm-brand-tag">Admin Panel</div>
              </div>
            </div>

            <div className="adm-section-label">Main Menu</div>
            {TABS.map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)} className={`adm-nav-item${activeTab === id ? ' active' : ''}`}>
                <Icon size={17} /> {label}
              </button>
            ))}


            <div className="adm-sidebar-footer">
              <div className="adm-avatar-chip">{(user?.username?.[0] || 'A').toUpperCase()}</div>
              <div>
                <div className="adm-avatar-name">{user?.username}</div>
                <div className="adm-avatar-role">Administrator</div>
              </div>
            </div>
          </aside>

          {/* MAIN */}
          <div className="adm-main">
            <div className="adm-topbar">
              <div>
                <div className="adm-page-title">{TABS.find(t => t.id === activeTab)?.label ?? 'Dashboard'}</div>
                <div className="adm-page-date">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
              <div className="adm-topbar-actions">
                {health && (
                  <span className="adm-live-badge">
                    <span className="adm-live-dot" /> System Online
                  </span>
                )}
                <button onClick={fetchAll} disabled={refreshing} className="adm-refresh">
                  <RefreshCw size={13} style={{ animation: refreshing ? 'adm-spin 0.7s linear infinite' : 'none' }} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Top KPI cards */}
            {stats && (
              <div className="adm-kpi-row">
                <div className="adm-kpi">
                  <div className="adm-kpi-icon sky"><Users size={20} /></div>
                  <div>
                    <div className="adm-kpi-val">{stats.student_count}</div>
                    <div className="adm-kpi-lbl">Total Students</div>
                    <TrendBadge trend={getTrend(weekly, 'active_students')} />
                  </div>
                </div>
                <div className="adm-kpi">
                  <div className="adm-kpi-icon mint"><Activity size={20} /></div>
                  <div>
                    <div className="adm-kpi-val">{weekly?.totals?.total_actions ?? '—'}</div>
                    <div className="adm-kpi-lbl">Actions This Week</div>
                    <TrendBadge trend={getTrend(weekly, 'total_actions')} />
                  </div>
                </div>
                <div className="adm-kpi">
                  <div className="adm-kpi-icon rose"><TrendingUp size={20} /></div>
                  <div>
                    <div className="adm-kpi-val">{weekly?.totals?.peak_day ?? '—'}</div>
                    <div className="adm-kpi-lbl">Peak Day</div>
                  </div>
                </div>
                <div className="adm-kpi">
                  <div className="adm-kpi-icon rose"><Zap size={20} /></div>
                  <div>
                    <div className="adm-kpi-val">{stats.content?.videos}</div>
                    <div className="adm-kpi-lbl">Videos</div>
                    <TrendBadge trend={getTrend(weekly, 'videos')} />
                  </div>
                </div>
              </div>
            )}

            {/* Tab content */}
            <div className="adm-content-area">
              {loading ? (
                <div className="adm-loader">
                  <div className="adm-spinner" />
                  <div className="adm-loader-lbl">Loading dashboard data...</div>
                </div>
              ) : (
                <div className="adm-panel" key={activeTab}>
                  {activeTab === 'overview'  && <OverviewTab  stats={stats} health={health} students={students} weekly={weekly} onTabChange={setActiveTab} />}
                  {activeTab === 'analytics' && <AnalyticsTab stats={stats} weekly={weekly} />}
                  {activeTab === 'users'     && <StudentsTab  students={students} adminCount={adminCount} onDelete={handleDelete} deletingId={deletingId} />}
                  {activeTab === 'reports'   && <ReportsTab   stats={stats} weekly={weekly} students={students} email={user?.email} />}
                </div>
              )}
            </div>

            <div className="adm-footer">© {new Date().getFullYear()} PadaiSathi — All rights reserved</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;