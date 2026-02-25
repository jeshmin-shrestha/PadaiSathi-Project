import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import Navbar from '../components/Navbar';

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

  useEffect(() => {
    selectedSummaryIdRef.current = selectedSummaryId;
  }, [selectedSummaryId]);

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

  const loadFlashcards = async () => {
    const idToUse = selectedSummaryIdRef.current;
    if (!idToUse) {
      setError('No summary found. Upload a PDF on the Summary page first!');
      return;
    }
    setIsLoading(true);
    setError('');
    setFlashcards([]);
    setCurrentCard(0);
    setIsFlipped(false);
    setKnownCards(new Set());

    try {
      const res = await fetch('http://localhost:8000/api/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary_id: idToUse, user_email: userEmail })
      });
      const data = await res.json();
      if (data.success && data.flashcards?.length > 0) {
        setFlashcards(data.flashcards);
      } else {
        setError('Could not generate flashcards. Try again.');
      }
    } catch (e) {
      setError('Failed to connect to backend: ' + e.message);
    } finally {
      setIsLoading(false);
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

  return (
    <div className="min-h-screen bg-gray-200">
      <Navbar />

      <style>{`
        @keyframes flipIn {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
        .card-enter { animation: flipIn 0.3s cubic-bezier(0.34,1.56,0.64,1); }
        .nav-dot { transition: all 0.2s ease; cursor: pointer; }
        .nav-dot:hover { transform: scale(1.4); }
      `}</style>

      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Summary selector */}
        <div className="bg-white rounded-3xl p-6 border-4 border-black mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Generate Flashcards</h3>
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
                  onClick={loadFlashcards}
                  disabled={isLoading || !selectedSummaryId}
                  className="px-6 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition disabled:bg-gray-400 whitespace-nowrap"
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

          {error && <p className="mt-3 text-red-600 text-sm font-medium">{error}</p>}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="bg-white rounded-3xl border-4 border-black p-16 flex flex-col items-center justify-center mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-black mb-4" />
            <p className="text-gray-500 font-medium">AI is creating your flashcards...</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && flashcards.length === 0 && (
          <div className="bg-white rounded-3xl border-4 border-black p-16 flex flex-col items-center justify-center gap-3">
            <span className="text-5xl">🃏</span>
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
                <button onClick={resetCards} title="Reset all" className="text-gray-400 hover:text-gray-700 transition">
                  <RotateCcw size={15} />
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-300 rounded-full h-2 mb-5 overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* The Card */}
            <div
              key={`${currentCard}-${isFlipped}`}
              onClick={handleFlip}
              className={`card-enter cursor-pointer rounded-3xl border-4 min-h-96 flex flex-col items-center justify-center p-12 mb-5 relative select-none transition-all duration-300 ${
                isFlipped
                  ? 'border-gray-800 bg-gray-900'
                  : isKnown
                  ? 'border-green-500 bg-green-50'
                  : 'border-black bg-white'
              }`}
            >
              {/* Corner label */}
              <span className={`absolute top-4 right-5 text-xs font-bold uppercase tracking-widest ${isFlipped ? 'text-gray-500' : 'text-gray-300'}`}>
                {isFlipped ? 'Answer' : 'Question'}
              </span>

              {/* Known badge */}
              {isKnown && !isFlipped && (
                <span className="absolute top-4 left-5 text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                  ✓ Known
                </span>
              )}

              {!isFlipped ? (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 text-center mb-8 leading-relaxed max-w-lg">
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
                    background: knownCards.has(i) ? '#22c55e' : i === currentCard ? '#111' : '#d1d5db',
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
                className="w-12 h-12 rounded-full border-4 border-black bg-white flex items-center justify-center hover:bg-gray-100 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-6 h-6 text-gray-800" />
              </button>

              <button
                onClick={toggleKnown}
                className={`flex-1 py-4 rounded-2xl font-bold text-lg border-2 transition ${
                  isKnown
                    ? 'bg-green-500 text-white border-green-700 hover:bg-green-600'
                    : 'bg-white text-gray-800 border-gray-400 hover:bg-gray-50'
                }`}
              >
                {isKnown ? '✓ Got It!' : 'Mark as Known'}
              </button>

              <button
                onClick={handleNext}
                disabled={currentCard === flashcards.length - 1}
                className="w-12 h-12 rounded-full border-4 border-black bg-black flex items-center justify-center hover:bg-gray-800 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Completion banner */}
            {knownCount === flashcards.length && flashcards.length > 0 && (
              <div className="mt-6 p-5 bg-green-50 border-4 border-green-500 rounded-3xl text-center">
                <p className="text-lg font-bold text-green-700">YAYY!!!</p>
                <p className="text-lg font-bold text-green-700">
                  You've mastered all {flashcards.length} cards!
                </p>
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

export default FlashcardPage;