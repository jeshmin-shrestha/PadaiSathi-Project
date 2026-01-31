import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import catIllustration from '../assets/images/Loginimage1.png';
import logoImage from '../assets/images/logo1.png';

const Register = ({ setIsAuthenticated, setUser }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!agreeToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      // Register new user
      const registerResponse = await fetch('http://localhost:8000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        }),
      });

      const registerData = await registerResponse.json();

      if (!registerResponse.ok || !registerData.success) {
        setError(registerData.detail || 'Registration failed. Email may already exist.');
        setLoading(false);
        return;
      }

      // Auto-login immediately after registration
      const loginResponse = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      const loginData = await loginResponse.json();

      if (loginResponse.ok && loginData.success) {
        // Save the NEW user data
        localStorage.setItem('user', JSON.stringify(loginData.user));
        setUser(loginData.user); // Update state with new user
        setIsAuthenticated(true);
        navigate('/dashboard');
      } else {
        setError('Registration successful, but auto-login failed. Please log in manually.');
        navigate('/login');
      }
    } catch (err) {
      console.error(err);
      setError('Cannot connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center p-3 md:p-5"
      style={{
        backgroundImage: `url(${catIllustration})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#D9D9D9'
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-10"></div>
      
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl relative z-10 border border-gray-200 ml-0 md:ml-8 lg:ml-16">
        <div className="p-5 md:p-7 lg:p-8">
          <div className="text-center mb-4">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-1">Create Account</h1>
            <p className="text-sm md:text-base text-gray-600 mb-2">Join our learning community</p>
            <div className="flex items-center justify-center mb-2">
              <img 
                src={logoImage} 
                alt="PadaiSathi Logo" 
                className="w-32 h-auto object-contain"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-2 rounded-md mb-3 text-center text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Full Name:</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent transition bg-gray-50 text-sm"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email:</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent transition bg-gray-50 text-sm"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Password:</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent transition bg-gray-50 text-sm"
                placeholder="Create password (min. 6 chars)"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Confirm Password:</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent transition bg-gray-50 text-sm"
                placeholder="Confirm your password"
                required
              />
            </div>

            <div className="flex items-center text-xs">
              <label className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="h-3.5 w-3.5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 mt-0.5"
                  required
                />
                <span className="text-gray-700 leading-tight">
                  I agree to the <a href="/terms" className="text-purple-600 hover:underline">Terms of Service</a> and <a href="/privacy" className="text-purple-600 hover:underline">Privacy Policy</a>
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-2.5 rounded-md font-semibold text-sm hover:bg-gray-800 transition disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-4 text-center text-gray-600 text-xs">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-600 font-medium hover:underline">
              Login here
            </Link>
          </p>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-gray-500 text-[10px]">OR</span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button className="flex items-center justify-center py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition text-xs">
                <span className="mr-1 text-blue-600 font-bold text-xs">f</span>
                <span className="text-gray-700">Facebook</span>
              </button>
              <button className="flex items-center justify-center py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition text-xs">
                <span className="mr-1 text-red-600 font-bold text-xs">G</span>
                <span className="text-gray-700">Google</span>
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-[10px] text-gray-500">
            © PadaiSathi. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;