import React from 'react';
import { Question } from '../../types/quiz';
import { Lightbulb, Award } from 'lucide-react';

interface QuestionImageCardProps {
  question: Question;
  onUseHint: () => void;
  onUseExpert: () => void;
  hintUsed: boolean;
  expertUsed: boolean;
}

export const QuestionImageCard: React.FC<QuestionImageCardProps> = ({
  question,
  onUseHint,
  onUseExpert,
  hintUsed,
  expertUsed,
}) => {
  const renderVisual = () => {
    const id = question.imageIdentifier || '';

    // 1. Mario Kempes (Argentina 1978 hero)
    if (id === 'kempes') {
      return (
        <div className="relative w-full h-full bg-gradient-to-b from-sky-700 via-sky-800 to-slate-900 flex flex-col items-center justify-end overflow-hidden">
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_20%,#7dd3fc,transparent_60%)]" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-16 bg-[#1f1917] rounded-t-full -mb-4 shadow-md" />
            <div className="w-14 h-15 bg-[#e0ac69] rounded-b-2xl relative shadow-inner flex flex-col items-center justify-center">
              <div className="w-7 h-3 bg-[#422006] rounded-full mt-3" />
            </div>
            <div className="w-36 h-28 bg-[#7dd3fc] rounded-t-3xl relative overflow-hidden flex justify-center shadow-2xl border-t-2 border-white">
              <div className="absolute left-6 w-5 h-full bg-white" />
              <div className="absolute right-6 w-5 h-full bg-white" />
              <div className="absolute w-5 h-full bg-white" />
              <div className="absolute -left-4 top-2 w-12 h-14 bg-[#7dd3fc] rotate-45 rounded-md" />
              <div className="absolute -right-4 top-2 w-12 h-14 bg-[#7dd3fc] -rotate-45 rounded-md" />
              <div className="absolute left-4 top-2 w-4 h-5 bg-[#0369a1] border border-amber-300 rounded-b-sm flex items-center justify-center">
                <span className="text-[7px] text-amber-300 font-bold">★</span>
              </div>
            </div>
          </div>
          <div className="absolute bottom-2 text-[11px] font-bold text-sky-100 tracking-wider bg-black/60 px-3 py-0.5 rounded-full border border-sky-400/40">
            ARGENTINA · 1978 WORLD CUP HERO
          </div>
        </div>
      );
    }

    // 2. Son Heung-min (Tottenham white kit)
    if (id === 'son') {
      return (
        <div className="relative w-full h-full bg-gradient-to-b from-[#1e3a8a] via-[#0f284e] to-[#040d1c] flex flex-col items-center justify-end overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,#38bdf8,transparent_65%)] opacity-35" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-18 h-13 bg-[#111827] rounded-t-2xl -mb-3" />
            <div className="w-13 h-14 bg-[#e5b88f] rounded-b-2xl flex flex-col items-center justify-center">
              <div className="w-6 h-2 bg-[#78350f] rounded-full mt-3" />
            </div>
            <div className="w-36 h-28 bg-white rounded-t-3xl relative overflow-hidden flex flex-col items-center shadow-2xl border-t border-slate-200">
              <div className="w-10 h-3 bg-[#132257] rounded-b-full" />
              <div className="mt-3 font-black text-rose-600 text-xs tracking-widest">
                AIA
              </div>
              <div className="text-[10px] font-bold text-[#132257] mt-0.5">
                SON · 7
              </div>
            </div>
          </div>
          <div className="absolute bottom-2 text-[11px] font-bold text-sky-100 tracking-wider bg-black/60 px-3 py-0.5 rounded-full border border-sky-400/40">
            PREMIER LEAGUE GOLDEN BOOT
          </div>
        </div>
      );
    }

    // 3. Jorginho (Chelsea blue kit)
    if (id === 'jorginho') {
      return (
        <div className="relative w-full h-full bg-gradient-to-b from-[#1e3a8a] via-[#172554] to-[#091026] flex flex-col items-center justify-end overflow-hidden">
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-17 h-12 bg-[#27272a] rounded-t-2xl -mb-3" />
            <div className="w-13 h-14 bg-[#d4a373] rounded-b-2xl flex flex-col items-center justify-center">
              <div className="w-5 h-4 bg-[#451a03] rounded-sm mt-3" />
            </div>
            <div className="w-36 h-28 bg-[#034694] rounded-t-3xl relative overflow-hidden flex flex-col items-center shadow-2xl border-t border-blue-400/40">
              <div className="w-10 h-3 bg-amber-400 rounded-b-sm" />
              <div className="mt-4 font-black text-white text-xs tracking-wider">
                CHELSEA · 5
              </div>
            </div>
          </div>
          <div className="absolute bottom-2 text-[11px] font-bold text-blue-100 tracking-wider bg-black/60 px-3 py-0.5 rounded-full border border-blue-400/40">
            UEFA PLAYER OF THE YEAR · 2021
          </div>
        </div>
      );
    }

    // 4. Jay-Jay Okocha (Bolton Wanderers / Nigeria)
    if (id === 'okocha') {
      return (
        <div className="relative w-full h-full bg-gradient-to-b from-slate-800 via-slate-900 to-black flex flex-col items-center justify-end overflow-hidden">
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-14 bg-[#09090b] rounded-t-full -mb-3 flex justify-between px-1">
              <div className="w-2 h-7 bg-[#18181b] rounded-b-full" />
              <div className="w-2 h-7 bg-[#18181b] rounded-b-full" />
            </div>
            <div className="w-13 h-14 bg-[#58311d] rounded-b-2xl flex flex-col items-center justify-center">
              <div className="w-6 h-2 bg-[#271004] rounded-full mt-3" />
            </div>
            <div className="w-36 h-28 bg-white rounded-t-3xl relative overflow-hidden flex flex-col items-center shadow-2xl border-t border-slate-200">
              <div className="w-12 h-3 bg-[#0c2340] rounded-b-md" />
              <div className="mt-4 font-black text-[#0c2340] text-sm tracking-widest font-mono">
                Reebok
              </div>
              <div className="text-[10px] font-bold text-rose-600 mt-1">
                BWFC · 10
              </div>
            </div>
          </div>
          <div className="absolute bottom-2 text-[11px] font-bold text-amber-200 tracking-wider bg-black/60 px-3 py-0.5 rounded-full border border-amber-400/40">
            "SO GOOD THEY NAMED HIM TWICE"
          </div>
        </div>
      );
    }

    // 5. Cruz Azul
    if (id === 'cruz_azul') {
      return (
        <div className="relative w-full h-full bg-gradient-to-b from-[#0e2a47] to-[#040e1a] flex flex-col items-center justify-center p-3">
          <div className="relative w-32 h-32 rounded-full bg-[#002f6c] p-2 flex items-center justify-center shadow-lg border-4 border-[#002f6c]">
            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center relative">
              <div className="w-18 h-18 rounded-full bg-[#002f6c] flex items-center justify-center relative">
                <div className="w-11 h-11 bg-white flex items-center justify-center relative shadow-xs">
                  <div className="w-3 h-8 bg-[#da291c] rounded-xs absolute" />
                  <div className="w-8 h-3 bg-[#da291c] rounded-xs absolute" />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-2 text-[11px] font-bold text-sky-200 bg-black/60 px-3 py-0.5 rounded-full">
            LIGA MX HISTORIC TITAN
          </div>
        </div>
      );
    }

    // 6. Ethiopian Football Visuals (Saint George / Walia / 1962 AFCON)
    if (id.includes('saint_george') || id.includes('walia') || id.includes('afcon_1962') || question.categoryTitle.includes('ETHIOPIAN')) {
      return (
        <div className="relative w-full h-full bg-gradient-to-b from-emerald-800 via-yellow-700 to-rose-900 flex flex-col items-center justify-center p-3 overflow-hidden">
          {/* Ethiopian Flag Colors Gradient Ribbon */}
          <div className="absolute inset-0 opacity-25 flex flex-col">
            <div className="flex-1 bg-emerald-500" />
            <div className="flex-1 bg-yellow-400" />
            <div className="flex-1 bg-rose-600" />
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 rounded-2xl bg-white/95 border-3 border-yellow-400 p-2 shadow-xl flex flex-col items-center justify-center text-center">
              <span className="text-3xl">🦁</span>
              <span className="text-[10px] font-black text-emerald-800 uppercase tracking-tighter mt-1">
                WALIA IBEX
              </span>
            </div>
            <div className="mt-2 text-[11px] font-black text-yellow-200 bg-black/70 px-3 py-0.5 rounded-full border border-yellow-400/40">
              ETHIOPIAN FOOTBALL HERITAGE
            </div>
          </div>
        </div>
      );
    }

    // 7. Tactical Pitch / Penalty box
    if (question.imageType === 'pitch' || id.includes('pitch') || id.includes('box')) {
      return (
        <div className="relative w-full h-full bg-gradient-to-b from-[#065f46] via-[#047857] to-[#064e3b] flex flex-col items-center justify-center p-3 overflow-hidden">
          <div className="relative w-44 h-28 border-2 border-white/80 rounded-xs flex flex-col items-center justify-start shadow-md">
            <div className="w-20 h-3 border-2 border-white/90 border-t-0 bg-white/10" />
            <div className="w-24 h-8 border-2 border-white/80 border-t-0" />
            <div className="w-2.5 h-2.5 bg-white rounded-full mt-2" />
          </div>
          <div className="mt-2 text-[11px] font-bold text-emerald-100 bg-black/60 px-3 py-0.5 rounded-full">
            REGULATION PITCH MARKINGS
          </div>
        </div>
      );
    }

    // 8. Trophies
    if (question.imageType === 'trophy' || id.includes('trophy')) {
      return (
        <div className="relative w-full h-full bg-gradient-to-b from-amber-700 via-amber-800 to-slate-900 flex flex-col items-center justify-center overflow-hidden">
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-16 bg-gradient-to-b from-yellow-200 via-amber-400 to-amber-600 rounded-b-full border-2 border-yellow-100 flex items-center justify-center shadow-lg relative">
              <div className="absolute -left-3 top-1 w-4 h-9 border-2 border-amber-300 rounded-l-full" />
              <div className="absolute -right-3 top-1 w-4 h-9 border-2 border-amber-300 rounded-r-full" />
              <span className="text-xl">🏆</span>
            </div>
            <div className="w-5 h-4 bg-amber-500" />
            <div className="w-20 h-5 bg-slate-900 rounded-xs border-t-2 border-amber-300 flex items-center justify-center">
              <span className="text-[8px] font-black text-amber-300">CHAMPION</span>
            </div>
          </div>
          <div className="mt-2 text-[11px] font-bold text-amber-200 bg-black/60 px-3 py-0.5 rounded-full">
            FOOTBALL GLORY
          </div>
        </div>
      );
    }

    // Default: Dynamic Soccer Ball
    return (
      <div className="relative w-full h-full bg-gradient-to-b from-blue-700 via-indigo-800 to-slate-900 flex flex-col items-center justify-center overflow-hidden">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-white to-slate-200 border-4 border-white shadow-xl flex items-center justify-center relative overflow-hidden">
          <div className="w-10 h-10 bg-slate-900 shadow-inner" style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }} />
          <div className="absolute -top-2 left-8 w-6 h-6 bg-slate-900" />
          <div className="absolute -bottom-2 left-8 w-6 h-6 bg-slate-900" />
          <div className="absolute top-8 -left-2 w-6 h-6 bg-slate-900" />
          <div className="absolute top-8 -right-2 w-6 h-6 bg-slate-900" />
        </div>
        <div className="mt-2 text-[11px] font-bold text-blue-100 bg-black/60 px-3 py-0.5 rounded-full">
          TEST YOUR FOOTBALL KNOWLEDGE
        </div>
      </div>
    );
  };

  return (
    // BRIGHT WHITE QUESTION CARD (Requirement #23)
    <div className="relative w-full max-w-[350px] aspect-[4/3] mx-auto rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-white flex flex-col">
      <div className="w-full flex-1 relative overflow-hidden rounded-2xl">
        {renderVisual()}
      </div>

      {/* Interactive Helper Controls: Hint & Expert */}
      <div className="absolute bottom-2.5 left-2.5 z-20">
        <button
          onClick={onUseExpert}
          disabled={expertUsed}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-md active:scale-95 ${
            expertUsed
              ? 'bg-emerald-600 text-white cursor-default'
              : 'bg-white/95 hover:bg-white text-blue-700 border border-blue-200 hover:border-blue-400'
          }`}
          title="Highlight Correct Answer"
        >
          <Award className="w-3.5 h-3.5 text-blue-600" />
          <span>{expertUsed ? 'Used' : 'Expert'}</span>
        </button>
      </div>

      <div className="absolute bottom-2.5 right-2.5 z-20">
        <button
          onClick={onUseHint}
          disabled={hintUsed}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-md active:scale-95 ${
            hintUsed
              ? 'bg-teal-600 text-white cursor-default'
              : 'bg-white/95 hover:bg-white text-emerald-700 border border-emerald-200 hover:border-emerald-400'
          }`}
          title="Eliminate 2 Wrong Answers"
        >
          <Lightbulb className="w-3.5 h-3.5 text-emerald-600" />
          <span>{hintUsed ? 'Used' : 'Hint (50/50)'}</span>
        </button>
      </div>
    </div>
  );
};
