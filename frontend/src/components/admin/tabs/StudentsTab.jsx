// ─── components/admin/tabs/StudentsTab.jsx ───────────────────────────────────
import React, { useState } from 'react';
import { Search, Trash2 } from 'lucide-react';

const StudentsTab = ({ students, adminCount, onDelete, deletingId }) => {
  const [search, setSearch] = useState('');

  const filtered = students.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">

      {/* Counts */}
      <div className="flex flex-wrap gap-3 items-center">
        <span className="px-3 py-1.5 bg-gray-800 text-white text-xs font-black rounded-full">
          {students.length} Students
        </span>
        <span className="px-3 py-1.5 bg-gray-200 border border-gray-400 text-gray-700 text-xs font-black rounded-full">
          {adminCount} Admins (hidden from platform)
        </span>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border-2 border-black px-4 py-3 flex items-center gap-3">
        <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search by username or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 outline-none text-gray-800 text-sm bg-transparent"
        />
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border-2 border-black overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-black">
              {['Student', 'Email', 'Points', 'Streak', 'Action'].map((h, i) => (
                <th key={h} className={`px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider ${i === 4 ? 'text-right' : 'text-left'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => (
              <tr key={u.id} className={`border-b border-gray-100 hover:bg-gray-50 transition ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-black flex-shrink-0">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold text-gray-900 truncate">{u.username}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-[200px]">{u.email}</td>
                <td className="px-6 py-4">
                  <span className="text-sm font-black text-purple-600">⭐ {u.points}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-black text-orange-500">🔥 {u.streak}d</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => onDelete(u.id, u.username)}
                    disabled={deletingId === u.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition border border-red-200 disabled:opacity-40 ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {deletingId === u.id ? 'Deleting…' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-gray-400 text-sm">
                  No students found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default StudentsTab;