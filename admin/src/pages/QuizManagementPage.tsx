import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Upload,
  Image as ImageIcon,
  Download,
  Layers,
  ListFilter,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { QuizLevel, QuizQuestion, AdminRole, QuestionPool, QuestionStatus } from '../types';
import { api } from '../services/api';
import { ConfirmModal } from '../components/ConfirmModal';
import { QuestionSummaryCards } from '../components/question-bank/QuestionSummaryCards';
import { QuestionTabs, QuestionTabId } from '../components/question-bank/QuestionTabs';
import { QuestionFiltersBar, FilterState } from '../components/question-bank/QuestionFiltersBar';
import { QuestionTable } from '../components/question-bank/QuestionTable';
import { PaginationControls } from '../components/question-bank/PaginationControls';
import { BatchActionsToolbar } from '../components/question-bank/BatchActionsToolbar';
import { QuestionEditorModal } from '../components/question-bank/QuestionEditorModal';
import { QuestionPreviewModal } from '../components/question-bank/QuestionPreviewModal';
import { ImageLibraryModal } from '../components/question-bank/ImageLibraryModal';
import { BulkImportModal } from '../components/question-bank/BulkImportModal';
import { ExportModal } from '../components/question-bank/ExportModal';
import { INITIAL_QUESTION_BANK } from '../components/question-bank/mockQuestionBankData';

interface QuizManagementPageProps {
  currentRole: AdminRole;
}

const DEFAULT_FILTERS: FilterState = {
  search: '',
  pool: 'ALL',
  status: 'ALL',
  difficulty: 'All',
  category: 'All',
  level: 'ALL',
  imageFilter: 'ALL',
};

export const QuizManagementPage: React.FC<QuizManagementPageProps> = ({ currentRole }) => {
  // Questions and levels state
  const [levels, setLevels] = useState<QuizLevel[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  // Active view: TABLE or LEVELS_MATRIX
  const [activeView, setActiveView] = useState<'TABLE' | 'LEVELS_MATRIX'>('TABLE');

  // Tabs and Filters
  const [activeTab, setActiveTab] = useState<QuestionTabId>('ALL');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // Selection for Batch Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Pagination (Scalable for 50,000+ items)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Modals state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);

  const [previewQuestion, setPreviewQuestion] = useState<QuizQuestion | null>(null);

  const [isImageLibraryOpen, setIsImageLibraryOpen] = useState(false);
  const [isSelectingImageForEditor, setIsSelectingImageForEditor] = useState(false);
  const [selectedLibraryImage, setSelectedLibraryImage] = useState<{ url: string; altText: string } | null>(null);

  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

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

  // Load initial dataset from backend & seed with rich demo catalog
  const loadData = async () => {
    try {
      setLoading(true);
      const [lvls, serverQuestions] = await Promise.all([
        api.getQuizLevels().catch(() => []),
        api.getQuizQuestions().catch(() => []),
      ]);

      setLevels(lvls || []);

      // If server returned items, normalize and merge with rich demo questions
      if (serverQuestions && serverQuestions.length > 0) {
        const normalizedServerQs: QuizQuestion[] = serverQuestions.map((sq, idx) => ({
          ...sq,
          questionCode: sq.questionCode || `Q000${101 + idx}`,
          pool: sq.pool || (sq.levelNumber ? 'LEVEL_BASED' : 'DAILY_CHALLENGE'),
          difficulty: sq.difficulty || 'MEDIUM',
          category: sq.category ? sq.category.replace(/_/g, ' ') : 'General Football',
          status: sq.status || 'PUBLISHED',
        }));

        // Merge keeping unique IDs
        const existingIds = new Set(normalizedServerQs.map((q) => q.id));
        const additional = INITIAL_QUESTION_BANK.filter((q) => !existingIds.has(q.id));
        setQuestions([...normalizedServerQs, ...additional]);
      } else {
        setQuestions(INITIAL_QUESTION_BANK);
      }
    } catch (err: any) {
      console.error('Failed to load quiz data:', err);
      setQuestions(INITIAL_QUESTION_BANK);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Questions Memo
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // 1. Tab filter
      if (activeTab === 'LEVEL_CONTENT' && q.pool !== 'LEVEL_BASED') return false;
      if (activeTab === 'DAILY_CHALLENGE' && q.pool !== 'DAILY_CHALLENGE') return false;
      if (activeTab === 'DRAFTS' && q.status !== 'DRAFT') return false;
      if (activeTab === 'NEEDS_REVIEW' && q.status !== 'NEEDS_REVIEW' && q.status !== 'REVIEW') return false;
      if (activeTab === 'PUBLISHED' && q.status !== 'PUBLISHED') return false;
      if (activeTab === 'INACTIVE' && q.status !== 'INACTIVE') return false;

      // 2. Search filter (text, code, category, level, explanation)
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase().trim();
        const code = (q.questionCode || '').toLowerCase();
        const text = (q.questionText || '').toLowerCase();
        const amh = (q.questionAmharic || '').toLowerCase();
        const cat = (q.category || '').toLowerCase();
        const exp = (q.explanation || '').toLowerCase();
        const lvlStr = q.levelNumber ? `level ${q.levelNumber}` : '';
        const opts = (q.options || []).join(' ').toLowerCase();

        const matches =
          code.includes(query) ||
          text.includes(query) ||
          amh.includes(query) ||
          cat.includes(query) ||
          exp.includes(query) ||
          lvlStr.includes(query) ||
          opts.includes(query);

        if (!matches) return false;
      }

      // 3. Pool dropdown filter
      if (filters.pool !== 'ALL') {
        if (filters.pool === 'LEVEL_BASED' && q.pool !== 'LEVEL_BASED') return false;
        if (filters.pool === 'DAILY_CHALLENGE' && q.pool !== 'DAILY_CHALLENGE') return false;
      }

      // 4. Status dropdown filter
      if (filters.status !== 'ALL') {
        if (filters.status === 'NEEDS_REVIEW') {
          if (q.status !== 'NEEDS_REVIEW' && q.status !== 'REVIEW') return false;
        } else if (q.status !== filters.status) {
          return false;
        }
      }

      // 5. Difficulty filter
      if (filters.difficulty !== 'All') {
        if ((q.difficulty || '').toUpperCase() !== filters.difficulty.toUpperCase()) return false;
      }

      // 6. Category filter
      if (filters.category !== 'All') {
        const cleanCat = (q.category || '').toLowerCase();
        const targetCat = filters.category.toLowerCase();
        if (!cleanCat.includes(targetCat) && !targetCat.includes(cleanCat)) {
          return false;
        }
      }

      // 7. Level filter
      if (filters.level !== 'ALL') {
        const lvlNum = parseInt(filters.level, 10);
        if (q.levelNumber !== lvlNum) return false;
      }

      // 8. Image filter
      if (filters.imageFilter === 'WITH_IMAGE') {
        if (!q.imageUrl || q.imageUrl.trim() === '') return false;
      } else if (filters.imageFilter === 'WITHOUT_IMAGE') {
        if (q.imageUrl && q.imageUrl.trim() !== '') return false;
      }

      return true;
    });
  }, [questions, activeTab, filters]);

  // Reset current page when filters or tabs change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, filters, pageSize]);

  // Paginated questions slice
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuestions.slice(start, start + pageSize);
  }, [filteredQuestions, currentPage, pageSize]);

  // Summary card click handler
  const handleSummaryCardClick = (cardId: string) => {
    if (cardId === 'ALL') {
      setActiveTab('ALL');
      setFilters(DEFAULT_FILTERS);
    } else if (cardId === 'PUBLISHED') {
      setActiveTab('PUBLISHED');
      setFilters({ ...DEFAULT_FILTERS, status: 'PUBLISHED' });
    } else if (cardId === 'DRAFT') {
      setActiveTab('DRAFTS');
      setFilters({ ...DEFAULT_FILTERS, status: 'DRAFT' });
    } else if (cardId === 'NEEDS_REVIEW') {
      setActiveTab('NEEDS_REVIEW');
      setFilters({ ...DEFAULT_FILTERS, status: 'NEEDS_REVIEW' });
    } else if (cardId === 'WITHOUT_IMAGE') {
      setActiveTab('ALL');
      setFilters({ ...DEFAULT_FILTERS, imageFilter: 'WITHOUT_IMAGE' });
    }
  };

  // Row selection
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    const pageIds = paginatedQuestions.map((q) => q.id);
    const allSelectedOnPage = pageIds.every((id) => selectedIds.includes(id));
    if (allSelectedOnPage) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  // Create / Edit handlers
  const handleOpenCreate = () => {
    setEditingQuestion(null);
    setSelectedLibraryImage(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (q: QuizQuestion) => {
    setEditingQuestion(q);
    setSelectedLibraryImage(null);
    setIsEditorOpen(true);
  };

  const handleSaveQuestion = (data: Partial<QuizQuestion>, reason: string) => {
    if (editingQuestion) {
      // Update existing
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === editingQuestion.id
            ? {
                ...q,
                ...data,
                updatedAt: new Date().toISOString(),
                updatedBy: 'Admin Operator',
              }
            : q
        )
      );
    } else {
      // Create new
      const newId = `q-${Date.now()}`;
      const created: QuizQuestion = {
        id: newId,
        questionCode: data.questionCode || `Q000${Math.floor(100 + Math.random() * 900)}`,
        questionText: data.questionText || '',
        questionAmharic: data.questionAmharic,
        options: data.options || ['A', 'B', 'C', 'D'],
        correctOptionIndex: data.correctOptionIndex ?? 0,
        pool: data.pool || 'LEVEL_BASED',
        levelNumber: data.levelNumber || 1,
        orderNumber: data.orderNumber || 1,
        category: data.category || 'Ethiopian Football',
        difficulty: data.difficulty || 'MEDIUM',
        status: data.status || 'DRAFT',
        imageUrl: data.imageUrl,
        imageAlt: data.imageAlt,
        sourceReference: data.sourceReference,
        explanation: data.explanation,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: 'Admin Operator',
      };
      setQuestions((prev) => [created, ...prev]);
    }
  };

  // Status Change with Confirmation Modal
  const handlePromptStatusChange = (q: QuizQuestion, newStatus: string) => {
    const isPublishing = newStatus === 'PUBLISHED';
    setConfirmState({
      isOpen: true,
      title: isPublishing ? 'Publish Question to Live Pool' : `Update Status to ${newStatus}`,
      actionName: `Set Question [${q.questionCode || q.id}] to ${newStatus}`,
      currentValue: q.status,
      newValue: newStatus,
      warningNote: isPublishing
        ? 'This question will be immediately served to players in active competitions and challenges.'
        : undefined,
      danger: newStatus === 'INACTIVE',
      actionFn: async (reason: string) => {
        setQuestions((prev) =>
          prev.map((item) =>
            item.id === q.id
              ? {
                  ...item,
                  status: newStatus as QuestionStatus,
                  updatedAt: new Date().toISOString(),
                  updatedBy: 'Admin Operator',
                }
              : item
          )
        );
      },
    });
  };

  // Delete Question with Confirmation Modal
  const handlePromptDelete = (q: QuizQuestion) => {
    setConfirmState({
      isOpen: true,
      title: 'Delete Question Record',
      actionName: `Permanently remove [${q.questionCode || q.id}] from catalog`,
      currentValue: q.questionText,
      newValue: 'DELETED',
      warningNote: 'This action removes the question from the admin repository.',
      danger: true,
      actionFn: async (reason: string) => {
        setQuestions((prev) => prev.filter((item) => item.id !== q.id));
        setSelectedIds((prev) => prev.filter((id) => id !== q.id));
      },
    });
  };

  // Batch Status Change
  const handleBatchStatusChange = (newStatus: string) => {
    const count = selectedIds.length;
    setConfirmState({
      isOpen: true,
      title: `Batch Update ${count} Questions`,
      actionName: `Set ${count} selected questions to ${newStatus}`,
      newValue: newStatus,
      warningNote: `This will apply status "${newStatus}" to all ${count} currently selected records.`,
      danger: newStatus === 'INACTIVE',
      actionFn: async (reason: string) => {
        setQuestions((prev) =>
          prev.map((q) =>
            selectedIds.includes(q.id)
              ? {
                  ...q,
                  status: newStatus as QuestionStatus,
                  updatedAt: new Date().toISOString(),
                  updatedBy: 'Admin Operator (Batch)',
                }
              : q
          )
        );
        setSelectedIds([]);
      },
    });
  };

  // Batch Delete
  const handleBatchDelete = () => {
    const count = selectedIds.length;
    setConfirmState({
      isOpen: true,
      title: `Delete ${count} Questions`,
      actionName: `Permanently delete ${count} questions`,
      newValue: 'DELETED',
      warningNote: `Are you sure you want to delete ${count} questions from the Question Bank?`,
      danger: true,
      actionFn: async (reason: string) => {
        setQuestions((prev) => prev.filter((q) => !selectedIds.includes(q.id)));
        setSelectedIds([]);
      },
    });
  };

  // Bulk Import
  const handleImportQuestions = (newQs: QuizQuestion[], reason: string) => {
    setQuestions((prev) => [...newQs, ...prev]);
    alert(`Successfully imported ${newQs.length} questions into the catalog!`);
  };

  // Image library pick for editor
  const handleImagePickedFromLibrary = (img: any) => {
    setSelectedLibraryImage({ url: img.url, altText: img.altText });
    setIsImageLibraryOpen(false);
  };

  const selectedQuestionsList = useMemo(
    () => questions.filter((q) => selectedIds.includes(q.id)),
    [questions, selectedIds]
  );

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Bar (Section 3 & 4) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2.5">
            <BookOpen className="w-5 h-5 text-blue-700" />
            <span>Football Quiz Content & Levels</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage the question bank, levels, images, publishing status and Daily Challenge content.
          </p>
        </div>

        {/* Primary Actions (Section 4) */}
        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-3.5 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Question</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsBulkImportOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center space-x-1.5"
          >
            <Upload className="w-4 h-4 text-slate-600" />
            <span>Bulk Import</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsSelectingImageForEditor(false);
              setIsImageLibraryOpen(true);
            }}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center space-x-1.5"
          >
            <ImageIcon className="w-4 h-4 text-slate-600" />
            <span>Image Library</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExportOpen(true)}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center space-x-1.5"
            title="Export Question Catalog"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* 2. Summary Cards (Section 3) */}
      <QuestionSummaryCards
        questions={questions}
        activeFilter={filters.status !== 'ALL' ? filters.status : filters.imageFilter === 'WITHOUT_IMAGE' ? 'WITHOUT_IMAGE' : 'ALL'}
        onFilterClick={handleSummaryCardClick}
      />

      {/* View Switcher: Question Bank Table vs Level Progress Matrix */}
      <div className="flex items-center justify-between pt-1">
        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100">
          <button
            type="button"
            onClick={() => setActiveView('TABLE')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              activeView === 'TABLE'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Question Bank Workspace</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('LEVELS_MATRIX')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              activeView === 'LEVELS_MATRIX'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Levels Matrix (1–100)</span>
          </button>
        </div>

        {activeView === 'LEVELS_MATRIX' && (
          <span className="text-xs text-slate-500 font-medium">
            Progression readiness per level • Click any level to filter questions
          </span>
        )}
      </div>

      {/* 3. Levels Matrix View */}
      {activeView === 'LEVELS_MATRIX' ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Football Quiz Levels Matrix (1 to 100)
              </h3>
              <p className="text-xs text-slate-500">
                Monitor question distribution, image coverage, and publishing completion across game levels.
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-blue-50 text-blue-800 px-2.5 py-1 rounded-lg border border-blue-200">
              100 Total Levels Configured
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30, 37, 45, 50, 75, 100].map((lvlNum) => {
              const lvlQs = questions.filter((q) => q.levelNumber === lvlNum && q.pool === 'LEVEL_BASED');
              const pubCount = lvlQs.filter((q) => q.status === 'PUBLISHED').length;
              const imgCount = lvlQs.filter((q) => q.imageUrl && q.imageUrl.trim() !== '').length;

              return (
                <div
                  key={lvlNum}
                  onClick={() => {
                    setFilters({ ...DEFAULT_FILTERS, pool: 'LEVEL_BASED', level: String(lvlNum) });
                    setActiveTab('LEVEL_CONTENT');
                    setActiveView('TABLE');
                  }}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-blue-50/60 hover:border-blue-400 cursor-pointer transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-blue-900 group-hover:text-blue-700">
                      Level {lvlNum}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                      {lvlQs.length} Qs
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Published:</span>
                      <strong className="text-emerald-700 font-mono">{pubCount}</strong>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>With Image:</span>
                      <strong className="text-blue-700 font-mono">{imgCount}</strong>
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all"
                      style={{
                        width: `${lvlQs.length > 0 ? Math.min(100, Math.round((pubCount / lvlQs.length) * 100)) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 4. Main Question Bank Table View */
        <div className="space-y-4">
          {/* Question Bank Tabs (Section 5) */}
          <QuestionTabs
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              // reset specific dropdown filters when changing primary tabs
              if (tab === 'LEVEL_CONTENT') {
                setFilters((prev) => ({ ...prev, pool: 'LEVEL_BASED' }));
              } else if (tab === 'DAILY_CHALLENGE') {
                setFilters((prev) => ({ ...prev, pool: 'DAILY_CHALLENGE' }));
              }
            }}
            questions={questions}
          />

          {/* Search & Filter Bar (Section 6) */}
          <QuestionFiltersBar
            filters={filters}
            onFilterChange={setFilters}
            onReset={() => setFilters(DEFAULT_FILTERS)}
            totalFiltered={filteredQuestions.length}
            totalAll={questions.length}
          />

          {/* Question Table (Section 7 & 8) */}
          <QuestionTable
            questions={paginatedQuestions}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            onEdit={handleOpenEdit}
            onPreview={(q) => setPreviewQuestion(q)}
            onDelete={handlePromptDelete}
            onStatusChange={handlePromptStatusChange}
          />

          {/* Scalable Pagination Controls (50,000+ scaling ready) */}
          <PaginationControls
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={filteredQuestions.length}
            totalCatalogItems={questions.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      {/* Floating Batch Actions Toolbar */}
      <BatchActionsToolbar
        selectedCount={selectedIds.length}
        onClear={() => setSelectedIds([])}
        onBatchStatusChange={handleBatchStatusChange}
        onBatchDelete={handleBatchDelete}
        onBatchExport={() => setIsExportOpen(true)}
      />

      {/* Question Editor Modal (Section 9, 10, 11, 12, 13) */}
      <QuestionEditorModal
        isOpen={isEditorOpen}
        question={editingQuestion}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveQuestion}
        onOpenImageLibrary={() => {
          setIsSelectingImageForEditor(true);
          setIsImageLibraryOpen(true);
        }}
        selectedLibraryImage={selectedLibraryImage}
      />

      {/* Question Preview Modal (Section 17) */}
      <QuestionPreviewModal
        question={previewQuestion}
        onClose={() => setPreviewQuestion(null)}
        onEdit={(q) => {
          setPreviewQuestion(null);
          handleOpenEdit(q);
        }}
        onTogglePublish={(q) => {
          const nextStatus = q.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
          handlePromptStatusChange(q, nextStatus);
        }}
      />

      {/* Image Library Modal (Section 4, 13) */}
      <ImageLibraryModal
        isOpen={isImageLibraryOpen}
        onClose={() => {
          setIsImageLibraryOpen(false);
          setIsSelectingImageForEditor(false);
        }}
        isSelectingForQuestion={isSelectingImageForEditor}
        onSelectImage={handleImagePickedFromLibrary}
      />

      {/* Bulk Import Modal (Section 4) */}
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onImportQuestions={handleImportQuestions}
      />

      {/* Export Modal (Section 4) */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        filteredQuestions={filteredQuestions}
        selectedQuestions={selectedQuestionsList}
        allQuestions={questions}
      />

      {/* Confirmation Audit Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        actionName={confirmState.actionName}
        currentValue={confirmState.currentValue}
        newValue={confirmState.newValue}
        warningNote={confirmState.warningNote}
        danger={confirmState.danger}
        onConfirm={confirmState.actionFn}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
