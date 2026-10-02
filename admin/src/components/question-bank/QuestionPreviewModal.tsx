import React from 'react';
import {
  X,
  CheckCircle2,
  ImageOff,
  ExternalLink,
  Edit2,
  Layers,
  Calendar,
  Shield,
  BookOpen,
} from 'lucide-react';
import { QuizQuestion } from '../../types';
import { Badge } from '../Badge';

interface QuestionPreviewModalProps {
  question: QuizQuestion | null;
  onClose: () => void;
  onEdit: (q: QuizQuestion) => void;
  onTogglePublish: (q: QuizQuestion) => void;
}

export const QuestionPreviewModal: React.FC<QuestionPreviewModalProps> = ({
  question,
  onClose,
  onEdit,
  onTogglePublish,
}) => {
  if (!question) return null;

  const isDaily = question.pool === 'DAILY_CHALLENGE';
  const isPublished = question.status === 'PUBLISHED';
  const code = question.questionCode || `Q000${question.id.replace(/\D/g, '') || '101'}`.slice(-7);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <span className="font-mono font-bold text-sm bg-blue-600 px-2.5 py-1 rounded-md text-white">
              {code}
            </span>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Question Inspection Preview</h3>
              <p className="text-[11px] text-slate-400">
                Admin review view with verified answer key & citation.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-700">
          {/* Metadata badges strip */}
          <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-200">
            <Badge status={question.status} />

            <span className="px-2.5 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
              {question.difficulty}
            </span>

            <span className="px-2.5 py-0.5 rounded-md font-semibold text-[11px] bg-blue-50 text-blue-800 border border-blue-200">
              {question.category}
            </span>

            {isDaily ? (
              <span className="px-2.5 py-0.5 rounded-md font-bold text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>DAILY CHALLENGE POOL</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-md font-bold text-[10px] bg-blue-50 text-blue-700 border border-blue-200 flex items-center space-x-1">
                <Layers className="w-3 h-3" />
                <span>LEVEL {question.levelNumber || 1} • ORDER #{question.orderNumber || 1}</span>
              </span>
            )}
          </div>

          {/* Question Text */}
          <div className="space-y-1.5">
            <h4 className="text-base font-bold text-slate-900 leading-snug">
              {question.questionText}
            </h4>
            {question.questionAmharic && (
              <p className="text-xs text-slate-600 font-sans italic bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                {question.questionAmharic}
              </p>
            )}
          </div>

          {/* Image Display */}
          {question.imageUrl && question.imageUrl.trim() !== '' ? (
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900/5">
              <img
                src={question.imageUrl}
                alt={question.imageAlt || 'Question visual preview'}
                className="w-full max-h-64 object-cover"
              />
              {question.imageAlt && (
                <div className="p-2 text-[11px] text-slate-500 bg-white border-t border-slate-100">
                  <span className="font-semibold text-slate-700">Alt text:</span> {question.imageAlt}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-rose-50/70 border border-dashed border-rose-200 rounded-xl flex items-center space-x-3 text-rose-800">
              <ImageOff className="w-5 h-5 text-rose-500 shrink-0" />
              <div>
                <p className="font-bold text-xs">NO IMAGE ASSIGNED</p>
                <p className="text-[11px] text-rose-700">
                  This question currently displays the placeholder badge in the catalog. Edit this question to assign an image from the Image Library.
                </p>
              </div>
            </div>
          )}

          {/* Options Display */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Answer Options (Admin View)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(['A', 'B', 'C', 'D'] as const).map((letter, idx) => {
                const isCorrect = question.correctOptionIndex === idx;
                const optText = question.options[idx] || `Option ${letter}`;
                return (
                  <div
                    key={letter}
                    className={`p-3 rounded-xl border flex items-start space-x-2.5 ${
                      isCorrect
                        ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-md font-mono font-bold text-xs flex items-center justify-center shrink-0 ${
                        isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {letter}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs ${isCorrect ? 'font-bold text-emerald-950' : 'text-slate-700'}`}>
                        {optText}
                      </p>
                      {isCorrect && (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 mt-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>OFFICIAL CORRECT ANSWER</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Explanation */}
          {question.explanation && (
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-blue-900 flex items-center space-x-1">
                <BookOpen className="w-3.5 h-3.5 text-blue-700" />
                <span>Trivia Explanation & Educational Context</span>
              </span>
              <p className="text-xs text-blue-950 font-medium leading-relaxed">
                {question.explanation}
              </p>
            </div>
          )}

          {/* Reference & Audit */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-500 font-mono">
            {question.sourceReference && (
              <div>
                <span className="font-sans font-bold text-slate-600">Source:</span>{' '}
                {question.sourceReference}
              </div>
            )}
            <div>
              Updated: {new Date(question.updatedAt).toLocaleDateString()} by{' '}
              <strong className="text-slate-700">{question.updatedBy}</strong>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors"
          >
            Close Preview
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                onTogglePublish(question);
                onClose();
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold text-white transition-colors shadow-xs ${
                isPublished
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isPublished ? 'Revert to Draft' : 'Publish Question'}
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(question);
              }}
              className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Question</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
