import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Camera, Lock, X, Check, Eye, EyeOff, ChevronRight, Upload, Trophy, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { API } from '../constants';

const AVATARS = [
  { id: 'avatar1',  img: '/avatars/avatar1.jpeg',  label: 'Student',              bg: 'from-green-400 to-green-600' },
  { id: 'avatar2',  img: '/avatars/avatar2.jpeg',  label: 'Wizard',               bg: 'from-pink-400 to-pink-600' },
  { id: 'avatar3',  img: '/avatars/avatar3.jpeg',  label: 'Nerd',                 bg: 'from-blue-400 to-blue-600' },
  { id: 'avatar4',  img: '/avatars/avatar12.jpeg', label: 'Gamer',                bg: 'from-purple-400 to-purple-600' },
  { id: 'avatar5',  img: '/avatars/avatar5.jpeg',  label: 'Champion',             bg: 'from-gray-600 to-gray-800' },
  { id: 'avatar6',  img: '/avatars/avatar4.jpeg',  label: 'Artist',               bg: 'from-amber-400 to-orange-500' },
  { id: 'avatar7',  img: '/avatars/avatar6.jpeg',  label: 'Ballerina Cappucina',  bg: 'from-cyan-400 to-cyan-600' },
  { id: 'avatar8',  img: '/avatars/avatar7.jpeg',  label: 'Cappuccino Assassino', bg: 'from-lime-400 to-lime-600' },
  { id: 'avatar9',  img: '/avatars/avatar8.jpeg',  label: 'Tralalero Tralala',    bg: 'from-red-400 to-orange-500' },
  { id: 'avatar10', img: '/avatars/avatar9.jpeg',  label: 'Harry Potter',         bg: 'from-yellow-400 to-yellow-500' },
  { id: 'avatar11', img: '/avatars/avatar10.jpeg', label: 'One Piece',            bg: 'from-sky-300 to-indigo-400' },
  { id: 'avatar12', img: '/avatars/avatar11.jpeg', label: 'Roblux',               bg: 'from-yellow-500 to-amber-600' },
];

const CUSTOM_AVATAR_ID  = 'custom';
const CUSTOM_AVATAR_KEY = 'user_custom_avatar';

const PAD_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Sora:wght@400;600;700;800&display=swap');
  .pad-bg * { font-family: 'Nunito', sans-serif; }
  .pad-bg {
    background: radial-gradient(ellipse 85% 55% at 5% 0%, rgba(186,220,255,0.6) 0%, transparent 60%),
                radial-gradient(ellipse 70% 50% at 95% 10%, rgba(200,225,255,0.5) 0%, transparent 55%),
                radial-gradient(ellipse 60% 40% at 50% 100%, rgba(176,212,255,0.4) 0%, transparent 60%),
                #e8f1fb;
    min-height: 100vh;
  }
  .pad-card {
    background: rgba(255,255,255,0.62);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border: 1px solid rgba(175,215,255,0.38);
    border-radius: 22px;
  }
  .pad-modal {
    background: rgba(255,255,255,0.95);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(175,215,255,0.4);
    border-radius: 28px;
  }
`;

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [modal, setModal] = useState(null);

  const [selectedAvatar, setSelectedAvatar] = useState('avatar1');
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [customImageBase64, setCustomImageBase64] = useState(null);
  const [previewCustomImage, setPreviewCustomImage] = useState(null);
  const fileInputRef = useRef(null);

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
    const savedCustom = localStorage.getItem(CUSTOM_AVATAR_KEY);
    if (savedCustom) setCustomImageBase64(savedCustom);
  }, []);

  const resolveAvatarImg = (avatarId, base64 = customImageBase64) => {
    if (avatarId === CUSTOM_AVATAR_ID) return base64 || null;
    return AVATARS.find(a => a.id === avatarId)?.img || AVATARS[0].img;
  };

  const resolveAvatarBg = (avatarId) => {
    if (avatarId === CUSTOM_AVATAR_ID) return 'from-indigo-400 to-purple-500';
    return AVATARS.find(a => a.id === avatarId)?.bg || AVATARS[0].bg;
  };

  const resolveAvatarLabel = (avatarId) => {
    if (avatarId === CUSTOM_AVATAR_ID) return 'My Photo';
    return AVATARS.find(a => a.id === avatarId)?.label || 'Student';
  };

  const currentAvatarImg   = resolveAvatarImg(user?.avatar || 'avatar1');
  const currentAvatarBg    = resolveAvatarBg(user?.avatar || 'avatar1');
  const currentAvatarLabel = resolveAvatarLabel(user?.avatar || 'avatar1');

  const previewImg   = selectedAvatar === CUSTOM_AVATAR_ID ? (previewCustomImage || customImageBase64) : resolveAvatarImg(selectedAvatar);
  const previewBg    = resolveAvatarBg(selectedAvatar);
  const previewLabel = resolveAvatarLabel(selectedAvatar);

  const handleLogout = () => setModal('logout');

  const confirmLogout = () => {
    ['padai_flashcards', 'padai_quiz', 'padai_summaries', 'padai_video_job', 'padai_video'].forEach(k => localStorage.removeItem(k));
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please select an image file.'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreviewCustomImage(ev.target.result);
      setSelectedAvatar(CUSTOM_AVATAR_ID);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = async () => {
    setAvatarSaving(true);
    try {
      if (selectedAvatar === CUSTOM_AVATAR_ID && previewCustomImage) {
        localStorage.setItem(CUSTOM_AVATAR_KEY, previewCustomImage);
        setCustomImageBase64(previewCustomImage);
      }
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
      setPreviewCustomImage(null);
      setModal(null);
    }
  };

  const handleOpenAvatarModal = () => {
    setSelectedAvatar(user.avatar || 'avatar1');
    setPreviewCustomImage(null);
    setModal('avatar');
  };

  const handleChangePassword = async () => {
    setPwError('');
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) { setPwError('All fields are required.'); return; }
    if (pwForm.newPw.length < 6) { setPwError('New password must be at least 6 characters.'); return; }
    if (!/(?=.*[A-Z])/.test(pwForm.newPw)) { setPwError('Password must contain at least one uppercase letter.'); return; }
    if (!/(?=.*\d)/.test(pwForm.newPw)) { setPwError('Password must contain at least one number.'); return; }
    if (!/[^a-zA-Z0-9]/.test(pwForm.newPw)) { setPwError('Password must contain at least one special character (!@#$%^&* etc.)'); return; }
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
    <div className="min-h-screen pad-bg">
      <style>{PAD_STYLE}</style>
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="pad-card p-10">

          {/* Avatar display */}
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <div className={`w-40 h-40 rounded-full bg-gradient-to-br ${currentAvatarBg} border-4 border-white shadow-lg overflow-hidden transition-transform group-hover:scale-105`}>
                {currentAvatarImg
                  ? <img src={currentAvatarImg} alt="avatar" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-white text-4xl">
                      <span style={{ fontFamily: 'sans-serif' }}>&#128100;</span>
                    </div>
                }
              </div>
              <button
                onClick={handleOpenAvatarModal}
                className="absolute bottom-0 right-0 text-white rounded-full w-9 h-9 flex items-center justify-center border-2 border-white hover:opacity-90 transition shadow"
                style={{ background: 'rgba(90,120,180,0.9)' }}
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 text-center mb-1" style={{ fontFamily: "'Sora', sans-serif" }}>
            {user.username}
          </h1>
          <p className="text-center text-gray-400 mb-8 capitalize font-medium">{user.role} · {currentAvatarLabel}</p>

          {/* Profile Info */}
          <div className="mb-8 rounded-2xl border border-blue-100 overflow-hidden">
            {[
              { label: 'Username', value: user.username },
              { label: 'Email',    value: user.email },
              { label: 'Points',   value: user.points, icon: <Trophy className="w-4 h-4 text-yellow-500 inline mr-1" />, accent: 'text-yellow-600 font-bold' },
              { label: 'Streak',   value: `${user.streak} days`, icon: <Flame className="w-4 h-4 text-orange-400 inline mr-1" />, accent: 'text-orange-500 font-bold' },
              { label: 'Role',     value: user.role, extra: 'capitalize' },
            ].map((row, i) => (
              <div key={i} className={`flex items-center justify-between px-5 py-4 ${i % 2 === 0 ? 'bg-white/60' : 'bg-blue-50/40'}`}>
                <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{row.label}</span>
                <span className={`text-base text-gray-800 ${row.accent || ''} ${row.extra || ''}`}>
                  {row.icon}{row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleOpenAvatarModal}
              className="w-full bg-white/70 border border-blue-100 text-gray-700 py-3.5 rounded-xl font-bold text-base hover:bg-blue-50 transition flex items-center justify-between px-5"
            >
              <div className="flex items-center space-x-3"><Camera className="w-5 h-5 text-blue-400" /><span>Change Avatar</span></div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>

            <button
              onClick={() => { setModal('password'); setPwError(''); setPwSuccess(false); setPwForm({ current: '', newPw: '', confirm: '' }); }}
              className="w-full bg-white/70 border border-blue-100 text-gray-700 py-3.5 rounded-xl font-bold text-base hover:bg-blue-50 transition flex items-center justify-between px-5"
            >
              <div className="flex items-center space-x-3"><Lock className="w-5 h-5 text-blue-400" /><span>Change Password</span></div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>

            <button
              onClick={handleLogout}
              className="w-full text-white py-3.5 rounded-xl font-bold text-base hover:opacity-90 transition flex items-center justify-center space-x-3"
              style={{ background: 'rgba(90,120,180,0.85)' }}
            >
              <LogOut className="w-5 h-5" /><span>Log Out</span>
            </button>
          </div>
        </div>
      </div>

      <footer className="text-center py-6 text-gray-400 text-sm mt-2">© PadaiSathi All rights reserved.</footer>

      {/* MODALS */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="pad-modal w-full max-w-xl shadow-2xl">

            {/* Avatar Modal */}
            {modal === 'avatar' && (
              <div className="p-7">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: "'Sora', sans-serif" }}>Choose Your Avatar</h2>
                  <button onClick={() => setModal(null)} className="text-gray-300 hover:text-gray-600"><X className="w-6 h-6" /></button>
                </div>

                {/* Upload your own photo */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full mb-5 border-2 border-dashed rounded-2xl p-4 flex items-center space-x-4 cursor-pointer transition
                    ${selectedAvatar === CUSTOM_AVATAR_ID ? 'border-blue-300 bg-blue-50' : 'border-blue-100 hover:border-blue-200 hover:bg-blue-50'}`}
                >
                  <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-blue-100 bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                    {(previewCustomImage || customImageBase64)
                      ? <img src={previewCustomImage || customImageBase64} alt="custom" className="w-full h-full object-cover" />
                      : <Upload className="w-6 h-6 text-white" />
                    }
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-700 text-sm">Upload your own photo</p>
                    <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, GIF · max 5MB</p>
                  </div>
                  {selectedAvatar === CUSTOM_AVATAR_ID && (
                    <div className="rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(90,120,180,0.85)' }}>
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>

                {/* Divider */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="flex-1 h-px bg-blue-100" />
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">or choose a preset</span>
                  <div className="flex-1 h-px bg-blue-100" />
                </div>

                {/* Preset avatars grid */}
                <div className="grid grid-cols-3 gap-4 mb-6 max-h-64 overflow-y-auto pr-1">
                  {AVATARS.map(av => (
                    <button
                      key={av.id}
                      onClick={() => { setSelectedAvatar(av.id); setPreviewCustomImage(null); }}
                      className="relative flex flex-col items-center p-2 rounded-2xl transition-all"
                      style={{
                        border: selectedAvatar === av.id ? '3px solid rgba(90,120,180,0.8)' : '3px solid transparent',
                        background: selectedAvatar === av.id ? 'rgba(230,240,255,0.8)' : 'transparent',
                        transform: selectedAvatar === av.id ? 'scale(1.05)' : 'scale(1)',
                      }}
                    >
                      <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${av.bg} overflow-hidden mb-2 shadow-md`}>
                        <img src={av.img} alt={av.label} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-xs font-medium text-gray-600 text-center leading-tight">{av.label}</span>
                      {selectedAvatar === av.id && (
                        <div className="absolute -top-2 -right-2 rounded-full w-6 h-6 flex items-center justify-center border-2 border-white"
                          style={{ background: 'rgba(90,120,180,0.85)' }}>
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Preview bar */}
                <div className="flex items-center space-x-3 bg-blue-50 rounded-2xl p-3 mb-5 border border-blue-100">
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${previewBg} overflow-hidden flex-shrink-0`}>
                    {previewImg
                      ? <img src={previewImg} alt="preview" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-white text-xl">&#128100;</div>
                    }
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{user.username}</p>
                    <p className="text-sm text-gray-400">{previewLabel}</p>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => { setModal(null); setPreviewCustomImage(null); }}
                    className="flex-1 py-3 rounded-xl border border-blue-100 font-bold text-gray-500 hover:border-blue-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveAvatar}
                    disabled={avatarSaving || (selectedAvatar === CUSTOM_AVATAR_ID && !previewCustomImage && !customImageBase64)}
                    className="flex-1 py-3 rounded-xl text-white font-bold hover:opacity-90 transition disabled:opacity-60"
                    style={{ background: 'rgba(90,120,180,0.85)' }}
                  >
                    {avatarSaving ? 'Saving…' : 'Save Avatar'}
                  </button>
                </div>
              </div>
            )}

            {/* Password Modal */}
            {modal === 'password' && (
              <div className="p-7">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: "'Sora', sans-serif" }}>Change Password</h2>
                  <button onClick={() => setModal(null)} className="text-gray-300 hover:text-gray-600"><X className="w-6 h-6" /></button>
                </div>

                {pwSuccess ? (
                  <div className="flex flex-col items-center py-8 space-y-3">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-8 h-8 text-green-500" />
                    </div>
                    <p className="text-lg font-bold text-green-600">Password Updated!</p>
                  </div>
                ) : (
                  <>
                    {[{ key: 'current', label: 'Current Password', placeholder: 'Enter current password' }].map(({ key, label, placeholder }) => (
                      <div key={key} className="mb-4">
                        <label className="block text-sm font-semibold text-gray-600 mb-1.5">{label}</label>
                        <div className="relative">
                          <input
                            type={showPw[key] ? 'text' : 'password'}
                            value={pwForm[key]}
                            onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                            placeholder={placeholder}
                            className="w-full border border-blue-100 rounded-xl px-4 py-3 pr-11 text-base focus:border-blue-300 focus:outline-none transition bg-white/60"
                          />
                          <button type="button" onClick={() => setShowPw(s => ({ ...s, [key]: !s[key] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600">
                            {showPw[key] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-gray-600 mb-1.5">New Password</label>
                      <div className="relative">
                        <input
                          type={showPw.newPw ? 'text' : 'password'}
                          value={pwForm.newPw}
                          onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))}
                          placeholder="Min 6 chars, uppercase, number, symbol"
                          className="w-full border border-blue-100 rounded-xl px-4 py-3 pr-11 text-base focus:border-blue-300 focus:outline-none transition bg-white/60"
                        />
                        <button type="button" onClick={() => setShowPw(s => ({ ...s, newPw: !s.newPw }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600">
                          {showPw.newPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <div className="mt-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Password must have:</p>
                        {[
                          { rule: /.{6,}/,         label: 'At least 6 characters' },
                          { rule: /[A-Z]/,          label: 'One uppercase letter (A-Z)' },
                          { rule: /\d/,             label: 'One number (0-9)' },
                          { rule: /[^a-zA-Z0-9]/,  label: 'One special character (!@#$%^&*)' },
                        ].map(({ rule, label }) => (
                          <div key={label} className="flex items-center gap-2 mb-1">
                            <span style={{ color: rule.test(pwForm.newPw) ? '#22c55e' : '#d1d5db', transition: 'color 0.2s', fontSize: '13px' }}>
                              {rule.test(pwForm.newPw) ? '✓' : '○'}
                            </span>
                            <span style={{ color: rule.test(pwForm.newPw) ? '#374151' : '#9ca3af', transition: 'color 0.2s', fontSize: '12px' }}>
                              {label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {[{ key: 'confirm', label: 'Confirm New Password', placeholder: 'Repeat new password' }].map(({ key, label, placeholder }) => (
                      <div key={key} className="mb-4">
                        <label className="block text-sm font-semibold text-gray-600 mb-1.5">{label}</label>
                        <div className="relative">
                          <input
                            type={showPw[key] ? 'text' : 'password'}
                            value={pwForm[key]}
                            onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                            placeholder={placeholder}
                            className="w-full border border-blue-100 rounded-xl px-4 py-3 pr-11 text-base focus:border-blue-300 focus:outline-none transition bg-white/60"
                          />
                          <button type="button" onClick={() => setShowPw(s => ({ ...s, [key]: !s[key] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600">
                            {showPw[key] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                    ))}

                    {pwError && (
                      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-500 font-medium mb-4">{pwError}</div>
                    )}

                    <div className="flex space-x-3 mt-2">
                      <button onClick={() => setModal(null)} className="flex-1 py-3 rounded-xl border border-blue-100 font-bold text-gray-500 hover:border-blue-200 transition">Cancel</button>
                      <button onClick={handleChangePassword} disabled={pwLoading}
                        className="flex-1 py-3 rounded-xl text-white font-bold hover:opacity-90 transition disabled:opacity-60"
                        style={{ background: 'rgba(90,120,180,0.85)' }}>
                        {pwLoading ? 'Updating…' : 'Update Password'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Logout Modal */}
            {modal === 'logout' && (
              <div className="p-7">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: "'Sora', sans-serif" }}>Log Out</h2>
                  <button onClick={() => setModal(null)} className="text-gray-300 hover:text-gray-600"><X className="w-6 h-6" /></button>
                </div>

                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100">
                    <LogOut className="w-8 h-8 text-blue-400" />
                  </div>
                </div>

                <p className="text-center text-gray-700 font-semibold text-lg mb-1">Are you sure?</p>
                <p className="text-center text-gray-400 text-sm mb-8">You'll need to log back in to access your account.</p>

                <div className="flex space-x-3">
                  <button onClick={() => setModal(null)}
                    className="flex-1 py-3 rounded-xl border border-blue-100 font-bold text-gray-500 hover:border-blue-200 transition">
                    Cancel
                  </button>
                  <button onClick={confirmLogout}
                    className="flex-1 py-3 rounded-xl text-white font-bold hover:opacity-90 transition"
                    style={{ background: 'rgba(90,120,180,0.85)' }}>
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
