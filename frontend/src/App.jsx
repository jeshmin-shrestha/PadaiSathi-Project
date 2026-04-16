import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import NotebookDetailPage from './pages/NotebookDetailPage';
import Navbar from './components/Navbar';
import AdminNavbar from './components/AdminNavbar';
import './App.css';
import AuthCallback from './pages/AuthCallback';
import FriendsPage from './pages/FriendsPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
function isTokenValid() {
  const token = localStorage.getItem('token');
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem('token');
    const user  = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (token && !isTokenValid()) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      sessionStorage.removeItem('user');
      return false;
    }
    return !!user;
  });
  const [user, setUser] = useState(() => {
    return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user')) || null;
  });

  const noNavbarRoutes = ['/reset-password', '/forgot-password', '/login', '/register'];

  return (
    <Router>
      <AppContent
        isAuthenticated={isAuthenticated}
        setIsAuthenticated={setIsAuthenticated}
        user={user}
        setUser={setUser}
        noNavbarRoutes={noNavbarRoutes}
      />
    </Router>
  );
}

function AppContent({ isAuthenticated, setIsAuthenticated, user, setUser, noNavbarRoutes }) {
  const location = useLocation();
  const hideNavbar = noNavbarRoutes.includes(location.pathname);

  return (
      <div className="min-h-screen">
        {!hideNavbar && isAuthenticated && user?.role === 'admin' && (
          <AdminNavbar user={user} setIsAuthenticated={setIsAuthenticated} />
        )}
        {!hideNavbar && isAuthenticated && user?.role !== 'admin' && <Navbar />}
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LandingPage />} />
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
          
          {/* Protected Routes */}
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

          <Route 
            path="/auth/callback" 
            element={<AuthCallback setIsAuthenticated={setIsAuthenticated} setUser={setUser} />} 
          />
          {/* ← ADD THIS new route for notebook detail */}
          <Route path="/notebook/:id" element={
            isAuthenticated ? <NotebookDetailPage /> : <Navigate to="/login" />
          } />
          
          <Route path="/friends" element={isAuthenticated ? <FriendsPage /> : <Navigate to="/login" />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
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
  );
}

export default App;