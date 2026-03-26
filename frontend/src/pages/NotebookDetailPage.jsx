import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, FileText, Layers, HelpCircle, Film, CheckCircle, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import { API } from '../constants';
import ReactMarkdown from 'react-markdown';

const PAD_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Sora:wght@400;600;700;800&display=swap');
  .pad-bg * { font-family: 'Nunito', sans-serif; }
  .pad-bg {
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
`;

const NotebookDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notebook, setNotebook] = useState(null);
  const [summary, setSummary] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) {
      window.location.href = '/login';
      return;
    }
    setUserEmail(storedUser.email);
    fetchNotebookDetails(storedUser.email);
  }, [id]);

  const fetchNotebookDetails = async (email) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API}/api/notebook/${id}?email=${email}`);
      const data = await response.json();
      if (data.notebook) {
        setNotebook(data.notebook);
        setSummary(data.summary);
        setFlashcards(data.flashcards || []);
        setQuizzes(data.quizzes || []);
        setVideos(data.videos || []);
      }
    } catch (error) {
      console.error('Error fetching notebook:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const goToPageWithHint = (path) => {
    if (summary?.id) {
      localStorage.setItem('padai_notebook_summary_hint', summary.id);
    }
    if (path === '/flashcards' && flashcards.length > 0 && summary?.id) {
      localStorage.setItem('padai_flashcards', JSON.stringify({ flashcards, summaryId: summary.id }));
    }
    navigate(path);
  };

  if (isLoading) return (
    <div className="min-h-screen pad-bg">
      <style>{PAD_STYLE}</style>
      <Navbar />
      <div className="flex justify-center py-32">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-400" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pad-bg">
      <style>{PAD_STYLE}</style>
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-6 lg:px-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/notebook')}
            className="flex items-center gap-2 px-4 py-2 text-white rounded-xl font-semibold hover:opacity-90 transition"
            style={{ background: 'rgba(90,120,180,0.85)' }}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2" style={{ fontFamily: "'Sora', sans-serif" }}>
            <BookOpen className="w-7 h-7 text-blue-400" /> {notebook?.title}
          </h1>
        </div>

        {/* Summary Section */}
        <div className="pad-card p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" /> Summary
            </h2>
            <button
              onClick={() => navigate('/summary')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition"
              style={{ background: 'rgba(90,120,180,0.85)' }}
            >
              {summary ? 'View Summary' : 'Generate Summary'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {summary ? (
            <div>
              <div className="text-gray-600 leading-relaxed prose prose-sm max-w-none">
                <ReactMarkdown>{summary.slang_version_text || summary.summary_text}</ReactMarkdown>
              </div>
              <p className="text-xs text-gray-400 mt-4">
                Generated: {new Date(summary.generated_at).toLocaleString()}
              </p>
            </div>
          ) : (
            <p className="text-gray-400 italic">
              No summary yet — click the button above to generate one!
            </p>
          )}
        </div>

        {/* Flashcards Section */}
        <div className="pad-card p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" /> Flashcards ({flashcards.length})
            </h2>
            <button
              onClick={() => goToPageWithHint('/flashcards')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition"
              style={{ background: 'rgba(90,120,180,0.85)' }}
            >
              {flashcards.length > 0 ? 'Practice Cards' : 'Generate Cards'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {flashcards.length > 0 ? (
            <div className="space-y-3">
              {flashcards.map((card, i) => (
                <div key={i} className="border border-blue-100 rounded-xl p-4 bg-white/40">
                  <p className="font-semibold text-gray-700">Q: {card.question}</p>
                  <p className="text-gray-500 mt-1">A: {card.answer}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic">
              No flashcards yet — click the button above to generate some!
            </p>
          )}
        </div>

        {/* Quiz Section */}
        <div className="pad-card p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-purple-400" /> Quiz Questions ({quizzes.length})
            </h2>
            <button
              onClick={() => goToPageWithHint('/quiz')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition"
              style={{ background: 'rgba(90,120,180,0.85)' }}
            >
              {quizzes.length > 0 ? 'Take Quiz' : 'Generate Quiz'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {quizzes.length > 0 ? (
            <div className="space-y-3">
              {quizzes.map((q, i) => (
                <div key={i} className="border border-blue-100 rounded-xl p-4 bg-white/40">
                  <p className="font-semibold text-gray-700">{i + 1}. {q.question}</p>
                  <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Answer: {q.correct_answer}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic">
              No quiz yet — click the button above to generate one!
            </p>
          )}
        </div>

        {/* Videos Section */}
        <div className="pad-card p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Film className="w-5 h-5 text-blue-500" /> Videos ({videos.length})
            </h2>
            <button
              onClick={() => goToPageWithHint('/video')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition"
              style={{ background: 'rgba(90,120,180,0.85)' }}
            >
              {videos.length > 0 ? 'Generate New Video' : 'Generate Video'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {videos.length > 0 ? (
            <div className="space-y-4">
              {videos.map((video, i) => (
                <div key={i} className="border border-blue-100 rounded-xl p-4 bg-white/40">
                  <video controls className="w-full rounded-xl" src={video.s3_path} />
                  <p className="text-xs text-gray-400 mt-2">
                    Theme: {video.background_theme} · {new Date(video.generated_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic">
              No videos yet — click the button above to generate one!
            </p>
          )}
        </div>

      </div>

      <footer className="text-center py-6 text-gray-500 text-sm">
        © PadaiSathi All rights reserved.
      </footer>
    </div>
  );
};

export default NotebookDetailPage;
