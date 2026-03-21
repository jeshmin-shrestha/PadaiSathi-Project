// ─── components/admin/tabs/OverviewTab.jsx ───────────────────────────────────
import React from 'react';
import {
  Users, FileText, Video, BookOpen, Zap,
  MessageSquare, Award, CheckCircle, XCircle,
  HardDrive, Clock, TrendingUp, TrendingDown, Minus,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { PALETTE } from '../../../constants';

// ── Trend helper ─────────────────────────────────────────────────────────────
// Splits weekly.days into this-half (last 3-4 days) vs prior-half (first 3 days)
// and returns { direction: 'up'|'down'|'flat', label: '+3 this week' }
const getTrend = (weekly, key) => {
  if (!weekly?.days?.length) return null;
  const days = weekly.days;
  const total  = days.reduce((s, d) => s + (d[key] || 0), 0);
  const half   = Math.floor(days.length / 2);
  const first  = days.slice(0, half).reduce((s, d) => s + (d[key] || 0), 0);
  const second = days.slice(half).reduce((s, d) => s + (d[key] || 0), 0);
  const diff   = second - first;

  if (total === 0) return { direction: 'flat', label: 'No activity yet' };
  if (diff > 0)    return { direction: 'up',   label: `+${diff} this week` };
  if (diff < 0)    return { direction: 'down',  label: `${diff} this week`  };
  return { direction: 'flat', label: `${total} this week` };
};

// For student count we use active_students from weekly
const getStudentTrend = (weekly) => {
  if (!weekly?.days?.length) return null;
  const days    = weekly.days;
  const half    = Math.floor(days.length / 2);
  const first   = days.slice(0, half).reduce((s, d) => s + (d.active_students || 0), 0);
  const second  = days.slice(half).reduce((s, d) => s + (d.active_students || 0), 0);
  const diff    = second - first;
  if (diff > 0)  return { direction: 'up',   label: `+${diff} active vs prior days` };
  if (diff < 0)  return { direction: 'down',  label: `${diff} active vs prior days`  };
  return { direction: 'flat', label: 'Stable activity' };
};

// ── Trend badge component ─────────────────────────────────────────────────────
const TrendBadge = ({ trend }) => {
  if (!trend) return null;
  const cfg = {
    up:   { Icon: TrendingUp,   bg: 'rgba(167,243,208,0.35)', border: 'rgba(74,222,128,0.3)',  color: '#15803d' },
    down: { Icon: TrendingDown, bg: 'rgba(254,202,202,0.35)', border: 'rgba(252,165,165,0.35)', color: '#b91c1c' },
    flat: { Icon: Minus,        bg: 'rgba(186,220,255,0.3)',  border: 'rgba(147,197,253,0.35)', color: '#2563eb' },
  }[trend.direction];

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 20,
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      fontSize: 10, fontWeight: 800, color: cfg.color,
      marginTop: 5, letterSpacing: '0.2px',
      whiteSpace: 'nowrap',
    }}>
      <cfg.Icon size={10} />
      {trend.label}
    </div>
  );
};

// ── KPI card ──────────────────────────────────────────────────────────────────
const KpiCard = ({ icon: Icon, label, value, sub, accent, trend }) => (
  <div style={{
    background: 'rgba(255,255,255,0.68)',
    border: '1px solid rgba(175,215,255,0.42)',
    borderRadius: 18,
    padding: '16px 18px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    boxShadow: '0 2px 10px rgba(100,160,220,0.07)',
    transition: 'transform .15s, box-shadow .15s',
    backdropFilter: 'blur(14px)',
  }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 22px rgba(100,160,220,0.13)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 10px rgba(100,160,220,0.07)'; }}
  >
    <div style={{
      width: 42, height: 42, borderRadius: 13,
      background: accent + '22', color: accent,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      marginTop: 2,
    }}>
      <Icon size={20} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 700, color: '#173a5c', lineHeight: 1 }}>
        {value ?? '—'}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#84a8c6', textTransform: 'uppercase', letterSpacing: '0.6px', marginTop: 3 }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: 10, color: '#aac8e0', fontWeight: 600, marginTop: 2 }}>{sub}</div>}
      {trend && <TrendBadge trend={trend} />}
    </div>
  </div>
);

// ── Section card ──────────────────────────────────────────────────────────────
const SectionCard = ({ title, subtitle, children }) => (
  <div style={{
    background: 'rgba(255,255,255,0.68)',
    border: '1px solid rgba(175,215,255,0.38)',
    borderRadius: 20, padding: '22px 24px',
    backdropFilter: 'blur(14px)',
    boxShadow: '0 2px 14px rgba(100,155,215,0.07)',
  }}>
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 700, color: '#173a5c' }}>{title}</div>
      {subtitle && <div style={{ fontSize: 11.5, color: '#8aaccb', fontWeight: 600, marginTop: 3 }}>{subtitle}</div>}
    </div>
    {children}
  </div>
);

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

// ── Main ──────────────────────────────────────────────────────────────────────
const OverviewTab = ({ stats, health, students, adminCount, weekly }) => {
  const contentBarData = stats ? [
    { name: 'Docs',       count: stats.content.documents,  fill: PALETTE.indigo  },
    { name: 'Summaries',  count: stats.content.summaries,  fill: PALETTE.emerald },
    { name: 'Flashcards', count: stats.content.flashcards, fill: PALETTE.amber   },
    { name: 'Quizzes',    count: stats.content.quizzes,    fill: PALETTE.rose    },
    { name: 'Videos',     count: stats.content.videos,     fill: PALETTE.sky     },
    { name: 'Notebooks',  count: stats.content.notebooks,  fill: PALETTE.violet  },
  ] : [];

  const healthItems = [
    { label: 'API Status', Icon: health ? CheckCircle : XCircle, text: health ? 'Online'    : 'Down',    ok: !!health },
    { label: 'Database',   Icon: health ? CheckCircle : XCircle, text: health ? 'Connected' : 'Error',   ok: !!health },
    { label: 'Storage',    Icon: HardDrive,                       text: 'Available',                      ok: true     },
    { label: 'Last Sync',  Icon: Clock,                           text: new Date().toLocaleTimeString(),  ok: true     },
  ];

  // Pre-compute trends from weekly data
  const trends = {
    students:   getStudentTrend(weekly),
    documents:  getTrend(weekly, 'documents'),
    summaries:  getTrend(weekly, 'summaries'),
    videos:     getTrend(weekly, 'videos'),
    flashcards: getTrend(weekly, 'flashcards'),
    quizzes:    getTrend(weekly, 'quizzes'),
  };

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* KPI row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 14 }}>
        <KpiCard icon={Users}    label="Total Students" value={students.length}                          accent="#3b82f6" sub={`+ ${adminCount} admin`}                           trend={trends.students}   />
        <KpiCard icon={FileText} label="Documents"      value={stats?.content.documents}                accent="#10b981" sub={`${stats?.avg_per_user?.documents} avg/student`}    trend={trends.documents}  />
        <KpiCard icon={BookOpen} label="Summaries"      value={stats?.content.summaries}                accent="#f59e0b" sub={`${stats?.avg_per_user?.summaries} avg/student`}    trend={trends.summaries}  />
        <KpiCard icon={Video}    label="Videos"         value={stats?.content.videos}                   accent="#ef4444"                                                           trend={trends.videos}     />
      </div>

      {/* KPI row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 14 }}>
        <KpiCard icon={Zap}           label="Flashcards"   value={stats?.content.flashcards}            accent="#8b5cf6" sub={`${stats?.avg_per_user?.flashcards} avg/student`}  trend={trends.flashcards} />
        <KpiCard icon={MessageSquare} label="Quizzes"      value={stats?.content.quizzes}               accent="#0ea5e9" sub={`${stats?.avg_per_user?.quizzes} avg/student`}     trend={trends.quizzes}    />
        <KpiCard icon={BookOpen}      label="Notebooks"    value={stats?.content.notebooks}             accent="#84cc16" />
        <KpiCard icon={Award}         label="Total Points" value={stats?.total_points?.toLocaleString()} accent="#d97706" sub={`${stats?.avg_points} avg/student`} />
      </div>

      {/* Content bar chart */}
      <SectionCard title="Content Created — All Time" subtitle="Total items generated across the platform">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={contentBarData} barSize={38}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(170,205,240,0.3)" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600, fill: '#4a6d8e' }} />
            <YAxis tick={{ fontSize: 11, fill: '#84a8c6' }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {contentBarData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* System health */}
      <SectionCard title="System Health" subtitle="Live status of platform services">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          {healthItems.map(({ label, Icon, text, ok }) => (
            <div key={label} style={{
              padding: '14px 16px', borderRadius: 14,
              background: ok ? 'rgba(167,243,208,0.2)' : 'rgba(254,202,202,0.25)',
              border: `1px solid ${ok ? 'rgba(74,222,128,0.3)' : 'rgba(252,165,165,0.4)'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Icon size={14} color={ok ? '#16a34a' : '#dc2626'} />
                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#6b8eaa', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  {label}
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: ok ? '#166534' : '#991b1b' }}>{text}</div>
            </div>
          ))}
        </div>
      </SectionCard>

    </div>
  );
};

export default OverviewTab;