import React from 'react';
import { useNavigate } from 'react-router-dom';
import FileUpload from '../components/FileUpload';  // Import the real upload component

const Dashboard = ({ user, setIsAuthenticated }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">No user data found</p>
          <button onClick={handleLogout} className="px-6 py-3 bg-red-600 text-white rounded-lg">
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white rounded-xl shadow-sm p-4 mb-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-800">PadaiSathi</h1>
          <span className="text-gray-600">Welcome, {user.username}</span>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
        >
          Logout
        </button>
      </nav>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Stats + Quick Actions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Your Stats Box */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Stats</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Points</span>
                <span className="text-2xl font-bold text-blue-600">{user.points || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Study Streak</span>
                <span className="text-2xl font-bold text-green-600">{user.streak || 0} days</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Box */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition">
                📚 View Study Materials
              </button>
              <button className="w-full text-left px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition">
                🎯 Take a Quiz
              </button>
              <button className="w-full text-left px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition">
                🏆 View Leaderboard
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Real PDF Upload + Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Upload Study Materials</h2>
            <FileUpload userEmail={user.email} />  {/* Real upload - Browse Files now works! */}

            {/* Recent Activity */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>No recent activity yet. Upload your first document!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;