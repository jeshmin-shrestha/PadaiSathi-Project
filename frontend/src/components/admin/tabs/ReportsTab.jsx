// ─── components/admin/tabs/ReportsTab.jsx ────────────────────────────────────
import React, { useState, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, Trophy, Medal,
  Star, Flame, UserPlus, BarChart2, Target,
  CalendarDays, TrendingUp,
} from 'lucide-react';
import { API } from '../../../constants';

// ── shared card ──────────────────────────────────────────────────────────────
const Card = ({ title, subtitle, children, style = {} }) => (
  <div style={{
    background: 'rgba(255,255,255,0.68)',
    border: '1px solid rgba(175,215,255,0.4)',
    borderRadius: 20, padding: '22px 24px',
    backdropFilter: 'blur(14px)',
    boxShadow: '0 2px 14px rgba(100,155,215,0.07)',
    ...style,
  }}>
    {(title || subtitle) && (
      <div style={{ marginBottom: 18 }}>
        {title && (
          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 700, color: '#173a5c' }}>
            {title}
          </div>
        )}
        {subtitle && (
          <div style={{ fontSize: 11.5, color: '#8aaccb', fontWeight: 600, marginTop: 3 }}>
            {subtitle}
          </div>
        )}
      </div>
    )}
    {children}
  </div>
);

const Row = ({ label, value, accent }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 0', borderBottom: '1px solid rgba(170,210,250,0.22)',
  }}>
    <span style={{ fontSize: 13, color: '#6b8eaa', fontWeight: 600 }}>{label}</span>
    <span style={{
      fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 700,
      color: accent || '#173a5c',
    }}>
      {value ?? '—'}
    </span>
  </div>
);

// ── RANK badge ────────────────────────────────────────────────────────────────
const RankBadge = ({ rank }) => {
  if (rank === 0) return <Trophy size={18} color="#f59e0b" />;
  if (rank === 1) return <Medal size={18} color="#9ca3af" />;
  if (rank === 2) return <Medal size={18} color="#cd7c2c" />;
  return (
    <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 700, color: '#84a8c6' }}>
      #{rank + 1}
    </span>
  );
};

// ── WEEK NAVIGATION ──────────────────────────────────────────────────────────
// weekOffset: 0 = current week, -1 = last week, -2 = 2 weeks ago …
const MAX_BACK = 8; // how many weeks back we allow

const formatWeekLabel = (offset) => {
  if (offset === 0) return 'This Week';
  if (offset === -1) return 'Last Week';
  return `${Math.abs(offset)} Weeks Ago`;
};

// ── Main component ────────────────────────────────────────────────────────────
const ReportsTab = ({ stats, weekly: currentWeekly, students }) => {
  const [weekOffset, setWeekOffset] = useState(0);          // 0 = current
  const [weeklyData, setWeeklyData] = useState(currentWeekly);
  const [loading, setLoading] = useState(false);

  // When the offset changes, fetch the right week from the backend
  useEffect(() => {
    if (weekOffset === 0) {
      setWeeklyData(currentWeekly);
      return;
    }
    const fetchWeek = async () => {
      setLoading(true);
      try {
        // The backend /api/admin/weekly-activity doesn't support offset yet,
        // so we compute the date range on the client and pass it, OR
        // we fall back to shifting the current data by offset*7 days.
        // If your backend supports ?week_offset= add it here:
        const res = await fetch(`${API}/api/admin/weekly-activity?week_offset=${weekOffset}`);
        if (res.ok) {
          const data = await res.json();
          setWeeklyData(data);
        } else {
          // Backend doesn't support offset — show shifted placeholder
          setWeeklyData(null);
        }
      } catch {
        setWeeklyData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchWeek();
  }, [weekOffset, currentWeekly]);

  const weekly = weeklyData;

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* ── Week navigator ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(255,255,255,0.68)', border: '1px solid rgba(175,215,255,0.4)',
        borderRadius: 16, padding: '14px 20px',
        backdropFilter: 'blur(12px)',
      }}>
        <button
          onClick={() => setWeekOffset(o => Math.max(o - 1, -MAX_BACK))}
          disabled={weekOffset <= -MAX_BACK}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 10,
            background: 'rgba(186,220,255,0.25)', border: '1px solid rgba(170,205,240,0.4)',
            fontSize: 12.5, fontWeight: 700, color: '#2a5a8c',
            cursor: weekOffset <= -MAX_BACK ? 'not-allowed' : 'pointer',
            opacity: weekOffset <= -MAX_BACK ? 0.4 : 1,
            fontFamily: "'Nunito',sans-serif",
            transition: 'all 0.15s',
          }}
        >
          <ChevronLeft size={15} /> Previous
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'center' }}>
            <CalendarDays size={15} color="#5a9ad4" />
            <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 700, color: '#173a5c' }}>
              {formatWeekLabel(weekOffset)}
            </span>
            {weekOffset === 0 && (
              <span style={{
                padding: '2px 8px', borderRadius: 10,
                background: 'rgba(74,222,128,0.18)', border: '1px solid rgba(74,222,128,0.3)',
                fontSize: 10, fontWeight: 800, color: '#16a34a', letterSpacing: '0.5px',
              }}>
                LIVE
              </span>
            )}
          </div>
          {weekly?.days?.length > 0 && (
            <div style={{ fontSize: 11, color: '#84a8c6', fontWeight: 600, marginTop: 3 }}>
              {weekly.days[0]?.date} → {weekly.days[weekly.days.length - 1]?.date}
            </div>
          )}
        </div>

        <button
          onClick={() => setWeekOffset(o => Math.min(o + 1, 0))}
          disabled={weekOffset >= 0}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 10,
            background: 'rgba(186,220,255,0.25)', border: '1px solid rgba(170,205,240,0.4)',
            fontSize: 12.5, fontWeight: 700, color: '#2a5a8c',
            cursor: weekOffset >= 0 ? 'not-allowed' : 'pointer',
            opacity: weekOffset >= 0 ? 0.4 : 1,
            fontFamily: "'Nunito',sans-serif",
            transition: 'all 0.15s',
          }}
        >
          Next <ChevronRight size={15} />
        </button>
      </div>

      {/* ── Weekly activity table ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#84a8c6', fontSize: 13, fontWeight: 700 }}>
          Loading week data…
        </div>
      ) : weekly ? (
        <Card
          title={`${formatWeekLabel(weekOffset)} — Activity Report`}
          subtitle="Day-by-day student engagement"
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 640, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(170,205,240,0.35)' }}>
                  {['Day', 'Date', 'Active', 'Docs', 'Summaries', 'Flashcards', 'Quizzes', 'Videos', 'Total'].map((h, i) => (
                    <th key={h} style={{
                      padding: '10px 14px',
                      fontSize: 10, fontWeight: 800, color: '#6b95b8',
                      textTransform: 'uppercase', letterSpacing: '1px',
                      textAlign: i === 0 ? 'left' : 'center',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weekly.days.map((d, idx) => {
                  const isPeak = d.total_actions === Math.max(...weekly.days.map(x => x.total_actions)) && d.total_actions > 0;
                  return (
                    <tr key={d.date} style={{
                      borderBottom: '1px solid rgba(170,205,240,0.18)',
                      background: isPeak ? 'rgba(186,220,255,0.2)' : idx % 2 === 0 ? 'transparent' : 'rgba(186,220,255,0.06)',
                    }}>
                      <td style={{ padding: '10px 14px', fontWeight: 800, color: '#173a5c', fontSize: 13 }}>{d.day}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: 11, color: '#84a8c6', fontWeight: 600 }}>{d.date?.slice(5)}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 800, color: '#059669', fontSize: 13 }}>{d.active_students}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: 12.5, fontWeight: 600, color: '#4a6d8e' }}>{d.documents}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: 12.5, fontWeight: 600, color: '#4a6d8e' }}>{d.summaries}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: 12.5, fontWeight: 600, color: '#4a6d8e' }}>{d.flashcards}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: 12.5, fontWeight: 600, color: '#4a6d8e' }}>{d.quizzes}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: 12.5, fontWeight: 600, color: '#4a6d8e' }}>{d.videos}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 800, color: '#4f46e5', fontSize: 13 }}>{d.total_actions}</td>
                    </tr>
                  );
                })}
                {/* Totals row */}
                <tr style={{ background: 'rgba(186,220,255,0.18)', borderTop: '1px solid rgba(170,205,240,0.35)' }}>
                  <td style={{ padding: '11px 14px', fontWeight: 800, color: '#173a5c', fontSize: 13 }} colSpan={2}>
                    Week Total
                  </td>
                  <td style={{ padding: '11px 14px', textAlign: 'center', fontWeight: 800, color: '#059669' }}>{weekly.totals.avg_daily_active}/day</td>
                  <td style={{ padding: '11px 14px', textAlign: 'center', fontWeight: 800, color: '#173a5c' }}>{weekly.totals.documents}</td>
                  <td style={{ padding: '11px 14px', textAlign: 'center', fontWeight: 800, color: '#173a5c' }}>{weekly.totals.summaries}</td>
                  <td style={{ padding: '11px 14px', textAlign: 'center', fontWeight: 800, color: '#173a5c' }}>{weekly.totals.flashcards}</td>
                  <td style={{ padding: '11px 14px', textAlign: 'center', fontWeight: 800, color: '#173a5c' }}>{weekly.totals.quizzes}</td>
                  <td style={{ padding: '11px 14px', textAlign: 'center', fontWeight: 800, color: '#173a5c' }}>{weekly.totals.videos}</td>
                  <td style={{ padding: '11px 14px', textAlign: 'center', fontWeight: 800, color: '#4f46e5' }}>{weekly.totals.total_actions}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: 10.5, color: '#84a8c6', fontWeight: 600, marginTop: 12 }}>
            Highlighted row = most active day of the week
          </div>
        </Card>
      ) : (
        <Card title={`${formatWeekLabel(weekOffset)} — Activity Report`}>
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#84a8c6', fontSize: 13, fontWeight: 600 }}>
            No data available for this period. Add <code>?week_offset=</code> support to your backend to enable historical reports.
          </div>
        </Card>
      )}

      {/* ── Platform summary + Engagement ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        <Card title="Platform Summary" subtitle="All-time totals">
          {[
            { label: 'Total Students Registered', value: students.length },
            { label: 'Total Documents Uploaded',  value: stats?.content.documents },
            { label: 'Total Summaries Generated', value: stats?.content.summaries },
            { label: 'Total Flashcards Created',  value: stats?.content.flashcards },
            { label: 'Total Quizzes Attempted',   value: stats?.content.quizzes },
            { label: 'Total Videos Generated',    value: stats?.content.videos },
            { label: 'Total Notebooks',           value: stats?.content.notebooks },
            { label: 'Total Points Earned',       value: stats?.total_points?.toLocaleString() },
          ].map(r => <Row key={r.label} {...r} />)}
        </Card>

        <Card title="Engagement Report" subtitle="Averages per student">
          {[
            { label: 'Avg Points per Student',     value: stats?.avg_points },
            { label: 'Avg Streak (days)',           value: `${stats?.avg_streak} days` },
            { label: 'Avg Documents per Student',  value: stats?.avg_per_user?.documents },
            { label: 'Avg Summaries per Student',  value: stats?.avg_per_user?.summaries },
            { label: 'Avg Flashcards per Student', value: stats?.avg_per_user?.flashcards },
            { label: 'Avg Quizzes per Student',    value: stats?.avg_per_user?.quizzes },
          ].map(r => <Row key={r.label} {...r} />)}

          {/* Engagement score bar */}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: '#6b95b8', marginBottom: 6 }}>
              <span>Platform Engagement Score</span>
              <span>{Math.min(Math.round((stats?.avg_points || 0) / 20), 100)}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 6, background: 'rgba(170,210,250,0.3)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(Math.round((stats?.avg_points || 0) / 20), 100)}%`,
                background: 'linear-gradient(90deg,#6366f1,#10b981)',
                borderRadius: 6,
                transition: 'width 0.7s',
              }} />
            </div>
          </div>
        </Card>

      </div>

      {/* ── Recently joined ── */}
      <Card title="Recently Joined Students" subtitle="Latest 8 registered accounts">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...students].slice(-8).reverse().map(u => (
            <div key={u.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', borderRadius: 13,
              background: 'rgba(186,220,255,0.12)',
              border: '1px solid rgba(175,215,255,0.25)',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg,#90c8f0,#6aaee0)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 13, fontWeight: 800, flexShrink: 0,
              }}>
                {u.username.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: '#173a5c', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.username}</div>
                <div style={{ fontSize: 11, color: '#84a8c6', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
              </div>
              <div style={{ display: 'flex', gap: 14, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#7c3aed', fontWeight: 800, fontSize: 12 }}>
                  <Star size={12} /> {u.points}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#ea580c', fontWeight: 800, fontSize: 12 }}>
                  <Flame size={12} /> {u.streak}d
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Top performers ── */}
      <Card title="Top 10 Performers" subtitle="Ranked by total points earned">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(170,205,240,0.3)' }}>
                {['Rank', 'Student', 'Points', 'Streak'].map((h, i) => (
                  <th key={h} style={{
                    padding: '10px 16px',
                    fontSize: 10, fontWeight: 800, color: '#6b95b8',
                    textTransform: 'uppercase', letterSpacing: '1px',
                    textAlign: i === 0 ? 'center' : 'left',
                    width: i === 0 ? 60 : 'auto',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats?.top_users?.map((u, i) => (
                <tr key={i} style={{
                  borderBottom: '1px solid rgba(170,205,240,0.18)',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(186,220,255,0.06)',
                }}>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <RankBadge rank={i} />
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#173a5c', fontSize: 13.5 }}>{u.name}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#7c3aed', fontWeight: 800, fontSize: 13 }}>
                      <Star size={13} /> {u.points}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#ea580c', fontWeight: 800, fontSize: 13 }}>
                      <Flame size={13} /> {u.streak}d
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
};

export default ReportsTab;