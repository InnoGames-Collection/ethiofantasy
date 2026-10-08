import React from 'react';
import { ArrowLeft, Heart, Trophy, Star, Clock, Flame } from 'lucide-react';
import { sound } from '../../services/soundService';

interface HeaderHudProps {
  mode: 'level_select' | 'question';
  isDailyChallenge?: boolean;
  questionNumber?: number;
  totalQuestions?: number;
  timeLeft?: number;
  stars?: number;
  score?: number;
  hearts?: number;
  levelNumber?: number;
  customBadge?: string;
  onBackClick?: () => void;
}

export const HeaderHud: React.FC<HeaderHudProps> = ({
  mode,
  isDailyChallenge = false,
  questionNumber = 1,
  totalQuestions = 10,
  timeLeft = 10,
  stars = 0,
  score = 0,
  hearts = 5,
  levelNumber,
  customBadge,
  onBackClick,
}) => {
  if (mode === 'level_select') {
    return (
      <header className="w-full flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-xs z-30 select-none">
        {/* EthioFantasy / Football Quiz Logo Branding */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm font-black text-sm">
            ⚽
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black text-blue-900 tracking-wider uppercase leading-none">
              FOOTBALL QUIZ
            </span>
            <span className="text-[10px] font-bold text-emerald-600 leading-none mt-0.5">
              EthioFantasy
            </span>
          </div>
        </div>

        {/* Resource Indicators (Clean Points & Stars) */}
        <div className="flex items-center gap-2.5">
          {/* Total Score Points */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-900 shadow-xs">
            <Trophy className="w-4 h-4 text-blue-600" />
            <span className="font-extrabold text-xs tracking-tight tabular-nums">
              {score} <span className="text-[10px] font-semibold text-blue-600">pts</span>
            </span>
          </div>

          {/* Star Counter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 shadow-xs">
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span className="font-extrabold text-xs tracking-tight tabular-nums">
              {stars}
            </span>
          </div>
        </div>
      </header>
    );
  }

  // Question Mode — Dedicated Clean Daily Challenge Top Bar (No Level #, No Hearts, No Level Score!)
  if (isDailyChallenge) {
    return (
      <header className="w-full flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs z-30 select-none">
        {/* Back / Pause button */}
        <button
          onClick={() => {
            sound.playTap();
            onBackClick?.();
          }}
          className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 active:scale-95 transition-all shadow-2xs cursor-pointer"
          aria-label="Back to Menu"
        >
          <ArrowLeft className="w-4 h-4 text-slate-700" />
        </button>

        {/* Daily Challenge Title Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 shadow-xs">
          <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
          <span className="font-black text-xs uppercase tracking-wider text-amber-900">
            Daily Challenge
          </span>
        </div>

        {/* Clean Question & Countdown Indicators */}
        <div className="flex items-center gap-2">
          {/* Question Counter */}
          <div className="flex items-center px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 font-black text-xs tabular-nums">
            <span>{questionNumber}/{totalQuestions}</span>
          </div>

          {/* 10s Timer */}
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-mono font-black text-xs shadow-xs transition-colors ${
            timeLeft <= 3
              ? 'bg-rose-600 text-white border border-rose-700 animate-pulse'
              : 'bg-amber-100 text-amber-950 border border-amber-300'
          }`}>
            <Clock className={`w-3 h-3 ${timeLeft <= 3 ? 'text-white' : 'text-amber-700'}`} />
            <span>00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span>
          </div>
        </div>
      </header>
    );
  }

  // Level-Based Question Mode (Preserves Level #, Hearts, Level Score)
  return (
    <header className="w-full flex items-center justify-between px-4 py-3 bg-white/90 backdrop-blur-md border-b border-blue-100 shadow-xs z-30 select-none">
      {/* Back button */}
      <button
        onClick={() => {
          sound.playTap();
          onBackClick?.();
        }}
        className="w-10 h-10 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-800 active:scale-95 transition-all shadow-xs cursor-pointer"
        aria-label="Back to Levels"
      >
        <ArrowLeft className="w-5 h-5 text-blue-700" />
      </button>

      {/* Level or Custom Indicator Pill */}
      {customBadge ? (
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-xs shadow-sm">
          <span>{customBadge}</span>
        </div>
      ) : levelNumber ? (
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-600 text-white font-extrabold text-xs shadow-sm">
          <span>⚽ Level {levelNumber}</span>
        </div>
      ) : null}

      {/* Right HUD: Lives & Score */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 shadow-xs">
          <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
          <span className="font-extrabold text-rose-700 text-xs tabular-nums">
            {hearts}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 shadow-xs">
          <Trophy className="w-4 h-4 text-blue-600" />
          <span className="font-extrabold text-blue-900 text-xs tabular-nums">
            {score}
          </span>
        </div>
      </div>
    </header>
  );
};
