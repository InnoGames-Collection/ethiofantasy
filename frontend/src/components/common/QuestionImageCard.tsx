import React, { useState } from 'react';
import { Question } from '../../types/quiz';
import { Lightbulb, Award } from 'lucide-react';
import { getQuestionImageAsset } from '../../data/questionImageRegistry';

interface QuestionImageCardProps {
  question: Question;
  onUseHint: () => void;
  onUseExpert: () => void;
  hintUsed: boolean;
  expertUsed: boolean;
  isDailyChallenge?: boolean;
}

export const QuestionImageCard: React.FC<QuestionImageCardProps> = ({
  question,
  onUseHint,
  onUseExpert,
  hintUsed,
  expertUsed,
  isDailyChallenge = false,
}) => {
  const asset = getQuestionImageAsset(question);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Fallback image in case of offline/network failure
  const fallbackUrl = 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80';
  const displayUrl = imageError ? fallbackUrl : (question.imageUrl || asset.imageUrl);
  const displayCaption = question.imageCaption || asset.caption;

  return (
    // BRIGHT WHITE QUESTION CARD (Preserves exact design, dimensions, aspect-[4/3], shadow, and borders)
    <div className="relative w-full max-w-[350px] aspect-[4/3] mx-auto rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-slate-900 flex flex-col select-none">
      <div className="w-full flex-1 relative overflow-hidden rounded-2xl bg-slate-950">
        {/* Loading placeholder skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-blue-950 to-slate-800 animate-pulse flex items-center justify-center">
            <span className="text-3xl opacity-30">⚽</span>
          </div>
        )}

        {/* Real professional football imagery */}
        <img
          key={displayUrl}
          src={displayUrl}
          alt={question.questionText}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="eager"
        />

        {/* Subtle cinematic gradient vignette for crisp text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

        {/* Contextual caption badge (establishes subject without spoiling the answer) */}
        {displayCaption && (
          <div className="absolute bottom-2.5 inset-x-2 flex justify-center pointer-events-none z-10">
            <span className="text-[10px] font-black tracking-wider text-white/95 uppercase bg-black/60 backdrop-blur-xs px-3 py-0.5 rounded-full border border-white/20 shadow-xs truncate max-w-full text-center">
              {displayCaption}
            </span>
          </div>
        )}
      </div>

      {/* Interactive Helper Controls: Hint & Expert (Level-Based Only) */}
      {!isDailyChallenge && (
        <>
          <div className="absolute bottom-2.5 left-2.5 z-20">
            <button
              onClick={onUseExpert}
              disabled={expertUsed}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
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
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
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
        </>
      )}
    </div>
  );
};
