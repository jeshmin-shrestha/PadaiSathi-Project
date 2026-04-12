import React, { useState, useEffect, useRef } from 'react';
import { Check, Trophy, CheckCircle } from 'lucide-react';
import ChickenImage from '../assets/images/chickenicon.png';
import BadgeToast from '../components/BadgeToast';
import { API } from '../constants';

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

const QuizPage = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [newBadges, setNewBadges] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [availableSummaries, setAvailableSummaries] = useState([]);
  const [selectedSummaryId, setSelectedSummaryId] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [error, setError] = useState('');
  const [quizStarted, setQuizStarted] = useState(false);
  const [pastAttempts, setPastAttempts] = useState([]);

  const selectedSummaryIdRef = useRef(null);
  const scoreSubmittedRef = useRef(false);
  const userAnswersRef = useRef([]);

  useEffect(() => {
    const saved = localStorage.getItem('padai_quiz');
    if (saved) {
      const parsed = JSON.parse(saved);
      setQuestions(parsed.questions);
      setQuizStarted(true);
      setSelectedSummaryId(parsed.summaryId);
      selectedSummaryIdRef.current = parsed.summaryId;
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('padai_quiz_generating')) return;
    setIsLoading(true);
    setQuizStarted(false);
    setQuestions([]);
    const interval = setInterval(() => {
      if (!localStorage.getItem('padai_quiz_generating')) {
        const saved = localStorage.getItem('padai_quiz');
        if (saved) {
          const parsed = JSON.parse(saved);
          setQuestions(parsed.questions);
          setQuizStarted(true);
          setSelectedSummaryId(Number(parsed.summaryId));
          selectedSummaryIdRef.current = Number(parsed.summaryId);
        }
        setIsLoading(false);
        clearInterval(interval);
      }
    }, 500);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setIsLoading(false);
      localStorage.removeItem('padai_quiz_generating');
    }, 600000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, []);

  useEffect(() => {
    selectedSummaryIdRef.current = selectedSummaryId;
  }, [selectedSummaryId]);

  // Reset submission flag and answers when a new quiz is generated
  useEffect(() => {
    scoreSubmittedRef.current = false;
    userAnswersRef.current = [];
  }, [questions]);

  // Record the user's answer each time they answer a question
  useEffect(() => {
    if (showFeedback && selectedAnswer !== null) {
      userAnswersRef.current[currentQuestion] = selectedAnswer;
    }
  }, [showFeedback]);

  // Auto-submit score when last question is answered
  useEffect(() => {
    if (
      questions.length > 0 &&
      currentQuestion === questions.length - 1 &&
      showFeedback &&
      !scoreSubmittedRef.current
    ) {
      scoreSubmittedRef.current = true;
      fetch(`${API}/api/submit-quiz-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: userEmail,
          summary_id: selectedSummaryIdRef.current,
          score,
          total_questions: questions.length,
          user_answers: userAnswersRef.current,
        }),
      })
        .then(() => fetchPastAttempts(userEmail))
        .catch(() => {});
    }
  }, [currentQuestion, showFeedback]);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) {
      window.location.href = '/login';
      return;
    }
    setUserEmail(storedUser.email);
    fetchSummaries(storedUser.email);
    fetchPastAttempts(storedUser.email);
  }, []);

  const fetchPastAttempts = async (email) => {
    try {
      const res = await fetch(`${API}/api/quiz-attempts?email=${email}`);
      const data = await res.json();
      if (data.attempts) setPastAttempts(data.attempts);
    } catch {
      // silently ignore
    }
  };

  const fetchSummaries = async (email) => {
    try {
      const response = await fetch(`${API}/api/my-summaries?email=${email}`);
      const data = await response.json();
      if (data.summaries?.length > 0) {
        const sorted = [...data.summaries].sort(
          (a, b) => new Date(b.generated_at) - new Date(a.generated_at)
        );
        setAvailableSummaries(sorted);
        const hint = Number(localStorage.getItem('padai_notebook_summary_hint'));
        if (hint && sorted.find(s => s.id === hint)) {
          setSelectedSummaryId(hint);
          selectedSummaryIdRef.current = hint;
          localStorage.removeItem('padai_notebook_summary_hint');
        } else if (!selectedSummaryIdRef.current) {
          setSelectedSummaryId(sorted[0].id);
          selectedSummaryIdRef.current = sorted[0].id;
        }
      }
    } catch {
      setError('Could not load summaries. Is the backend running?');
    }
  };

  const loadQuiz = async () => {
    const idToUse = selectedSummaryIdRef.current;
    console.log('[Quiz] Using summary ID:', idToUse);

    if (!idToUse) {
      setError('No summary found. Upload a PDF on the Summary page first!');
      return;
    }

    setIsLoading(true);
    localStorage.setItem('padai_quiz_generating', idToUse);
    setError('');
    setQuestions([]);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setQuizStarted(false);

    try {
      const res = await fetch(`${API}/api/generate-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary_id: idToUse, user_email: userEmail })
      });
      const data = await res.json();
      if (data.success && data.questions?.length > 0) {
        setQuestions(data.questions);
        if (data.newly_earned_badges?.length > 0) {
          setNewBadges(data.newly_earned_badges);
        }
        setQuizStarted(true);
        localStorage.setItem('padai_quiz', JSON.stringify({ questions: data.questions, summaryId: idToUse }));
      } else {
        setError('Could not generate quiz questions. Try again.');
      }
    } catch (e) {
      setError('Failed to connect to backend: ' + e.message);
    } finally {
      setIsLoading(false);
      localStorage.removeItem('padai_quiz_generating');
    }
  };

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

  const selectedSummaryEntry = availableSummaries.find(s => s.id === selectedSummaryId);
  const summaryLabel = selectedSummaryEntry
    ? new Date(selectedSummaryEntry.generated_at).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : selectedSummaryId ? `Summary ${selectedSummaryId}` : '';

  return (
    <div className="min-h-screen pad-bg">
      <style>{PAD_STYLE}</style>

      <div className="max-w-7xl mx-auto px-6 py-6 lg:px-8">

        {/* Summary selector */}
        <div className="pad-card p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-1">Generate Quiz</h3>
          <p className="text-sm text-gray-500 mb-4">
            Newest summary is auto-selected. Switch below if needed.
          </p>

          {availableSummaries.length > 0 ? (
            <>
              {selectedSummaryId && (
                <div className="mb-3 px-3 py-2 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" /> Using {summaryLabel}
                </div>
              )}
              <div className="flex gap-3 items-center">
                <select
                  className="flex-1 p-3 border border-blue-100 rounded-xl text-gray-700 bg-white/60"
                  value={selectedSummaryId || ''}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setSelectedSummaryId(val);
                    selectedSummaryIdRef.current = val;
                  }}
                >
                  {availableSummaries.map((s, i) => (
                    <option key={s.id} value={s.id}>
                      Summary {availableSummaries.length - i} — {new Date(s.generated_at).toLocaleString()}
                    </option>
                  ))}
                </select>
                <button
                  onClick={loadQuiz}
                  disabled={isLoading || !selectedSummaryId}
                  className="px-6 py-3 text-white font-bold rounded-xl transition whitespace-nowrap"
                  style={{
                    background: (isLoading || !selectedSummaryId) ? 'rgba(150,170,200,0.7)' : 'rgba(90,120,180,0.9)',
                  }}
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

          {error && <p className="mt-3 text-red-500 text-sm font-medium">{error}</p>}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="pad-card p-16 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-400 mb-4" />
            <p className="text-gray-500 font-medium">AI is crafting your quiz...</p>
            <p className="text-gray-400 text-sm mt-1">Using {summaryLabel}</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !quizStarted && (
          <div className="pad-card p-16 flex items-center justify-center">
            <p className="text-gray-400 italic text-center">
              Select a summary and click "Start Quiz"
            </p>
          </div>
        )}

        {/* Quiz UI */}
        {!isLoading && quizStarted && questions.length > 0 && (
          <>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-bold text-gray-700">
                  Question {currentQuestion + 1} of {questions.length}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">{summaryLabel}</span>
                  <span className="text-lg font-bold text-gray-700">
                    Score: {score}/{questions.length}
                  </span>
                </div>
              </div>
              <div className="w-full bg-blue-100 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, background: 'rgba(90,120,180,0.85)' }}
                />
              </div>
            </div>

            <div className="pad-card p-12 mb-6 relative">
              <h2 className="text-2xl font-bold text-gray-800 text-center mb-12">
                {questions[currentQuestion].question}
              </h2>

              <div className="space-y-4">
                {questions[currentQuestion].options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerClick(index)}
                    disabled={showFeedback}
                    className={`w-full text-left px-6 py-4 rounded-2xl border font-semibold text-lg transition ${
                      selectedAnswer === index && showFeedback
                        ? isCorrect
                          ? 'bg-green-100 border-green-400 text-green-800'
                          : 'bg-red-100 border-red-400 text-red-800'
                        : selectedAnswer === index
                        ? 'border-blue-300 bg-blue-50 text-blue-800'
                        : 'border-blue-100 bg-white/60 hover:bg-blue-50 text-gray-700'
                    } ${showFeedback ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              <div className="absolute -bottom-16 -left-10">
                <div className="w-30 h-30 rounded-full border border-blue-100 flex items-center justify-center"
                  style={{ background: 'rgba(255,220,80,0.9)' }}>
                  <img src={ChickenImage} alt="Chicken" className="w-24 h-24 object-contain" />
                </div>
              </div>
            </div>

            {showFeedback && (
              <div className={`rounded-3xl p-6 border flex items-center justify-between ${
                isCorrect
                  ? 'bg-green-500 border-green-600'
                  : 'bg-red-500 border-red-600'
              }`}>
                <span className="text-white text-xl font-bold">
                  {isCorrect
                    ? "YAY !!! You've got it right"
                    : 'Oops! That\'s not correct. The right answer was: ' +
                      questions[currentQuestion].options[questions[currentQuestion].correct]}
                </span>
                {isCorrect && (
                  <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center border-4 border-white">
                    <Check className="w-10 h-10 text-white stroke-[3]" />
                  </div>
                )}
              </div>
            )}

            {currentQuestion === questions.length - 1 && showFeedback && (
              <div className="mt-6 text-center">
                <div className="pad-card p-8">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Trophy className="w-8 h-8 text-yellow-500" />
                    <h3 className="text-3xl font-bold text-gray-800">Quiz Complete!</h3>
                  </div>
                  <p className="text-xl text-gray-600 mb-6">
                    Your final score: {score} out of {questions.length}
                  </p>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={restartQuiz}
                      className="text-white px-8 py-3 rounded-xl font-bold transition"
                      style={{ background: 'rgba(90,120,180,0.9)' }}
                    >
                      Restart Quiz
                    </button>
                    <button
                      onClick={loadQuiz}
                      className="text-white px-8 py-3 rounded-xl font-bold transition"
                      style={{ background: 'rgba(140,80,200,0.85)' }}
                    >
                      New Questions
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Past Attempts — only when quiz is not actively in progress */}
        {pastAttempts.length > 0 && !quizStarted && (
          <div className="pad-card p-6 mt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Past Attempts</h3>
            <div className="space-y-2">
              {pastAttempts.map((a) => {
                const pct = Math.round((a.score / a.total_questions) * 100);
                return (
                  <div key={a.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/60 border border-blue-100">
                    <span className="text-sm text-gray-500">
                      {new Date(a.attempted_at).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={`font-bold text-sm ${pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                      {a.score}/{a.total_questions} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <footer className="text-center py-6 text-gray-500 text-sm mt-8">
        © PadaiSathi All rights reserved.
      </footer>
      <BadgeToast badgeIds={newBadges} onDone={() => setNewBadges([])} />
    </div>
  );
};

export default QuizPage;
