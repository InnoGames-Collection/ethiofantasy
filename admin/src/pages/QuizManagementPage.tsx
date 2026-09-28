import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Edit,
  Eye,
  CheckCircle,
  AlertTriangle,
  Send,
  Archive,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { QuizLevel, QuizQuestion, AdminRole } from '../types';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import { ConfirmModal } from '../components/ConfirmModal';

interface QuizManagementPageProps {
  currentRole: AdminRole;
}

export const QuizManagementPage: React.FC<QuizManagementPageProps> = ({ currentRole }) => {
  const [levels, setLevels] = useState<QuizLevel[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(1);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit / Create Question Modal
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [formText, setFormText] = useState('');
  const [formAmharic, setFormAmharic] = useState('');
  const [formOptions, setFormOptions] = useState<string[]>(['', '', '', '']);
  const [formCorrectIndex, setFormCorrectIndex] = useState(0);
  const [formCategory, setFormCategory] = useState<QuizQuestion['category']>('ETHIOPIAN_PREMIER_LEAGUE');
  const [formDifficulty, setFormDifficulty] = useState<QuizQuestion['difficulty']>('EASY');
  const [formExplanation, setFormExplanation] = useState('');
  const [formOrder, setFormOrder] = useState(1);
  const [formReason, setFormReason] = useState('');

  // Preview Modal before publishing (Section 17 requirement)
  const [previewQuestion, setPreviewQuestion] = useState<QuizQuestion | null>(null);

  // Confirmation Modal
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    actionName: string;
    currentValue?: string;
    newValue?: string;
    warningNote?: string;
    danger?: boolean;
    actionFn: (reason: string) => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    actionName: '',
    actionFn: async () => {},
  });

  const canEdit = currentRole === 'SUPER_ADMIN' || currentRole === 'OPERATIONS_ADMIN';

  const loadData = async () => {
    try {
      setLoading(true);
      const [lvls, qList] = await Promise.all([
        api.getQuizLevels(),
        api.getQuizQuestions(selectedLevel || undefined, statusFilter),
      ]);
      setLevels(lvls);
      setQuestions(qList);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedLevel, statusFilter]);

  const handleOpenCreate = () => {
    setEditingQuestion(null);
    setFormText('');
    setFormAmharic('');
    setFormOptions(['Option A', 'Option B', 'Option C', 'Option D']);
    setFormCorrectIndex(0);
    setFormCategory('ETHIOPIAN_PREMIER_LEAGUE');
    setFormDifficulty('MEDIUM');
    setFormExplanation('');
    setFormOrder(questions.length + 1);
    setFormReason('');
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (q: QuizQuestion) => {
    setEditingQuestion(q);
    setFormText(q.questionText);
    setFormAmharic(q.questionAmharic || '');
    setFormOptions([...q.options]);
    setFormCorrectIndex(q.correctOptionIndex);
    setFormCategory(q.category);
    setFormDifficulty(q.difficulty);
    setFormExplanation(q.explanation || '');
    setFormOrder(q.orderNumber);
    setFormReason('');
    setIsEditorOpen(true);
  };

  const handleSaveQuestion = async () => {
    if (!formText.trim()) {
      alert('Question text is required.');
      return;
    }
    if (formOptions.some((o) => !o.trim())) {
      alert('All 4 answer options must be filled.');
      return;
    }
    if (!formReason.trim()) {
      alert('Operational reason is required for content auditing.');
      return;
    }

    try {
      if (editingQuestion) {
        await api.updateQuizQuestion(
          editingQuestion.id,
          {
            questionText: formText,
            questionAmharic: formAmharic,
            options: formOptions,
            correctOptionIndex: formCorrectIndex,
            category: formCategory,
            difficulty: formDifficulty,
            explanation: formExplanation,
            orderNumber: formOrder,
          },
          formReason
        );
      } else {
        await api.createQuizQuestion(
          {
            levelNumber: selectedLevel || 1,
            orderNumber: formOrder,
            questionText: formText,
            questionAmharic: formAmharic,
            options: formOptions,
            correctOptionIndex: formCorrectIndex,
            category: formCategory,
            difficulty: formDifficulty,
            explanation: formExplanation,
          },
          formReason
        );
      }
      setIsEditorOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Section 17: Explicit confirmation before publishing changes
  const handlePublishPrompt = (q: QuizQuestion) => {
    setConfirmState({
      isOpen: true,
      title: 'Publish Question to Live Service',
      actionName: `Publish Question #${q.orderNumber} in Level ${q.levelNumber}`,
      currentValue: q.status,
      newValue: 'PUBLISHED',
      warningNote:
        'This question will immediately appear to live players taking the Football Quiz and Daily Challenges.',
      actionFn: async (reason: string) => {
        await api.setQuestionStatus(q.id, 'PUBLISHED', reason);
        setPreviewQuestion(null);
        await loadData();
      },
    });
  };

  const handleDeactivate = (q: QuizQuestion) => {
    setConfirmState({
      isOpen: true,
      title: 'Deactivate Question',
      actionName: `Set Question #${q.orderNumber} to INACTIVE`,
      currentValue: q.status,
      newValue: 'INACTIVE',
      warningNote: 'This removes the question from the active game pool without deleting historical records.',
      danger: true,
      actionFn: async (reason: string) => {
        await api.setQuestionStatus(q.id, 'INACTIVE', reason);
        await loadData();
      },
    });
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-blue-700" />
            <span>Football Quiz Content & Levels</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Safely manage trivia question banks, review drafts, and publish verified football questions.
          </p>
        </div>

        {canEdit && (
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-blue-800 text-white rounded-lg text-xs font-semibold hover:bg-blue-900 shadow-xs transition-colors flex items-center space-x-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Draft Question</span>
          </button>
        )}
      </div>

      {/* Quiz Levels Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {levels.map((lvl) => {
          const isSelected = selectedLevel === lvl.levelNumber;
          return (
            <div
              key={lvl.id}
              onClick={() => setSelectedLevel(lvl.levelNumber)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-blue-50/70 border-blue-500 shadow-xs ring-1 ring-blue-500'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-blue-900">
                  Level {lvl.levelNumber}
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                  {lvl.publishedQuestionsCount} published
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mt-1 truncate">
                {lvl.title}
              </h4>
              <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                {lvl.description}
              </p>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Pass: {lvl.requiredScore}%</span>
                <span>{lvl.pointsPerQuestion} pts/Q</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Questions Filter Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-2 text-xs">
          <span className="font-semibold text-slate-700">Filter Status:</span>
          {['ALL', 'PUBLISHED', 'DRAFT', 'INACTIVE'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-blue-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <span className="text-xs font-mono text-slate-500">
          Showing {questions.length} Questions for Level {selectedLevel}
        </span>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {questions.length > 0 ? (
          questions.map((q) => (
            <div
              key={q.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-blue-900">
                      Q#{q.orderNumber}
                    </span>
                    <Badge status={q.status} />
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      {q.difficulty}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Category: {q.category.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 pt-1">
                    {q.questionText}
                  </h4>
                  {q.questionAmharic && (
                    <p className="text-xs text-slate-600 font-sans">
                      {q.questionAmharic}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    onClick={() => setPreviewQuestion(q)}
                    className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded transition-colors"
                    title="Preview Question"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {canEdit && (
                    <>
                      <button
                        onClick={() => handleOpenEdit(q)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                        title="Edit Question"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {q.status !== 'PUBLISHED' && (
                        <button
                          onClick={() => handlePublishPrompt(q)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center space-x-1 shadow-2xs"
                        >
                          <Send className="w-3 h-3" />
                          <span>Publish</span>
                        </button>
                      )}

                      {q.status === 'PUBLISHED' && (
                        <button
                          onClick={() => handleDeactivate(q)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs font-semibold flex items-center space-x-1"
                        >
                          <Archive className="w-3 h-3" />
                          <span>Deactivate</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {q.options.map((opt, idx) => {
                  const isCorrect = idx === q.correctOptionIndex;
                  return (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                        isCorrect
                          ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-[10px] w-4 text-slate-400">
                          {['A', 'B', 'C', 'D'][idx]}.
                        </span>
                        <span>{opt}</span>
                      </div>
                      {isCorrect && (
                        <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-mono font-bold">
                          CORRECT
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {q.explanation && (
                <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-200">
                  <strong className="text-slate-700">Explanation:</strong> {q.explanation}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-3">
            <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-800">No Questions Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are no questions for Level {selectedLevel} with status "{statusFilter}".
            </p>
          </div>
        )}
      </div>

      {/* CREATE / EDIT QUESTION MODAL */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 text-sm">
                {editingQuestion ? 'Edit Football Quiz Question' : 'Create Draft Question'}
              </h3>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Level</label>
                  <div className="p-2 bg-slate-100 rounded border border-slate-300 font-mono font-bold">
                    Level {selectedLevel}
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Order Index</label>
                  <input
                    type="number"
                    value={formOrder}
                    onChange={(e) => setFormOrder(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Difficulty</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value as any)}
                    className="w-full border border-slate-300 rounded p-2 bg-white"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as any)}
                  className="w-full border border-slate-300 rounded p-2 bg-white"
                >
                  <option value="ETHIOPIAN_PREMIER_LEAGUE">Ethiopian Premier League</option>
                  <option value="WALIA_IBEX">Walia Ibex & National Team</option>
                  <option value="AFRICAN_FOOTBALL">African CAF & Continental</option>
                  <option value="WORLD_CUP">World Cup & Global</option>
                  <option value="EUROPEAN_LEAGUES">European Leagues</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Question Text (English) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  placeholder="e.g. Which team won the 2021 Ethiopian Premier League?"
                  className="w-full border border-slate-300 rounded p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Question Text (Amharic Translation - Optional)
                </label>
                <input
                  type="text"
                  value={formAmharic}
                  onChange={(e) => setFormAmharic(e.target.value)}
                  placeholder="የጥያቄው የአማርኛ ትርጉም..."
                  className="w-full border border-slate-300 rounded p-2.5"
                />
              </div>

              {/* 4 Options */}
              <div className="space-y-2">
                <label className="block font-semibold text-slate-700">
                  Answer Options & Correct Answer Selection <span className="text-rose-600">*</span>
                </label>
                {formOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={formCorrectIndex === idx}
                      onChange={() => setFormCorrectIndex(idx)}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="font-mono font-bold w-6 text-slate-500">
                      {['A', 'B', 'C', 'D'][idx]}:
                    </span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const copy = [...formOptions];
                        copy[idx] = e.target.value;
                        setFormOptions(copy);
                      }}
                      placeholder={`Option ${['A', 'B', 'C', 'D'][idx]}`}
                      className="flex-1 border border-slate-300 rounded p-2"
                    />
                    {formCorrectIndex === idx && (
                      <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded">
                        CORRECT
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Explanation</label>
                <textarea
                  value={formExplanation}
                  onChange={(e) => setFormExplanation(e.target.value)}
                  placeholder="Fact snippet shown to players after answer submission"
                  rows={2}
                  className="w-full border border-slate-300 rounded p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for Audit Record <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="e.g. Added historic derby question verified by sports archive"
                  rows={2}
                  className="w-full border border-slate-300 rounded p-2"
                />
              </div>
            </div>
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end space-x-2">
              <button
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium text-xs hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuestion}
                className="px-4 py-2 bg-blue-800 text-white rounded-lg font-semibold text-xs hover:bg-blue-900"
              >
                Save Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUESTION PREVIEW MODAL (Section 17 requirement: Preview before publish) */}
      {previewQuestion && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 text-sm">Question Player Preview</h3>
              <button
                onClick={() => setPreviewQuestion(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-slate-500">Level {previewQuestion.levelNumber} - Question #{previewQuestion.orderNumber}</span>
                <Badge status={previewQuestion.status} />
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="text-sm font-bold text-slate-900">{previewQuestion.questionText}</div>
                {previewQuestion.questionAmharic && (
                  <div className="text-xs text-slate-600">{previewQuestion.questionAmharic}</div>
                )}
              </div>

              <div className="space-y-2">
                {previewQuestion.options.map((opt, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border flex items-center justify-between ${
                      i === previewQuestion.correctOptionIndex
                        ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{['A', 'B', 'C', 'D'][i]}. {opt}</span>
                    {i === previewQuestion.correctOptionIndex && (
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-mono">
                        CORRECT
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {previewQuestion.explanation && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-slate-700">
                  <strong>Explanation:</strong> {previewQuestion.explanation}
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end space-x-2">
              <button
                onClick={() => setPreviewQuestion(null)}
                className="px-4 py-2 border border-slate-300 rounded text-slate-700 text-xs font-semibold hover:bg-slate-100"
              >
                Close Preview
              </button>
              {canEdit && previewQuestion.status !== 'PUBLISHED' && (
                <button
                  onClick={() => handlePublishPrompt(previewQuestion)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center space-x-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish Question</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((s) => ({ ...s, isOpen: false }))}
        onConfirm={confirmState.actionFn}
        title={confirmState.title}
        actionName={confirmState.actionName}
        currentValue={confirmState.currentValue}
        newValue={confirmState.newValue}
        warningNote={confirmState.warningNote}
        danger={confirmState.danger}
        confirmButtonText="Confirm Publish"
      />
    </div>
  );
};
