import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

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
      const response = await fetch(
        `http://localhost:8000/api/notebook/${id}?email=${email}`
      );
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

  if (isLoading) return (
    <div className="min-h-screen bg-gray-200">
      <Navbar />
      <div className="flex justify-center py-32">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-black" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-200">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/notebook')}
            className="px-4 py-2 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            📓 {notebook?.title}
          </h1>
        </div>

        {/* Summary Section */}
        <div className="bg-white rounded-3xl p-8 border-4 border-black mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📄 Summary</h2>
          {summary ? (
            <div>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {summary.slang_version_text || summary.summary_text}
              </p>
              <p className="text-xs text-gray-400 mt-4">
                Generated: {new Date(summary.generated_at).toLocaleString()}
              </p>
            </div>
          ) : (
            <p className="text-gray-400 italic">
              No summary yet — go to Summary page to generate one!
            </p>
          )}
        </div>

        {/* Flashcards Section */}
        <div className="bg-white rounded-3xl p-8 border-4 border-black mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            🃏 Flashcards ({flashcards.length})
          </h2>
          {flashcards.length > 0 ? (
            <div className="space-y-3">
              {flashcards.map((card, i) => (
                <div key={i} className="border-2 border-gray-200 rounded-xl p-4">
                  <p className="font-semibold text-gray-800">Q: {card.question}</p>
                  <p className="text-gray-600 mt-1">A: {card.answer}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic">
              No flashcards yet — go to Flashcards page to generate some!
            </p>
          )}
        </div>

        {/* Quiz Section */}
        <div className="bg-white rounded-3xl p-8 border-4 border-black mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            ❓ Quiz Questions ({quizzes.length})
          </h2>
          {quizzes.length > 0 ? (
            <div className="space-y-3">
              {quizzes.map((q, i) => (
                <div key={i} className="border-2 border-gray-200 rounded-xl p-4">
                  <p className="font-semibold text-gray-800">{i + 1}. {q.question}</p>
                  <p className="text-green-600 text-sm mt-1">✅ Answer: {q.correct_answer}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic">
              No quiz yet — go to Quiz page to generate one!
            </p>
          )}
        </div>

        {/* Videos Section */}
        <div className="bg-white rounded-3xl p-8 border-4 border-black mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            🎬 Videos ({videos.length})
          </h2>
          {videos.length > 0 ? (
            <div className="space-y-4">
              {videos.map((video, i) => (
                <div key={i} className="border-2 border-gray-200 rounded-xl p-4">
                  <video
                    controls
                    className="w-full rounded-xl"
                    src={video.s3_path}
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Theme: {video.background_theme} • {new Date(video.generated_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic">
              No videos yet — go to Video page to generate one!
            </p>
          )}
        </div>

      </div>
      <footer className="text-center py-6 text-gray-600 text-sm">
        © PadaiSathi All rights reserved.
      </footer>
    </div>
  );
};

export default NotebookDetailPage;