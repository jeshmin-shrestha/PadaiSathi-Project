import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  CheckCircle, XCircle, HardDrive, Clock,
  TrendingUp, TrendingDown, Minus, Zap, MessageSquare,
  Award, Users, FileText, Activity, BookOpen,
} from 'lucide-react';
import { PALETTE } from '../../../constants';

// ── shared helpers ─────────────────────────────────────────────────────────
export const getTrend = (weekly, key) => {
  if (!weekly?.days?.length) return null;
  const days   = weekly.days;
  const total  = days.reduce((s, d) => s + (d[key] || 0), 0);
  const half   = Math.floor(days.length / 2);
  const first  = days.slice(0, half).reduce((s, d) => s + (d[key] || 0), 0);
  const second = days.slice(half).reduce((s, d) => s + (d[key] || 0), 0);
  const diff   = second - first;
  if (total === 0) return { direction: 'flat', label: 'No activity yet' };
  if (diff  >  0) return { direction: 'up',   label: `+${diff} this week` };
  if (diff  <  0) return { direction: 'down', label: `${diff} this week`  };
  return             { direction: 'flat', label: `${total} this week` };
};

export const TrendBadge = ({ trend }) => {
  if (!trend) return null;
  const cfg = {
    up:   { Icon: TrendingUp,   bg: 'rgba(167,243,208,0.35)', border: 'rgba(74,222,128,0.3)',   color: '#15803d' },
    down: { Icon: TrendingDown, bg: 'rgba(254,202,202,0.35)', border: 'rgba(252,165,165,0.35)', color: '#b91c1c' },
    flat: { Icon: Minus,        bg: 'rgba(186,220,255,0.3)',  border: 'rgba(147,197,253,0.35)', color: '#2563eb' },
  }[trend.direction];
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 20,
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      fontSize: 10, fontWeight: 800, color: cfg.color,
      marginTop: 5, letterSpacing: '0.2px', whiteSpace: 'nowrap',
    }}>
      <cfg.Icon size={10} />
      {trend.label}
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(175,215,255,0.5)',
      borderRadius: 12, padding: '10px 14px',
      boxShadow: '0 4px 16px rgba(100,160,220,0.15)',
      fontSize: 12, fontWeight: 700, color: '#173a5c',
    }}>
      <div style={{ marginBottom: 4, color: '#84a8c6', fontSize: 11 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color }}>{p.name}: <b>{p.value}</b></div>
      ))}
    </div>
  );
};

const SectionCard = ({ title, subtitle, children, action }) => (
  <div style={{
    background: 'rgba(255,255,255,0.68)', border: '1px solid rgba(175,215,255,0.38)',
    borderRadius: 20, padding: '22px 24px', backdropFilter: 'blur(14px)',
    boxShadow: '0 2px 14px rgba(100,155,215,0.07)',
  }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
      <div>
        <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 700, color: '#173a5c' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11.5, color: '#8aaccb', fontWeight: 600, marginTop: 3 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
    {children}
  </div>
);

const KpiCard = ({ icon: Icon, label, value, sub, accent, trend }) => (
  <div
    style={{
      background: 'rgba(255,255,255,0.68)', border: '1px solid rgba(175,215,255,0.42)',
      borderRadius: 18, padding: '16px 18px', display: 'flex', alignItems: 'flex-start',
      gap: 14, boxShadow: '0 2px 10px rgba(100,160,220,0.07)',
      transition: 'transform .15s, box-shadow .15s', backdropFilter: 'blur(14px)',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 22px rgba(100,160,220,0.13)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 10px rgba(100,160,220,0.07)'; }}
  >
    <div style={{
      width: 42, height: 42, borderRadius: 13,
      background: accent + '22', color: accent,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
    }}>
      <Icon size={20} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 700, color: '#173a5c', lineHeight: 1 }}>
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

const Row = ({ label, value }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 0', borderBottom: '1px solid rgba(170,210,250,0.22)',
  }}>
    <span style={{ fontSize: 13, color: '#6b8eaa', fontWeight: 600 }}>{label}</span>
    <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 700, color: '#173a5c' }}>
      {value ?? '—'}
    </span>
  </div>
);

const WEEKLY_METRICS = [
  { key: 'total_actions',   label: 'All Actions',     color: PALETTE.indigo  },
  { key: 'active_students', label: 'Active Students', color: PALETTE.emerald },
  { key: 'summaries',       label: 'Summaries',       color: PALETTE.amber   },
  { key: 'flashcards',      label: 'Flashcards',      color: PALETTE.violet  },
];

// ── COMPONENT ─────────────────────────────────────────────────────────────
const OverviewTab = ({ stats, health, students, weekly, onTabChange }) => {
  const [weeklyMetric, setWeeklyMetric] = useState('total_actions');
  
  const activeColor = WEEKLY_METRICS.find(m => m.key === weeklyMetric)?.color || PALETTE.indigo;

  const healthItems = [
    { label: 'API Status', Icon: health ? CheckCircle : XCircle, text: health ? 'Online'    : 'Down',   ok: !!health },
    { label: 'Database',   Icon: health ? CheckCircle : XCircle, text: health ? 'Connected' : 'Error',  ok: !!health },
    { label: 'Storage',    Icon: HardDrive,                       text: health?.storage === 'unavailable' ? 'Unavailable' : 'Available', ok: health?.storage !== 'unavailable' },
    { label: 'Last Sync',  Icon: Clock,                           text: new Date().toLocaleTimeString(), ok: true     },
  ];

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 14 }}>
        <KpiCard icon={Zap}           label="Flashcards"  value={stats?.content?.flashcards}  accent="#8b5cf6" sub={`${stats?.avg_per_user?.flashcards} avg/student`} trend={getTrend(weekly, 'flashcards')} />
        <KpiCard icon={MessageSquare} label="Quizzes"     value={stats?.content?.quizzes}     accent="#0ea5e9" sub={`${stats?.avg_per_user?.quizzes} avg/student`}    trend={getTrend(weekly, 'quizzes')}    />
        <KpiCard icon={BookOpen} label="Notebooks" value={stats?.content?.notebooks} accent="#10b981" sub="total created" trend={getTrend(weekly, 'notebooks')} />
        <KpiCard icon={FileText}      label="Summaries"   value={stats?.content?.summaries}   accent="#f59e0b" sub={`${stats?.avg_per_user?.summaries} avg/student`}  trend={getTrend(weekly, 'summaries')}  />
      </div>

      {/* Weekly Activity Chart */}
      <SectionCard
        title="Weekly Student Activity"
        subtitle="Actions taken by students over the past 7 days"
        action={
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {WEEKLY_METRICS.map(m => (
              <button key={m.key} onClick={() => setWeeklyMetric(m.key)} style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 11.5, fontWeight: 700,
                border: weeklyMetric === m.key ? 'none' : '1px solid rgba(170,205,240,0.5)',
                background: weeklyMetric === m.key ? m.color : 'rgba(255,255,255,0.7)',
                color: weeklyMetric === m.key ? '#fff' : '#4a6d8e',
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
                {m.label}
              </button>
            ))}
          </div>
        }
      >
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={weekly?.days || []}>
            <defs>
              <linearGradient id="ovAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={activeColor} stopOpacity={0.28} />
                <stop offset="95%" stopColor={activeColor} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(170,205,240,0.3)" />
            <XAxis dataKey="day" tick={{ fontSize: 12, fontWeight: 700, fill: '#4a6d8e' }} />
            <YAxis tick={{ fontSize: 11, fill: '#84a8c6' }} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone" dataKey={weeklyMetric}
              name={weeklyMetric.replace(/_/g, ' ')}
              stroke={activeColor} strokeWidth={3}
              fill="url(#ovAreaGrad)"
              dot={{ r: 5, fill: activeColor, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 7 }}
            />
          </AreaChart>
        </ResponsiveContainer>
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => onTabChange('reports')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 700, color: '#4a6d8e',
              fontFamily: "'Nunito',sans-serif",
              padding: '4px 2px',
              borderBottom: '1px dashed rgba(100,150,200,0.4)',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#173a5c'}
            onMouseLeave={e => e.currentTarget.style.color = '#4a6d8e'}
          >
            <FileText size={12} />
            See full report
          </button>
        </div>
      </SectionCard>

      

      {/* Top Streakers */}
      <SectionCard title="Top Streakers" subtitle="Students with the longest consecutive learning streaks">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[...students]
            .sort((a, b) => (b.streak || 0) - (a.streak || 0))
            .slice(0, 5)
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
                    🔥 {u.streak}d
                  </div>
                </div>
              </div>
            ))}
        </div>
      </SectionCard>

      

      {/* System Health */}
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