import React from 'react';
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Activity, Users, FileText, Zap } from 'lucide-react';
import { PALETTE } from '../../../constants';

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
    background: 'rgba(255,255,255,0.68)', border: '1px solid rgba(175,215,255,0.38)',
    borderRadius: 20, padding: '22px 24px', backdropFilter: 'blur(14px)',
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
    background: 'rgba(255,255,255,0.68)', border: '1px solid rgba(175,215,255,0.42)',
    borderRadius: 18, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
    backdropFilter: 'blur(12px)', boxShadow: '0 2px 8px rgba(100,160,220,0.06)',
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

const AnalyticsTab = ({ stats, weekly }) => (
  <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

    {/* Weekly summary mini-cards */}
    {weekly && (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
        <MiniStatCard Icon={Activity} label="Actions This Week"  value={weekly.totals.total_actions}    accent="#6366f1" />
        <MiniStatCard Icon={Users}    label="Avg Active / Day"   value={weekly.totals.avg_daily_active} accent="#10b981" />
        <MiniStatCard Icon={FileText} label="Summaries (Week)"   value={weekly.totals.summaries}        accent="#f59e0b" />
        <MiniStatCard Icon={Zap}      label="Peak Day"           value={weekly.totals.peak_day}         accent="#ef4444" />
      </div>
    )}

    {/* Activity breakdown by type (bar) */}
    <SectionCard title="Activity Breakdown by Type" subtitle="Docs, summaries, flashcards, quizzes and videos side-by-side">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={weekly?.days || []} barSize={10}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(170,205,240,0.3)" />
          <XAxis dataKey="day" tick={{ fontSize: 12, fontWeight: 700, fill: '#4a6d8e' }} />
          <YAxis tick={{ fontSize: 11, fill: '#84a8c6' }} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="documents"  name="Docs"       fill={PALETTE.indigo}  radius={[3,3,0,0]} />
          <Bar dataKey="summaries"  name="Summaries"  fill={PALETTE.emerald} radius={[3,3,0,0]} />
          <Bar dataKey="flashcards" name="Flashcards" fill={PALETTE.amber}   radius={[3,3,0,0]} />
          <Bar dataKey="quizzes"    name="Quizzes"    fill={PALETTE.rose}    radius={[3,3,0,0]} />
          <Bar dataKey="videos"     name="Videos"     fill={PALETTE.sky}     radius={[3,3,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </SectionCard>

    {/* Points distribution + avg content */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
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

  </div>
);

export default AnalyticsTab;