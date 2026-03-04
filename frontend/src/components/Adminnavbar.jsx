// components/AdminNavbar.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logoImage from '../assets/images/reading-cat.png';
import { Users, BarChart2, FileText, Settings, LogOut } from 'lucide-react';

const AdminNavbar = ({ user, setIsAuthenticated }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      localStorage.removeItem('user');
      if (setIsAuthenticated) setIsAuthenticated(false);
      window.location.href = '/login';
    }
  };

  return (
    <nav className="bg-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Left: Logo — identical to student Navbar */}
        <div className="flex items-center space-x-4">
          <div className="w-24 h-24 flex items-center justify-center overflow-hidden">
            <img
              src={logoImage}
              alt="PadaiSathi Logo"
              className="h-full w-auto object-contain hover:opacity-90 transition-opacity cursor-pointer"
              onClick={() => navigate('/dashboard')}
            />
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <span className="pr-0.5 font-extrabold text-gray-900 text-lg">Padai</span>
              <span className="px-0 py-0.5 bg-gray-300 rounded-full font-extrabold text-gray-900 text-lg">Sathi</span>
            </div>
            {/* Admin badge — subtle, matches the gray palette */}
            <span className="px-2 py-0.5 bg-gray-800 text-white text-xs font-bold rounded-full uppercase tracking-wider">
              Admin
            </span>
          </div>
        </div>

        {/* Right: Admin Nav Links — same button style as student Navbar */}
        <div className="flex items-center space-x-4 md:space-x-6">
          <button
            onClick={() => navigate('/dashboard')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-2xl font-medium transition ${
              isActive('/dashboard') ? 'bg-gray-400 text-gray-800' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-300'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => navigate('/admin/users')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-2xl font-medium transition ${
              isActive('/admin/users') ? 'bg-gray-400 text-gray-800' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-300'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Users</span>
          </button>

          <button
            onClick={() => navigate('/admin/reports')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-2xl font-medium transition ${
              isActive('/admin/reports') ? 'bg-gray-400 text-gray-800' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Reports</span>
          </button>

          <button
            onClick={() => navigate('/admin/settings')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-2xl font-medium transition ${
              isActive('/admin/settings') ? 'bg-gray-400 text-gray-800' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-300'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>

          {/* Admin user pill — same size as student avatar button */}
          <div className="flex items-center space-x-2 bg-gray-800 rounded-full pl-1 pr-3 py-1 ml-2">
            <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user?.username?.charAt(0).toUpperCase() || 'A'}
            </div>
            <span className="text-white text-sm font-medium">{user?.username || 'Admin'}</span>
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-2xl font-medium transition text-gray-700 hover:text-gray-900 hover:bg-gray-300"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>

      </div>
    </nav>
  );
};

export default AdminNavbar;