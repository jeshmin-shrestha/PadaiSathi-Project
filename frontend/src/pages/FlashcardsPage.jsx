import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '../components/Navbar';

const FlashcardPage = () => {
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState(new Set());

  const flashcards = [
    {
      question: "What is photosynthesis?",
      answer: "The process by which plants convert light energy into chemical energy (glucose) using carbon dioxide and water, releasing oxygen as a byproduct."
    },
    {
      question: "What is the Powerhouse of the cell?",
      answer: "Mitochondria - the organelle responsible for producing ATP (energy) through cellular respiration."
    },
    {
      question: "What is DNA?",
      answer: "Deoxyribonucleic acid - a molecule that carries genetic instructions for the development, functioning, and reproduction of all living organisms."
    },
    {
      question: "What is gravity?",
      answer: "A force of attraction between objects with mass. The more massive an object, the stronger its gravitational pull."
    },
    {
      question: "What is an ecosystem?",
      answer: "A community of living organisms interacting with each other and their physical environment, including plants, animals, and microorganisms."
    }
  ];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handlePrevious = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
      setIsFlipped(false);
    }
  };

  const handleNext = () => {
    if (currentCard < flashcards.length - 1) {
      setCurrentCard(currentCard + 1);
      setIsFlipped(false);
    }
  };

  const toggleKnown = () => {
    const newKnownCards = new Set(knownCards);
    if (newKnownCards.has(currentCard)) {
      newKnownCards.delete(currentCard);
    } else {
      newKnownCards.add(currentCard);
    }
    setKnownCards(newKnownCards);
  };

  const knownCount = knownCards.size;
  const progressPercent = (knownCount / flashcards.length) * 100;

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Card Counter */}
        <div className="mb-6">
          <span className="text-lg font-bold text-gray-800">
            Card {currentCard + 1} of {flashcards.length}
          </span>
        </div>

        {/* Flashcard */}
        <div 
          onClick={handleFlip}
          className={`cursor-pointer transition-all duration-500 transform ${isFlipped ? 'scale-[0.98]' : 'scale-100'}`}
        >
          <div className={`relative rounded-3xl border-4 border-black p-16 min-h-96 flex flex-col items-center justify-center ${
            isFlipped ? 'bg-green-600' : 'bg-white'
          }`}>
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

        {/* Navigation and Progress */}
        <div className="mt-8 flex items-center space-x-4">
          {/* Previous Button */}
          <button
            onClick={handlePrevious}
            disabled={currentCard === 0}
            className="w-12 h-12 rounded-full border-4 border-black bg-white flex items-center justify-center hover:bg-gray-100 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </button>

          {/* Progress Bar */}
          <div className="flex-1">
            <div className="w-full bg-gray-300 rounded-full h-8 border-2 border-gray-400 overflow-hidden">
              <div 
                className={`h-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                  knownCards.has(currentCard) ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}
                style={{ width: `${progressPercent}%`, minWidth: '15%' }}
              >
                I've Got This !
              </div>
            </div>
          </div>

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={currentCard === flashcards.length - 1}
            className="w-12 h-12 rounded-full border-4 border-black bg-black flex items-center justify-center hover:bg-gray-800 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Mark as Known Button */}
        <div className="mt-6 text-center">
          <button
            onClick={toggleKnown}
            className={`px-8 py-3 rounded-xl font-bold border-3 transition ${
              knownCards.has(currentCard)
                ? 'bg-green-600 text-white border-green-800'
                : 'bg-white text-gray-800 border-gray-400 hover:bg-gray-50'
            }`}
          >
            {knownCards.has(currentCard) ? '✓ I Know This' : 'Mark as Known'}
          </button>
        </div>

        {/* Stats */}
        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>Cards mastered: {knownCount} / {flashcards.length}</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-600 text-sm mt-8">
        © PadaiSathi All rights reserved.
      </footer>
    </div>
  );
};

export default FlashcardPage;