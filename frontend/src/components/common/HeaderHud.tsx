import React from 'react';
import { ArrowLeft, Heart, Trophy, Star } from 'lucide-react';
import { sound } from '../../services/soundService';

interface HeaderHudProps {
  mode: 'level_select' | 'question';
  stars?: number;
  score?: number;
  hearts?: number;
  levelNumber?: number;
  customBadge?: string;
  onBackClick?: () => void;
}

export const HeaderHud: React.FC<HeaderHudProps> = ({
  mode,
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

        {/* Resource Indicators (Clean Points & Stars - NO $ or Cash!) */}
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

  // Question Mode (Bright & High Readability)
  return (
    <header className="w-full flex items-center justify-between px-4 py-3 bg-white/90 backdrop-blur-md border-b border-blue-100 shadow-xs z-30 select-none">
      {/* Back button */}
      <button
        onClick={() => {
          sound.playTap();
          onBackClick?.();
        }}
        className="w-10 h-10 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-800 active:scale-95 transition-all shadow-xs"
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
