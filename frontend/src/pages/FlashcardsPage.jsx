import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Layers, CheckCircle, Check } from 'lucide-react';
import BadgeToast from '../components/BadgeToast';
import { API } from '../constants';
import ChickenImage from '../assets/images/chickenicon.png';

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
  @keyframes flipIn {
    from { opacity: 0; transform: scale(0.97); }
    to   { opacity: 1; transform: scale(1); }
  }
  .card-enter { animation: flipIn 0.3s cubic-bezier(0.34,1.56,0.64,1); }
  .nav-dot { transition: all 0.2s ease; cursor: pointer; }
  .nav-dot:hover { transform: scale(1.4); }
`;

const FlashcardPage = () => {
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState(new Set());
  const [flashcards, setFlashcards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [availableSummaries, setAvailableSummaries] = useState([]);
  const [selectedSummaryId, setSelectedSummaryId] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [error, setError] = useState('');
  const selectedSummaryIdRef = useRef(null);
  const [newBadges, setNewBadges] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('padai_flashcards');
    if (saved) {
      const parsed = JSON.parse(saved);
      setFlashcards(parsed.flashcards);
      setSelectedSummaryId(parsed.summaryId);
      selectedSummaryIdRef.current = parsed.summaryId;
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('padai_flashcards_generating')) return;
    setIsLoading(true);
    setFlashcards([]);
    const interval = setInterval(() => {
      if (!localStorage.getItem('padai_flashcards_generating')) {
        const saved = localStorage.getItem('padai_flashcards');
        if (saved) {
          const parsed = JSON.parse(saved);
          setFlashcards(parsed.flashcards);
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
      localStorage.removeItem('padai_flashcards_generating');
    }, 600000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, []);

  useEffect(() => {
    selectedSummaryIdRef.current = selectedSummaryId;
  }, [selectedSummaryId]);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
    if (!storedUser) {
      window.location.href = '/login';
      return;
    }
    setUserEmail(storedUser.email);
    fetchSummaries(storedUser.email);
  }, []);

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

  const loadFlashcards = async () => {
    const idToUse = selectedSummaryIdRef.current;
    if (!idToUse) {
      setError('No summary found. Upload a PDF on the Summary page first!');
      return;
    }
    setIsLoading(true);
    localStorage.setItem('padai_flashcards_generating', idToUse);
    setError('');
    setFlashcards([]);
    setCurrentCard(0);
    setIsFlipped(false);
    setKnownCards(new Set());

    try {
      const res = await fetch(`${API}/api/generate-flashcards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary_id: idToUse, user_email: userEmail })
      });
      const data = await res.json();
      if (data.success && data.flashcards?.length > 0) {
        setFlashcards(data.flashcards);
        if (data.newly_earned_badges?.length > 0) {
          setNewBadges(data.newly_earned_badges);
        }
        localStorage.setItem('padai_flashcards', JSON.stringify({ flashcards: data.flashcards, summaryId: idToUse }));
      } else {
        setError('Could not generate flashcards. Try again.');
      }
    } catch (e) {
      setError('Failed to connect to backend: ' + e.message);
    } finally {
      setIsLoading(false);
      localStorage.removeItem('padai_flashcards_generating');
    }
  };

  const handleFlip = () => setIsFlipped(f => !f);
  const handlePrevious = () => {
    if (currentCard > 0) { setCurrentCard(c => c - 1); setIsFlipped(false); }
  };
  const handleNext = () => {
    if (currentCard < flashcards.length - 1) { setCurrentCard(c => c + 1); setIsFlipped(false); }
  };
  const toggleKnown = () => {
    setKnownCards(prev => {
      const next = new Set(prev);
      next.has(currentCard) ? next.delete(currentCard) : next.add(currentCard);
      return next;
    });
  };
  const resetCards = () => {
    setCurrentCard(0);
    setIsFlipped(false);
    setKnownCards(new Set());
  };

  const knownCount = knownCards.size;
  const progressPercent = flashcards.length > 0 ? (knownCount / flashcards.length) * 100 : 0;
  const isKnown = knownCards.has(currentCard);

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
          <h3 className="text-lg font-bold text-gray-800 mb-1">Generate Flashcards</h3>
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
                  onClick={loadFlashcards}
                  disabled={isLoading || !selectedSummaryId}
                  className="px-6 py-3 text-white font-bold rounded-xl transition whitespace-nowrap"
                  style={{
                    background: (isLoading || !selectedSummaryId) ? 'rgba(150,170,200,0.7)' : 'rgba(90,120,180,0.9)',
                  }}
                >
                  {isLoading ? 'Generating...' : 'Generate Cards'}
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
          <div className="pad-card p-16 flex flex-col items-center justify-center mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-400 mb-4" />
            <p className="text-gray-500 font-medium">AI is creating your flashcards...</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && flashcards.length === 0 && (
          <div className="pad-card p-16 flex flex-col items-center justify-center gap-3">
            <Layers className="w-14 h-14 text-blue-200 mb-2" />
            <p className="text-gray-400 italic text-center">
              Select a summary and click "Generate Cards"
            </p>
          </div>
        )}

        {/* Flashcard UI */}
        {!isLoading && flashcards.length > 0 && (
          <>
            {/* Counter + reset */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{knownCount} / {flashcards.length} mastered</span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">Card {currentCard + 1} of {flashcards.length}</span>
                <button onClick={resetCards} title="Reset all" className="text-gray-400 hover:text-gray-600 transition">
                  <RotateCcw size={15} />
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-blue-100 rounded-full h-2 mb-5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 bg-green-400"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* The Card */}
            <div
              key={`${currentCard}-${isFlipped}`}
              onClick={handleFlip}
              className={`card-enter cursor-pointer rounded-3xl min-h-96 flex flex-col items-center justify-center p-12 mb-5 relative select-none transition-all duration-300 ${
                isFlipped
                  ? 'border border-gray-200'
                  : isKnown
                  ? 'border border-green-300'
                  : 'border border-blue-100'
              }`}
              style={{
                background: isFlipped
                  ? 'rgba(30,40,60,0.88)'
                  : isKnown
                  ? 'rgba(240,255,245,0.85)'
                  : 'rgba(255,255,255,0.72)',
                backdropFilter: 'blur(18px)',
              }}
            >
              <span className={`absolute top-4 right-5 text-xs font-bold uppercase tracking-widest ${isFlipped ? 'text-gray-400' : 'text-gray-300'}`}>
                {isFlipped ? 'Answer' : 'Question'}
              </span>

              {isKnown && !isFlipped && (
                <span className="absolute top-4 left-5 text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" /> Known
                </span>
              )}

              {!isFlipped ? (
                <>
                  <h2 className="text-2xl font-bold text-gray-800 text-center mb-8 leading-relaxed max-w-lg">
                    {flashcards[currentCard].question}
                  </h2>
                  <p className="text-gray-400 text-sm">Click to Reveal</p>
                </>
              ) : (
                <>
                  <p className="text-lg text-white text-center leading-relaxed mb-8 max-w-lg">
                    {flashcards[currentCard].answer}
                  </p>
                  <p className="text-gray-500 text-sm">Click to hide</p>
                </>
              )}
            </div>

            {/* Dot navigation */}
            <div className="flex justify-center gap-2 mb-6 flex-wrap">
              {flashcards.map((_, i) => (
                <div
                  key={i}
                  className="nav-dot"
                  onClick={() => { setCurrentCard(i); setIsFlipped(false); }}
                  style={{
                    width: i === currentCard ? '28px' : '10px',
                    height: '10px',
                    borderRadius: '5px',
                    background: knownCards.has(i) ? '#22c55e' : i === currentCard ? 'rgba(90,120,180,0.85)' : '#bfdbfe',
                    transition: 'all 0.25s ease'
                  }}
                />
              ))}
            </div>

            {/* Navigation row */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handlePrevious}
                disabled={currentCard === 0}
                className="w-12 h-12 rounded-full border border-blue-200 bg-white/60 flex items-center justify-center hover:bg-blue-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-6 h-6 text-gray-600" />
              </button>

              <button
                onClick={toggleKnown}
                className={`flex-1 py-4 rounded-2xl font-bold text-lg border transition ${
                  isKnown
                    ? 'bg-green-500 text-white border-green-400 hover:bg-green-600'
                    : 'bg-white/60 text-gray-700 border-blue-100 hover:bg-blue-50'
                }`}
              >
                {isKnown ? (
                  <span className="flex items-center justify-center gap-2">
                    <Check className="w-5 h-5" /> Got It!
                  </span>
                ) : 'Mark as Known'}
              </button>

              <button
                onClick={handleNext}
                disabled={currentCard === flashcards.length - 1}
                className="w-12 h-12 rounded-full flex items-center justify-center hover:opacity-90 transition disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: 'rgba(90,120,180,0.85)' }}
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Completion banner */}
            {knownCount === flashcards.length && flashcards.length > 0 && (
              <div className="mt-6 p-5 bg-green-50 border border-green-200 rounded-3xl text-center">
                <img src={ChickenImage} alt="Chicken" className="w-24 h-24 object-contain mx-auto mb-2" />
                <p className="text-lg font-bold text-green-700">YAYY!!!</p>
                <p className="text-lg font-bold text-green-700">
                  You've mastered all {flashcards.length} cards!
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <footer className="text-center py-6 text-gray-500 text-sm mt-8">
        © PadaiSathi All rights reserved.
      </footer>
      <BadgeToast badgeIds={newBadges} onDone={() => setNewBadges([])} />
    </div>
  );
};

export default FlashcardPage;
