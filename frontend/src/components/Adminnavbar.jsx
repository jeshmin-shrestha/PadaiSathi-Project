// ─── components/AdminNavbar.jsx ──────────────────────────────────────────────
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { NavBrand, NavButton } from './Navbar';          // ← shared primitives

const AdminNavbar = ({ user, setIsAuthenticated }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (!window.confirm('Are you sure you want to log out?')) return;
    localStorage.removeItem('user');
    if (setIsAuthenticated) setIsAuthenticated(false);
    window.location.href = '/login';
  };

  return (
    <nav className="bg-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">

        {/* Brand — identical markup to student navbar */}
        <div className="flex items-center gap-3">
          <NavBrand onLogoClick={() => navigate('/dashboard')} />
          <span className="px-2 py-0.5 bg-gray-800 text-white text-xs font-bold rounded-full uppercase tracking-wider">
            Admin
          </span>
        </div>

        {/* User pill + logout */}
        <div className="flex items-center gap-2">

          {/* Admin user pill — consistent size with student avatar (w-10 h-10) */}
          <div className="flex items-center gap-2 bg-gray-800 rounded-full pl-1 pr-3 py-1 ml-2">
            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user?.username?.charAt(0).toUpperCase() || 'A'}
            </div>
            <span className="text-white text-sm font-medium">{user?.username || 'Admin'}</span>
          </div>

          {/* Logout */}
          <NavButton onClick={handleLogout} className="ml-1">
            <LogOut className="w-4 h-4" />
            Logout
          </NavButton>

        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;