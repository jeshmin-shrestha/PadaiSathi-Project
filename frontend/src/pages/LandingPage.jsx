import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Film, GraduationCap, ChevronDown } from 'lucide-react';
import logoImage from '../assets/images/logo1.png';
import totoro from '../assets/images/totoro.png';

const PAD_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Sora:wght@400;600;700;800&display=swap');
  .land-root * { font-family: 'Nunito', sans-serif; }
  .land-bg {
    background: radial-gradient(ellipse 85% 55% at 5% 0%, rgba(186,220,255,0.6) 0%, transparent 60%),
                radial-gradient(ellipse 70% 50% at 95% 10%, rgba(200,225,255,0.5) 0%, transparent 55%),
                radial-gradient(ellipse 60% 40% at 50% 100%, rgba(176,212,255,0.4) 0%, transparent 60%),
                #e8f1fb;
    min-height: 100vh;
  }
  .pad-card {
    background: rgba(255,255,255,0.62);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border: 1px solid rgba(175,215,255,0.38);
    border-radius: 22px;
  }
  .pad-hero {
    background: linear-gradient(135deg, rgba(186,220,255,0.55) 0%, rgba(214,233,255,0.35) 100%);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(175,215,255,0.45);
    border-radius: 28px;
  }
  .land-nav {
    background: rgba(255,255,255,0.75);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border-bottom: 1px solid rgba(175,215,255,0.45);
  }
`;

const LandingPage = () => {
  return (
    <div className="land-root land-bg min-h-screen">
      <style>{PAD_STYLE}</style>

      {/* Navbar */}
      <nav className="land-nav shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={logoImage}
              alt="PadaiSathi Logo"
              className="w-40 h-auto object-contain"
            />
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="px-5 py-2 rounded-xl font-semibold text-sm transition"
              style={{ background: 'rgba(186,220,255,0.6)', color: '#3b6fa0' }}
            >
              Home
            </Link>
            <Link
              to="/login"
              className="text-gray-600 font-semibold text-sm hover:text-blue-600 transition"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-5 py-2 text-white rounded-xl font-semibold text-sm transition"
              style={{ background: 'rgba(90,120,180,0.85)' }}
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto mt-8 px-6 lg:px-8">
        <div className="pad-hero px-8 py-16">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h2
                className="text-5xl font-bold text-gray-900 leading-tight mb-4"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                Study Less,<br />
                Understand More
              </h2>
              <p className="text-gray-600 text-lg mb-3">
                Upload, Summarize &amp; Learn.
              </p>
              <p className="text-gray-500 mb-8">
                Transform your documents into engaging videos, flashcards and quizzes with AI magic.
              </p>
              <Link
                to="/register"
                className="inline-block text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition"
                style={{ background: 'rgba(90,120,180,0.9)' }}
              >
                Get Started
              </Link>
            </div>

            <div className="md:w-1/2 flex justify-center">
              <img src={totoro} alt="PadaiSathi mascot" className="max-w-xs w-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Why Students Love Us */}
      <section className="max-w-7xl mx-auto px-6 py-20 lg:px-8">
        <div className="text-center mb-16">
          <h3
            className="text-4xl font-bold text-gray-900 mb-3"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            Why Students Love Us
          </h3>
          <p className="text-gray-500 text-lg">Everything you need to ace your exam</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* AI Summaries */}
          <div className="pad-card p-8 text-center hover:shadow-xl transition">
            <h4 className="text-2xl font-bold text-gray-800 mb-4">AI Summaries</h4>
            <p className="text-gray-500 mb-6">
              Big chapters leaving you? Upload your boring PDFs &amp; get summaries that actually make sense.
            </p>
            <div
              className="w-24 h-24 rounded-full mx-auto flex items-center justify-center"
              style={{ background: 'rgba(186,220,255,0.5)' }}
            >
              <FileText className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          {/* Video Magic */}
          <div className="pad-card p-8 text-center hover:shadow-xl transition">
            <h4 className="text-2xl font-bold text-gray-800 mb-4">Video Magic</h4>
            <p className="text-gray-500 mb-6">
              Tired of endless reading? Watch flashy AI-generated engaging videos.
            </p>
            <div
              className="w-24 h-24 rounded-full mx-auto flex items-center justify-center"
              style={{ background: 'rgba(200,220,255,0.5)' }}
            >
              <Film className="w-12 h-12 text-indigo-500" />
            </div>
          </div>

          {/* Exam Ready */}
          <div className="pad-card p-8 text-center hover:shadow-xl transition">
            <h4 className="text-2xl font-bold text-gray-800 mb-4">Exam Ready</h4>
            <p className="text-gray-500 mb-6">
              Relax and grasp AI-generated quizzes tailored to your content.
            </p>
            <div
              className="w-24 h-24 rounded-full mx-auto flex items-center justify-center"
              style={{ background: 'rgba(210,230,255,0.5)' }}
            >
              <GraduationCap className="w-12 h-12 text-blue-600" />
            </div>
          </div>
        </div>
      </section>

      {/* What Students Say */}
      <section className="max-w-7xl mx-auto px-6 pb-8 lg:px-8">
        <div className="pad-hero px-8 py-16">
          <h3
            className="text-4xl font-bold text-gray-900 text-center mb-12"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            What Students Say
          </h3>

          <div className="grid md:grid-cols-4 gap-6 mb-6">
            {[
              { name: 'Aarav S.', text: 'PadaiSathi turned my 50-page notes into a crisp summary in seconds. Game changer!', grad: 'from-blue-300 to-blue-500' },
              { name: 'Priya M.', text: 'The flashcards are so good. I went from failing to topping my class!', grad: 'from-purple-300 to-indigo-400' },
              { name: 'Rohan K.', text: 'The Minecraft video mode kept me focused the whole revision session.', grad: 'from-green-300 to-teal-400' },
              { name: 'Sita T.', text: 'Finally an app that gets students. The Gen-Z summaries are hilarious and helpful.', grad: 'from-pink-300 to-rose-400' },
            ].map((t, i) => (
              <div key={i} className="pad-card p-6">
                <div className={`w-16 h-16 rounded-full mx-auto mb-4 bg-gradient-to-br ${t.grad} flex items-center justify-center`}>
                  <span className="text-white font-bold text-lg">{t.name[0]}</span>
                </div>
                <p className="font-bold text-gray-700 text-center text-sm mb-2">{t.name}</p>
                <p className="text-gray-500 text-sm text-center">{t.text}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <ChevronDown className="w-8 h-8 mx-auto text-blue-300" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-8 mb-8 lg:px-8">
        <div className="pad-card p-16 text-center">
          <h3
            className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            Ready to Transform Your Learning?
            <GraduationCap className="w-9 h-9 text-blue-500" />
          </h3>
          <p className="text-gray-500 text-lg mb-8">
            Join 10,000+ students who are studying smarter, not harder
          </p>
          <Link
            to="/register"
            className="inline-block text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition"
            style={{ background: 'rgba(90,120,180,0.9)' }}
          >
            Start Learning Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-400 text-sm">
        © PadaiSathi All rights reserved.
      </footer>
    </div>
  );
};

export default LandingPage;
