import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';  // rename or create
import AdminDashboard from './pages/AdminDashboard';     // new
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={
            <Login setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
          } />
          <Route path="/register" element={
            <Register setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
          } />
          <Route path="/dashboard" element={
            isAuthenticated ? (
              user?.role === 'admin' ? 
                <AdminDashboard user={user} setIsAuthenticated={setIsAuthenticated} /> :
                <StudentDashboard user={user} setIsAuthenticated={setIsAuthenticated} />
            ) : (
              <Navigate to="/login" />
            )
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;