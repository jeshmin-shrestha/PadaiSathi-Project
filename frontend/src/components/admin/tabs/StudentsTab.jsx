// ─── components/admin/tabs/StudentsTab.jsx ───────────────────────────────────
import React, { useState } from 'react';
import { Search, Trash2, Users, ShieldOff, Star, Flame, Eye, X, Mail, Calendar, Shield } from 'lucide-react';

// ── Student Detail Modal ──────────────────────────────────────────────────────
const StudentModal = ({ student, onClose }) => {
  if (!student) return null;

  const joinedDate = student.created_at
    ? new Date(student.created_at).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : '—';

  const daysAgo = student.created_at
    ? Math.floor((new Date() - new Date(student.created_at)) / 86400000)
    : null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(10,30,60,0.35)',
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.15s ease',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%', zIndex: 101,
        transform: 'translate(-50%, -50%)',
        width: '100%', maxWidth: 420,
        background: 'rgba(255,255,255,0.96)',
        border: '1px solid rgba(175,215,255,0.5)',
        borderRadius: 24,
        boxShadow: '0 20px 60px rgba(30,80,160,0.18)',
        backdropFilter: 'blur(20px)',
        animation: 'slideUp 0.2s cubic-bezier(0.22,1,0.36,1)',
        overflow: 'hidden',
      }}>

        {/* Header bar */}
        <div style={{
          background: 'linear-gradient(135deg, #d9eeff 0%, #e8f4ff 100%)',
          borderBottom: '1px solid rgba(170,205,240,0.4)',
          padding: '20px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 700, color: '#173a5c' }}>
            Student Profile
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 8, border: 'none',
              background: 'rgba(170,205,240,0.4)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#4a6d8e', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(170,205,240,0.7)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(170,205,240,0.4)'}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Avatar + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg,#90c8f0,#6aaee0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 24, fontWeight: 800, flexShrink: 0,
              boxShadow: '0 4px 14px rgba(100,170,224,0.35)',
            }}>
              {student.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 700, color: '#173a5c' }}>
                {student.username}
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                marginTop: 4, padding: '2px 10px', borderRadius: 20,
                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                fontSize: 10.5, fontWeight: 800, color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>
                <Shield size={10} />
                {student.role}
              </div>
            </div>
          </div>

          {/* Info rows */}
          <div style={{
            background: 'rgba(186,220,255,0.12)', border: '1px solid rgba(175,215,255,0.35)',
            borderRadius: 16, overflow: 'hidden',
          }}>
            {/* Email */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 18px', borderBottom: '1px solid rgba(170,205,240,0.25)',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: 'rgba(99,102,241,0.1)', color: '#4338ca',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Mail size={14} />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#84a8c6', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 2 }}>Email</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#173a5c' }}>{student.email}</div>
              </div>
            </div>

            {/* Joined date */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 18px',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: 'rgba(16,185,129,0.1)', color: '#059669',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Calendar size={14} />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#84a8c6', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 2 }}>Joined</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#173a5c' }}>
                  {joinedDate}
                  {daysAgo !== null && (
                    <span style={{ fontSize: 11, color: '#84a8c6', fontWeight: 600, marginLeft: 8 }}>
                      ({daysAgo === 0 ? 'Today' : `${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Points + streak */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{
              padding: '14px 16px', borderRadius: 14,
              background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.15)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <Star size={18} color="#7c3aed" />
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#84a8c6', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Points</div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 700, color: '#7c3aed' }}>{student.points}</div>
              </div>
            </div>
            <div style={{
              padding: '14px 16px', borderRadius: 14,
              background: 'rgba(234,88,12,0.07)', border: '1px solid rgba(234,88,12,0.15)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <Flame size={18} color="#ea580c" />
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#84a8c6', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Streak</div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 700, color: '#ea580c' }}>{student.streak}d</div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid rgba(170,205,240,0.3)',
          display: 'flex', justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 22px', borderRadius: 11, border: 'none',
              background: 'linear-gradient(135deg,#6aaee0,#4a90d9)',
              color: '#fff', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: "'Nunito',sans-serif",
              boxShadow: '0 2px 10px rgba(74,144,217,0.3)',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Close
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, calc(-50% + 16px)) } to { opacity: 1; transform: translate(-50%, -50%) } }
      `}</style>
    </>
  );
};

// ── Confirm Delete Modal ──────────────────────────────────────────────────────
const ConfirmDeleteModal = ({ student, onConfirm, onCancel }) => {
  if (!student) return null;
  return (
    <>
      <div
        onClick={onCancel}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(10,30,60,0.35)',
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.15s ease',
        }}
      />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', zIndex: 201,
        transform: 'translate(-50%, -50%)',
        width: '100%', maxWidth: 380,
        background: 'rgba(255,255,255,0.97)',
        border: '1px solid rgba(175,215,255,0.5)',
        borderRadius: 24,
        boxShadow: '0 20px 60px rgba(30,80,160,0.18)',
        backdropFilter: 'blur(20px)',
        animation: 'slideUp 0.2s cubic-bezier(0.22,1,0.36,1)',
        overflow: 'hidden',
        fontFamily: "'Nunito', sans-serif",
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #fff0f0 0%, #ffe8e8 100%)',
          borderBottom: '1px solid rgba(252,165,165,0.35)',
          padding: '18px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 700, color: '#991b1b', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Trash2 size={15} /> Delete Student
          </div>
          <button
            onClick={onCancel}
            style={{
              width: 28, height: 28, borderRadius: 8, border: 'none',
              background: 'rgba(252,165,165,0.3)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#991b1b',
            }}
          >
            <X size={13} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#173a5c', marginBottom: 6 }}>
            Permanently delete <strong>"{student.username}"</strong>?
          </p>
          <p style={{ fontSize: 12, color: '#84a8c6', fontWeight: 500 }}>
            This will remove all their summaries, flashcards, quizzes, videos, and notebooks. This cannot be undone.
          </p>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid rgba(170,205,240,0.3)',
          display: 'flex', justifyContent: 'flex-end', gap: 10,
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '9px 20px', borderRadius: 11, border: '1px solid rgba(170,205,240,0.5)',
              background: 'rgba(255,255,255,0.8)', color: '#4a6d8e',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito',sans-serif",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '9px 20px', borderRadius: 11, border: 'none',
              background: 'linear-gradient(135deg,#f87171,#dc2626)',
              color: '#fff', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: "'Nunito',sans-serif",
              boxShadow: '0 2px 10px rgba(220,38,38,0.3)',
            }}
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </>
  );
};

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
const StudentsTab = ({ students, adminCount, onDelete, deletingId }) => {
  const [search,          setSearch]          = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [pendingDelete,   setPendingDelete]   = useState(null);

  const filtered = students.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Modals */}
      <StudentModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
      <ConfirmDeleteModal
        student={pendingDelete}
        onConfirm={() => { onDelete(pendingDelete.id, pendingDelete.username); setPendingDelete(null); }}
        onCancel={() => setPendingDelete(null)}
      />

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

      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(170,205,240,0.5)',
        borderRadius: 14, padding: '12px 16px', backdropFilter: 'blur(12px)',
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
        background: 'rgba(255,255,255,0.68)', border: '1px solid rgba(175,215,255,0.42)',
        borderRadius: 20, overflow: 'hidden', backdropFilter: 'blur(14px)',
        boxShadow: '0 2px 14px rgba(100,155,215,0.07)',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 720, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(186,220,255,0.2)', borderBottom: '1px solid rgba(170,205,240,0.35)' }}>
                {['Student', 'Email', 'Points', 'Streak', 'Actions'].map((h, i) => (
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
                      <Star size={13} /> {u.points}
                    </div>
                  </td>

                  {/* Streak */}
                  <td style={{ padding: '13px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#ea580c', fontWeight: 800, fontSize: 13 }}>
                      <Flame size={13} /> {u.streak}d
                    </div>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '13px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                      {/* View button */}
                      <button
                        onClick={() => setSelectedStudent(u)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '7px 13px', borderRadius: 10,
                          background: 'rgba(186,220,255,0.3)', border: '1px solid rgba(170,205,240,0.5)',
                          color: '#2a5a8c', fontSize: 12, fontWeight: 700,
                          cursor: 'pointer', transition: 'all 0.15s',
                          fontFamily: "'Nunito',sans-serif",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(170,205,240,0.5)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(186,220,255,0.3)'}
                      >
                        <Eye size={12} /> View
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={() => setPendingDelete(u)}
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
                    </div>
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