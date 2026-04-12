import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, FileText, Layers, HelpCircle, Film, CheckCircle, ArrowRight } from 'lucide-react';
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
  const [quizAttempts, setQuizAttempts] = useState([]);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) {
      window.location.href = '/login';
      return;
    }
    setUserEmail(storedUser.email);
    fetchNotebookDetails(storedUser.email);
    fetch(`${API}/api/quiz-attempts?email=${storedUser.email}`)
      .then(r => r.json())
      .then(d => { if (d.attempts) setQuizAttempts(d.attempts); })
      .catch(() => {});
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

      <div className="flex justify-center py-32">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-400" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pad-bg">
      <style>{PAD_STYLE}</style>


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
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-purple-400" /> Quiz Questions ({quizzes.length})
              </h2>
              {(() => {
                const attempts = quizAttempts.filter(a => a.summary_id === summary?.id);
                if (attempts.length === 0) return null;
                const best = attempts.reduce((b, a) => a.score > b.score ? a : b, attempts[0]);
                const pct = Math.round((best.score / best.total_questions) * 100);
                return (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${pct >= 80 ? 'bg-green-100 text-green-700' : pct >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'}`}>
                    Best: {best.score}/{best.total_questions}
                  </span>
                );
              })()}
            </div>
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
              {(() => {
                const lastAttempt = quizAttempts.filter(a => a.summary_id === summary?.id)[0];
                const userAnswers = lastAttempt?.user_answers || [];
                return quizzes.map((q, i) => {
                  const correctIdx = parseInt(q.correct_answer);
                  const correctText = q.options?.[correctIdx] ?? q.correct_answer;
                  const userIdx = userAnswers[i];
                  const answered = userIdx !== undefined && userIdx !== null;
                  const gotRight = answered && userIdx === correctIdx;
                  return (
                    <div key={i} className={`border rounded-xl p-4 ${answered ? (gotRight ? 'border-green-200 bg-green-50/40' : 'border-red-200 bg-red-50/30') : 'border-blue-100 bg-white/40'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-gray-700">{i + 1}. {q.question}</p>
                        {answered && (
                          <span className={`text-lg flex-shrink-0 ${gotRight ? 'text-green-500' : 'text-red-400'}`}>
                            {gotRight ? '✓' : '✗'}
                          </span>
                        )}
                      </div>
                      <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> {correctText}
                      </p>
                      {answered && !gotRight && (
                        <p className="text-red-400 text-sm mt-0.5">Your answer: {q.options?.[userIdx] ?? `Option ${userIdx + 1}`}</p>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            <p className="text-gray-400 italic">
              No quiz yet — click the button above to generate one!
            </p>
          )}

          {/* Past attempts for this notebook's summary */}
          {(() => {
            const attempts = quizAttempts.filter(a => a.summary_id === summary?.id);
            if (attempts.length === 0) return null;
            return (
              <div className="mt-4 pt-4 border-t border-blue-100">
                <p className="text-sm font-semibold text-gray-500 mb-2">Your attempts</p>
                <div className="space-y-1.5">
                  {attempts.slice(0, 5).map((a) => {
                    const pct = Math.round((a.score / a.total_questions) * 100);
                    return (
                      <div key={a.id} className="flex justify-between text-sm px-3 py-2 rounded-xl bg-white/50 border border-blue-50">
                        <span className="text-gray-400">{new Date(a.attempted_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        <span className={`font-bold ${pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                          {a.score}/{a.total_questions} ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
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
