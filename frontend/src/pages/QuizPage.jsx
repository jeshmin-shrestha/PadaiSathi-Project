import React, { useState, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import Navbar from '../components/Navbar';

const QuizPage = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // ── API state ──────────────────────────────────────────────────────────────
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [availableSummaries, setAvailableSummaries] = useState([]);
  const [selectedSummaryId, setSelectedSummaryId] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [error, setError] = useState('');
  const [quizStarted, setQuizStarted] = useState(false);

  // ── Ref so callbacks always read the latest ID (fixes stale closure bug) ──
  const selectedSummaryIdRef = useRef(null);

  useEffect(() => {
    selectedSummaryIdRef.current = selectedSummaryId;
  }, [selectedSummaryId]);

  // ── Load user + summaries on mount ────────────────────────────────────────
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) {
      window.location.href = '/login'; // redirect if not logged in
      return;
    }
    setUserEmail(storedUser.email);
    fetchSummaries(storedUser.email);
  }, []);

  const fetchSummaries = async (email) => {
    try {
      const response = await fetch(`http://localhost:8000/api/my-summaries?email=${email}`);
      const data = await response.json();
      if (data.summaries?.length > 0) {
        const sorted = [...data.summaries].sort(
          (a, b) => new Date(b.generated_at) - new Date(a.generated_at)
        );
        setAvailableSummaries(sorted);
        if (!selectedSummaryIdRef.current) {
          setSelectedSummaryId(sorted[0].id);
          selectedSummaryIdRef.current = sorted[0].id;
        }
      }
    } catch {
      setError('Could not load summaries. Is the backend running?');
    }
  };

  // ── Generate quiz ─────────────────────────────────────────────────────────
  const loadQuiz = async () => {
    const idToUse = selectedSummaryIdRef.current;
    console.log('[Quiz] Using summary ID:', idToUse);

    if (!idToUse) {
      setError('No summary found. Upload a PDF on the Summary page first!');
      return;
    }

    setIsLoading(true);
    setError('');
    setQuestions([]);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setQuizStarted(false);

    try {
      const res = await fetch('http://localhost:8000/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary_id: idToUse, user_email: userEmail })
      });
      const data = await res.json();
      if (data.success && data.questions?.length > 0) {
        setQuestions(data.questions);
        setQuizStarted(true);
      } else {
        setError('Could not generate quiz questions. Try again.');
      }
    } catch (e) {
      setError('Failed to connect to backend: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Quiz logic ────────────────────────────────────────────────────────────
  const handleAnswerClick = (index) => {
    if (showFeedback) return;
    setSelectedAnswer(index);
    const correct = index === questions[currentQuestion].correct;
    setIsCorrect(correct);
    if (correct) setScore(s => s + 1);
    setShowFeedback(true);
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(q => q + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
      }
    }, 2000);
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setIsCorrect(false);
  };

  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-200">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* ── Summary selector ────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl p-6 border-4 border-black mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Generate Quiz</h3>
          <p className="text-sm text-gray-500 mb-4">
            Newest summary is auto-selected. Switch below if needed.
          </p>

          {availableSummaries.length > 0 ? (
            <>
              {selectedSummaryId && (
                <div className="mb-3 px-3 py-2 bg-green-50 border border-green-300 rounded-xl text-sm text-green-700 font-medium">
                  ✅ Using summary #{selectedSummaryId}
                </div>
              )}
              <div className="flex gap-3 items-center">
                <select
                  className="flex-1 p-3 border-2 border-gray-300 rounded-xl text-gray-800"
                  value={selectedSummaryId || ''}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setSelectedSummaryId(val);
                    selectedSummaryIdRef.current = val;
                  }}
                >
                  {availableSummaries.map(s => (
                    <option key={s.id} value={s.id}>
                      #{s.id} — {new Date(s.generated_at).toLocaleString()}
                    </option>
                  ))}
                </select>
                <button
                  onClick={loadQuiz}
                  disabled={isLoading || !selectedSummaryId}
                  className="px-6 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition disabled:bg-gray-400 whitespace-nowrap"
                >
                  {isLoading ? 'Generating...' : 'Start Quiz'}
                </button>
              </div>
            </>
          ) : (
            <p className="text-gray-500 italic text-sm">
              No summaries yet — upload a PDF on the Summary page first.
            </p>
          )}

          {error && <p className="mt-3 text-red-600 text-sm font-medium">{error}</p>}
        </div>

        {/* ── Loading ──────────────────────────────────────────────────────── */}
        {isLoading && (
          <div className="bg-white rounded-3xl border-4 border-black p-16 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-black mb-4" />
            <p className="text-gray-500 font-medium">AI is crafting your quiz...</p>
            <p className="text-gray-400 text-sm mt-1">Using summary #{selectedSummaryIdRef.current}</p>
          </div>
        )}

        {/* ── Empty state ───────────────────────────────────────────────────── */}
        {!isLoading && !quizStarted && (
          <div className="bg-white rounded-3xl border-4 border-black p-16 flex items-center justify-center">
            <p className="text-gray-400 italic text-center">
              Select a summary and click "Start Quiz"
            </p>
          </div>
        )}

        {/* ── Quiz UI ──────────────────────────────────────────────────────── */}
        {!isLoading && quizStarted && questions.length > 0 && (
          <>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-bold text-gray-800">
                  Question {currentQuestion + 1} of {questions.length}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">Summary #{selectedSummaryId}</span>
                  <span className="text-lg font-bold text-gray-800">
                    Score: {score}/{questions.length}
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-300 rounded-full h-3">
                <div
                  className="bg-purple-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="bg-white rounded-3xl p-12 border-4 border-black mb-6 relative">
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
                {questions[currentQuestion].question}
              </h2>

              <div className="space-y-4">
                {questions[currentQuestion].options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerClick(index)}
                    disabled={showFeedback}
                    className={`w-full text-left px-6 py-4 rounded-2xl border-4 border-black font-semibold text-lg transition ${
                      selectedAnswer === index && showFeedback
                        ? isCorrect
                          ? 'bg-green-200 border-green-600'
                          : 'bg-red-200 border-red-600'
                        : selectedAnswer === index
                        ? 'bg-purple-100 border-purple-600'
                        : 'bg-white hover:bg-gray-50'
                    } ${showFeedback ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              <div className="absolute -bottom-6 -left-6">
                <div className="w-20 h-20 bg-yellow-400 rounded-full border-4 border-black flex items-center justify-center">
                  <span className="text-3xl">🐱</span>
                </div>
              </div>
            </div>

            {showFeedback && (
              <div className={`rounded-3xl p-6 border-4 flex items-center justify-between ${
                isCorrect ? 'bg-green-600 border-green-800' : 'bg-red-600 border-red-800'
              }`}>
                <span className="text-white text-xl font-bold">
                  {isCorrect
                    ? "YAY !!! You've got it right"
                    : 'Oops! That\'s not correct. The right answer was: ' +
                      questions[currentQuestion].options[questions[currentQuestion].correct]}
                </span>
                {isCorrect && (
                  <div className="w-16 h-16 bg-green-700 rounded-full flex items-center justify-center border-4 border-white">
                    <Check className="w-10 h-10 text-white stroke-[3]" />
                  </div>
                )}
              </div>
            )}

            {currentQuestion === questions.length - 1 && showFeedback && (
              <div className="mt-6 text-center">
                <div className="bg-white rounded-3xl p-8 border-4 border-black">
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">Quiz Complete! 🎉</h3>
                  <p className="text-xl text-gray-700 mb-6">
                    Your final score: {score} out of {questions.length}
                  </p>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={restartQuiz}
                      className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition"
                    >
                      Restart Quiz
                    </button>
                    <button
                      onClick={loadQuiz}
                      className="bg-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-purple-700 transition"
                    >
                      New Questions
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <footer className="text-center py-6 text-gray-600 text-sm mt-8">
        © PadaiSathi All rights reserved.
      </footer>
    </div>
  );
};

export default QuizPage;