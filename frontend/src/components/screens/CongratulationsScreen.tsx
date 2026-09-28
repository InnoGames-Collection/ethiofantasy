import React, { useEffect } from 'react';
import { LevelData, QuestionResult } from '../../types/quiz';
import { sound } from '../../services/soundService';
import { Check, X, Percent, Trophy, RotateCcw, Home, Eye, Star } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CongratulationsScreenProps {
  level: LevelData;
  results: QuestionResult[];
  levelScore: number;
  isDailyChallenge?: boolean;
  onOpenReview: () => void;
  onBackToLevels: () => void;
  onReplayLevel?: () => void;
  onOpenLeaderboard?: () => void;
}

export const CongratulationsScreen: React.FC<CongratulationsScreenProps> = ({
  level,
  results,
  levelScore,
  isDailyChallenge = false,
  onOpenReview,
  onBackToLevels,
  onReplayLevel,
  onOpenLeaderboard,
}) => {
  const correctCount = results.filter((r) => r.isCorrect).length;
  const incorrectCount = results.length - correctCount;
  const scorePercent = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;

  // Star calculation
  const earnedStars = scorePercent >= 90 ? 3 : scorePercent >= 60 ? 2 : scorePercent >= 30 ? 1 : 0;
  const isPassed = scorePercent >= 50;

  useEffect(() => {
    sound.playVictory();

    try {
      confetti({
        particleCount: 65,
        spread: 80,
        origin: { y: 0.45 },
        colors: ['#22c55e', '#3b82f6', '#facc15', '#06b6d4'],
      });
    } catch {
      // Ignore
    }
  }, []);

  return (
    // BRIGHT, CLEAN SPORTS PALETTE (White, Blue, Green)
    <div className="min-h-screen w-full flex flex-col justify-between bg-gradient-to-b from-[#edf5ff] via-[#f7fbff] to-[#eaf3fe] text-slate-800 p-4 select-none overflow-y-auto">
      <div className="w-full max-w-md mx-auto flex flex-col items-center">
        {/* Trophy Victory Artwork */}
        <div className="relative mt-2 mb-2 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 p-1 shadow-lg shadow-amber-300/40 flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-white flex flex-col items-center justify-center">
              <span className="text-4xl">🏆</span>
            </div>
          </div>
        </div>

        {/* Heading & Subtitle */}
        <h1 className="text-2xl font-black tracking-wider uppercase text-blue-950 text-center">
          {isDailyChallenge
            ? 'DAILY CHALLENGE COMPLETE'
            : isPassed
            ? 'CONGRATULATIONS!'
            : 'LEVEL FINISHED'}
        </h1>
        <p className="text-xs font-bold text-slate-600 mt-0.5 text-center">
          {isDailyChallenge
            ? 'Official Daily Score Recorded for 7-Day Competition'
            : `LEVEL ${level.levelNumber} COMPLETE · ${level.title}`}
        </p>

        {/* Earned Stars & Points Banner */}
        <div className="w-full mt-3 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🎉</span>
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-wide">
                {isDailyChallenge
                  ? `Daily Score: +${levelScore} Points`
                  : isPassed
                  ? `Level Passed! +${earnedStars} Stars`
                  : 'Level Complete'}
              </span>
              <span className="text-[11px] text-blue-100 font-semibold">
                {isDailyChallenge ? 'Added to your 7-Day Total' : `Score: ${levelScore} points`}
              </span>
            </div>
          </div>

          {/* Star Icons */}
          {!isDailyChallenge && (
            <div className="flex items-center gap-1">
              {[...Array(3)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < earnedStars
                      ? 'text-amber-300 fill-amber-300 drop-shadow-sm'
                      : 'text-blue-300/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* 3 Stat Cards in a Row: Correct, Incorrect, Score % */}
        <div className="w-full grid grid-cols-3 gap-2.5 mt-3.5">
          {/* 1. Correct (Green) */}
          <div className="flex flex-col items-center justify-center py-3 px-2 rounded-2xl bg-white border border-emerald-200 shadow-xs">
            <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center mb-1 text-emerald-600">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <span className="text-xl font-black text-slate-900 tabular-nums">
              {correctCount}
            </span>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-tight">
              Correct
            </span>
          </div>

          {/* 2. Incorrect (Red) */}
          <div className="flex flex-col items-center justify-center py-3 px-2 rounded-2xl bg-white border border-rose-200 shadow-xs">
            <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center mb-1 text-rose-600">
              <X className="w-4 h-4 stroke-[3]" />
            </div>
            <span className="text-xl font-black text-slate-900 tabular-nums">
              {incorrectCount}
            </span>
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-tight">
              Incorrect
            </span>
          </div>

          {/* 3. Score % (Blue) */}
          <div className="flex flex-col items-center justify-center py-3 px-2 rounded-2xl bg-white border border-blue-200 shadow-xs">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center mb-1 text-blue-600">
              <Percent className="w-4 h-4 stroke-[3]" />
            </div>
            <span className="text-xl font-black text-slate-900 tabular-nums">
              {scorePercent}%
            </span>
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-tight">
              Accuracy
            </span>
          </div>
        </div>

        {/* Performance Detail Card */}
        <div className="w-full mt-3.5 p-4 rounded-3xl bg-white border border-blue-100 shadow-xs flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-2">
            <span className="text-xs font-black text-blue-900 uppercase">
              {isDailyChallenge ? 'DAILY CHALLENGE SUMMARY' : `LEVEL ${level.levelNumber} SUMMARY`}
            </span>
            <span className="text-xs font-bold text-slate-500">
              {correctCount}/{results.length} Questions Answered
            </span>
          </div>

          {/* Rating Progress Bar */}
          <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                scorePercent >= 60 ? 'bg-emerald-500' : 'bg-blue-600'
              }`}
              style={{ width: `${scorePercent}%` }}
            />
          </div>

          <p className="text-xs text-slate-600 text-center font-medium">
            {isDailyChallenge
              ? 'Great effort! Your score is counted towards the 7-day prize competition. You can review your answers below.'
              : isPassed
              ? `Outstanding! You answered all ${results.length} questions and unlocked the next level!`
              : `You completed all ${results.length} questions. You can review all answers below or replay.`}
          </p>
        </div>

        {/* REVIEW ANSWERS BUTTON (Requirements #12, #13) */}
        <div className="w-full mt-3.5">
          <button
            onClick={() => {
              sound.playTap();
              onOpenReview();
            }}
            className="w-full py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black text-sm uppercase tracking-wider shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer border border-emerald-400"
          >
            <Eye className="w-4 h-4" />
            <span>REVIEW ANSWERS</span>
          </button>
        </div>
      </div>

      {/* Bottom Action Controls */}
      <div className="w-full max-w-md mx-auto pt-4 flex items-center gap-3">
        {/* Replay Level (only for championship mode, NOT for Daily Challenge!) */}
        {!isDailyChallenge && onReplayLevel && (
          <button
            onClick={() => {
              sound.playTap();
              onReplayLevel();
            }}
            className="w-12 h-12 rounded-2xl bg-white hover:bg-slate-50 border border-blue-200 flex items-center justify-center text-blue-800 active:scale-95 shadow-xs transition-all shrink-0 cursor-pointer"
            title="Replay Level"
          >
            <RotateCcw className="w-5 h-5 text-blue-600" />
          </button>
        )}

        {/* Back to Levels / Home */}
        <button
          onClick={() => {
            sound.playTap();
            onBackToLevels();
          }}
          className="flex-1 py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-extrabold text-sm md:text-base tracking-wide shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition-all border border-blue-400 cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>{isDailyChallenge ? 'Back to Home' : 'Back to Levels'}</span>
        </button>
      </div>
    </div>
  );
};
