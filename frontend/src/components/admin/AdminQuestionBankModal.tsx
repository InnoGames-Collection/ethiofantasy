import React, { useState, useMemo } from 'react';
import { Question } from '../../types/quiz';
import { DAILY_CHALLENGE_QUESTIONS } from '../../data/dailyChallengeData';
import { LEVELS } from '../../data/levelsData';
import { getQuestionImageAsset, QuestionImageAsset } from '../../data/questionImageRegistry';
import { sound } from '../../services/soundService';
import {
  X,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  ImageIcon,
  Sparkles,
} from 'lucide-react';

interface AdminQuestionBankModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminQuestionBankModal: React.FC<AdminQuestionBankModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [poolFilter, setPoolFilter] = useState<'ALL' | 'DAILY' | 'LEVEL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED_RELEVANT' | 'NEEDS_REVIEW' | 'FALLBACK'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Compile all unique questions from runtime datasets
  const allAuditedItems = useMemo(() => {
    const items: {
      question: Question;
      pool: 'DAILY_CHALLENGE' | 'LEVEL';
      levelNum?: number;
      asset: QuestionImageAsset;
    }[] = [];

    // 1. Daily Challenge exclusive questions
    DAILY_CHALLENGE_QUESTIONS.forEach((q) => {
      items.push({
        question: q,
        pool: 'DAILY_CHALLENGE',
        asset: getQuestionImageAsset(q),
      });
    });

    // 2. Level-based questions (sample 10 questions from each level)
    LEVELS.forEach((level) => {
      level.questions.forEach((q) => {
        items.push({
          question: q,
          pool: 'LEVEL',
          levelNum: level.levelNumber,
          asset: getQuestionImageAsset(q),
        });
      });
    });

    return items;
  }, []);

  // Compute exact audit statistics across the actual dataset
  const auditStats = useMemo(() => {
    // Unique questions deduplicated by questionText to give clear bank numbers
    const seenTexts = new Set<string>();
    let uniqueTotal = 0;
    let relevantCount = 0;
    let needsReviewCount = 0;
    let fallbackCount = 0;

    allAuditedItems.forEach((item) => {
      if (!seenTexts.has(item.question.questionText)) {
        seenTexts.add(item.question.questionText);
        uniqueTotal++;
        if (item.asset.status === 'VERIFIED_RELEVANT') {
          relevantCount++;
        } else if (item.asset.status === 'NEEDS_REVIEW') {
          needsReviewCount++;
        } else {
          fallbackCount++;
        }
      }
    });

    return {
      totalChecked: uniqueTotal,
      relevantCount,
      needsReviewCount,
      fallbackCount,
      totalInstances: allAuditedItems.length,
    };
  }, [allAuditedItems]);

  // Categories list
  const categoriesList = useMemo(() => {
    const cats = new Set<string>();
    allAuditedItems.forEach((i) => {
      if (i.question.categoryTitle) cats.add(i.question.categoryTitle);
    });
    return Array.from(cats).sort();
  }, [allAuditedItems]);

  // Filtered view
  const filteredItems = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    // Use unique deduplication for readability in admin preview
    const seen = new Set<string>();

    return allAuditedItems.filter((item) => {
      // Deduplicate identical questions in the preview table
      const dedupKey = item.question.questionText;
      if (seen.has(dedupKey)) return false;
      seen.add(dedupKey);

      // Pool filter
      if (poolFilter === 'DAILY' && item.pool !== 'DAILY_CHALLENGE') return false;
      if (poolFilter === 'LEVEL' && item.pool !== 'LEVEL') return false;

      // Status filter
      if (statusFilter !== 'ALL' && item.asset.status !== statusFilter) return false;

      // Category filter
      if (selectedCategory !== 'ALL' && item.question.categoryTitle !== selectedCategory) return false;

      // Search term
      if (term) {
        const matchText = item.question.questionText.toLowerCase().includes(term);
        const matchId = item.question.id.toLowerCase().includes(term);
        const matchCat = (item.question.categoryTitle || '').toLowerCase().includes(term);
        if (!matchText && !matchId && !matchCat) return false;
      }

      return true;
    });
  }, [allAuditedItems, searchTerm, poolFilter, statusFilter, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm select-none animate-fadeIn">
      <div className="w-full max-w-4xl h-[92vh] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Admin Portal · Question Bank Image Registry
                </h2>
                <span className="text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Content Audit v2.0
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Inspect question-specific photography assets, licensing, and metadata before backend integration.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playTap();
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audit KPI Summary (Requirement #18) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-slate-950/40 border-b border-slate-800 shrink-0">
          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              TOTAL QUESTIONS CHECKED
            </span>
            <span className="text-xl sm:text-2xl font-black text-white mt-1 tabular-nums">
              {auditStats.totalChecked}
            </span>
            <span className="text-[10px] text-slate-400">
              Across {auditStats.totalInstances} Level & Daily slots
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-600/30 flex flex-col">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider">
                RELEVANT IMAGES
              </span>
            </div>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 mt-1 tabular-nums">
              {auditStats.relevantCount}
            </span>
            <span className="text-[10px] text-emerald-300/80">
              {Math.round((auditStats.relevantCount / auditStats.totalChecked) * 100)}% verified specific
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-600/30 flex flex-col">
            <div className="flex items-center gap-1.5 text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider">
                NEEDS REVIEW
              </span>
            </div>
            <span className="text-xl sm:text-2xl font-black text-amber-400 mt-1 tabular-nums">
              {auditStats.needsReviewCount}
            </span>
            <span className="text-[10px] text-amber-300/80">
              Category-mapped fallback
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex flex-col">
            <div className="flex items-center gap-1.5 text-slate-400">
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider">
                USING FALLBACK
              </span>
            </div>
            <span className="text-xl sm:text-2xl font-black text-slate-300 mt-1 tabular-nums">
              {auditStats.fallbackCount}
            </span>
            <span className="text-[10px] text-slate-400">
              Default stadium/turf
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="p-3 sm:p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search question, ID, or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Pool Filter */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => setPoolFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                poolFilter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Pools
            </button>
            <button
              onClick={() => setPoolFilter('DAILY')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                poolFilter === 'DAILY' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Daily ({DAILY_CHALLENGE_QUESTIONS.length})
            </button>
            <button
              onClick={() => setPoolFilter('LEVEL')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                poolFilter === 'LEVEL' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Level Game
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="VERIFIED_RELEVANT">Verified Relevant</option>
            <option value="NEEDS_REVIEW">Needs Review</option>
            <option value="FALLBACK">Using Fallback</option>
          </select>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:outline-none max-w-[160px] truncate"
          >
            <option value="ALL">All Categories</option>
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Scrollable Questions List (Requirement #13) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredItems.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-500">
              <Search className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs">No questions matched the selected filters.</p>
            </div>
          ) : (
            filteredItems.map(({ question, pool, levelNum, asset }) => (
              <div
                key={question.id + question.questionText}
                className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/80 flex flex-col sm:flex-row gap-4 items-start"
              >
                {/* Image Preview Thumbnail */}
                <div className="w-full sm:w-44 aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 border border-slate-700 relative shrink-0">
                  <img
                    src={asset.imageUrl}
                    alt={question.questionText}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-1.5 inset-x-1 flex justify-center pointer-events-none">
                    <span className="text-[9px] font-black uppercase tracking-wider text-white bg-black/60 px-2 py-0.5 rounded-sm truncate text-center max-w-full">
                      {asset.caption}
                    </span>
                  </div>
                </div>

                {/* Question Metadata & Details */}
                <div className="flex-1 flex flex-col gap-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="font-mono bg-slate-900 px-2 py-0.5 rounded-md text-slate-300 font-bold border border-slate-700">
                      {question.id}
                    </span>

                    <span className={`px-2 py-0.5 rounded-md font-black uppercase ${
                      pool === 'DAILY_CHALLENGE'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {pool === 'DAILY_CHALLENGE' ? 'DAILY CHALLENGE' : `LEVEL ${levelNum || 1}`}
                    </span>

                    <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-md font-bold uppercase">
                      {question.categoryTitle}
                    </span>

                    <span className={`px-2 py-0.5 rounded-md font-bold uppercase ${
                      asset.status === 'VERIFIED_RELEVANT'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-600/40'
                        : asset.status === 'NEEDS_REVIEW'
                        ? 'bg-amber-950 text-amber-400 border border-amber-600/40'
                        : 'bg-rose-950 text-rose-400 border border-rose-600/40'
                    }`}>
                      {asset.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Question Text */}
                  <h3 className="text-xs sm:text-sm font-bold text-white leading-snug">
                    {question.questionText}
                  </h3>

                  {/* Options with Admin Correct Answer Highlight */}
                  <div className="grid grid-cols-2 gap-1.5 mt-1 text-[11px]">
                    {question.options.map((opt, optIdx) => {
                      const isCorrect = optIdx === question.correctAnswerIndex;
                      return (
                        <div
                          key={optIdx}
                          className={`p-2 rounded-lg border font-medium flex items-center justify-between ${
                            isCorrect
                              ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300 font-bold'
                              : 'bg-slate-900/60 border-slate-700/50 text-slate-300'
                          }`}
                        >
                          <span className="truncate">
                            <span className="font-mono text-[10px] text-slate-400 mr-1.5">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            {opt}
                          </span>
                          {isCorrect && (
                            <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-900/60 px-1 rounded-xs ml-1">
                              CORRECT
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Image Source & Licensing (Requirement #9) */}
                  <div className="pt-2 mt-1 border-t border-slate-700/50 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500">Source:</span>
                      <span className="text-slate-300 font-medium">{asset.source}</span>
                      <span>·</span>
                      <span className="text-slate-500">License:</span>
                      <span className="text-slate-300">{asset.license}</span>
                    </div>

                    <a
                      href={asset.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold transition-colors"
                    >
                      <span>View Full Image</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Showing {filteredItems.length} unique questions in preview</span>
          </div>

          <button
            onClick={() => {
              sound.playTap();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            Close Admin Preview
          </button>
        </div>
      </div>
    </div>
  );
};
