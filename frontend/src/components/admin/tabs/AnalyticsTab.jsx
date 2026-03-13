// ─── components/admin/tabs/AnalyticsTab.jsx ──────────────────────────────────
import React, { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { ChartCard, CustomTooltip } from '../../ui/DashboardUI';
import { PALETTE } from '../../../constants';

const WEEKLY_METRICS = [
  { key: 'total_actions',   label: 'All Actions',      color: PALETTE.indigo  },
  { key: 'active_students', label: 'Active Students',  color: PALETTE.emerald },
  { key: 'summaries',       label: 'Summaries',        color: PALETTE.amber   },
  { key: 'flashcards',      label: 'Flashcards',       color: PALETTE.violet  },
];

const avgPerUserRows = (stats) => stats ? [
  { name: 'Docs/user',       value: stats.avg_per_user.documents  },
  { name: 'Summaries/user',  value: stats.avg_per_user.summaries  },
  { name: 'Flashcards/user', value: stats.avg_per_user.flashcards },
  { name: 'Quizzes/user',    value: stats.avg_per_user.quizzes    },
] : [];

const AnalyticsTab = ({ stats, weekly, students }) => {
  const [weeklyMetric, setWeeklyMetric] = useState('total_actions');
  const activeColor = WEEKLY_METRICS.find(m => m.key === weeklyMetric)?.color || PALETTE.indigo;

  return (
    <div className="space-y-6">

      {/* Weekly summary cards */}
      {weekly && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Actions This Week',  value: weekly.totals.total_actions,    icon: '⚡', color: 'bg-indigo-500'  },
            { label: 'Avg Active/Day',     value: weekly.totals.avg_daily_active, icon: '👩‍🎓', color: 'bg-emerald-500' },
            { label: 'Summaries (Week)',   value: weekly.totals.summaries,        icon: '📝', color: 'bg-amber-500'   },
            { label: 'Peak Day',           value: weekly.totals.peak_day,         icon: '📈', color: 'bg-rose-500'    },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="bg-white rounded-2xl border-2 border-black p-4 flex flex-col gap-2">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${color}`}>{icon}</div>
              <p className="text-2xl font-black text-gray-900 leading-none">{value ?? '—'}</p>
              <p className="text-xs font-semibold text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Area chart with metric toggle */}
      <ChartCard title="📅 Weekly Student Activity" subtitle="All actions taken by students over the past 7 days">
        {/* Metric pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {WEEKLY_METRICS.map(m => (
            <button
              key={m.key}
              onClick={() => setWeeklyMetric(m.key)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition border-2 ${
                weeklyMetric === m.key
                  ? 'text-white border-transparent'
                  : 'border-gray-200 text-gray-500 bg-white hover:border-gray-400'
              }`}
              style={weeklyMetric === m.key ? { backgroundColor: m.color, borderColor: m.color } : {}}
            >
              {m.label}
            </button>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={weekly?.days || []}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={activeColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={activeColor} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 12, fontWeight: 700 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
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
      </ChartCard>

      {/* Grouped bar chart breakdown */}
      <ChartCard title="📊 Activity Breakdown by Type" subtitle="Compare docs, summaries, flashcards, quizzes and videos side-by-side">
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
      </ChartCard>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* Points distribution */}
        <ChartCard title="Points Distribution" subtitle="How many students fall in each range">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats?.points_dist} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="range" tick={{ fontSize: 11, fontWeight: 600 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Students" fill={PALETTE.indigo} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Avg content per student */}
        <ChartCard title="Avg Content per Student" subtitle="How engaged is the average student?">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={avgPerUserRows(stats)} layout="vertical" barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Avg" fill={PALETTE.emerald} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>

      {/* Top 10 leaderboard */}
      <ChartCard title="🏆 Top 10 Students by Points" subtitle="The highest performing students on the platform">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={stats?.top_users?.map(u => ({ name: u.name, points: u.points }))} barSize={30}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="points" name="Points" fill={PALETTE.amber} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Streak + averages */}
      <div className="grid lg:grid-cols-3 gap-6">

        <ChartCard title="🔥 Top Streakers" subtitle="Students with the longest consecutive learning streaks" className="lg:col-span-2">
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
                    <div className="h-2 bg-orange-400 rounded-full" style={{ width: `${Math.min((u.streak || 0) * 3, 120)}px` }} />
                    <span className="text-xs font-black text-orange-500 w-16 text-right">🔥 {u.streak}d</span>
                  </div>
                </div>
              ))}
          </div>
        </ChartCard>

        <ChartCard title="📊 Key Averages">
          <div className="space-y-4">
            {[
              { label: 'Avg Points',         value: stats?.avg_points,              icon: '⭐', color: 'text-amber-600'  },
              { label: 'Avg Streak (days)',   value: stats?.avg_streak,              icon: '🔥', color: 'text-orange-500' },
              { label: 'Docs per Student',    value: stats?.avg_per_user.documents,  icon: '📄', color: 'text-indigo-600' },
              { label: 'Quizzes per Student', value: stats?.avg_per_user.quizzes,    icon: '❓', color: 'text-sky-600'    },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-xs text-gray-500 font-medium">{icon} {label}</span>
                <span className={`text-lg font-black ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </ChartCard>

      </div>
    </div>
  );
};

export default AnalyticsTab;