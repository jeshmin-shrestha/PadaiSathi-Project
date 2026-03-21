// ─── components/admin/tabs/AnalyticsTab.jsx ──────────────────────────────────
import React, { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import {
  Activity, Users, FileText, Zap,
  Star, Flame, File, HelpCircle,
} from 'lucide-react';
import { PALETTE } from '../../../constants';

const WEEKLY_METRICS = [
  { key: 'total_actions',   label: 'All Actions',     color: PALETTE.indigo  },
  { key: 'active_students', label: 'Active Students', color: PALETTE.emerald },
  { key: 'summaries',       label: 'Summaries',       color: PALETTE.amber   },
  { key: 'flashcards',      label: 'Flashcards',      color: PALETTE.violet  },
];

const avgPerUserRows = (stats) => stats ? [
  { name: 'Docs/user',       value: stats.avg_per_user.documents  },
  { name: 'Summaries/user',  value: stats.avg_per_user.summaries  },
  { name: 'Flashcards/user', value: stats.avg_per_user.flashcards },
  { name: 'Quizzes/user',    value: stats.avg_per_user.quizzes    },
] : [];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(175,215,255,0.5)',
      borderRadius: 12, padding: '10px 14px', boxShadow: '0 4px 16px rgba(100,160,220,0.15)',
      fontSize: 12, fontWeight: 700, color: '#173a5c',
    }}>
      <div style={{ marginBottom: 4, color: '#84a8c6', fontSize: 11 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color }}>{p.name}: <b>{p.value}</b></div>
      ))}
    </div>
  );
};

const SectionCard = ({ title, subtitle, children }) => (
  <div style={{
    background: 'rgba(255,255,255,0.68)',
    border: '1px solid rgba(175,215,255,0.38)',
    borderRadius: 20, padding: '22px 24px',
    backdropFilter: 'blur(14px)',
    boxShadow: '0 2px 14px rgba(100,155,215,0.07)',
  }}>
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 700, color: '#173a5c' }}>{title}</div>
      {subtitle && <div style={{ fontSize: 11.5, color: '#8aaccb', fontWeight: 600, marginTop: 3 }}>{subtitle}</div>}
    </div>
    {children}
  </div>
);

const MiniStatCard = ({ Icon, label, value, accent }) => (
  <div style={{
    background: 'rgba(255,255,255,0.68)',
    border: '1px solid rgba(175,215,255,0.42)',
    borderRadius: 18, padding: '14px 16px',
    display: 'flex', alignItems: 'center', gap: 12,
    backdropFilter: 'blur(12px)',
    boxShadow: '0 2px 8px rgba(100,160,220,0.06)',
  }}>
    <div style={{
      width: 38, height: 38, borderRadius: 11,
      background: accent + '22', color: accent,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Icon size={18} />
    </div>
    <div>
      <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 700, color: '#173a5c', lineHeight: 1 }}>{value ?? '—'}</div>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: '#84a8c6', textTransform: 'uppercase', letterSpacing: '0.6px', marginTop: 2 }}>{label}</div>
    </div>
  </div>
);

const AnalyticsTab = ({ stats, weekly, students }) => {
  const [weeklyMetric, setWeeklyMetric] = useState('total_actions');
  const activeColor = WEEKLY_METRICS.find(m => m.key === weeklyMetric)?.color || PALETTE.indigo;

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Weekly summary mini cards */}
      {weekly && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
          <MiniStatCard Icon={Activity} label="Actions This Week"  value={weekly.totals.total_actions}    accent="#6366f1" />
          <MiniStatCard Icon={Users}    label="Avg Active / Day"   value={weekly.totals.avg_daily_active} accent="#10b981" />
          <MiniStatCard Icon={FileText} label="Summaries (Week)"   value={weekly.totals.summaries}        accent="#f59e0b" />
          <MiniStatCard Icon={Zap}      label="Peak Day"           value={weekly.totals.peak_day}         accent="#ef4444" />
        </div>
      )}

      {/* Area chart with metric toggle */}
      <SectionCard title="Weekly Student Activity" subtitle="All actions taken by students over the past 7 days">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {WEEKLY_METRICS.map(m => (
            <button
              key={m.key}
              onClick={() => setWeeklyMetric(m.key)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 12, fontWeight: 700,
                border: weeklyMetric === m.key ? 'none' : '1px solid rgba(170,205,240,0.5)',
                background: weeklyMetric === m.key ? m.color : 'rgba(255,255,255,0.7)',
                color: weeklyMetric === m.key ? '#fff' : '#4a6d8e',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={weekly?.days || []}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={activeColor} stopOpacity={0.28} />
                <stop offset="95%" stopColor={activeColor} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(170,205,240,0.3)" />
            <XAxis dataKey="day" tick={{ fontSize: 12, fontWeight: 700, fill: '#4a6d8e' }} />
            <YAxis tick={{ fontSize: 11, fill: '#84a8c6' }} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey={weeklyMetric}
              name={weeklyMetric.replace(/_/g, ' ')}
              stroke={activeColor}
              strokeWidth={3}
              fill="url(#areaGrad)"
              dot={{ r: 5, fill: activeColor, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 7 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* Grouped bar breakdown */}
      <SectionCard title="Activity Breakdown by Type" subtitle="Docs, summaries, flashcards, quizzes and videos side-by-side">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={weekly?.days || []} barSize={10}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(170,205,240,0.3)" />
            <XAxis dataKey="day" tick={{ fontSize: 12, fontWeight: 700, fill: '#4a6d8e' }} />
            <YAxis tick={{ fontSize: 11, fill: '#84a8c6' }} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700, color: '#4a6d8e' }} />
            <Bar dataKey="documents"  name="Docs"       fill={PALETTE.indigo}  radius={[3,3,0,0]} />
            <Bar dataKey="summaries"  name="Summaries"  fill={PALETTE.emerald} radius={[3,3,0,0]} />
            <Bar dataKey="flashcards" name="Flashcards" fill={PALETTE.amber}   radius={[3,3,0,0]} />
            <Bar dataKey="quizzes"    name="Quizzes"    fill={PALETTE.rose}    radius={[3,3,0,0]} />
            <Bar dataKey="videos"     name="Videos"     fill={PALETTE.sky}     radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Points distribution */}
        <SectionCard title="Points Distribution" subtitle="How many students fall in each range">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats?.points_dist} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(170,205,240,0.3)" />
              <XAxis dataKey="range" tick={{ fontSize: 11, fontWeight: 600, fill: '#4a6d8e' }} />
              <YAxis tick={{ fontSize: 11, fill: '#84a8c6' }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Students" fill={PALETTE.indigo} radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        {/* Avg content per student */}
        <SectionCard title="Avg Content per Student" subtitle="How engaged is the average student?">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={avgPerUserRows(stats)} layout="vertical" barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(170,205,240,0.3)" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#84a8c6' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontWeight: 600, fill: '#4a6d8e' }} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Avg" fill={PALETTE.emerald} radius={[0,6,6,0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

      </div>

      {/* Top 10 leaderboard */}
      <SectionCard title="Top 10 Students by Points" subtitle="The highest performing students on the platform">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={stats?.top_users?.map(u => ({ name: u.name, points: u.points }))} barSize={30}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(170,205,240,0.3)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600, fill: '#4a6d8e' }} />
            <YAxis tick={{ fontSize: 11, fill: '#84a8c6' }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="points" name="Points" fill={PALETTE.amber} radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* Streak + averages */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>

        <SectionCard title="Top Streakers" subtitle="Students with the longest consecutive learning streaks">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...students]
              .sort((a, b) => (b.streak || 0) - (a.streak || 0))
              .slice(0, 6)
              .map((u, i) => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 20, fontSize: 12, fontWeight: 800, color: '#84a8c6', flexShrink: 0 }}>{i + 1}</span>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#90c8f0,#6aaee0)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 12, fontWeight: 800, flexShrink: 0,
                  }}>
                    {u.username.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ flex: 1, fontWeight: 700, color: '#173a5c', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.username}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      height: 6, borderRadius: 3,
                      background: 'linear-gradient(90deg,#fb923c,#f97316)',
                      width: Math.min((u.streak || 0) * 3, 100) + 'px',
                    }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#ea580c', fontSize: 12, fontWeight: 800, minWidth: 50 }}>
                      <Flame size={13} />
                      {u.streak}d
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </SectionCard>

        <SectionCard title="Key Averages">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { label: 'Avg Points',         value: stats?.avg_points,              Icon: Star,        color: '#d97706' },
              { label: 'Avg Streak (days)',   value: stats?.avg_streak,              Icon: Flame,       color: '#ea580c' },
              { label: 'Docs per Student',    value: stats?.avg_per_user?.documents, Icon: File,        color: '#6366f1' },
              { label: 'Quizzes per Student', value: stats?.avg_per_user?.quizzes,   Icon: HelpCircle,  color: '#0ea5e9' },
            ].map(({ label, value, Icon, color }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 0', borderBottom: '1px solid rgba(170,210,250,0.25)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon size={14} color={color} />
                  <span style={{ fontSize: 12, color: '#6b8eaa', fontWeight: 600 }}>{label}</span>
                </div>
                <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 700, color }}>{value}</span>
              </div>
            ))}
          </div>
        </SectionCard>

      </div>
    </div>
  );
};

export default AnalyticsTab;