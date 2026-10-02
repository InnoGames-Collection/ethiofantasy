import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Image as ImageIcon,
  ImageOff,
  HelpCircle,
  Shield,
  Layers,
  Calendar,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';
import { QuizQuestion, QuestionPool, QuestionDifficulty, QuestionStatus } from '../../types';
import { CATEGORY_OPTIONS, DIFFICULTY_OPTIONS } from './mockQuestionBankData';

interface QuestionEditorModalProps {
  isOpen: boolean;
  question: QuizQuestion | null; // null = create new
  onClose: () => void;
  onSave: (data: Partial<QuizQuestion>, reason: string) => void;
  onOpenImageLibrary: () => void;
  selectedLibraryImage?: { url: string; altText: string } | null;
}

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({
  isOpen,
  question,
  onClose,
  onSave,
  onOpenImageLibrary,
  selectedLibraryImage,
}) => {
  const isEditing = !!question;

  const [questionCode, setQuestionCode] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [questionAmharic, setQuestionAmharic] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number>(0);
  const [pool, setPool] = useState<QuestionPool>('LEVEL_BASED');
  const [levelNumber, setLevelNumber] = useState<number>(1);
  const [orderNumber, setOrderNumber] = useState<number>(1);
  const [category, setCategory] = useState<string>('Ethiopian Football');
  const [difficulty, setDifficulty] = useState<string>('MEDIUM');
  const [status, setStatus] = useState<QuestionStatus>('DRAFT');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageAlt, setImageAlt] = useState<string>('');
  const [sourceReference, setSourceReference] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize form state
  useEffect(() => {
    if (question) {
      setQuestionCode(question.questionCode || `Q000${question.id.replace(/\D/g, '') || '101'}`.slice(-7));
      setQuestionText(question.questionText || '');
      setQuestionAmharic(question.questionAmharic || '');
      setOptions(
        question.options && question.options.length === 4
          ? [...question.options]
          : ['Option A', 'Option B', 'Option C', 'Option D']
      );
      setCorrectOptionIndex(
        typeof question.correctOptionIndex === 'number' && question.correctOptionIndex >= 0 && question.correctOptionIndex < 4
          ? question.correctOptionIndex
          : 0
      );
      setPool(question.pool || (question.levelNumber ? 'LEVEL_BASED' : 'DAILY_CHALLENGE'));
      setLevelNumber(question.levelNumber || 1);
      setOrderNumber(question.orderNumber || 1);
      setCategory(question.category || 'Ethiopian Football');
      setDifficulty((question.difficulty as string) || 'MEDIUM');
      setStatus((question.status as QuestionStatus) || 'DRAFT');
      setImageUrl(question.imageUrl || '');
      setImageAlt(question.imageAlt || '');
      setSourceReference(question.sourceReference || '');
      setExplanation(question.explanation || '');
      setReason('');
      setErrorMsg(null);
    } else {
      // Create new defaults
      const autoId = `Q000${Math.floor(100 + Math.random() * 900)}`;
      setQuestionCode(autoId);
      setQuestionText('');
      setQuestionAmharic('');
      setOptions(['', '', '', '']);
      setCorrectOptionIndex(0);
      setPool('LEVEL_BASED');
      setLevelNumber(1);
      setOrderNumber(1);
      setCategory('Ethiopian Football');
      setDifficulty('MEDIUM');
      setStatus('DRAFT');
      setImageUrl('');
      setImageAlt('');
      setSourceReference('');
      setExplanation('');
      setReason('');
      setErrorMsg(null);
    }
  }, [question, isOpen]);

  // Sync if image selected from library
  useEffect(() => {
    if (selectedLibraryImage) {
      setImageUrl(selectedLibraryImage.url);
      if (selectedLibraryImage.altText && !imageAlt) {
        setImageAlt(selectedLibraryImage.altText);
      }
    }
  }, [selectedLibraryImage]);

  if (!isOpen) return null;

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleSave = (targetStatus?: QuestionStatus) => {
    if (!questionText.trim()) {
      setErrorMsg('Question text is required.');
      return;
    }
    if (options.some((o) => !o.trim())) {
      setErrorMsg('All 4 answer options (A, B, C, D) must be provided.');
      return;
    }
    if (!reason.trim()) {
      setErrorMsg('Operational reason is required for compliance audit logging.');
      return;
    }

    setErrorMsg(null);

    const data: Partial<QuizQuestion> = {
      questionCode: questionCode.trim() || undefined,
      questionText: questionText.trim(),
      questionAmharic: questionAmharic.trim() || undefined,
      options: options.map((o) => o.trim()),
      correctOptionIndex,
      pool,
      levelNumber: pool === 'LEVEL_BASED' ? levelNumber : undefined,
      orderNumber: pool === 'LEVEL_BASED' ? orderNumber : undefined,
      category,
      difficulty,
      status: targetStatus || status,
      imageUrl: imageUrl.trim() || undefined,
      imageAlt: imageAlt.trim() || undefined,
      sourceReference: sourceReference.trim() || undefined,
      explanation: explanation.trim() || undefined,
    };

    onSave(data, reason.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              Q
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold tracking-tight">
                  {isEditing ? `Edit Question [${questionCode}]` : 'Create New Football Question'}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                  ADMIN WORKSPACE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Authoritative question editor for EthioFantasy 50,000+ Football Quiz Catalog.
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

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center space-x-2 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: ID, Content Pool & Level Assignment */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/90 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Pool & Level Configuration</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                System Code: <strong className="text-slate-800">{questionCode}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Question Code */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  QUESTION ID
                </label>
                <input
                  type="text"
                  value={questionCode}
                  onChange={(e) => setQuestionCode(e.target.value.toUpperCase())}
                  placeholder="e.g. Q000124"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Content Pool (Section 11 requirement: extremely distinct) */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  CONTENT POOL <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPool('LEVEL_BASED')}
                    className={`px-3 py-2 rounded-lg border text-left transition-all flex items-center space-x-2.5 ${
                      pool === 'LEVEL_BASED'
                        ? 'bg-blue-50/90 border-blue-500 text-blue-900 font-bold ring-1 ring-blue-500 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        pool === 'LEVEL_BASED' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                      }`}
                    >
                      {pool === 'LEVEL_BASED' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="text-xs">LEVEL-BASED POOL</div>
                      <div className="text-[10px] text-slate-500 font-normal">Assigned to progression Level 1–100</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPool('DAILY_CHALLENGE')}
                    className={`px-3 py-2 rounded-lg border text-left transition-all flex items-center space-x-2.5 ${
                      pool === 'DAILY_CHALLENGE'
                        ? 'bg-indigo-50/90 border-indigo-500 text-indigo-900 font-bold ring-1 ring-indigo-500 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        pool === 'DAILY_CHALLENGE' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                      }`}
                    >
                      {pool === 'DAILY_CHALLENGE' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="text-xs">DAILY CHALLENGE POOL</div>
                      <div className="text-[10px] text-slate-500 font-normal">Dedicated for daily tournament rounds</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Level Selector - Conditional on LEVEL_BASED (Section 12) */}
            {pool === 'LEVEL_BASED' ? (
              <div className="pt-2 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    TARGET LEVEL (1 to 100) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={levelNumber}
                    onChange={(e) => setLevelNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500"
                  >
                    {Array.from({ length: 100 }, (_, i) => i + 1).map((lvl) => (
                      <option key={lvl} value={lvl}>
                        Level {lvl}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    ORDER POSITION IN LEVEL
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            ) : (
              <div className="p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-lg text-indigo-900 text-xs flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  <strong>Daily Challenge Pool:</strong> Question does not require level assignment. It will be available for tournament scheduling in Daily Challenge Operations.
                </span>
              </div>
            )}
          </div>

          {/* Section 2: Question Text (English & Amharic) */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                QUESTION TEXT (ENGLISH) <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="e.g. Which country won the 1974 FIFA World Cup as tournament hosts?"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                QUESTION TEXT (AMHARIC TRANSLATION) - OPTIONAL
              </label>
              <textarea
                rows={2}
                value={questionAmharic}
                onChange={(e) => setQuestionAmharic(e.target.value)}
                placeholder="ለምሳሌ፡ በ1974 የዓለም ዋንጫ አስተናጋጅ ሆና ዋንጫውን ያነሳችው ሀገር ማን ናት?"
                className="w-full px-3.5 py-2 bg-slate-50/60 border border-slate-200 rounded-xl text-xs text-slate-800 font-sans focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Section 3: Options & Controlled Correct Answer (Section 10 requirement) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Answer Options & Correct Answer Selection</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                ADMIN-CONTROLLED • A/B/C/D ONLY
              </span>
            </div>

            <p className="text-[11px] text-slate-500">
              Select the radio button beside the correct option. The system strictly enforces controlled selection of A, B, C, or D.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(['A', 'B', 'C', 'D'] as const).map((letter, idx) => {
                const isCorrect = correctOptionIndex === idx;
                return (
                  <div
                    key={letter}
                    onClick={() => setCorrectOptionIndex(idx)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all duration-150 ${
                      isCorrect
                        ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`w-6 h-6 rounded-md font-mono font-bold text-xs flex items-center justify-center ${
                            isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="text-xs font-bold text-slate-700">Option {letter}</span>
                      </div>

                      {isCorrect && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>CORRECT ANSWER</span>
                        </span>
                      )}
                    </div>

                    <input
                      type="text"
                      value={options[idx]}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder={`Enter text for Option ${letter}...`}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Image Management (Section 8, 13) */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <span>Question Image Management</span>
              </span>
              <button
                type="button"
                onClick={onOpenImageLibrary}
                className="px-2.5 py-1 bg-white border border-slate-300 hover:border-blue-500 text-blue-700 rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-2xs transition-colors"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Browse Image Library</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-start gap-4">
              {/* Image Preview Box */}
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center shrink-0 overflow-hidden relative shadow-2xs">
                {imageUrl && imageUrl.trim() !== '' ? (
                  <img
                    src={imageUrl}
                    alt={imageAlt || 'Selected question image'}
                    className="w-full h-full object-cover"
                    onError={() => {}}
                  />
                ) : (
                  <div className="text-center p-2 text-rose-600">
                    <ImageOff className="w-5 h-5 mx-auto mb-1 opacity-70" />
                    <span className="text-[9px] font-black uppercase tracking-wider">
                      NO IMAGE
                    </span>
                  </div>
                )}
              </div>

              {/* Inputs */}
              <div className="flex-1 space-y-2.5 w-full">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    IMAGE URL
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... or choose from Library"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      IMAGE ALT TEXT / DESCRIPTION
                    </label>
                    <input
                      type="text"
                      value={imageAlt}
                      onChange={(e) => setImageAlt(e.target.value)}
                      placeholder="e.g. World Cup trophy celebration"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      SOURCE / REFERENCE
                    </label>
                    <input
                      type="text"
                      value={sourceReference}
                      onChange={(e) => setSourceReference(e.target.value)}
                      placeholder="e.g. FIFA Technical Study 2022"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Metadata, Category, Difficulty, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                CATEGORY <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500"
              >
                {CATEGORY_OPTIONS.filter((c) => c !== 'All').map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                DIFFICULTY <span className="text-rose-500">*</span>
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500"
              >
                {DIFFICULTY_OPTIONS.filter((d) => d !== 'All').map((diff) => (
                  <option key={diff} value={diff.toUpperCase()}>
                    {diff}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                PUBLISHING STATUS <span className="text-rose-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as QuestionStatus)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500"
              >
                <option value="DRAFT">Draft (Work in progress)</option>
                <option value="NEEDS_REVIEW">Needs Review (Editorial check)</option>
                <option value="PUBLISHED">Published (Live in game)</option>
                <option value="INACTIVE">Inactive (Hidden from game)</option>
              </select>
            </div>
          </div>

          {/* Section 6: Explanation & Trivia context */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              ANSWER EXPLANATION & FACT BACKGROUND
            </label>
            <textarea
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Provide background context or trivia fact displayed to players or reviewers..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Section 7: Audit Reason */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5">
            <div className="flex items-center space-x-1.5 text-amber-900 font-bold text-xs">
              <Shield className="w-4 h-4 text-amber-600" />
              <span>Operational Justification / Audit Reason <span className="text-rose-500">*</span></span>
            </div>
            <p className="text-[11px] text-amber-800">
              All question edits are logged into the permanent Ethio Telecom compliance audit ledger.
            </p>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Added verified answer source reference and uploaded stadium image"
              className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors"
          >
            Cancel
          </button>

          <div className="w-full sm:w-auto flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleSave('DRAFT')}
              className="w-full sm:w-auto px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={() => handleSave('NEEDS_REVIEW')}
              className="w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
            >
              Submit for Review
            </button>
            <button
              type="button"
              onClick={() => handleSave('PUBLISHED')}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
            >
              Save & Publish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
