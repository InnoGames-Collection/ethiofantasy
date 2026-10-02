import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { sound } from '../../services/soundService';
import { Trophy } from 'lucide-react';

interface GoalAnimationProps {
  rewardCoins: number;
  questionIndex: number;
  totalQuestions: number;
  onContinue: () => void;
}

export const GoalAnimation: React.FC<GoalAnimationProps> = ({
  rewardCoins,
  questionIndex,
  totalQuestions,
  onContinue,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sound.playGoal();

    const t1 = setTimeout(() => sound.playCoin(0), 300);
    const t2 = setTimeout(() => sound.playCoin(0.12), 420);

    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#3b82f6', '#facc15', '#ffffff'],
      });
    } catch {
      // Ignore in sandbox
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const progressPercent = Math.min(100, Math.round(((questionIndex + 1) / totalQuestions) * 100));

  return (
    <div
      ref={containerRef}
      onClick={onContinue}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 bg-gradient-to-b from-[#0f2d59]/95 via-[#0b2447]/95 to-[#061833]/98 backdrop-blur-md select-none animate-fadeIn cursor-pointer"
    >
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <div className="w-[500px] h-[500px] bg-gradient-to-r from-blue-400/20 via-emerald-400/30 to-sky-400/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="w-full h-8" />

      {/* Center Action: Flying Football + GOAL! Typography */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto">
        <div className="relative mb-6">
          <div className="absolute -top-8 -left-12 w-28 h-16 border-t-2 border-l-2 border-white/60 rounded-full -rotate-45 pointer-events-none opacity-80" />
          <div className="absolute -top-4 -left-16 w-32 h-14 border-t-2 border-emerald-300/60 rounded-full -rotate-45 pointer-events-none opacity-70" />

          {/* 3D Soccer ball */}
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-white via-slate-100 to-slate-300 border-4 border-white shadow-[0_0_50px_rgba(56,189,248,0.8)] flex items-center justify-center relative overflow-hidden animate-bounce">
            <div className="w-11 h-11 bg-slate-900 shadow-inner" style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }} />
            <div className="absolute -top-2 left-9 w-6 h-6 bg-slate-900" />
            <div className="absolute -bottom-2 left-9 w-6 h-6 bg-slate-900" />
            <div className="absolute top-9 -left-2 w-6 h-6 bg-slate-900" />
            <div className="absolute top-9 -right-2 w-6 h-6 bg-slate-900" />
          </div>
        </div>

        {/* Big Bold Athletic "GOAL!" Text */}
        <h1 className="text-6xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-emerald-200 drop-shadow-[0_8px_20px_rgba(0,0,0,0.8)] uppercase -rotate-2 scale-110 transform">
          GOAL!
        </h1>

        {/* Score Reward Card (NO $ OR CASH - Requirement #11) */}
        <div className="mt-5 flex flex-col items-center">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
            Score Points
          </span>
          <div className="mt-1.5 flex items-center gap-2 px-5 py-2 rounded-full bg-slate-900/90 border border-emerald-400/50 shadow-xl shadow-emerald-500/20">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="text-2xl font-black text-emerald-400 tabular-nums">
              +{rewardCoins} <span className="text-xs text-emerald-200 font-bold">PTS</span>
            </span>
          </div>
        </div>
      </div>

      {/* Progress & Continue */}
      <div className="w-full max-w-xs z-10 flex flex-col items-center gap-4">
        <div className="w-full flex flex-col items-center gap-1.5">
          <div className="w-full flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Next question</span>
            <span className="font-bold text-emerald-400 tabular-nums">{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-800 border border-emerald-500/30 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            sound.playTap();
            onContinue();
          }}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 active:scale-98 text-white font-extrabold text-base tracking-wide shadow-lg shadow-blue-500/30 transition-all cursor-pointer border border-white/20"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
