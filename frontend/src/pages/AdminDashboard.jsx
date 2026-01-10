import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const AdminDashboard = ({ user, setIsAuthenticated }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Use the shared Navbar component */}
      <Navbar />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Admin Header */}
        <div className="bg-gray-300 rounded-3xl p-8 mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
            <p className="text-gray-700">Welcome, {user.username}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Admin Controls */}
          <div className="lg:col-span-2 bg-white rounded-3xl border-4 border-black shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Controls</h2>
            <div className="space-y-4">
              <button className="w-full p-6 bg-blue-100 text-blue-800 rounded-2xl hover:bg-blue-200 transition font-semibold text-lg border-2 border-blue-300">
                👥 Manage Users
              </button>
              <button className="w-full p-6 bg-purple-100 text-purple-800 rounded-2xl hover:bg-purple-200 transition font-semibold text-lg border-2 border-purple-300">
                📊 View System Stats
              </button>
              <button className="w-full p-6 bg-green-100 text-green-800 rounded-2xl hover:bg-green-200 transition font-semibold text-lg border-2 border-green-300">
                📈 Generate Reports
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border-4 border-black shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Stats</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700 font-medium">Total Users</span>
                  <span className="text-2xl font-bold text-gray-900">1</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700 font-medium">Active Students</span>
                  <span className="text-2xl font-bold text-green-600">1</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700 font-medium">Admins</span>
                  <span className="text-2xl font-bold text-purple-600">1</span>
                </div>
              </div>
            </div>

            {/* System Health */}
            <div className="bg-white rounded-3xl border-4 border-black shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">System Health</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">API Status: Online</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Database: Connected</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Storage: Available</span>
                </div>
              </div>
            </div>
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

export default AdminDashboard;