import React, { useEffect, useState } from 'react';
import { sound } from '../../services/soundService';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Preparing the field... 0%');

  useEffect(() => {
    const startTime = Date.now();
    const duration = 2000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(pct);

      if (pct < 35) {
        setStatusText(`Preparing the field... ${pct}%`);
      } else if (pct < 85) {
        setStatusText(`Setting up 100 levels... ${pct}%`);
      } else {
        setStatusText(`Almost ready... ${pct}%`);
      }

      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          sound.playWhistle();
          onComplete();
        }, 200);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div
      onClick={() => {
        sound.playWhistle();
        onComplete();
      }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between p-8 bg-gradient-to-b from-[#0f3460] via-[#0b2447] to-[#04152b] text-white select-none overflow-hidden cursor-pointer"
    >
      {/* Stadium pitch field pattern and floating stars */}
      <div className="absolute inset-0 pointer-events-none opacity-25">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border-2 border-white/40 rounded-full" />
        <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/40 -translate-y-1/2" />
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute text-amber-300 text-xs animate-pulse"
            style={{
              top: `${(i * 19) % 95}%`,
              left: `${(i * 23) % 95}%`,
              animationDuration: `${1.5 + (i % 3) * 0.5}s`,
            }}
          >
            ★
          </div>
        ))}
      </div>

      <div className="w-full h-8" />

      {/* Center Branding (F1 Master) */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto">
        {/* Animated Football Ball Emblem with white outline */}
        <div className="relative mb-6">
          <div className="w-32 h-32 rounded-full bg-slate-900 border-4 border-white shadow-[0_0_40px_rgba(34,197,94,0.6)] flex items-center justify-center relative overflow-hidden">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-white via-slate-100 to-slate-300 flex items-center justify-center relative">
              <div
                className="w-12 h-12 bg-slate-900 rounded-xs shadow-inner"
                style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }}
              />
              <div className="absolute -top-3 left-10 w-7 h-7 bg-slate-900 rounded-xs rotate-12" />
              <div className="absolute -bottom-3 left-10 w-7 h-7 bg-slate-900 rounded-xs -rotate-12" />
              <div className="absolute top-10 -left-3 w-7 h-7 bg-slate-900 rounded-xs rotate-45" />
              <div className="absolute top-10 -right-3 w-7 h-7 bg-slate-900 rounded-xs -rotate-45" />
            </div>
          </div>
        </div>

        {/* FOOTBALL QUIZ Athletic Heading */}
        <h1 className="text-4xl sm:text-5xl font-black text-amber-400 tracking-wider text-center drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] uppercase">
          FOOTBALL
        </h1>
        <h1 className="text-4xl sm:text-5xl font-black text-amber-400 tracking-wider text-center drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] uppercase -mt-2">
          QUIZ
        </h1>

        {/* EthioFantasy Edition Banner */}
        <div className="mt-3 px-4 py-1.5 rounded-full bg-emerald-600/90 border border-emerald-300 shadow-md flex items-center gap-1.5 text-xs font-black text-white uppercase tracking-wider">
          <span>EthioFantasy Edition · 100 Levels</span>
        </div>

        {/* Sub-banner: Test Your Football Knowledge */}
        <div className="mt-3 px-5 py-2 rounded-full bg-slate-900/80 border border-teal-400/40 shadow-xl flex items-center gap-2 text-xs sm:text-sm font-bold text-teal-200">
          <span>⚽</span>
          <span>Test Your Football Knowledge</span>
          <span>🏆</span>
        </div>
      </div>

      {/* Bottom Loading Progress Bar & Status (F1 Master) */}
      <div className="w-full max-w-xs z-10 flex flex-col items-center gap-2 mb-6">
        <div className="w-full h-2 rounded-full bg-slate-800/90 border border-teal-500/30 overflow-hidden p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400 transition-all duration-100 shadow-[0_0_12px_rgba(52,211,153,0.8)]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-slate-300 tabular-nums">
          {statusText}
        </span>
      </div>
    </div>
  );
};
