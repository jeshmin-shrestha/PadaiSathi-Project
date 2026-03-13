// ─── components/admin/tabs/OverviewTab.jsx ───────────────────────────────────
import React from 'react';
import { Users, FileText, Video, BookOpen, Zap, MessageSquare, Award } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { StatCard, ChartCard, CustomTooltip } from '../../ui/DashboardUI';
import { PALETTE } from '../../../constants';

const OverviewTab = ({ stats, health, students, adminCount }) => {
  const contentBarData = stats ? [
    { name: 'Docs',       count: stats.content.documents,  fill: PALETTE.indigo  },
    { name: 'Summaries',  count: stats.content.summaries,  fill: PALETTE.emerald },
    { name: 'Flashcards', count: stats.content.flashcards, fill: PALETTE.amber   },
    { name: 'Quizzes',    count: stats.content.quizzes,    fill: PALETTE.rose    },
    { name: 'Videos',     count: stats.content.videos,     fill: PALETTE.sky     },
    { name: 'Notebooks',  count: stats.content.notebooks,  fill: PALETTE.violet  },
  ] : [];

  return (
    <div className="space-y-6">

      {/* Row 1 KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}    label="Total Students" value={students.length}             color="bg-indigo-500"  sub={`+ ${adminCount} admin(s)`} />
        <StatCard icon={FileText} label="Documents"      value={stats?.content.documents}   color="bg-emerald-500" sub={`${stats?.avg_per_user.documents} avg/student`} />
        <StatCard icon={BookOpen} label="Summaries"      value={stats?.content.summaries}   color="bg-amber-500"   sub={`${stats?.avg_per_user.summaries} avg/student`} />
        <StatCard icon={Video}    label="Videos"         value={stats?.content.videos}      color="bg-rose-500" />
      </div>

      {/* Row 2 KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Zap}           label="Flashcards"   value={stats?.content.flashcards} color="bg-violet-500" sub={`${stats?.avg_per_user.flashcards} avg/student`} />
        <StatCard icon={MessageSquare} label="Quizzes"      value={stats?.content.quizzes}    color="bg-sky-500"    sub={`${stats?.avg_per_user.quizzes} avg/student`} />
        <StatCard icon={BookOpen}      label="Notebooks"    value={stats?.content.notebooks}  color="bg-lime-600" />
        <StatCard icon={Award}         label="Total Points" value={stats?.total_points?.toLocaleString()} color="bg-amber-600" sub={`${stats?.avg_points} avg`} />
      </div>

      {/* Content bar chart */}
      <ChartCard title="Content Created — All Time" subtitle="Total items generated across the platform">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={contentBarData} barSize={38}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {contentBarData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* System health */}
      <ChartCard title="⚡ System Health">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'API',       status: health ? '✅ Online'    : '❌ Down',   ok: !!health },
            { label: 'Database',  status: health ? '✅ Connected' : '❌ Error',  ok: !!health },
            { label: 'Storage',   status: '✅ Available',                        ok: true     },
            { label: 'Last Sync', status: new Date().toLocaleTimeString(),        ok: true     },
          ].map(({ label, status, ok }) => (
            <div key={label} className={`p-3 rounded-xl border-2 ${ok ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <p className="text-xs font-bold text-gray-500 mb-1">{label}</p>
              <p className="text-sm font-black text-gray-800">{status}</p>
            </div>
          ))}
        </div>
      </ChartCard>

    </div>
  );
};

export default OverviewTab;