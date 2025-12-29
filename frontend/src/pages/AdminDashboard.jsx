import React from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = ({ user, setIsAuthenticated }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <nav className="bg-white rounded-xl shadow-sm p-4 mb-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
          <span className="text-gray-600">Welcome, {user.username}</span>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
        >
          Logout
        </button>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-6">Admin Controls</h2>
          <div className="space-y-4">
            <button className="w-full p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
              Manage Users
            </button>
            <button className="w-full p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100">
              View System Stats
            </button>
            <button className="w-full p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100">
              Generate Reports
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Stats</h2>
            <p className="text-gray-600">Total Users: 1</p>
            <p className="text-gray-600">Active Students: 1</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;