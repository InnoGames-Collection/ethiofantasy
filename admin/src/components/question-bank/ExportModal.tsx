import React, { useState } from 'react';
import { X, Download, FileSpreadsheet, FileCode, Check } from 'lucide-react';
import { QuizQuestion } from '../../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  filteredQuestions: QuizQuestion[];
  selectedQuestions: QuizQuestion[];
  allQuestions: QuizQuestion[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  filteredQuestions,
  selectedQuestions,
  allQuestions,
}) => {
  const [scope, setScope] = useState<'FILTERED' | 'SELECTED' | 'ALL'>('FILTERED');
  const [format, setFormat] = useState<'CSV' | 'JSON'>('CSV');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const getTargetQuestions = () => {
    switch (scope) {
      case 'SELECTED':
        return selectedQuestions.length > 0 ? selectedQuestions : filteredQuestions;
      case 'ALL':
        return allQuestions;
      case 'FILTERED':
      default:
        return filteredQuestions;
    }
  };

  const targetList = getTargetQuestions();

  const handleExport = () => {
    setIsExporting(true);

    try {
      if (format === 'JSON') {
        const jsonContent = JSON.stringify(targetList, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ethiofantasy_questions_${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        // CSV
        const headers = [
          'Question ID',
          'Question Text',
          'Amharic Text',
          'Option A',
          'Option B',
          'Option C',
          'Option D',
          'Correct Answer',
          'Category',
          'Difficulty',
          'Pool',
          'Level',
          'Status',
          'Image URL',
          'Explanation',
          'Source Reference',
        ];

        const escapeCsv = (str: string = '') => {
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        };

        const rows = targetList.map((q) => {
          const code = q.questionCode || `Q000${q.id.replace(/\D/g, '') || '101'}`;
          const corrChar = ['A', 'B', 'C', 'D'][q.correctOptionIndex] || 'A';
          return [
            escapeCsv(code),
            escapeCsv(q.questionText),
            escapeCsv(q.questionAmharic || ''),
            escapeCsv(q.options[0] || ''),
            escapeCsv(q.options[1] || ''),
            escapeCsv(q.options[2] || ''),
            escapeCsv(q.options[3] || ''),
            corrChar,
            escapeCsv(q.category),
            q.difficulty,
            q.pool || (q.levelNumber ? 'LEVEL_BASED' : 'DAILY_CHALLENGE'),
            q.levelNumber || '',
            q.status,
            escapeCsv(q.imageUrl || ''),
            escapeCsv(q.explanation || ''),
            escapeCsv(q.sourceReference || ''),
          ].join(',');
        });

        const csvString = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ethiofantasy_questions_${Date.now()}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setIsExporting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden my-auto">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <Download className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold tracking-tight">Export Football Question Bank</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs text-slate-700">
          {/* Export Scope */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Export Scope
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2.5 p-2.5 border rounded-xl cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="scope"
                  checked={scope === 'FILTERED'}
                  onChange={() => setScope('FILTERED')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-bold text-slate-800">Current Filtered Results</span>
                  <span className="text-slate-400 ml-1 font-mono">({filteredQuestions.length} questions)</span>
                </div>
              </label>

              {selectedQuestions.length > 0 && (
                <label className="flex items-center space-x-2.5 p-2.5 border rounded-xl cursor-pointer hover:bg-slate-50 bg-blue-50/50 border-blue-200">
                  <input
                    type="radio"
                    name="scope"
                    checked={scope === 'SELECTED'}
                    onChange={() => setScope('SELECTED')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-bold text-blue-900">Selected Rows Only</span>
                    <span className="text-blue-700 ml-1 font-mono">({selectedQuestions.length} selected)</span>
                  </div>
                </label>
              )}

              <label className="flex items-center space-x-2.5 p-2.5 border rounded-xl cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="scope"
                  checked={scope === 'ALL'}
                  onChange={() => setScope('ALL')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-bold text-slate-800">Entire Question Catalog</span>
                  <span className="text-slate-400 ml-1 font-mono">({allQuestions.length} total)</span>
                </div>
              </label>
            </div>
          </div>

          {/* File Format */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              File Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormat('CSV')}
                className={`p-3 rounded-xl border text-left flex items-center space-x-2.5 transition-all ${
                  format === 'CSV'
                    ? 'border-blue-600 bg-blue-50/80 text-blue-900 font-bold ring-1 ring-blue-500'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <div>
                  <div className="text-xs">CSV Spreadsheet</div>
                  <div className="text-[10px] text-slate-500 font-normal">Excel / Google Sheets</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('JSON')}
                className={`p-3 rounded-xl border text-left flex items-center space-x-2.5 transition-all ${
                  format === 'JSON'
                    ? 'border-blue-600 bg-blue-50/80 text-blue-900 font-bold ring-1 ring-blue-500'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <FileCode className="w-4 h-4 text-indigo-600" />
                <div>
                  <div className="text-xs">JSON Document</div>
                  <div className="text-[10px] text-slate-500 font-normal">API / Developer Export</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={targetList.length === 0 || isExporting}
            className="px-5 py-2 bg-blue-800 hover:bg-blue-900 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Download {targetList.length} Questions</span>
          </button>
        </div>
      </div>
    </div>
  );
};
