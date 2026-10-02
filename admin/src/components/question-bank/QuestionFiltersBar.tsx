import React from 'react';
import { Search, RotateCcw, Filter, Image, ImageOff } from 'lucide-react';
import { CATEGORY_OPTIONS, DIFFICULTY_OPTIONS } from './mockQuestionBankData';

export interface FilterState {
  search: string;
  pool: 'ALL' | 'LEVEL_BASED' | 'DAILY_CHALLENGE';
  status: 'ALL' | 'DRAFT' | 'NEEDS_REVIEW' | 'PUBLISHED' | 'INACTIVE';
  difficulty: string;
  category: string;
  level: string; // 'ALL' or '1', '2', ...
  imageFilter: 'ALL' | 'WITH_IMAGE' | 'WITHOUT_IMAGE';
}

interface QuestionFiltersBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onReset: () => void;
  totalFiltered: number;
  totalAll: number;
}

export const QuestionFiltersBar: React.FC<QuestionFiltersBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  totalFiltered,
  totalAll,
}) => {
  const isFiltered =
    filters.search !== '' ||
    filters.pool !== 'ALL' ||
    filters.status !== 'ALL' ||
    filters.difficulty !== 'All' ||
    filters.category !== 'All' ||
    filters.level !== 'ALL' ||
    filters.imageFilter !== 'ALL';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3.5 shadow-xs">
      {/* Top Search bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            placeholder="Search questions, ID, category, level, or answer options..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50/80 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ ...filters, search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-mono"
            >
              ×
            </button>
          )}
        </div>

        {/* Quick Image Filter Toggle */}
        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, imageFilter: 'ALL' })}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              filters.imageFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Media
          </button>
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, imageFilter: 'WITH_IMAGE' })}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-md flex items-center space-x-1 transition-colors ${
              filters.imageFilter === 'WITH_IMAGE'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Questions with attached images"
          >
            <Image className="w-3.5 h-3.5" />
            <span>Has Image</span>
          </button>
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, imageFilter: 'WITHOUT_IMAGE' })}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-md flex items-center space-x-1 transition-colors ${
              filters.imageFilter === 'WITHOUT_IMAGE'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Questions missing an image"
          >
            <ImageOff className="w-3.5 h-3.5" />
            <span>No Image</span>
          </button>
        </div>

        {isFiltered && (
          <button
            onClick={onReset}
            className="px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200/80 transition-colors flex items-center space-x-1.5 shrink-0 self-start md:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Dropdown Filters Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
        {/* Pool Selector */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Content Pool
          </label>
          <select
            value={filters.pool}
            onChange={(e) =>
              onFilterChange({ ...filters, pool: e.target.value as FilterState['pool'] })
            }
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
          >
            <option value="ALL">All Pools</option>
            <option value="LEVEL_BASED">Level-Based</option>
            <option value="DAILY_CHALLENGE">Daily Challenge</option>
          </select>
        </div>

        {/* Status Selector */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Publish Status
          </label>
          <select
            value={filters.status}
            onChange={(e) =>
              onFilterChange({ ...filters, status: e.target.value as FilterState['status'] })
            }
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="NEEDS_REVIEW">Needs Review</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {/* Category Selector */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Category
          </label>
          <select
            value={filters.category}
            onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium truncate"
          >
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty Selector */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Difficulty
          </label>
          <select
            value={filters.difficulty}
            onChange={(e) => onFilterChange({ ...filters, difficulty: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
          >
            {DIFFICULTY_OPTIONS.map((diff) => (
              <option key={diff} value={diff}>
                {diff === 'All' ? 'All Difficulties' : diff}
              </option>
            ))}
          </select>
        </div>

        {/* Level Selector */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Level
          </label>
          <select
            value={filters.level}
            onChange={(e) => onFilterChange({ ...filters, level: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
          >
            <option value="ALL">All Levels</option>
            {[1, 2, 3, 4, 5, 8, 10, 12, 15, 25, 37, 50, 100].map((lvl) => (
              <option key={lvl} value={String(lvl)}>
                Level {lvl}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Results Summary */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
        <div className="flex items-center space-x-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>
            Showing <strong className="text-slate-800">{totalFiltered}</strong> matching questions (from {totalAll} catalog items)
          </span>
        </div>
        {isFiltered && (
          <span className="text-blue-700 font-medium">Filters Applied</span>
        )}
      </div>
    </div>
  );
};
