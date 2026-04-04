import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Film, GraduationCap, Layers, Users, BookOpen } from 'lucide-react';
import logoImage from '../assets/images/logo1.png';
import totoro from '../assets/images/totoro.png';

const FEATURES = [
  {
    title: 'AI Summaries',
    desc: 'Upload your boring PDFs & get summaries that actually make sense — in seconds.',
    icon: <FileText className="w-10 h-10 text-blue-500" />,
    bg: 'rgba(186,220,255,0.5)',
  },
  {
    title: 'Video Magic',
    desc: 'Tired of endless reading? Watch flashy AI-generated engaging videos from your notes.',
    icon: <Film className="w-10 h-10 text-indigo-500" />,
    bg: 'rgba(200,220,255,0.5)',
  },
  {
    title: 'Exam Ready',
    desc: 'Relax and grasp AI-generated quizzes tailored exactly to your content.',
    icon: <GraduationCap className="w-10 h-10 text-blue-600" />,
    bg: 'rgba(210,230,255,0.5)',
  },
  {
    title: 'Smart Flashcards',
    desc: 'Flip through AI-generated flashcards to lock in key concepts fast.',
    icon: <Layers className="w-10 h-10 text-violet-500" />,
    bg: 'rgba(220,210,255,0.5)',
  },
  {
    title: 'Compete with Friends',
    desc: 'Challenge your friends on the leaderboard and climb the ranks together.',
    icon: <Users className="w-10 h-10 text-emerald-500" />,
    bg: 'rgba(200,240,220,0.5)',
  },
  {
    title: 'Smart Notebooks',
    desc: 'Save, organise and revisit your notes all in one beautiful place.',
    icon: <BookOpen className="w-10 h-10 text-rose-400" />,
    bg: 'rgba(255,210,210,0.5)',
  },
];

const TESTIMONIALS = [
  { name: 'Riya B.',  text: 'PadaiSathi turned my 50-page notes into a crisp summary in seconds. Game changer!', grad: 'from-blue-300 to-blue-500' },
  { name: 'Dixita B.', text: 'The flashcards are so good. I went from failing to topping my class!',               grad: 'from-purple-300 to-indigo-400' },
  { name: 'Jenisha S.', text: 'The Minecraft video mode kept me focused the whole revision session.',               grad: 'from-green-300 to-teal-400' },
  { name: 'Prasamsha S.',  text: 'Finally an app that gets students. The Gen-Z summaries are hilarious and helpful.',  grad: 'from-pink-300 to-rose-400' },
];

const LandingPage = () => {
  return (
    <div className="land-root land-bg min-h-screen">
      {/* ── Navbar ── */}
      <nav className="land-nav shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <img src={logoImage} alt="PadaiSathi Logo" className="h-10 sm:h-12 w-auto object-contain" />

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/"
              className="nav-home px-4 py-2 rounded-xl font-semibold text-sm transition"
              style={{ background: 'rgba(186,220,255,0.6)', color: '#3b6fa0' }}
            >
              Home
            </Link>
            <Link
              to="/login"
              className="nav-login text-gray-600 font-semibold text-sm hover:text-blue-600 transition"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-4 sm:px-5 py-2 text-white rounded-xl font-semibold text-sm transition"
              style={{ background: 'rgba(90,120,180,0.85)' }}
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-7xl mx-auto mt-6 sm:mt-8 px-4 sm:px-6 lg:px-8">
        <div className="pad-hero hero-pad px-6 sm:px-10 py-10 sm:py-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="md:w-1/2 text-center md:text-left">
              <h2 className="hero-heading">
                Study Less,<br />Understand More
              </h2>
              <p className="text-gray-600 text-base sm:text-lg mb-2">
                Upload, Summarize &amp; Learn.
              </p>
              <p className="text-gray-500 text-sm sm:text-base mb-8">
                Transform your documents into engaging videos, flashcards and quizzes with AI magic.
              </p>
              <Link
                to="/register"
                className="inline-block text-white px-7 py-3 rounded-xl font-semibold hover:opacity-90 transition text-sm sm:text-base"
                style={{ background: 'rgba(90,120,180,0.9)' }}
              >
                Get Started
              </Link>
            </div>

            <div className="md:w-1/2 flex justify-center items-center">
              <img
                src={totoro}
                alt="PadaiSathi mascot"
                className="hero-mascot"
                style={{
                  maxWidth: 360,
                  width: '100%',
                  filter: 'drop-shadow(0 12px 28px rgba(100,160,220,0.3))',
                  objectFit: 'contain',
                  marginTop: '-16px',
                  marginBottom: '-16px',
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="features-section max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <div className="text-center mb-10 sm:mb-14">
          <h3 className="section-heading mb-3">Why Students Love Us</h3>
          <p className="text-gray-500 text-base sm:text-lg">Everything you need to ace your exam</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
          {FEATURES.map((f) => (
            <div key={f.title} className="pad-card p-4 sm:p-8 text-center hover:shadow-xl transition flex flex-col items-center">
              <h4 className="text-base sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-4">{f.title}</h4>
              <p className="text-gray-500 text-xs sm:text-sm mb-4 sm:mb-6 hidden sm:block">{f.desc}</p>
              <div
                className="w-16 h-16 sm:w-24 sm:h-24 rounded-full flex items-center justify-center"
                style={{ background: f.bg }}
              >
                {f.icon}
              </div>
              <p className="text-gray-500 text-xs mt-3 sm:hidden leading-snug">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-8 lg:px-8">
        <div className="pad-hero testimonials-pad px-6 sm:px-10 py-10 sm:py-16">
          <h3 className="section-heading text-center mb-10 sm:mb-12">What Students Say</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="pad-card p-5 sm:p-6 hover:shadow-xl transition">
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full mx-auto mb-3 sm:mb-4 bg-gradient-to-br ${t.grad} flex items-center justify-center`}>
                  <span className="text-white font-bold text-base sm:text-lg">{t.name[0]}</span>
                </div>
                <p className="font-bold text-gray-700 text-center text-sm mb-1 sm:mb-2">{t.name}</p>
                <p className="text-gray-500 text-xs sm:text-sm text-center">{t.text}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 mb-8 lg:px-8">
        <div className="pad-card cta-pad p-8 sm:p-16 text-center">
          <h3 className="cta-heading mb-3 sm:mb-4 flex items-center justify-center gap-3 flex-wrap">
            Ready to Transform Your Learning?
            <GraduationCap className="w-10 h-10 sm:w-10 sm:h-10 text-blue-500 flex-shrink-0" />
          </h3>
          <p className="text-gray-500 text-sm sm:text-lg mb-6 sm:mb-8">
            Join students who are studying smarter, not harder
          </p>
          <Link
            to="/register"
            className="inline-block text-white px-7 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg hover:opacity-90 transition"
            style={{ background: 'rgba(90,120,180,0.9)' }}
          >
            Start Learning Now
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="text-center py-6 sm:py-8 text-gray-400 text-xs sm:text-sm">
        © PadaiSathi All rights reserved.
      </footer>
    </div>
  );
};

export default LandingPage;
