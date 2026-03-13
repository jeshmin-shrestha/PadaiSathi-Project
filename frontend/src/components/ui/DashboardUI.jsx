// ─── components/ui/DashboardUI.jsx ───────────────────────────────────────────
// Reusable primitives used across all AdminDashboard tabs.

import React from 'react';

/** KPI card with icon, value, label, optional trend badge and sub-text */
export const StatCard = ({ icon: Icon, label, value, color, sub, trend }) => (
  <div className="bg-white rounded-2xl border-2 border-black p-5 flex flex-col justify-between h-full min-h-[110px]">
    <div className="flex items-start justify-between mb-2">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      {trend !== undefined && (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
          trend >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'
        }`}>
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

/** Chart wrapper with a consistent header */
export const ChartCard = ({ title, subtitle, children, className = '' }) => (
  <div className={`bg-white rounded-3xl border-2 border-black p-6 ${className}`}>
    {title && <h2 className="text-lg font-black text-gray-900 mb-0.5">{title}</h2>}
    {subtitle && <p className="text-xs text-gray-400 mb-4">{subtitle}</p>}
    {children}
  </div>
);

/** Recharts tooltip that matches the app's design system */
export const CustomTooltip = ({ active, payload, label }) => {
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