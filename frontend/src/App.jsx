import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import LandingPage from './pages/LandingPage';
import ProfilePage from './pages/ProfilePage';
import SummaryPage from './pages/SummaryPage';
import VideoPage from './pages/VideoPage';
import QuizPage from './pages/QuizPage';
import FlashcardsPage from './pages/FlashcardsPage';
import NotebookPage from './pages/NotebookPage';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  return (
    <Router>
      <div className="min-h-screen">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={
            isAuthenticated ? 
              <Navigate to="/dashboard" /> : 
              <Login setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
          } />
          <Route path="/register" element={
            isAuthenticated ? 
              <Navigate to="/dashboard" /> : 
              <Register setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
          } />
          
          {/* Protected Routes (Need Login) */}
          <Route path="/dashboard" element={
            isAuthenticated ? (
              user?.role === 'admin' ? 
                <AdminDashboard user={user} setIsAuthenticated={setIsAuthenticated} /> :
                <StudentDashboard user={user} setIsAuthenticated={setIsAuthenticated} />
            ) : <Navigate to="/login" />
          } />
          
          <Route path="/profile" element={
            isAuthenticated ? <ProfilePage user={user} /> : <Navigate to="/login" />
          } />
          
          <Route path="/summary" element={
            isAuthenticated ? <SummaryPage /> : <Navigate to="/login" />
          } />
          
          <Route path="/video" element={
            isAuthenticated ? <VideoPage /> : <Navigate to="/login" />
          } />
          
          <Route path="/quiz" element={
            isAuthenticated ? <QuizPage /> : <Navigate to="/login" />
          } />
          
          <Route path="/flashcards" element={
            isAuthenticated ? <FlashcardsPage /> : <Navigate to="/login" />
          } />
          
          <Route path="/notebook" element={
            isAuthenticated ? <NotebookPage /> : <Navigate to="/login" />
          } />
          
          {/* 404 Page */}
          <Route path="*" element={
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">404</h1>
                <p className="text-gray-600">Page not found</p>
                <a href="/" className="text-blue-600 hover:underline mt-4 inline-block">
                  Go back home
                </a>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;