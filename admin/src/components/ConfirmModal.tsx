import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
  title: string;
  actionName: string;
  currentValue?: string;
  newValue?: string;
  warningNote?: string;
  confirmButtonText?: string;
  danger?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  actionName,
  currentValue,
  newValue,
  warningNote,
  confirmButtonText = 'Confirm Action',
  danger = false,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!reason.trim() || reason.trim().length < 4) {
      setError('An operational reason is required for administrative audit recording.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onConfirm(reason.trim());
      setReason('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between border-b ${danger ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center space-x-2">
            <AlertTriangle className={`w-5 h-5 ${danger ? 'text-rose-600' : 'text-amber-600'}`} />
            <h3 className={`font-semibold text-base ${danger ? 'text-rose-900' : 'text-slate-900'}`}>
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 rounded-md p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="text-sm text-slate-600">
            You are about to execute: <span className="font-semibold text-slate-900">{actionName}</span>.
            This action will modify authoritative records and be written to the permanent audit trail.
          </div>

          {(currentValue !== undefined || newValue !== undefined) && (
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs space-y-1.5 font-mono">
              {currentValue !== undefined && (
                <div className="flex items-start">
                  <span className="text-slate-400 w-24 shrink-0 uppercase tracking-wider">Current:</span>
                  <span className="text-slate-700 break-all">{currentValue || 'None'}</span>
                </div>
              )}
              {newValue !== undefined && (
                <div className="flex items-start">
                  <span className="text-emerald-600 font-bold w-24 shrink-0 uppercase tracking-wider">New Value:</span>
                  <span className="text-emerald-800 font-semibold break-all">{newValue}</span>
                </div>
              )}
            </div>
          )}

          {warningNote && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 leading-relaxed">
              <strong>Notice:</strong> {warningNote}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Operational Reason / Justification <span className="text-rose-600">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Weekly competition ended; confirming audited top 10 rankings per Ethio Telecom rules."
              rows={3}
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none text-slate-800"
              autoFocus
            />
            <span className="text-xs text-slate-400 mt-1 block">
              Required for compliance and operator audit log.
            </span>
          </div>

          {error && (
            <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-md">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end items-center space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={`px-4 py-2 text-sm font-semibold rounded-lg text-white shadow-xs transition-colors flex items-center space-x-1.5 ${
              danger
                ? 'bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400'
                : 'bg-blue-800 hover:bg-blue-900 disabled:bg-blue-400'
            }`}
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                <span>Recording...</span>
              </>
            ) : (
              <span>{confirmButtonText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
