import React from 'react';
import { QuestionResult } from '../../types/quiz';
import { sound } from '../../services/soundService';
import { ArrowLeft, Check, X, Trophy } from 'lucide-react';

interface ReviewScreenProps {
  levelNumber: number;
  levelTitle: string;
  results: QuestionResult[];
  onBackToResult: () => void;
  onBackToLevels: () => void;
}

export const ReviewScreen: React.FC<ReviewScreenProps> = ({
  levelNumber,
  levelTitle,
  results,
  onBackToResult,
  onBackToLevels,
}) => {
  const correctCount = results.filter((r) => r.isCorrect).length;
  const scorePercent = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-gradient-to-b from-[#eef6ff] via-[#f7fbff] to-[#e8f3fe] text-slate-800 select-none pb-6">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-30 w-full max-w-md mx-auto px-4 py-3 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-xs flex items-center justify-between">
        <button
          onClick={() => {
            sound.playTap();
            onBackToResult();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Result</span>
        </button>

        <div className="flex flex-col items-center">
          <span className="text-xs font-black text-blue-900 uppercase">
            REVIEW ANSWERS
          </span>
          <span className="text-[11px] font-semibold text-slate-500">
            Level {levelNumber}: {levelTitle}
          </span>
        </div>

        <div className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold text-xs">
          {correctCount}/{results.length}
        </div>
      </header>

      {/* Main Scrollable Question History (Requirements #13, #16, #17) */}
      <div className="w-full max-w-md mx-auto px-4 flex-1 py-4 space-y-4 overflow-y-auto">
        {/* Performance pill banner */}
        <div className="w-full p-3 rounded-2xl bg-white border border-blue-100 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-blue-600" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-700">Level {levelNumber} Performance</span>
              <span className="text-[11px] text-slate-500">{scorePercent}% Accuracy across all {results.length} questions</span>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
            scorePercent >= 60 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
          }`}>
            {scorePercent >= 60 ? 'PASSED' : 'RETRY'}
          </span>
        </div>

        {/* List of EVERY question in the exact order played (Requirement #13 & #16) */}
        {results.map((item, index) => {
          return (
            <div
              key={index}
              className={`p-4 rounded-3xl bg-white border shadow-sm transition-all ${
                item.isCorrect ? 'border-emerald-200' : 'border-rose-200'
              }`}
            >
              {/* Question Header: Number & Result Badge */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-blue-900 tracking-wider uppercase">
                  QUESTION {item.questionNumber}
                </span>

                <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  item.isCorrect
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}>
                  {item.isCorrect ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Correct</span>
                    </>
                  ) : (
                    <>
                      <X className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Incorrect</span>
                    </>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <p className="text-sm font-bold text-slate-900 mb-3 leading-snug">
                {item.questionText}
              </p>

              {/* 4 Answer Choices with clear selection & correct states (Requirements #14, #15) */}
              <div className="space-y-2">
                {item.options.map((opt, optIdx) => {
                  const isPlayerChoice = item.selectedOptionIndex === optIdx;
                  const isCorrectChoice = optIdx === item.correctAnswerIndex;

                  let rowStyle = 'bg-slate-50 border-slate-200 text-slate-700';
                  let badge = null;

                  if (isCorrectChoice) {
                    // Correct answer is always GREEN
                    rowStyle = 'bg-emerald-50 border-2 border-emerald-500 text-emerald-950 font-bold';
                    badge = (
                      <span className="flex items-center gap-1 text-[11px] font-black text-emerald-700 ml-auto shrink-0 bg-emerald-100 px-2 py-0.5 rounded-md">
                        <Check className="w-3 h-3 stroke-[3]" />
                        {isPlayerChoice ? 'YOUR ANSWER ✓' : 'CORRECT ANSWER ✓'}
                      </span>
                    );
                  } else if (isPlayerChoice && !item.isCorrect) {
                    // Player's wrong answer is clearly RED
                    rowStyle = 'bg-rose-50 border-2 border-rose-500 text-rose-950 font-bold';
                    badge = (
                      <span className="flex items-center gap-1 text-[11px] font-black text-rose-700 ml-auto shrink-0 bg-rose-100 px-2 py-0.5 rounded-md">
                        <X className="w-3 h-3 stroke-[3]" />
                        YOUR ANSWER ✕
                      </span>
                    );
                  }

                  return (
                    <div
                      key={optIdx}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${rowStyle}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-white border border-current flex items-center justify-center font-bold text-[10px] shrink-0">
                          {['A', 'B', 'C', 'D'][optIdx]}
                        </span>
                        <span className="leading-tight">{opt}</span>
                      </div>
                      {badge}
                    </div>
                  );
                })}
              </div>

              {/* User Selection Summary Footer */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold">
                <span className={item.isCorrect ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                  Your choice: {item.userAnswer}
                </span>
                {!item.isCorrect && (
                  <span className="text-emerald-700 font-bold">
                    Correct: {item.correctAnswer}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Navigation Buttons (Requirement #18) */}
      <div className="w-full max-w-md mx-auto px-4 pt-3 flex items-center gap-3">
        <button
          onClick={() => {
            sound.playTap();
            onBackToResult();
          }}
          className="flex-1 py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-blue-200 text-blue-900 font-bold text-sm shadow-xs transition-all active:scale-98"
        >
          Back to Result
        </button>

        <button
          onClick={() => {
            sound.playTap();
            onBackToLevels();
          }}
          className="flex-1 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-md transition-all active:scale-98"
        >
          Back to Levels
        </button>
      </div>
    </div>
  );
};
