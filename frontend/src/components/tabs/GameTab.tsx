import React from 'react';
import { DailyChallengeState } from '../../types/quiz';
import { sound } from '../../services/soundService';
import { Trophy, Flame, Play, ChevronRight, CheckCircle2, Star, ShieldCheck } from 'lucide-react';

interface GameTabProps {
  dailyState: DailyChallengeState;
  currentLevelNumber: number;
  unlockedCount: number;
  totalScore: number;
  onOpenLevelSelect: () => void;
  onPlayDailyChallenge: () => void;
}

export const GameTab: React.FC<GameTabProps> = ({
  dailyState,
  currentLevelNumber,
  unlockedCount,
  totalScore,
  onOpenLevelSelect,
  onPlayDailyChallenge,
}) => {
  return (
    <div className="w-full flex flex-col space-y-4 pb-20 select-none">
      <div className="pt-2 px-1">
        <h2 className="text-lg font-black text-blue-950 uppercase tracking-tight">
          Games & Competitions
        </h2>
        <p className="text-xs text-slate-500">
          Play the 100-Level Championship or compete in the Daily Challenge.
        </p>
      </div>

      {/* CARD 1: 100-LEVEL FOOTBALL QUIZ (Primary Mode) */}
      <div className="w-full p-5 rounded-3xl bg-white border border-blue-100 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-black uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5 text-blue-600" />
            <span>NORMAL LEVEL PROGRESSION</span>
          </div>

          <span className="text-xs font-black text-blue-700">
            {unlockedCount} / 100 Unlocked
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-700 p-0.5 shadow-lg flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center text-3xl">
              ⚽
            </div>
          </div>

          <div className="flex flex-col">
            <h3 className="text-base font-black text-slate-900">
              Football Quiz
            </h3>
            <p className="text-xs text-slate-500 leading-snug">
              Test your football knowledge across 100 championship levels.
            </p>
            <div className="mt-1 flex items-center gap-2 text-xs font-bold text-slate-700">
              <span className="text-blue-700">Level {currentLevelNumber}</span>
              <span>·</span>
              <span>Total Score: {totalScore.toLocaleString()} pts</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full">
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-300"
              style={{ width: `${(unlockedCount / 100) * 100}%` }}
            />
          </div>
        </div>

        <button
          onClick={() => {
            sound.playTap();
            onOpenLevelSelect();
          }}
          className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <span>CONTINUE PLAYING (LEVEL {currentLevelNumber})</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* CARD 2: DAILY CHALLENGE (1 Play / Day) */}
      <div className="w-full p-5 rounded-3xl bg-white border border-blue-100 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-black uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>DAILY CHALLENGE</span>
          </div>

          <span className="text-xs font-extrabold text-slate-500">
            1 Play / Day
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 p-0.5 shadow-lg flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-[14px] bg-amber-950 flex items-center justify-center text-3xl">
              🎯
            </div>
          </div>

          <div className="flex flex-col">
            <h3 className="text-base font-black text-slate-900">
              Today\'s Daily Quiz
            </h3>
            <p className="text-xs text-slate-500 leading-snug">
              10 fresh questions for the 7-day prize competition.
            </p>
            <div className="mt-1 text-xs font-bold text-emerald-700">
              {dailyState.completed
                ? `Today\'s Score: ${dailyState.todayScore} pts (Completed)`
                : 'Available to play now'}
            </div>
          </div>
        </div>

        {dailyState.completed ? (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Daily challenge completed today! Reopens tomorrow.</span>
          </div>
        ) : (
          <button
            onClick={() => {
              sound.playTap();
              onPlayDailyChallenge();
            }}
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>PLAY TODAY'S CHALLENGE</span>
          </button>
        )}
      </div>
    </div>
  );
};
