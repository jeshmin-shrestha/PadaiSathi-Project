import React, { useState } from 'react';
import { Settings, LogOut } from 'lucide-react';
import Navbar from '../components/Navbar';

const ProfilePage = () => {
  const [user] = useState({
    username: 'Jeshmin',
    fullName: 'Jeshmin Shrestha',
    email: 'shrestha.jeshmin30@gmail.com',
    password: '••••••• •••'
  });

  const handleAccountSettings = () => {
    alert('Opening account settings...');
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      alert('Logging out...');
    }
  };

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Profile Card */}
        <div className="bg-gray-100 rounded-3xl p-12 border-4 border-black">
          {/* Avatar */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center border-4 border-white shadow-lg">
                <div className="text-6xl">👨‍🎓</div>
              </div>
              {/* Hair/Ahoge decoration */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="w-2 h-8 bg-amber-800 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Username */}
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">
            {user.username}
          </h1>

          {/* Profile Information */}
          <div className="space-y-6 mb-8">
            {/* Full Name */}
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-700">Full Name</span>
              <span className="text-lg text-gray-900">{user.fullName}</span>
            </div>

            <div className="h-px bg-gray-300"></div>

            {/* Email */}
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-700">Email</span>
              <span className="text-lg text-gray-900 underline">{user.email}</span>
            </div>

            <div className="h-px bg-gray-300"></div>

            {/* Password */}
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-700">Password</span>
              <span className="text-lg text-gray-900 tracking-wider">{user.password}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={handleAccountSettings}
              className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition flex items-center justify-center space-x-3"
            >
              <Settings className="w-6 h-6" />
              <span>Account Settings</span>
            </button>

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

      {/* Footer */}
      <footer className="text-center py-6 text-gray-600 text-sm mt-8">
        © PadaiSathi All rights reserved.
      </footer>
    </div>
  );
};

export default ProfilePage;