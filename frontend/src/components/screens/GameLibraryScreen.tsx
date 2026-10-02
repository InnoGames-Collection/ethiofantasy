import React from 'react';
import { Volume2, ChevronLeft } from 'lucide-react';
import { sound } from '../../services/soundService';

interface GameLibraryScreenProps {
  onLaunchGame: () => void;
}

export const GameLibraryScreen: React.FC<GameLibraryScreenProps> = ({ onLaunchGame }) => {
  return (
    <div className="min-h-screen w-full bg-[#121212] text-white flex flex-col justify-between p-4 select-none">
      {/* Top Header (F1 Master: "< My games", Volume & More icon) */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between py-2 border-b border-white/10">
        <div className="flex items-center gap-1.5 text-base font-semibold text-white">
          <ChevronLeft className="w-5 h-5" />
          <span>My games</span>
        </div>
        <div className="flex items-center gap-3 text-slate-300">
          <Volume2 className="w-5 h-5 text-slate-300" />
        </div>
      </header>

      {/* Main Grid: Library Title & Game Tiles */}
      <div className="w-full max-w-md mx-auto flex-1 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold tracking-tight text-white">
            Library
          </h2>
        </div>

        {/* 3-Column Game Grid from F1.mp4 00:00 */}
        <div className="grid grid-cols-3 gap-3">
          {/* Primary Featured: Football Quiz: Ultimate Test */}
          <div
            onClick={() => {
              sound.playTap();
              onLaunchGame();
            }}
            className="flex flex-col items-center group cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-[#4c1d95] via-[#2e1065] to-[#0f172a] p-1 border-2 border-amber-400 shadow-xl shadow-purple-900/40 relative overflow-hidden flex items-center justify-center">
              {/* Vibrant artwork */}
              <div className="w-full h-full rounded-xl bg-gradient-to-b from-[#7c3aed] to-[#3b0764] flex flex-col items-center justify-center relative p-1">
                <span className="text-3xl filter drop-shadow">⚽</span>
                <span className="text-[10px] font-black text-amber-300 uppercase tracking-tighter mt-1 bg-black/50 px-1.5 rounded-full">
                  QUIZ
                </span>
                {/* Glow ring */}
                <div className="absolute inset-0 border border-amber-300/40 rounded-xl" />
              </div>
            </div>
            <span className="text-[11px] font-bold text-center mt-1.5 text-white line-clamp-2 leading-tight">
              Football Quiz: Ultimate Test
            </span>
          </div>

          {/* Secondary Tile: Football Trivia Master */}
          <div
            onClick={() => {
              sound.playTap();
              onLaunchGame();
            }}
            className="flex flex-col items-center group cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-full aspect-square rounded-2xl bg-[#1e293b] p-1 border border-slate-700 shadow-md relative overflow-hidden flex items-center justify-center">
              <div className="w-full h-full rounded-xl bg-gradient-to-b from-slate-700 to-slate-900 flex flex-col items-center justify-center p-1">
                <span className="text-3xl">🏆</span>
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter mt-1">
                  TRIVIA
                </span>
              </div>
            </div>
            <span className="text-[11px] font-medium text-center mt-1.5 text-slate-300 line-clamp-2 leading-tight">
              Football Trivia Master
            </span>
          </div>

          {/* Third Tile: Football Quiz 2025 */}
          <div
            onClick={() => {
              sound.playTap();
              onLaunchGame();
            }}
            className="flex flex-col items-center group cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-full aspect-square rounded-2xl bg-[#0f172a] p-1 border border-slate-700 shadow-md relative overflow-hidden flex items-center justify-center">
              <div className="w-full h-full rounded-xl bg-gradient-to-b from-teal-800 to-slate-900 flex flex-col items-center justify-center p-1">
                <span className="text-3xl">🎯</span>
                <span className="text-[9px] font-bold text-teal-300 uppercase tracking-tighter mt-1">
                  2025
                </span>
              </div>
            </div>
            <span className="text-[11px] font-medium text-center mt-1.5 text-slate-300 line-clamp-2 leading-tight">
              football_quiz
            </span>
          </div>

          {/* Row 2: Decorative surrounding tiles from F1 */}
          <div className="flex flex-col items-center opacity-60">
            <div className="w-full aspect-square rounded-2xl bg-amber-900/40 p-1 border border-amber-700/30 flex items-center justify-center">
              <span className="text-2xl">🍓</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">Fruit Fancy</span>
          </div>

          <div className="flex flex-col items-center opacity-60">
            <div className="w-full aspect-square rounded-2xl bg-sky-950/40 p-1 border border-sky-700/30 flex items-center justify-center">
              <span className="text-2xl">🧠</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">General Quiz</span>
          </div>

          <div className="flex flex-col items-center opacity-60">
            <div className="w-full aspect-square rounded-2xl bg-yellow-950/40 p-1 border border-yellow-700/30 flex items-center justify-center">
              <span className="text-2xl">📐</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">Geometry Dash</span>
          </div>
        </div>

        {/* Play Banner */}
        <div className="mt-8 p-4 rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 border border-blue-400/40 shadow-xl flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
              READY TO PLAY?
            </span>
            <h3 className="text-lg font-black text-white">
              Football Quiz 2026
            </h3>
            <span className="text-xs text-blue-100">
              16 levels · 190+ questions · Real players & clubs
            </span>
          </div>

          <button
            onClick={() => {
              sound.playTap();
              onLaunchGame();
            }}
            className="px-5 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            PLAY
          </button>
        </div>
      </div>
    </div>
  );
};
