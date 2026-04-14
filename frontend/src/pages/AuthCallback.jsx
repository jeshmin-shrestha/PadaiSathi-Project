// src/pages/AuthCallback.jsx
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthCallback = ({ setIsAuthenticated, setUser }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    const username = searchParams.get('username');
    const avatar = searchParams.get('avatar');
    const auth_provider = searchParams.get('auth_provider') || 'google';
    const error = searchParams.get('error');

    if (error) {
      console.error('Auth error:', error);
      navigate('/login?error=google_auth_failed');
      return;
    }

    if (token && email) {
      // Create user object
      const user = {
        email,
        username: username || email.split('@')[0],
        avatar: avatar || 'avatar1',
        points: 100,
        streak: 1,
        role: 'student',
        auth_provider,
      };

      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      
      // Update app state
      setUser(user);
      setIsAuthenticated(true);
      
      // Redirect to dashboard
      navigate('/dashboard');
    } else {
      navigate('/login?error=invalid_auth');
    }
  }, [searchParams, navigate, setIsAuthenticated, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200">
      <div className="bg-white rounded-3xl p-10 border-4 border-black shadow-xl text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-600 mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Completing Login...</h2>
        <p className="text-gray-600">Please wait while we redirect you</p>
      </div>
    </div>
  );
};

export default AuthCallback;