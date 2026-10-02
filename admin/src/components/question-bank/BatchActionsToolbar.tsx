import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  X,
  ShieldAlert,
  Archive,
  Download,
} from 'lucide-react';

interface BatchActionsToolbarProps {
  selectedCount: number;
  onClear: () => void;
  onBatchStatusChange: (newStatus: string) => void;
  onBatchDelete: () => void;
  onBatchExport: () => void;
}

export const BatchActionsToolbar: React.FC<BatchActionsToolbarProps> = ({
  selectedCount,
  onClear,
  onBatchStatusChange,
  onBatchDelete,
  onBatchExport,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-2xl px-5 py-3 shadow-2xl border border-slate-700/80 flex items-center space-x-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center space-x-2 pr-3 border-r border-slate-700">
        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
        <span className="text-xs font-semibold text-slate-200">
          <strong className="text-white font-mono">{selectedCount}</strong> questions selected
        </span>
      </div>

      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => onBatchStatusChange('PUBLISHED')}
          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors shadow-xs"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Publish</span>
        </button>

        <button
          type="button"
          onClick={() => onBatchStatusChange('NEEDS_REVIEW')}
          className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors shadow-xs"
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Needs Review</span>
        </button>

        <button
          type="button"
          onClick={() => onBatchStatusChange('DRAFT')}
          className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors shadow-xs"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Draft</span>
        </button>

        <button
          type="button"
          onClick={() => onBatchStatusChange('INACTIVE')}
          className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
        >
          <Archive className="w-3.5 h-3.5" />
          <span>Deactivate</span>
        </button>

        <button
          type="button"
          onClick={onBatchExport}
          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors border border-slate-700"
          title="Export selected questions to CSV"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>

        <button
          type="button"
          onClick={onBatchDelete}
          className="px-2.5 py-1.5 bg-rose-600/90 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors ml-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete</span>
        </button>
      </div>

      <button
        type="button"
        onClick={onClear}
        className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
        title="Deselect all"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
