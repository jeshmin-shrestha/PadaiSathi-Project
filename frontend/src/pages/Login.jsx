import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import catIllustration from '../assets/images/Loginimage1.png';
import logoImage from '../assets/images/logo1.png'; // ← Your logo image

const Login = ({ setIsAuthenticated, setUser }) => {
  const [email, setEmail] = useState('demo@padai.com');
  const [password, setPassword] = useState('demo123');
  const [staySignedIn, setStaySignedIn] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setIsAuthenticated(true);
        navigate('/dashboard');
      } else {
        setError(data.detail || 'Invalid email or password');
      }
    } catch (err) {
      setError('Cannot connect to server. Use demo credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center p-4 md:p-6"
      style={{
        backgroundImage: `url(${catIllustration})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#D9D9D9'
      }}
    >
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-black bg-opacity-10"></div>
      
      {/* White login form card - positioned on left */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl relative z-10 border border-gray-200 ml-0 md:ml-8 lg:ml-16">
        <div className="p-6 md:p-8 lg:p-10">
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">Welcome Back</h1>
            <p className="text-base md:text-lg text-gray-600 mb-3">You've been missed</p>
            <div className="flex items-center justify-center mb-3">
              {/* Logo image only - centered */}
              <img 
                src={logoImage} 
                alt="PadaiSathi Logo" 
                className="w-40 h-auto object-contain" // Adjust size as needed
              />
            </div>
            <p className="text-gray-600 text-sm md:text-base">Login to your account</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-2 rounded-lg mb-4 text-center text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition bg-gray-50"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition bg-gray-50"
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={staySignedIn}
                  onChange={(e) => setStaySignedIn(e.target.checked)}
                  className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-gray-700">Stay Signed in</span>
              </label>
              <a href="#" className="text-purple-600 hover:underline">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-lg font-semibold text-base hover:bg-gray-800 transition disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600 text-sm">
            Don't have an account?{' '}
            <a href="/register" className="text-purple-600 font-medium hover:underline">
              Register here
            </a>
          </p>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-gray-500">OR</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-xs">
                <span className="mr-2 text-blue-600 font-bold">f</span>
                <span className="text-gray-700">Facebook</span>
              </button>
              <button className="flex items-center justify-center py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-xs">
                <span className="mr-2 text-red-600 font-bold">G</span>
                <span className="text-gray-700">Google</span>
              </button>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-gray-500">
            © PadaiSathi. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;