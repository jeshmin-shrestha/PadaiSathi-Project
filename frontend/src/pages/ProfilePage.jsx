import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Camera, Lock, X, Check, Eye, EyeOff, ChevronRight, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const AVATARS = [
  { id: 'avatar1',  img: '/avatars/avatar1.jpeg',  label: 'Student',           bg: 'from-green-400 to-green-600' },
  { id: 'avatar2',  img: '/avatars/avatar2.jpeg',  label: 'Wizard',            bg: 'from-pink-400 to-pink-600' },
  { id: 'avatar3',  img: '/avatars/avatar3.jpeg',  label: 'Nerd',              bg: 'from-blue-400 to-blue-600' },
  { id: 'avatar4',  img: '/avatars/avatar12.jpeg', label: 'Gamer',             bg: 'from-purple-400 to-purple-600' },
  { id: 'avatar5',  img: '/avatars/avatar5.jpeg',  label: 'Champion',          bg: 'from-gray-600 to-gray-800' },
  { id: 'avatar6',  img: '/avatars/avatar4.jpeg',  label: 'Artist',            bg: 'from-amber-400 to-orange-500' },
  { id: 'avatar7',  img: '/avatars/avatar6.jpeg',  label: 'Ballerina Cappucina', bg: 'from-cyan-400 to-cyan-600' },
  { id: 'avatar8',  img: '/avatars/avatar7.jpeg',  label: 'Cappuccino Assassino', bg: 'from-lime-400 to-lime-600' },
  { id: 'avatar9',  img: '/avatars/avatar8.jpeg',  label: 'Tralalero Tralala', bg: 'from-red-400 to-orange-500' },
  { id: 'avatar10', img: '/avatars/avatar9.jpeg',  label: 'Harry Potter',      bg: 'from-yellow-400 to-yellow-500' },
  { id: 'avatar11', img: '/avatars/avatar10.jpeg', label: 'One Piece',         bg: 'from-sky-300 to-indigo-400' },
  { id: 'avatar12', img: '/avatars/avatar11.jpeg', label: 'Roblux',            bg: 'from-yellow-500 to-amber-600' },
];

const CUSTOM_AVATAR_ID = 'custom';
const CUSTOM_AVATAR_KEY = 'user_custom_avatar'; // localStorage key for base64 image

const API = 'http://127.0.0.1:8000';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [modal, setModal] = useState(null);

  const [selectedAvatar, setSelectedAvatar] = useState('avatar1');
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [customImageBase64, setCustomImageBase64] = useState(null); // currently saved custom image
  const [previewCustomImage, setPreviewCustomImage] = useState(null); // preview before saving
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

  // Resolve the display image for any avatar id
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

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  // Handle file selection for custom upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please select an image file.'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreviewCustomImage(ev.target.result);
      setSelectedAvatar(CUSTOM_AVATAR_ID); // auto-select custom
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
              <div className={`w-40 h-40 rounded-full bg-gradient-to-br ${currentAvatarBg} border-4 border-white shadow-lg overflow-hidden transition-transform group-hover:scale-105`}>
                {currentAvatarImg
                  ? <img src={currentAvatarImg} alt="avatar" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-white text-4xl">👤</div>
                }
              </div>
              <button
                onClick={handleOpenAvatarModal}
                className="absolute bottom-0 right-0 bg-black text-white rounded-full w-9 h-9 flex items-center justify-center border-2 border-white hover:bg-gray-700 transition shadow"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 text-center mb-1">{user.username}</h1>
          <p className="text-center text-gray-500 mb-8 capitalize font-medium">{user.role} · {currentAvatarLabel}</p>

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
              onClick={handleOpenAvatarModal}
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
          <div className="bg-white rounded-3xl border-4 border-black w-full max-w-xl shadow-2xl">

            {/* Avatar Modal */}
            {modal === 'avatar' && (
              <div className="p-7">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Choose Your Avatar</h2>
                  <button onClick={() => setModal(null)} className="text-gray-400 hover:text-black"><X className="w-6 h-6" /></button>
                </div>

                {/* ── Upload your own photo ── */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full mb-5 border-2 border-dashed rounded-2xl p-4 flex items-center space-x-4 cursor-pointer transition
                    ${selectedAvatar === CUSTOM_AVATAR_ID
                      ? 'border-black bg-gray-50'
                      : 'border-gray-300 hover:border-gray-500 hover:bg-gray-50'
                    }`}
                >
                  <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-200 bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                    {(previewCustomImage || customImageBase64)
                      ? <img src={previewCustomImage || customImageBase64} alt="custom" className="w-full h-full object-cover" />
                      : <Upload className="w-6 h-6 text-white" />
                    }
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-sm">Upload your own photo</p>
                    <p className="text-xs text-gray-500 mt-0.5">JPG, PNG, GIF · max 5MB</p>
                  </div>
                  {selectedAvatar === CUSTOM_AVATAR_ID && (
                    <div className="bg-black rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                {/* Divider */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">or choose a preset</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Preset avatars grid */}
                <div className="grid grid-cols-3 gap-4 mb-6 max-h-64 overflow-y-auto pr-1">
                  {AVATARS.map(av => (
                    <button
                      key={av.id}
                      onClick={() => { setSelectedAvatar(av.id); setPreviewCustomImage(null); }}
                      className="relative flex flex-col items-center p-2 rounded-2xl transition-all"
                      style={{
                        border: selectedAvatar === av.id ? '3px solid black' : '3px solid transparent',
                        background: selectedAvatar === av.id ? '#f9fafb' : 'transparent',
                        transform: selectedAvatar === av.id ? 'scale(1.05)' : 'scale(1)',
                      }}
                    >
                      <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${av.bg} overflow-hidden mb-2 shadow-md`}>
                        <img src={av.img} alt={av.label} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-xs font-medium text-gray-700 text-center leading-tight">{av.label}</span>
                      {selectedAvatar === av.id && (
                        <div className="absolute -top-2 -right-2 bg-black rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Preview bar */}
                <div className="flex items-center space-x-3 bg-gray-50 rounded-2xl p-3 mb-5 border-2 border-gray-200">
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${previewBg} overflow-hidden flex-shrink-0`}>
                    {previewImg
                      ? <img src={previewImg} alt="preview" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-white text-xl">👤</div>
                    }
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{user.username}</p>
                    <p className="text-sm text-gray-500">{previewLabel}</p>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => { setModal(null); setPreviewCustomImage(null); }}
                    className="flex-1 py-3 rounded-xl border-2 border-gray-300 font-bold text-gray-600 hover:border-gray-400 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveAvatar}
                    disabled={avatarSaving || (selectedAvatar === CUSTOM_AVATAR_ID && !previewCustomImage && !customImageBase64)}
                    className="flex-1 py-3 rounded-xl bg-black text-white font-bold hover:bg-gray-800 transition disabled:opacity-60"
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