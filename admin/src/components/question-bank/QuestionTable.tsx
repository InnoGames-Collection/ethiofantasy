import React, { useState } from 'react';
import {
  Edit2,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Copy,
  Check,
  ImageOff,
  MoreVertical,
  ExternalLink,
} from 'lucide-react';
import { QuizQuestion } from '../../types';
import { Badge } from '../Badge';

interface QuestionTableProps {
  questions: QuizQuestion[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onEdit: (q: QuizQuestion) => void;
  onPreview: (q: QuizQuestion) => void;
  onDelete: (q: QuizQuestion) => void;
  onStatusChange: (q: QuizQuestion, status: string) => void;
}

export const QuestionTable: React.FC<QuestionTableProps> = ({
  questions,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onPreview,
  onDelete,
  onStatusChange,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const isAllSelected =
    questions.length > 0 && questions.every((q) => selectedIds.includes(q.id));
  const isPartiallySelected =
    selectedIds.length > 0 && !isAllSelected && questions.some((q) => selectedIds.includes(q.id));

  const handleCopyCode = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const getDifficultyBadge = (difficulty: string) => {
    const diff = (difficulty || 'EASY').toUpperCase();
    switch (diff) {
      case 'EASY':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'HARD':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'EXPERT':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto min-h-[360px]">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-3.5 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isPartiallySelected;
                  }}
                  onChange={onToggleSelectAll}
                  className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                  title="Select / Deselect All on page"
                />
              </th>
              <th className="py-3 px-3 w-24">Question ID</th>
              <th className="py-3 px-3 min-w-[280px]">Question Preview</th>
              <th className="py-3 px-3 w-28 text-center">Image</th>
              <th className="py-3 px-3 w-32">Category</th>
              <th className="py-3 px-3 w-24">Difficulty</th>
              <th className="py-3 px-3 w-28">Pool</th>
              <th className="py-3 px-3 w-16 text-center">Level</th>
              <th className="py-3 px-3 w-28">Status</th>
              <th className="py-3 px-3 w-28">Updated</th>
              <th className="py-3 px-3 w-24 text-right pr-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {questions.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <AlertCircle className="w-8 h-8 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-600">No questions match the selected criteria</p>
                    <p className="text-xs text-slate-400">Try adjusting your filters, searching a different term, or creating a new question.</p>
                  </div>
                </td>
              </tr>
            ) : (
              questions.map((q) => {
                const isSelected = selectedIds.includes(q.id);
                const code = q.questionCode || `Q000${q.id.replace(/\D/g, '') || '001'}`.slice(-7);
                const isDaily = q.pool === 'DAILY_CHALLENGE';

                return (
                  <tr
                    key={q.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isSelected ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(q.id)}
                        className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                      />
                    </td>

                    {/* Question ID */}
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">
                      <div className="flex items-center space-x-1.5 group">
                        <span
                          onClick={() => onPreview(q)}
                          className="cursor-pointer hover:text-blue-700 hover:underline"
                          title="Click to preview question"
                        >
                          {code}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyCode(code, e)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 p-0.5 rounded transition-opacity"
                          title="Copy ID"
                        >
                          {copiedId === code ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Question Preview */}
                    <td className="py-3 px-3">
                      <div className="space-y-1 pr-2">
                        <p
                          onClick={() => onPreview(q)}
                          className="text-slate-900 font-semibold line-clamp-2 hover:text-blue-800 cursor-pointer"
                          title={q.questionText}
                        >
                          {q.questionText}
                        </p>
                        {q.questionAmharic && (
                          <p className="text-[11px] text-slate-500 line-clamp-1 italic font-sans">
                            {q.questionAmharic}
                          </p>
                        )}
                        <div className="flex items-center space-x-2 pt-0.5 text-[10px] text-slate-400">
                          <span>4 options</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-semibold font-mono">
                            Correct: {['A', 'B', 'C', 'D'][q.correctOptionIndex] || 'A'}
                          </span>
                          {q.sourceReference && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[140px]" title={q.sourceReference}>
                                Ref: {q.sourceReference}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Image Thumbnail or Placeholder */}
                    <td className="py-3 px-3 text-center">
                      {q.imageUrl && q.imageUrl.trim() !== '' ? (
                        <div className="relative inline-block group">
                          <img
                            src={q.imageUrl}
                            alt={q.imageAlt || 'Question thumbnail'}
                            className="w-11 h-11 object-cover rounded-lg border border-slate-200 shadow-2xs group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              // If image link fails, fallback gracefully
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          {/* Hover preview tooltip */}
                          <div className="hidden group-hover:block absolute z-20 left-12 top-0 w-36 p-1 bg-white rounded-lg shadow-xl border border-slate-200 pointer-events-none">
                            <img
                              src={q.imageUrl}
                              alt="Enlarged preview"
                              className="w-full h-24 object-cover rounded-md"
                            />
                            <p className="text-[9px] text-slate-600 p-1 truncate">
                              {q.imageAlt || 'Preview image'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="inline-flex flex-col items-center justify-center w-16 py-1.5 px-1 bg-rose-50/80 border border-dashed border-rose-200 rounded-lg text-rose-700">
                          <ImageOff className="w-3.5 h-3.5 mb-0.5 opacity-80" />
                          <span className="text-[9px] font-black tracking-wider uppercase">
                            NO IMAGE
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      <span className="inline-block bg-slate-100/90 text-slate-800 px-2 py-0.5 rounded text-[11px] font-semibold truncate max-w-[130px]">
                        {q.category}
                      </span>
                    </td>

                    {/* Difficulty */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block border px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getDifficultyBadge(
                          q.difficulty
                        )}`}
                      >
                        {q.difficulty}
                      </span>
                    </td>

                    {/* Pool */}
                    <td className="py-3 px-3">
                      {isDaily ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          DAILY
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          LEVEL
                        </span>
                      )}
                    </td>

                    {/* Level */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                      {isDaily ? (
                        <span className="text-slate-400 font-normal">—</span>
                      ) : (
                        `L${q.levelNumber || 1}`
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      <Badge status={q.status} size="sm" />
                    </td>

                    {/* Updated */}
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap text-[11px] font-mono">
                      {formatDate(q.updatedAt)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right pr-4">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          type="button"
                          onClick={() => onPreview(q)}
                          className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Preview Question"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(q)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Question"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* More menu */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveMenuId(activeMenuId === q.id ? null : q.id)
                            }
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="More options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeMenuId === q.id && (
                            <div
                              className="absolute right-0 top-8 z-30 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 text-left text-xs"
                              onMouseLeave={() => setActiveMenuId(null)}
                            >
                              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                                Change Status
                              </div>
                              {q.status !== 'PUBLISHED' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onStatusChange(q, 'PUBLISHED');
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3 py-1.5 text-emerald-700 hover:bg-emerald-50 font-medium flex items-center space-x-1.5"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Publish Question</span>
                                </button>
                              )}
                              {q.status !== 'NEEDS_REVIEW' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onStatusChange(q, 'NEEDS_REVIEW');
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3 py-1.5 text-purple-700 hover:bg-purple-50 font-medium flex items-center space-x-1.5"
                                >
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  <span>Mark Needs Review</span>
                                </button>
                              )}
                              {q.status !== 'DRAFT' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onStatusChange(q, 'DRAFT');
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3 py-1.5 text-amber-700 hover:bg-amber-50 font-medium flex items-center space-x-1.5"
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Revert to Draft</span>
                                </button>
                              )}
                              {q.status !== 'INACTIVE' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onStatusChange(q, 'INACTIVE');
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3 py-1.5 text-slate-600 hover:bg-slate-100 font-medium flex items-center space-x-1.5"
                                >
                                  <span>Deactivate</span>
                                </button>
                              )}
                              <div className="border-t border-slate-100 my-1"></div>
                              <button
                                type="button"
                                onClick={() => {
                                  onDelete(q);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3 py-1.5 text-rose-600 hover:bg-rose-50 font-medium flex items-center space-x-1.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Record</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
