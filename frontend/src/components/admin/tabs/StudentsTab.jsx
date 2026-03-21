// ─── components/admin/tabs/StudentsTab.jsx ───────────────────────────────────
import React, { useState } from 'react';
import { Search, Trash2, Users, ShieldOff, Star, Flame } from 'lucide-react';

const StudentsTab = ({ students, adminCount, onDelete, deletingId }) => {
  const [search, setSearch] = useState('');

  const filtered = students.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Count chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '7px 14px', borderRadius: 20,
          background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
          fontSize: 12, fontWeight: 800, color: '#4338ca',
        }}>
          <Users size={13} />
          {students.length} Students
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '7px 14px', borderRadius: 20,
          background: 'rgba(156,163,175,0.12)', border: '1px solid rgba(156,163,175,0.3)',
          fontSize: 12, fontWeight: 800, color: '#6b7280',
        }}>
          <ShieldOff size={13} />
          {adminCount} Admins (hidden from platform)
        </div>
      </div>

      {/* Search bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(170,205,240,0.5)',
        borderRadius: 14, padding: '12px 16px',
        backdropFilter: 'blur(12px)',
      }}>
        <Search size={16} color="#84a8c6" style={{ flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search by username or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, border: 'none', outline: 'none',
            background: 'transparent', fontSize: 13.5, fontWeight: 600,
            color: '#173a5c', fontFamily: "'Nunito',sans-serif",
          }}
        />
        <span style={{ fontSize: 11, color: '#84a8c6', fontWeight: 700, whiteSpace: 'nowrap' }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div style={{
        background: 'rgba(255,255,255,0.68)',
        border: '1px solid rgba(175,215,255,0.42)',
        borderRadius: 20, overflow: 'hidden',
        backdropFilter: 'blur(14px)',
        boxShadow: '0 2px 14px rgba(100,155,215,0.07)',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 680, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(186,220,255,0.2)', borderBottom: '1px solid rgba(170,205,240,0.35)' }}>
                {['Student', 'Email', 'Points', 'Streak', 'Action'].map((h, i) => (
                  <th key={h} style={{
                    padding: '13px 20px',
                    fontSize: 10.5, fontWeight: 800, color: '#6b95b8',
                    textTransform: 'uppercase', letterSpacing: '1px',
                    textAlign: i === 4 ? 'right' : 'left',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr
                  key={u.id}
                  style={{
                    borderBottom: '1px solid rgba(170,205,240,0.2)',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(186,220,255,0.06)',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(186,220,255,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(186,220,255,0.06)'}
                >
                  {/* Name */}
                  <td style={{ padding: '13px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: 'linear-gradient(135deg,#90c8f0,#6aaee0)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 13, fontWeight: 800, flexShrink: 0,
                      }}>
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 700, color: '#173a5c', fontSize: 13.5 }}>{u.username}</span>
                    </div>
                  </td>

                  {/* Email */}
                  <td style={{ padding: '13px 20px', fontSize: 12.5, color: '#6b95b8', fontWeight: 500 }}>
                    {u.email}
                  </td>

                  {/* Points */}
                  <td style={{ padding: '13px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#7c3aed', fontWeight: 800, fontSize: 13 }}>
                      <Star size={13} />
                      {u.points}
                    </div>
                  </td>

                  {/* Streak */}
                  <td style={{ padding: '13px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#ea580c', fontWeight: 800, fontSize: 13 }}>
                      <Flame size={13} />
                      {u.streak}d
                    </div>
                  </td>

                  {/* Delete */}
                  <td style={{ padding: '13px 20px', textAlign: 'right' }}>
                    <button
                      onClick={() => onDelete(u.id, u.username)}
                      disabled={deletingId === u.id}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '7px 13px', borderRadius: 10,
                        background: 'rgba(254,202,202,0.3)', border: '1px solid rgba(252,165,165,0.4)',
                        color: '#dc2626', fontSize: 12, fontWeight: 700,
                        cursor: deletingId === u.id ? 'not-allowed' : 'pointer',
                        opacity: deletingId === u.id ? 0.45 : 1,
                        transition: 'all 0.15s',
                        fontFamily: "'Nunito',sans-serif",
                      }}
                      onMouseEnter={e => { if (deletingId !== u.id) e.currentTarget.style.background = 'rgba(252,165,165,0.45)'; }}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(254,202,202,0.3)'}
                    >
                      <Trash2 size={12} />
                      {deletingId === u.id ? 'Deleting…' : 'Remove'}
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '60px 0', textAlign: 'center', color: '#84a8c6', fontSize: 13, fontWeight: 600 }}>
                    No students found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default StudentsTab;