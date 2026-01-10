import React, { useState } from 'react';
import { Check } from 'lucide-react';
import Navbar from '../components/Navbar';

const QuizPage = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const questions = [
    {
      question: "What is the Powerhouse of the cell?",
      options: ["Nucleus", "Mitochondria", "Heart", "Liver"],
      correct: 1
    },
    {
      question: "What is the largest planet in our solar system?",
      options: ["Earth", "Mars", "Jupiter", "Saturn"],
      correct: 2
    },
    {
      question: "What is the chemical symbol for water?",
      options: ["H2O", "CO2", "O2", "NaCl"],
      correct: 0
    },
    {
      question: "Who wrote 'Romeo and Juliet'?",
      options: ["Charles Dickens", "Jane Austen", "William Shakespeare", "Mark Twain"],
      correct: 2
    },
    {
      question: "What is the speed of light?",
      options: ["300,000 km/s", "150,000 km/s", "450,000 km/s", "200,000 km/s"],
      correct: 0
    }
  ];

  const handleAnswerClick = (index) => {
    if (showFeedback) return; // Prevent changing answer after submission
    
    setSelectedAnswer(index);
    const correct = index === questions[currentQuestion].correct;
    setIsCorrect(correct);
    
    if (correct) {
      setScore(score + 1);
    }
    
    setShowFeedback(true);
    
    // Auto advance after 2 seconds
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
      }
    }, 2000);
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Progress Bar and Score */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg font-bold text-gray-800">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span className="text-lg font-bold text-gray-800">
              Score: {score}/{questions.length}
            </span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-3">
            <div 
              className="bg-purple-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
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

          {/* Totoro character - bottom left */}
          <div className="absolute -bottom-6 -left-6">
            <div className="w-20 h-20 bg-yellow-400 rounded-full border-4 border-black flex items-center justify-center">
              <span className="text-3xl">🐱</span>
            </div>
          </div>
        </div>

        {/* Feedback Message */}
        {showFeedback && (
          <div className={`rounded-3xl p-6 border-4 flex items-center justify-between ${
            isCorrect 
              ? 'bg-green-600 border-green-800' 
              : 'bg-red-600 border-red-800'
          }`}>
            <span className="text-white text-xl font-bold">
              {isCorrect 
                ? "YAY !!! You've got it right" 
                : "Oops! That's not correct. The right answer was: " + questions[currentQuestion].options[questions[currentQuestion].correct]
              }
            </span>
            
            {isCorrect && (
              <div className="w-16 h-16 bg-green-700 rounded-full flex items-center justify-center border-4 border-white">
                <Check className="w-10 h-10 text-white stroke-[3]" />
              </div>
            )}
          </div>
        )}

        {/* Completion Message */}
        {currentQuestion === questions.length - 1 && showFeedback && (
          <div className="mt-6 text-center">
            <div className="bg-white rounded-3xl p-8 border-4 border-black">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Quiz Complete! 🎉
              </h3>
              <p className="text-xl text-gray-700 mb-6">
                Your final score: {score} out of {questions.length}
              </p>
              <button 
                onClick={() => {
                  setCurrentQuestion(0);
                  setScore(0);
                  setSelectedAnswer(null);
                  setShowFeedback(false);
                }}
                className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition"
              >
                Restart Quiz
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-600 text-sm mt-8">
        © PadaiSathi All rights reserved.
      </footer>
    </div>
  );
};

export default QuizPage;