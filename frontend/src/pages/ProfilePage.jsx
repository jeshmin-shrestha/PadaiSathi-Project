import React, { useState, useEffect } from 'react';
import { Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) {
      window.location.href = '/login';
      return;
    }
    setUser(storedUser);
  }, []);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-200">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="bg-gray-100 rounded-3xl p-12 border-4 border-black">

          {/* Avatar */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center border-4 border-white shadow-lg">
                <div className="text-6xl">👨‍🎓</div>
              </div>
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="w-2 h-8 bg-amber-800 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Username */}
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
            {user.username}
          </h1>
          <p className="text-center text-gray-500 mb-8 capitalize">{user.role}</p>

          {/* Profile Info */}
          <div className="space-y-6 mb-8">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-700">Username</span>
              <span className="text-lg text-gray-900">{user.username}</span>
            </div>
            <div className="h-px bg-gray-300"></div>

            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-700">Email</span>
              <span className="text-lg text-gray-900 underline">{user.email}</span>
            </div>
            <div className="h-px bg-gray-300"></div>

            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-700">Points</span>
              <span className="text-lg font-bold text-purple-600">🏆 {user.points} pts</span>
            </div>
            <div className="h-px bg-gray-300"></div>

            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-700">Streak</span>
              <span className="text-lg font-bold text-orange-500">🔥 {user.streak} days</span>
            </div>
            <div className="h-px bg-gray-300"></div>

            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-700">Role</span>
              <span className="text-lg text-gray-900 capitalize">{user.role}</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-4">
            <button
              onClick={handleLogout}
              className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition flex items-center justify-center space-x-3"
            >
              <LogOut className="w-6 h-6" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>

      <footer className="text-center py-6 text-gray-600 text-sm mt-8">
        © PadaiSathi All rights reserved.
      </footer>
    </div>
  );
};

export default ProfilePage;