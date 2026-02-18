import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, BookOpen } from 'lucide-react';
import Navbar from '../components/Navbar'; // Import the shared Navbar

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [user] = useState({
    name: 'Jeshmin',
    currentCourse: 'Introduction to the Cell',
    courseProgress: 65,
    streak: 11,
    stats: {
      videos: 21,
      quizzes: 21,
      flashcards: 24,
      notebooks: 5
    },
    totalPoints: 2450,
    badges: [
      { id: 1, name: 'First Steps', icon: '🦉', earned: true },
      { id: 2, name: 'Quiz Master', icon: '🏆', earned: true },
      { id: 3, name: 'Video Watcher', icon: '📚', earned: true },
      { id: 4, name: 'Speed Learner', icon: '⚡', earned: true }
    ]
  });

  const [leaderboard] = useState([
    { rank: 1, name: 'Jeshmin Shrestha', avatar: '🐱' },
    { rank: 2, name: 'Ram Shrestha', avatar: '🐱' },
    { rank: 3, name: 'Sita Shrestha', avatar: '🐱' }
  ]);

  return (
    <div className="min-h-screen bg-gray-200">
      {/* USE THE SHARED NAVBAR */}
      <Navbar />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="bg-gray-300 rounded-3xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Hello {user.name}!
              </h1>
              <p className="text-gray-700 mb-6">Ready to continue your learning journey?</p>
              
              <div className="bg-white rounded-2xl p-4 max-w-md">
                <h3 className="font-semibold text-gray-900 mb-3">{user.currentCourse}</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-orange-400 to-pink-500 h-full rounded-full transition-all"
                      style={{ width: `${user.courseProgress}%` }}
                    />
                  </div>
                  <button className="px-6 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition text-sm">
                    Continue
                  </button>
                </div>
              </div>
            </div>
            
            <div className="text-8xl">🐦</div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Streak Card */}
            <div className="bg-white rounded-3xl p-8 border-4 border-black text-center">
              <div className="text-6xl mb-4">🔥</div>
              <p className="text-xl mb-2">
                You're on a <span className="text-5xl font-bold mx-2">11</span> streak!
              </p>
            </div>

            {/* Quick Statistics */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-3xl">📊</span>
                <h3 className="text-xl font-bold text-gray-900">Quick Statistics</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Videos */}
                <div className="bg-white rounded-2xl p-6 border-4 border-black text-center">
                  <Video className="w-12 h-12 mx-auto mb-3" />
                  <div className="text-4xl font-bold text-gray-900 mb-1">{user.stats.videos}</div>
                  <div className="text-sm text-gray-600">Videos</div>
                </div>

                {/* Quiz */}
                <div className="bg-white rounded-2xl p-6 border-4 border-black text-center">
                  <div className="text-5xl mb-2">❓</div>
                  <div className="text-4xl font-bold text-gray-900 mb-1">{user.stats.quizzes}</div>
                  <div className="text-sm text-gray-600">Quiz</div>
                </div>

                {/* Flashcards */}
                <div className="bg-white rounded-2xl p-6 border-4 border-black text-center">
                  <div className="text-5xl mb-2">📇</div>
                  <div className="text-4xl font-bold text-gray-900 mb-1">{user.stats.flashcards}</div>
                  <div className="text-sm text-gray-600">Flashcards Reviewed</div>
                </div>

                {/* Notebooks */}
                <div className="bg-white rounded-2xl p-6 border-4 border-black text-center">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-green-700" />
                  <div className="text-4xl font-bold text-gray-900 mb-1">{user.stats.notebooks}</div>
                  <div className="text-sm text-gray-600">Notebooks</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Leaderboard */}
            <div className="bg-white rounded-3xl p-8 border-4 border-black">
              <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Leaderboard</h3>
              
              {/* Podium */}
              <div className="flex items-end justify-center space-x-4 mb-6">
                {/* 2nd Place */}
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-3xl mb-2 border-4 border-white shadow-lg">
                    🐱
                  </div>
                  <div className="w-24 h-20 bg-gray-300 rounded-t-xl flex items-center justify-center font-bold text-2xl">
                    2
                  </div>
                </div>

                {/* 1st Place */}
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-4xl mb-2 border-4 border-yellow-400 shadow-lg">
                    🐱
                  </div>
                  <div className="w-28 h-32 bg-yellow-400 rounded-t-xl flex items-center justify-center font-bold text-3xl">
                    1
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-3xl mb-2 border-4 border-white shadow-lg">
                    🐱
                  </div>
                  <div className="w-24 h-16 bg-orange-300 rounded-t-xl flex items-center justify-center font-bold text-2xl">
                    3
                  </div>
                </div>
              </div>

              {/* Leaderboard List */}
              <div className="space-y-3">
                {leaderboard.map((entry) => (
                  <div key={entry.rank} className="flex items-center space-x-3 p-3 bg-white rounded-xl border-2 border-black">
                    <span className="font-bold text-lg w-8">{entry.rank}.</span>
                    <span className="text-2xl">{entry.avatar}</span>
                    <span className="font-semibold text-gray-900">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Badges */}
            <div className="bg-white rounded-3xl p-8 border-4 border-black">
              <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Your Badges</h3>
              
              <div className="text-center mb-6">
                <div className="text-6xl mb-2">🏆</div>
                <div className="text-sm text-gray-600">Total Points</div>
                <div className="text-3xl font-bold text-gray-900">{user.totalPoints}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {user.badges.map((badge) => (
                  <div key={badge.id} className="bg-gray-50 rounded-xl p-4 text-center border-2 border-gray-300">
                    <div className="text-5xl mb-2">{badge.icon}</div>
                    <div className="text-xs font-semibold text-gray-700">{badge.name}</div>
                  </div>
                ))}
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

export default StudentDashboard;