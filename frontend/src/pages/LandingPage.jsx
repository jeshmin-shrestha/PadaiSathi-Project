import React from 'react';
import { Link } from 'react-router-dom';
import logoImage from '../assets/images/logo1.png';
import totoro from '../assets/images/totoro.png';
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            
                          <img 
                            src={logoImage} 
                            alt="PadaiSathi Logo" 
                            className="w-40 h-auto object-contain" // Adjust size as needed
                          />
           
          </div>
          
          <div className="flex items-center space-x-8">
            <Link to="/" className="px-6 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition">
              Home
            </Link>
            <Link to="/login" className="text-gray-700 font-medium hover:text-purple-600 transition">
              Login
            </Link>
            <Link to="/register" className="text-gray-700 font-medium hover:text-purple-600 transition">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gray-200 rounded-3xl max-w-7xl mx-auto mt-8 px-8 py-16 shadow-lg">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h2 className="text-5xl font-bold text-gray-900 leading-tight mb-4">
              Study Less,<br />
              Understand More
            </h2>
            <p className="text-gray-700 text-lg mb-3">
              Upload, Summarize & Learn.
            </p>
            <p className="text-gray-600 mb-8">
              Transform your documents into engaging videos, flashcards and quizzes with AI magic.
            </p>
            <Link
              to="/register"
              className="inline-block bg-black text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
            >
              Get Started
            </Link>
          </div>

          <div className="md:w-1/2 flex justify-center">
            <img 
                            src={totoro} 
                            alt="PadaiSathi Logo" />
           
           
          </div>
        </div>
      </section>

      {/* Why Students Love Us Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h3 className="text-4xl font-bold text-gray-900 mb-3">
            Why Students Love Us
          </h3>
          <p className="text-gray-600 text-lg">
            Everything you need to ace your exam
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* AI Summaries Card */}
          <div className="bg-gray-200 rounded-3xl p-8 text-center hover:shadow-xl transition">
            <h4 className="text-2xl font-bold text-gray-900 mb-4">AI Summaries</h4>
            <p className="text-gray-700 mb-6">
              Big Chapters leaving you ? Upload your boring PDFs & get summarises that actually make sense.
            </p>
            {/* Icon placeholder */}
            <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto flex items-center justify-center">
              <span className="text-xs text-gray-600">Icon</span>
            </div>
          </div>

          {/* Video Magic Card */}
          <div className="bg-gray-200 rounded-3xl p-8 text-center hover:shadow-xl transition">
            <h4 className="text-2xl font-bold text-gray-900 mb-4">Video Magic</h4>
            <p className="text-gray-700 mb-6">
              Tired of endless reading ? Watch flashy AI-generated engaging videos.
            </p>
            {/* Icon placeholder */}
            <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto flex items-center justify-center">
              <span className="text-xs text-gray-600">Icon</span>
            </div>
          </div>

          {/* Exam Ready Card */}
          <div className="bg-gray-200 rounded-3xl p-8 text-center hover:shadow-xl transition">
            <h4 className="text-2xl font-bold text-gray-900 mb-4">Exam Ready</h4>
            <p className="text-gray-700 mb-6">
              Relax and grasp AI-generated quizzes tailored to your content.
            </p>
            {/* Icon placeholder */}
            <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto flex items-center justify-center">
              <span className="text-xs text-gray-600">Icon</span>
            </div>
          </div>
        </div>
      </section>

      {/* What Students Say Section */}
      <section className="bg-gray-200 rounded-3xl max-w-7xl mx-auto px-8 py-16 mb-8">
        <h3 className="text-4xl font-bold text-gray-900 text-center mb-12">
          What Students Say
        </h3>

        <div className="grid md:grid-cols-4 gap-6 mb-6">
          {/* Testimonial 1 */}
          <div className="bg-white rounded-2xl p-6 shadow-md">
            {/* Avatar placeholder */}
            <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-4"></div>
            <p className="text-gray-700 text-sm text-center">
              Lorem ipsum dolor sit amet consectetur adipiscing elit
            </p>
          </div>

          {/* Testimonial 2 */}
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-4"></div>
            <p className="text-gray-700 text-sm text-center">
              Lorem ipsum dolor sit amet consectetur adipiscing elit
            </p>
          </div>

          {/* Testimonial 3 */}
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-4"></div>
            <p className="text-gray-700 text-sm text-center">
              Lorem ipsum dolor sit amet consectetur adipiscing elit
            </p>
          </div>

          {/* Testimonial 4 */}
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-4"></div>
            <p className="text-gray-700 text-sm text-center">
              Lorem ipsum dolor sit amet consectetur adipiscing elit
            </p>
          </div>
        </div>

        {/* Down arrow indicator */}
        <div className="text-center">
          <svg className="w-8 h-8 mx-auto text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-200 rounded-3xl max-w-7xl mx-auto px-8 py-16 mb-8 text-center">
        <h3 className="text-4xl font-bold text-gray-900 mb-4">
          Ready to Transform Your Learning? 🎓
        </h3>
        <p className="text-gray-700 text-lg mb-8">
          Join 10,000+ students who are studying smarter, not harder
        </p>
        <Link
          to="/register"
          className="inline-block bg-black text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-800 transition"
        >
          Start Learning Now
        </Link>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-600 text-sm">
        © PadaiSathi All rights reserved.
      </footer>
    </div>
  );
};

export default LandingPage;