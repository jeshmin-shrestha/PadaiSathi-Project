// components/Navbar.jsx - Fixed version
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logoImage from '../assets/images/reading-cat.png';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;
  
  return (
    <nav className="bg-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Left: Huge Logo like in the HTML */}
        <div className="flex items-center space-x-4">
          {/* LARGE LOGO CONTAINER */}
          <div className="w-24 h-24 flex items-center justify-center overflow-hidden">
            <img 
              src={logoImage} 
              alt="PadaiSathi Logo" 
              className="h-full w-auto object-contain hover:opacity-90 transition-opacity cursor-pointer"
              onClick={() => navigate('/dashboard')}
            />
          </div>
          
          {/* Brand Text - Cleaner version */}
          <div className="flex items-center">
            {/* Padai - No background, just text */}
            <span className="pr-0.5 font-extrabold text-gray-900 text-lg">
              Padai
            </span>
            
            {/* Sathi - Grey background only */}
            <span className="px-0 py-0.5 bg-gray-300 rounded-full font-extrabold text-gray-900 text-lg">
              Sathi
            </span>
          </div>
        </div>
        
        {/* Right: Navigation Buttons */}
        <div className="flex items-center space-x-4 md:space-x-6">
          <button 
            onClick={() => navigate('/dashboard')}
            className={`px-5 py-2.5 rounded-lg font-medium transition ${
              isActive('/dashboard') 
                ? 'bg-gray-400 text-gray-800 rounded-2xl' 
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-300 rounded-2xl'
            }`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => navigate('/notebook')}
            className={`px-5 py-2.5 rounded-lg font-medium transition ${
              isActive('/notebook') 
                ? 'bg-gray-400 text-gray-800 rounded-2xl' 
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-300rounded-2xl'
            }`}
          >
            Notebooks
          </button>
          <button 
            onClick={() => navigate('/summary')}
            className={`px-5 py-2.5 rounded-lg font-medium transition ${
              isActive('/summary') 
                ? 'bg-gray-400 text-gray-800 rounded-2xl' 
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-300 rounded-2xl'
            }`}
          >
            Summary
          </button>
          <button 
            onClick={() => navigate('/video')}
            className={`px-5 py-2.5 rounded-lg font-medium transition ${
              isActive('/video') 
                ? 'bg-gray-400 text-gray-800 rounded-2xl' 
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-300 rounded-2xl'
            }`}
          >
            Video
          </button>
          <button 
            onClick={() => navigate('/flashcards')}
            className={`px-5 py-2.5 rounded-lg font-medium transition ${
              isActive('/flashcards') 
                ? 'bg-gray-400 text-gray-800 rounded-2xl' 
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-300 rounded-2xl'
            }`}
          >
            Flashcard
          </button>
          <button 
            onClick={() => navigate('/quiz')}
            className={`px-5 py-2.5 rounded-lg font-medium transition ${
              isActive('/quiz') 
                ? 'bg-gray-400 text-gray-800 rounded-2xl' 
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-300 rounded-2xl'
            }`}
          >
            Quiz
          </button>
          <button 
            onClick={() => navigate('/profile')}
            className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-white hover:bg-gray-700 transition ml-2"
          >
            <span className="text-base">👤</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;