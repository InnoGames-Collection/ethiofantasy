import React from 'react';
import { QuestionResult } from '../../types/quiz';
import { sound } from '../../services/soundService';
import { ArrowLeft, Check, X, Trophy, Lock, ShieldCheck } from 'lucide-react';

interface ReviewScreenProps {
  levelNumber: number;
  levelTitle: string;
  results: QuestionResult[];
  isDailyChallenge?: boolean;
  isReviewLocked?: boolean;
  challengeDate?: string;
  levelScore?: number;
  onBackToResult: () => void;
  onBackToLevels: () => void;
}

export const ReviewScreen: React.FC<ReviewScreenProps> = ({
  levelNumber,
  levelTitle,
  results,
  isDailyChallenge = false,
  isReviewLocked = false,
  challengeDate,
  levelScore = 0,
  onBackToResult,
  onBackToLevels,
}) => {
  // ========================================================================
  // STATE A — DAILY CHALLENGE STILL ACTIVE: REVIEW LOCKED
  // Rule: DO NOT reveal questions, choices, selected answers, or correct answers.
  // Show professional informational Review-locked state.
  // ========================================================================
  if (isDailyChallenge && isReviewLocked) {
    return (
      <div className="min-h-screen w-full flex flex-col justify-between bg-gradient-to-b from-[#eef6ff] via-[#f7fbff] to-[#e8f3fe] text-slate-800 select-none pb-6">
        {/* Sticky Top Header */}
        <header className="sticky top-0 z-30 w-full max-w-md mx-auto px-4 py-3 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-xs flex items-center justify-between">
          <button
            onClick={() => {
              sound.playTap();
              onBackToResult();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Result</span>
          </button>

          <div className="flex flex-col items-center">
            <span className="text-xs font-black text-blue-900 uppercase">
              DAILY CHALLENGE REVIEW
            </span>
            <span className="text-[11px] font-semibold text-slate-500">
              {challengeDate ? `Challenge Date: ${challengeDate}` : 'Today\'s Challenge'}
            </span>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-extrabold text-xs">
            <Lock className="w-3 h-3 text-amber-600" />
            <span>LOCKED</span>
          </div>
        </header>

        {/* Informational Review-Locked State Body */}
        <div className="w-full max-w-md mx-auto px-4 flex-1 py-5 flex flex-col items-center justify-center">
          <div className="w-full bg-white rounded-3xl border border-blue-100 shadow-md p-6 flex flex-col items-center text-center">
            {/* Lock Icon in Warm Gold Ambient Glow */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 p-1 shadow-lg shadow-amber-300/30 flex items-center justify-center mb-4">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                <Lock className="w-9 h-9 text-amber-500" />
              </div>
            </div>

            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 px-3 py-1 rounded-full bg-amber-50 border border-amber-200">
              COMPETITION INTEGRITY
            </span>

            <h2 className="text-xl font-black uppercase text-blue-950 mt-2.5 tracking-wide">
              Review Currently Locked
            </h2>

            {/* Core Required Informational Statements */}
            <p className="text-sm font-bold text-slate-800 mt-2">
              Review will be available after today's challenge ends.
            </p>
            <p className="text-xs font-semibold text-emerald-700 mt-1">
              Your Daily Challenge has been submitted successfully.
            </p>

            {/* Fair Play Explanation Notice */}
            <div className="w-full mt-5 p-4 rounded-2xl bg-blue-50/80 border border-blue-200/70 flex flex-col gap-2 text-left">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
                <span className="text-xs font-black text-blue-900 uppercase">
                  Fair Play & Leaderboard Protection
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                To maintain competitive fairness for all participants on the 7-day leaderboard, question answers remain hidden while today's challenge is active.
              </p>
              <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between text-[11px] text-blue-900 font-bold">
                <span>Official answers unlock:</span>
                <span className="font-extrabold uppercase">After today's challenge ends</span>
              </div>
            </div>

            {/* Submission Status Badges */}
            <div className="w-full grid grid-cols-2 gap-2 mt-4 text-left">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400">Questions Completed</span>
                <p className="text-sm font-black text-slate-900">10 of 10 Submitted</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400">Daily Points</span>
                <p className="text-sm font-black text-blue-900">+{levelScore} Points</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation Buttons */}
        <div className="w-full max-w-md mx-auto px-4 pt-3 flex items-center gap-3">
          <button
            onClick={() => {
              sound.playTap();
              onBackToResult();
            }}
            className="flex-1 py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-blue-200 text-blue-900 font-bold text-sm shadow-xs transition-all active:scale-98 cursor-pointer"
          >
            Back to Result
          </button>

          <button
            onClick={() => {
              sound.playTap();
              onBackToLevels();
            }}
            className="flex-1 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-md transition-all active:scale-98 cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ========================================================================
  // STATE B — DAILY CHALLENGE HAS EXPIRED (OR LEVEL-BASED GAME REVIEW)
  // Preserves existing detailed question-by-question Review screen.
  // ========================================================================
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Result</span>
        </button>

        <div className="flex flex-col items-center">
          <span className="text-xs font-black text-blue-900 uppercase">
            REVIEW ANSWERS
          </span>
          <span className="text-[11px] font-semibold text-slate-500">
            {isDailyChallenge ? 'Daily Challenge (Expired)' : `Level ${levelNumber}: ${levelTitle}`}
          </span>
        </div>

        <div className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold text-xs">
          {correctCount}/{results.length}
        </div>
      </header>

      {/* Main Scrollable Question History */}
      <div className="w-full max-w-md mx-auto px-4 flex-1 py-4 space-y-4 overflow-y-auto">
        {/* Performance pill banner */}
        <div className="w-full p-3 rounded-2xl bg-white border border-blue-100 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-blue-600" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-700">
                {isDailyChallenge ? 'Daily Challenge Performance' : `Level ${levelNumber} Performance`}
              </span>
              <span className="text-[11px] text-slate-500">
                {scorePercent}% Accuracy across all {results.length} questions
              </span>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
            scorePercent >= 60 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
          }`}>
            {scorePercent >= 60 ? 'PASSED' : 'RETRY'}
          </span>
        </div>

        {/* List of EVERY question in the exact order played */}
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

              {/* 4 Answer Choices with clear selection & correct states */}
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

      {/* Bottom Navigation Buttons */}
      <div className="w-full max-w-md mx-auto px-4 pt-3 flex items-center gap-3">
        <button
          onClick={() => {
            sound.playTap();
            onBackToResult();
          }}
          className="flex-1 py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-blue-200 text-blue-900 font-bold text-sm shadow-xs transition-all active:scale-98 cursor-pointer"
        >
          Back to Result
        </button>

        <button
          onClick={() => {
            sound.playTap();
            onBackToLevels();
          }}
          className="flex-1 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-md transition-all active:scale-98 cursor-pointer"
        >
          {isDailyChallenge ? 'Back to Home' : 'Back to Levels'}
        </button>
      </div>
    </div>
  );
};
