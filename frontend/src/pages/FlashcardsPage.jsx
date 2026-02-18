import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '../components/Navbar';

const FlashcardPage = () => {
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState(new Set());

  // ── API state ──────────────────────────────────────────────────────────────
  const [flashcards, setFlashcards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [availableSummaries, setAvailableSummaries] = useState([]);
  const [selectedSummaryId, setSelectedSummaryId] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [error, setError] = useState('');

  // ── Ref so callbacks always read the latest ID (fixes stale closure bug) ──
  const selectedSummaryIdRef = useRef(null);

  useEffect(() => {
    selectedSummaryIdRef.current = selectedSummaryId;
  }, [selectedSummaryId]);

  // ── Load user + summaries on mount ────────────────────────────────────────
  useEffect(() => {
    const email = localStorage.getItem('userEmail') || 'demo@padai.com';
    setUserEmail(email);
    fetchSummaries(email);
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

  // ── Generate flashcards ───────────────────────────────────────────────────
  const loadFlashcards = async () => {
    const idToUse = selectedSummaryIdRef.current;
    console.log('[Flashcards] Using summary ID:', idToUse);

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

  // ── Card navigation ───────────────────────────────────────────────────────
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

  const knownCount = knownCards.size;
  const progressPercent = flashcards.length > 0 ? (knownCount / flashcards.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-200">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* ── Summary selector ────────────────────────────────────────────── */}
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

        {/* ── Loading ──────────────────────────────────────────────────────── */}
        {isLoading && (
          <div className="bg-white rounded-3xl border-4 border-black p-16 flex flex-col items-center justify-center mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-black mb-4" />
            <p className="text-gray-500 font-medium">AI is creating your flashcards...</p>
            <p className="text-gray-400 text-sm mt-1">Using summary #{selectedSummaryIdRef.current}</p>
          </div>
        )}

        {/* ── Empty state ───────────────────────────────────────────────────── */}
        {!isLoading && flashcards.length === 0 && (
          <div className="bg-white rounded-3xl border-4 border-black p-16 flex items-center justify-center">
            <p className="text-gray-400 italic text-center">
              Select a summary and click "Generate Cards"
            </p>
          </div>
        )}

        {/* ── Flashcard UI ─────────────────────────────────────────────────── */}
        {!isLoading && flashcards.length > 0 && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <span className="text-lg font-bold text-gray-800">
                Card {currentCard + 1} of {flashcards.length}
              </span>
              <span className="text-sm text-gray-500">Summary #{selectedSummaryId}</span>
            </div>

            <div
              onClick={handleFlip}
              className={`cursor-pointer transition-all duration-500 transform ${isFlipped ? 'scale-[0.98]' : 'scale-100'}`}
            >
              <div className={`relative rounded-3xl border-4 border-black p-16 min-h-96 flex flex-col items-center justify-center ${isFlipped ? 'bg-green-600' : 'bg-white'}`}>
                {!isFlipped ? (
                  <>
                    <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
                      {flashcards[currentCard].question}
                    </h2>
                    <p className="text-gray-500 text-sm">Click to Reveal</p>
                  </>
                ) : (
                  <>
                    <p className="text-white text-lg text-center leading-relaxed mb-8">
                      {flashcards[currentCard].answer}
                    </p>
                    <p className="text-white text-sm opacity-80">Click to hide</p>
                  </>
                )}
              </div>
            </div>

            <div className="mt-8 flex items-center space-x-4">
              <button
                onClick={handlePrevious}
                disabled={currentCard === 0}
                className="w-12 h-12 rounded-full border-4 border-black bg-white flex items-center justify-center hover:bg-gray-100 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-6 h-6 text-gray-800" />
              </button>

              <div className="flex-1">
                <div className="w-full bg-gray-300 rounded-full h-8 border-2 border-gray-400 overflow-hidden">
                  <div
                    className={`h-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${knownCards.has(currentCard) ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}
                    style={{ width: `${Math.max(progressPercent, 15)}%` }}
                  >
                    I've Got This!
                  </div>
                </div>
              </div>

              <button
                onClick={handleNext}
                disabled={currentCard === flashcards.length - 1}
                className="w-12 h-12 rounded-full border-4 border-black bg-black flex items-center justify-center hover:bg-gray-800 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={toggleKnown}
                className={`px-8 py-3 rounded-xl font-bold border-2 transition ${
                  knownCards.has(currentCard)
                    ? 'bg-green-600 text-white border-green-800'
                    : 'bg-white text-gray-800 border-gray-400 hover:bg-gray-50'
                }`}
              >
                {knownCards.has(currentCard) ? '✓ I Know This' : 'Mark as Known'}
              </button>
            </div>

            <div className="mt-8 text-center text-gray-600 text-sm">
              <p>Cards mastered: {knownCount} / {flashcards.length}</p>
            </div>
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