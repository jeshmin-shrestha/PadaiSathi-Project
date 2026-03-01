import React, { useState, useEffect } from 'react';
import { LogOut, Camera, Lock, X, Check, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const AVATARS = [
  { id: 'avatar1',  img: '/avatars/avatar1.jpeg',  label: 'Avatar 1',  bg: 'from-green-400 to-green-600' },
  { id: 'avatar2',  img: '/avatars/avatar2.jpeg',  label: 'Avatar 2',  bg: 'from-pink-400 to-pink-600' },
  { id: 'avatar3',  img: '/avatars/avatar2.jpeg',  label: 'Avatar 3',  bg: 'from-blue-400 to-blue-600' },
  { id: 'avatar4',  img: '/avatars/avatar2.jpeg',  label: 'Avatar 4',  bg: 'from-purple-400 to-purple-600' },
  { id: 'avatar5',  img: '/avatars/avatar1.jpeg',  label: 'Avatar 5',  bg: 'from-gray-600 to-gray-800' },
  { id: 'avatar6',  img: '/avatars/avatar2.jpeg',  label: 'Avatar 6',  bg: 'from-amber-400 to-orange-500' },
  { id: 'avatar7',  img: '/avatars/avatar1.jpeg',  label: 'Avatar 7',  bg: 'from-cyan-400 to-cyan-600' },
  { id: 'avatar8',  img: '/avatars/avatar1.jpeg',  label: 'Avatar 8',  bg: 'from-lime-400 to-lime-600' },
  { id: 'avatar9',  img: '/avatars/avatar2.jpeg',  label: 'Avatar 9',  bg: 'from-red-400 to-orange-500' },
  { id: 'avatar10', img: '/avatars/avatar2.jpeg', label: 'Avatar 10', bg: 'from-yellow-400 to-yellow-500' },
  { id: 'avatar11', img: '/avatars/avatar1.jpeg', label: 'Avatar 11', bg: 'from-sky-300 to-indigo-400' },
  { id: 'avatar12', img: '/avatars/avatar1.jpeg', label: 'Avatar 12', bg: 'from-yellow-500 to-amber-600' },
];

const API = 'http://127.0.0.1:8000';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [modal, setModal] = useState(null);

  const [selectedAvatar, setSelectedAvatar] = useState('avatar1');
  const [avatarSaving, setAvatarSaving] = useState(false);

  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('user'));
    if (!stored) { window.location.href = '/login'; return; }
    setUser(stored);
    setSelectedAvatar(stored.avatar || 'avatar1');
  }, []);

  const currentAvatar = AVATARS.find(a => a.id === (user?.avatar || 'avatar1')) || AVATARS[0];
  const previewAvatar = AVATARS.find(a => a.id === selectedAvatar) || AVATARS[0];

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  const handleSaveAvatar = async () => {
    setAvatarSaving(true);
    try {
      await fetch(`${API}/api/update-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, avatar: selectedAvatar }),
      });
    } catch {
      // backend may not be ready, save locally anyway
    } finally {
      const updated = { ...user, avatar: selectedAvatar };
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      setAvatarSaving(false);
      setModal(null);
    }
  };

  const handleChangePassword = async () => {
    setPwError('');
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) { setPwError('All fields are required.'); return; }
    if (pwForm.newPw.length < 6) { setPwError('New password must be at least 6 characters.'); return; }
    if (pwForm.newPw !== pwForm.confirm) { setPwError('Passwords do not match.'); return; }
    setPwLoading(true);
    try {
      const res = await fetch(`${API}/api/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, current_password: pwForm.current, new_password: pwForm.newPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed');
      setPwSuccess(true);
      setTimeout(() => { setModal(null); setPwSuccess(false); setPwForm({ current: '', newPw: '', confirm: '' }); }, 1500);
    } catch (e) {
      setPwError(e.message || 'Something went wrong.');
    } finally {
      setPwLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-200">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="bg-gray-100 rounded-3xl p-10 border-4 border-black shadow-xl">

          {/* Avatar display */}
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${currentAvatar.bg} border-4 border-white shadow-lg overflow-hidden transition-transform group-hover:scale-105`}>
                <img src={currentAvatar.img} alt={currentAvatar.label} className="w-full h-full object-cover" />
              </div>
              <button
                onClick={() => { setSelectedAvatar(user.avatar || 'avatar1'); setModal('avatar'); }}
                className="absolute bottom-0 right-0 bg-black text-white rounded-full w-9 h-9 flex items-center justify-center border-2 border-white hover:bg-gray-700 transition shadow"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 text-center mb-1">{user.username}</h1>
          <p className="text-center text-gray-500 mb-8 capitalize font-medium">{user.role} · {currentAvatar.label}</p>

          {/* Profile Info */}
          <div className="mb-8 rounded-2xl border-2 border-gray-200 overflow-hidden">
            {[
              { label: 'Username', value: user.username },
              { label: 'Email',    value: user.email },
              { label: 'Points',   value: `🏆 ${user.points} pts`,  accent: 'text-purple-600 font-bold' },
              { label: 'Streak',   value: `🔥 ${user.streak} days`, accent: 'text-orange-500 font-bold' },
              { label: 'Role',     value: user.role, extra: 'capitalize' },
            ].map((row, i) => (
              <div key={i} className={`flex items-center justify-between px-5 py-4 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{row.label}</span>
                <span className={`text-base text-gray-900 ${row.accent || ''} ${row.extra || ''}`}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => { setSelectedAvatar(user.avatar || 'avatar1'); setModal('avatar'); }}
              className="w-full bg-white border-2 border-black text-black py-3.5 rounded-xl font-bold text-base hover:bg-gray-50 transition flex items-center justify-between px-5"
            >
              <div className="flex items-center space-x-3"><Camera className="w-5 h-5" /><span>Change Avatar</span></div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>

            <button
              onClick={() => { setModal('password'); setPwError(''); setPwSuccess(false); setPwForm({ current: '', newPw: '', confirm: '' }); }}
              className="w-full bg-white border-2 border-black text-black py-3.5 rounded-xl font-bold text-base hover:bg-gray-50 transition flex items-center justify-between px-5"
            >
              <div className="flex items-center space-x-3"><Lock className="w-5 h-5" /><span>Change Password</span></div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>

            <button
              onClick={handleLogout}
              className="w-full bg-black text-white py-3.5 rounded-xl font-bold text-base hover:bg-gray-800 transition flex items-center justify-center space-x-3"
            >
              <LogOut className="w-5 h-5" /><span>Log Out</span>
            </button>
          </div>
        </div>
      </div>

      <footer className="text-center py-6 text-gray-600 text-sm mt-2">© PadaiSathi All rights reserved.</footer>

      {/* MODALS */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl border-4 border-black w-full max-w-md shadow-2xl">

            {/* Avatar Modal */}
            {modal === 'avatar' && (
              <div className="p-7">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Choose Your Avatar</h2>
                  <button onClick={() => setModal(null)} className="text-gray-400 hover:text-black"><X className="w-6 h-6" /></button>
                </div>

                <div className="grid grid-cols-4 gap-3 mb-6">
                  {AVATARS.map(av => (
                    <button
                      key={av.id}
                      onClick={() => setSelectedAvatar(av.id)}
                      className="relative flex flex-col items-center p-2 rounded-2xl transition-all"
                      style={{
                        border: selectedAvatar === av.id ? '3px solid black' : '3px solid transparent',
                        background: selectedAvatar === av.id ? '#f9fafb' : 'transparent',
                        transform: selectedAvatar === av.id ? 'scale(1.05)' : 'scale(1)',
                      }}
                    >
                      <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${av.bg} overflow-hidden mb-1`}>
                        <img src={av.img} alt={av.label} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-xs font-medium text-gray-600">{av.label}</span>
                      {selectedAvatar === av.id && (
                        <div className="absolute -top-1.5 -right-1.5 bg-black rounded-full w-5 h-5 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Preview */}
                <div className="flex items-center space-x-3 bg-gray-50 rounded-2xl p-3 mb-5 border-2 border-gray-200">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${previewAvatar.bg} overflow-hidden flex-shrink-0`}>
                    <img src={previewAvatar.img} alt={previewAvatar.label} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{user.username}</p>
                    <p className="text-sm text-gray-500">{previewAvatar.label}</p>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button onClick={() => setModal(null)} className="flex-1 py-3 rounded-xl border-2 border-gray-300 font-bold text-gray-600 hover:border-gray-400 transition">Cancel</button>
                  <button onClick={handleSaveAvatar} disabled={avatarSaving} className="flex-1 py-3 rounded-xl bg-black text-white font-bold hover:bg-gray-800 transition disabled:opacity-60">
                    {avatarSaving ? 'Saving…' : 'Save Avatar'}
                  </button>
                </div>
              </div>
            )}

            {/* Password Modal */}
            {modal === 'password' && (
              <div className="p-7">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Change Password</h2>
                  <button onClick={() => setModal(null)} className="text-gray-400 hover:text-black"><X className="w-6 h-6" /></button>
                </div>

                {pwSuccess ? (
                  <div className="flex flex-col items-center py-8 space-y-3">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-lg font-bold text-green-700">Password Updated!</p>
                  </div>
                ) : (
                  <>
                    {[
                      { key: 'current', label: 'Current Password',    placeholder: 'Enter current password' },
                      { key: 'newPw',   label: 'New Password',         placeholder: 'At least 6 characters' },
                      { key: 'confirm', label: 'Confirm New Password', placeholder: 'Repeat new password' },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key} className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                        <div className="relative">
                          <input
                            type={showPw[key] ? 'text' : 'password'}
                            value={pwForm[key]}
                            onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                            placeholder={placeholder}
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 pr-11 text-base focus:border-black focus:outline-none transition"
                          />
                          <button type="button" onClick={() => setShowPw(s => ({ ...s, [key]: !s[key] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                            {showPw[key] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                    ))}

                    {pwError && (
                      <div className="bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-medium mb-4">{pwError}</div>
                    )}

                    <div className="flex space-x-3 mt-2">
                      <button onClick={() => setModal(null)} className="flex-1 py-3 rounded-xl border-2 border-gray-300 font-bold text-gray-600 hover:border-gray-400 transition">Cancel</button>
                      <button onClick={handleChangePassword} disabled={pwLoading} className="flex-1 py-3 rounded-xl bg-black text-white font-bold hover:bg-gray-800 transition disabled:opacity-60">
                        {pwLoading ? 'Updating…' : 'Update Password'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;