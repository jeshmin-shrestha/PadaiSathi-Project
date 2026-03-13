// ─── components/admin/tabs/ReportsTab.jsx ────────────────────────────────────
import React from 'react';

const RANK_MEDAL = ['🥇', '🥈', '🥉'];

const ReportsTab = ({ stats, weekly, students }) => (
  <div className="space-y-6">

    {/* Weekly activity table */}
    {weekly && (
      <div className="bg-white rounded-3xl border-2 border-black p-6">
        <h2 className="text-lg font-black text-gray-900 mb-0.5">📅 This Week's Activity Report</h2>
        <p className="text-xs text-gray-400 mb-4">Day-by-day student engagement for the past 7 days</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b-2 border-black">
                {['Day', 'Date', 'Active Students', 'Docs', 'Summaries', 'Flashcards', 'Quizzes', 'Videos', 'Total'].map((h, i) => (
                  <th key={h} className={`pb-3 text-xs font-black text-gray-500 uppercase tracking-wider ${i === 0 ? 'text-left' : 'text-center'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weekly.days.map(d => {
                const isPeak = d.total_actions === Math.max(...weekly.days.map(x => x.total_actions)) && d.total_actions > 0;
                return (
                  <tr key={d.date} className={`border-b border-gray-100 last:border-0 ${isPeak ? 'bg-indigo-50' : ''}`}>
                    <td className="py-2.5 font-black text-gray-800">{d.day}</td>
                    <td className="py-2.5 text-center text-xs text-gray-400">{d.date.slice(5)}</td>
                    <td className="py-2.5 text-center font-bold text-emerald-600">{d.active_students}</td>
                    <td className="py-2.5 text-center text-sm font-semibold text-gray-700">{d.documents}</td>
                    <td className="py-2.5 text-center text-sm font-semibold text-gray-700">{d.summaries}</td>
                    <td className="py-2.5 text-center text-sm font-semibold text-gray-700">{d.flashcards}</td>
                    <td className="py-2.5 text-center text-sm font-semibold text-gray-700">{d.quizzes}</td>
                    <td className="py-2.5 text-center text-sm font-semibold text-gray-700">{d.videos}</td>
                    <td className="py-2.5 text-center font-black text-indigo-600">{d.total_actions}</td>
                  </tr>
                );
              })}
              {/* Totals row */}
              <tr className="border-t-2 border-black bg-gray-50">
                <td className="py-2.5 font-black text-gray-900" colSpan={2}>📊 Week Total</td>
                <td className="py-2.5 text-center font-black text-emerald-700">{weekly.totals.avg_daily_active}/day</td>
                <td className="py-2.5 text-center font-black text-gray-900">{weekly.totals.documents}</td>
                <td className="py-2.5 text-center font-black text-gray-900">{weekly.totals.summaries}</td>
                <td className="py-2.5 text-center font-black text-gray-900">{weekly.totals.flashcards}</td>
                <td className="py-2.5 text-center font-black text-gray-900">{weekly.totals.quizzes}</td>
                <td className="py-2.5 text-center font-black text-gray-900">{weekly.totals.videos}</td>
                <td className="py-2.5 text-center font-black text-indigo-700">{weekly.totals.total_actions}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-3">🔵 Highlighted row = most active day of the week</p>
      </div>
    )}

    {/* Summary + Engagement cards */}
    <div className="grid md:grid-cols-2 gap-6">

      <div className="bg-white rounded-3xl border-2 border-black p-6">
        <h2 className="text-lg font-black text-gray-900 mb-4">📋 Platform Summary Report</h2>
        <div className="space-y-3">
          {[
            { label: 'Total Students Registered', value: students.length },
            { label: 'Total Documents Uploaded',  value: stats?.content.documents },
            { label: 'Total Summaries Generated', value: stats?.content.summaries },
            { label: 'Total Flashcards Created',  value: stats?.content.flashcards },
            { label: 'Total Quizzes Attempted',   value: stats?.content.quizzes },
            { label: 'Total Videos Generated',    value: stats?.content.videos },
            { label: 'Total Notebooks',           value: stats?.content.notebooks },
            { label: 'Total Points Earned',       value: stats?.total_points?.toLocaleString() },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <span className="text-sm text-gray-600 font-medium">{label}</span>
              <span className="text-sm font-black text-gray-900">{value ?? '—'}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border-2 border-black p-6">
        <h2 className="text-lg font-black text-gray-900 mb-4">🎯 Engagement Report</h2>
        <div className="space-y-3 mb-6">
          {[
            { label: 'Avg Points per Student',     value: stats?.avg_points },
            { label: 'Avg Streak (days)',           value: `${stats?.avg_streak} days` },
            { label: 'Avg Documents per Student',  value: stats?.avg_per_user.documents },
            { label: 'Avg Summaries per Student',  value: stats?.avg_per_user.summaries },
            { label: 'Avg Flashcards per Student', value: stats?.avg_per_user.flashcards },
            { label: 'Avg Quizzes per Student',    value: stats?.avg_per_user.quizzes },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <span className="text-sm text-gray-600 font-medium">{label}</span>
              <span className="text-sm font-black text-gray-900">{value ?? '—'}</span>
            </div>
          ))}
        </div>
        {/* Engagement score bar */}
        <div>
          <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
            <span>Platform Engagement Score</span>
            <span>{Math.min(Math.round((stats?.avg_points || 0) / 20), 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(Math.round((stats?.avg_points || 0) / 20), 100)}%` }}
            />
          </div>
        </div>
      </div>

    </div>

    {/* Recently joined */}
    <div className="bg-white rounded-3xl border-2 border-black p-6">
      <h2 className="text-lg font-black text-gray-900 mb-4">🆕 Recently Joined Students</h2>
      <div className="space-y-3">
        {[...students].slice(-8).reverse().map(u => (
          <div key={u.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
              {u.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm truncate">{u.username}</p>
              <p className="text-xs text-gray-500 truncate">{u.email}</p>
            </div>
            <div className="flex gap-3 flex-shrink-0 text-xs font-black">
              <span className="text-purple-600">⭐ {u.points}</span>
              <span className="text-orange-500">🔥 {u.streak}d</span>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Top 10 performers */}
    <div className="bg-white rounded-3xl border-2 border-black p-6">
      <h2 className="text-lg font-black text-gray-900 mb-4">🏅 Top 10 Performers</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-black">
              {['Rank', 'Student', 'Points', 'Streak'].map((h, i) => (
                <th key={h} className={`pb-3 text-xs font-black text-gray-500 uppercase tracking-wider ${i === 0 ? 'text-center w-12' : 'text-left'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats?.top_users?.map((u, i) => (
              <tr key={i} className="border-b border-gray-100 last:border-0">
                <td className="py-3 text-center">
                  <span className={`font-black text-lg ${i < 3 ? '' : 'text-gray-400'}`}>
                    {i < 3 ? RANK_MEDAL[i] : `#${i + 1}`}
                  </span>
                </td>
                <td className="py-3 font-bold text-gray-900">{u.name}</td>
                <td className="py-3 font-black text-purple-600">⭐ {u.points}</td>
                <td className="py-3 font-black text-orange-500">🔥 {u.streak}d</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

  </div>
);

export default ReportsTab;