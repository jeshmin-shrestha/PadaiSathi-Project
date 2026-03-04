// components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logoImage from '../assets/images/reading-cat.png';

const AVATARS = [
  { id: 'avatar1',  img: '/avatars/avatar1.jpeg',  bg: 'from-green-400 to-green-600' },
  { id: 'avatar2',  img: '/avatars/avatar2.jpeg',  bg: 'from-pink-400 to-pink-600' },
  { id: 'avatar3',  img: '/avatars/avatar3.jpeg',  bg: 'from-blue-400 to-blue-600' },
  { id: 'avatar4',  img: '/avatars/avatar12.jpeg', bg: 'from-purple-400 to-purple-600' },
  { id: 'avatar5',  img: '/avatars/avatar5.jpeg',  bg: 'from-gray-600 to-gray-800' },
  { id: 'avatar6',  img: '/avatars/avatar4.jpeg',  bg: 'from-amber-400 to-orange-500' },
  { id: 'avatar7',  img: '/avatars/avatar6.jpeg',  bg: 'from-cyan-400 to-cyan-600' },
  { id: 'avatar8',  img: '/avatars/avatar7.jpeg',  bg: 'from-lime-400 to-lime-600' },
  { id: 'avatar9',  img: '/avatars/avatar8.jpeg',  bg: 'from-red-400 to-orange-500' },
  { id: 'avatar10', img: '/avatars/avatar9.jpeg',  bg: 'from-yellow-400 to-yellow-500' },
  { id: 'avatar11', img: '/avatars/avatar10.jpeg', bg: 'from-sky-300 to-indigo-400' },
  { id: 'avatar12', img: '/avatars/avatar11.jpeg', bg: 'from-yellow-500 to-amber-600' },
];

const CUSTOM_AVATAR_KEY = 'user_custom_avatar';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userAvatar, setUserAvatar] = useState(null);
  const [customImg, setCustomImg] = useState(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('user'));
    const avatarId = stored?.avatar || 'avatar1';
    if (avatarId === 'custom') {
      const base64 = localStorage.getItem(CUSTOM_AVATAR_KEY);
      setCustomImg(base64 || null);
      setUserAvatar({ id: 'custom', bg: 'from-indigo-400 to-purple-500' });
    } else {
      setCustomImg(null);
      const found = AVATARS.find(a => a.id === avatarId) || AVATARS[0];
      setUserAvatar(found);
    }
  }, [location]);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center space-x-4">
          <div className="w-24 h-24 flex items-center justify-center overflow-hidden">
            <img
              src={logoImage}
              alt="PadaiSathi Logo"
              className="h-full w-auto object-contain hover:opacity-90 transition-opacity cursor-pointer"
              onClick={() => navigate('/dashboard')}
            />
          </div>
          <div className="flex items-center">
            <span className="pr-0.5 font-extrabold text-gray-900 text-lg">Padai</span>
            <span className="px-0 py-0.5 bg-gray-300 rounded-full font-extrabold text-gray-900 text-lg">Sathi</span>
          </div>
        </div>

        {/* Right: Navigation Buttons */}
        <div className="flex items-center space-x-4 md:space-x-6">
          <button
            onClick={() => navigate('/dashboard')}
            className={`px-5 py-2.5 rounded-2xl font-medium transition ${isActive('/dashboard') ? 'bg-gray-400 text-gray-800' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-300'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate('/notebook')}
            className={`px-5 py-2.5 rounded-2xl font-medium transition ${isActive('/notebook') ? 'bg-gray-400 text-gray-800' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-300'}`}
          >
            Notebooks
          </button>
          <button
            onClick={() => navigate('/summary')}
            className={`px-5 py-2.5 rounded-2xl font-medium transition ${isActive('/summary') ? 'bg-gray-400 text-gray-800' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-300'}`}
          >
            Summary
          </button>
          <button
            onClick={() => navigate('/video')}
            className={`px-5 py-2.5 rounded-2xl font-medium transition ${isActive('/video') ? 'bg-gray-400 text-gray-800' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-300'}`}
          >
            Video
          </button>
          <button
            onClick={() => navigate('/flashcards')}
            className={`px-5 py-2.5 rounded-2xl font-medium transition ${isActive('/flashcards') ? 'bg-gray-400 text-gray-800' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-300'}`}
          >
            Flashcard
          </button>
          <button
            onClick={() => navigate('/quiz')}
            className={`px-5 py-2.5 rounded-2xl font-medium transition ${isActive('/quiz') ? 'bg-gray-400 text-gray-800' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-300'}`}
          >
            Quiz
          </button>

          {/* Profile button — shows real avatar or custom uploaded photo */}
          <button
            onClick={() => navigate('/profile')}
            className={`w-12 h-12 rounded-full overflow-hidden border-2 transition ml-2 ${
              isActive('/profile') ? 'border-black' : 'border-gray-400 hover:border-gray-700'
            } bg-gradient-to-br ${userAvatar?.bg || 'from-gray-600 to-gray-800'}`}
          >
            {customImg
              ? <img src={customImg} alt="Your avatar" className="w-full h-full object-cover" />
              : userAvatar?.img
                ? <img src={userAvatar.img} alt="Your avatar" className="w-full h-full object-cover" />
                : null
            }
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;