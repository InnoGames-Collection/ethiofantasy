import React, { useState } from 'react';
import {
  X,
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  Download,
  Copy,
  Layers,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { QuizQuestion, QuestionPool, QuestionStatus } from '../../types';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportQuestions: (newQuestions: QuizQuestion[], reason: string) => void;
}

interface ParsedRow {
  index: number;
  questionCode?: string;
  questionText: string;
  questionAmharic?: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  category: string;
  difficulty: string;
  pool: QuestionPool;
  levelNumber?: number;
  explanation?: string;
  imageUrl?: string;
  sourceReference?: string;
  isValid: boolean;
  errors: string[];
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onImportQuestions,
}) => {
  const [step, setStep] = useState<'INPUT' | 'VALIDATION'>('INPUT');
  const [format, setFormat] = useState<'CSV' | 'JSON'>('CSV');
  const [rawText, setRawText] = useState('');
  const [defaultPool, setDefaultPool] = useState<QuestionPool>('LEVEL_BASED');
  const [defaultLevel, setDefaultLevel] = useState<number>(1);
  const [defaultStatus, setDefaultStatus] = useState<QuestionStatus>('DRAFT');
  const [reason, setReason] = useState('Bulk question catalog import via operator portal');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);

  if (!isOpen) return null;

  const sampleCsv = `Question Text,Option A,Option B,Option C,Option D,Correct (A/B/C/D),Category,Difficulty,Pool,Level,Explanation
Which country won the 1998 FIFA World Cup?,France,Brazil,Italy,Germany,A,World Cup,EASY,LEVEL_BASED,1,France defeated Brazil 3-0 in Paris
Who is the all-time top scorer for the Ethiopian national team?,Getaneh Kebede,Saladin Said,Mengistu Worku,Adane Girma,A,Ethiopian Football,MEDIUM,LEVEL_BASED,1,Getaneh Kebede scored over 30 international goals
Which club won the UEFA Champions League in 2023?,Manchester City,Inter Milan,Real Madrid,Bayern Munich,A,Champions League,EASY,DAILY_CHALLENGE,,Rodri scored the winning goal in Istanbul`;

  const sampleJson = `[
  {
    "questionText": "Which country won the 1998 FIFA World Cup?",
    "options": ["France", "Brazil", "Italy", "Germany"],
    "correctAnswer": "A",
    "category": "World Cup",
    "difficulty": "EASY",
    "pool": "LEVEL_BASED",
    "levelNumber": 1,
    "explanation": "France defeated Brazil 3-0 in Paris"
  }
]`;

  const handleCopySample = () => {
    navigator.clipboard?.writeText(format === 'CSV' ? sampleCsv : sampleJson);
    alert('Sample template copied to clipboard!');
  };

  const handleLoadSample = () => {
    setRawText(format === 'CSV' ? sampleCsv : sampleJson);
  };

  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let insideQuote = false;
    let entry = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        result.push(entry.trim());
        entry = '';
      } else {
        entry += char;
      }
    }
    result.push(entry.trim());
    return result;
  };

  const handleProcessInput = () => {
    if (!rawText.trim()) {
      alert('Please enter or paste question records to import.');
      return;
    }

    const rows: ParsedRow[] = [];

    if (format === 'CSV') {
      const lines = rawText
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      // Check if first row is header
      const startIndex = lines[0].toLowerCase().includes('question') ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const parts = parseCsvLine(lines[i]);
        const errors: string[] = [];

        const questionText = parts[0] || '';
        const optionA = parts[1] || '';
        const optionB = parts[2] || '';
        const optionC = parts[3] || '';
        const optionD = parts[4] || '';
        const rawCorrect = (parts[5] || 'A').toUpperCase().trim();
        const category = parts[6] || 'General Football';
        const difficulty = (parts[7] || 'MEDIUM').toUpperCase().trim();
        const rowPool = (parts[8] || defaultPool) as QuestionPool;
        const level = parts[9] ? parseInt(parts[9], 10) : defaultLevel;
        const explanation = parts[10] || '';

        if (!questionText) errors.push('Missing question text');
        if (!optionA || !optionB || !optionC || !optionD) {
          errors.push('Missing 1 or more options (all 4 required)');
        }
        if (!['A', 'B', 'C', 'D'].includes(rawCorrect)) {
          errors.push(`Invalid correct answer "${rawCorrect}" (must be A, B, C, or D)`);
        }

        rows.push({
          index: i + 1,
          questionText,
          optionA,
          optionB,
          optionC,
          optionD,
          correctAnswer: (['A', 'B', 'C', 'D'].includes(rawCorrect) ? rawCorrect : 'A') as any,
          category,
          difficulty,
          pool: rowPool === 'DAILY_CHALLENGE' ? 'DAILY_CHALLENGE' : 'LEVEL_BASED',
          levelNumber: level,
          explanation,
          isValid: errors.length === 0,
          errors,
        });
      }
    } else {
      // JSON
      try {
        const parsed = JSON.parse(rawText);
        const list = Array.isArray(parsed) ? parsed : [parsed];

        list.forEach((item, idx) => {
          const errors: string[] = [];
          const qText = item.questionText || '';
          const opts = item.options || [];
          const optA = opts[0] || item.optionA || '';
          const optB = opts[1] || item.optionB || '';
          const optC = opts[2] || item.optionC || '';
          const optD = opts[3] || item.optionD || '';
          const corr = (item.correctAnswer || 'A').toUpperCase();

          if (!qText) errors.push('Missing question text');
          if (!optA || !optB || !optC || !optD) errors.push('All 4 options required');
          if (!['A', 'B', 'C', 'D'].includes(corr)) errors.push('Correct answer must be A/B/C/D');

          rows.push({
            index: idx + 1,
            questionText: qText,
            optionA: optA,
            optionB: optB,
            optionC: optC,
            optionD: optD,
            correctAnswer: (['A', 'B', 'C', 'D'].includes(corr) ? corr : 'A') as any,
            category: item.category || 'General Football',
            difficulty: item.difficulty || 'MEDIUM',
            pool: item.pool || defaultPool,
            levelNumber: item.levelNumber || defaultLevel,
            explanation: item.explanation || '',
            imageUrl: item.imageUrl || '',
            sourceReference: item.sourceReference || '',
            isValid: errors.length === 0,
            errors,
          });
        });
      } catch (err: any) {
        alert(`Invalid JSON format: ${err.message}`);
        return;
      }
    }

    if (rows.length === 0) {
      alert('No rows could be identified in input data.');
      return;
    }

    setParsedRows(rows);
    setStep('VALIDATION');
  };

  const validRows = parsedRows.filter((r) => r.isValid);
  const invalidRows = parsedRows.filter((r) => !r.isValid);

  const handleConfirmImport = () => {
    if (validRows.length === 0) {
      alert('No valid questions to import.');
      return;
    }

    const converted: QuizQuestion[] = validRows.map((r, i) => {
      const charIndex = { A: 0, B: 1, C: 2, D: 3 }[r.correctAnswer] ?? 0;
      const code = `Q000${Math.floor(200 + Math.random() * 800)}`;
      return {
        id: `q-bulk-${Date.now()}-${i}`,
        questionCode: code,
        questionText: r.questionText,
        options: [r.optionA, r.optionB, r.optionC, r.optionD],
        correctOptionIndex: charIndex,
        category: r.category,
        difficulty: r.difficulty,
        pool: r.pool,
        levelNumber: r.pool === 'LEVEL_BASED' ? r.levelNumber || defaultLevel : undefined,
        orderNumber: i + 1,
        status: defaultStatus,
        explanation: r.explanation,
        imageUrl: r.imageUrl,
        sourceReference: r.sourceReference,
        updatedAt: new Date().toISOString(),
        updatedBy: 'Admin Operator (Bulk)',
      };
    });

    onImportQuestions(converted, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold tracking-tight">Bulk Question Importer</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                  CSV / JSON PIPELINE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Batch ingest football trivia questions for Level progression or Daily Challenge pools.
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

        {/* Step 1: Input & Configuration */}
        {step === 'INPUT' ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-slate-700">
            {/* Format and Preset Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-700">Format:</span>
                <button
                  type="button"
                  onClick={() => setFormat('CSV')}
                  className={`px-3 py-1 rounded-md font-semibold text-xs transition-colors ${
                    format === 'CSV'
                      ? 'bg-blue-900 text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  CSV (Comma-Separated)
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('JSON')}
                  className={`px-3 py-1 rounded-md font-semibold text-xs transition-colors ${
                    format === 'JSON'
                      ? 'bg-blue-900 text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  JSON (Array)
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-md font-semibold text-xs transition-colors flex items-center space-x-1"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Insert Sample</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopySample}
                  className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-md font-semibold text-xs transition-colors flex items-center space-x-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Template</span>
                </button>
              </div>
            </div>

            {/* Default Import Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50/70 border border-slate-200 rounded-xl">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Default Target Pool
                </label>
                <select
                  value={defaultPool}
                  onChange={(e) => setDefaultPool(e.target.value as QuestionPool)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                >
                  <option value="LEVEL_BASED">Level-Based</option>
                  <option value="DAILY_CHALLENGE">Daily Challenge</option>
                </select>
              </div>

              {defaultPool === 'LEVEL_BASED' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Default Level (if unassigned)
                  </label>
                  <select
                    value={defaultLevel}
                    onChange={(e) => setDefaultLevel(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    {[1, 2, 3, 4, 5, 10, 25, 37, 50].map((lvl) => (
                      <option key={lvl} value={lvl}>
                        Level {lvl}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Initial Status
                </label>
                <select
                  value={defaultStatus}
                  onChange={(e) => setDefaultStatus(e.target.value as QuestionStatus)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                >
                  <option value="DRAFT">Draft (Recommended for verification)</option>
                  <option value="NEEDS_REVIEW">Needs Review</option>
                  <option value="PUBLISHED">Published (Direct live)</option>
                </select>
              </div>
            </div>

            {/* Paste Area */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                PASTE {format} CONTENT OR DRAG-AND-DROP FILE
              </label>
              <textarea
                rows={10}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={
                  format === 'CSV'
                    ? 'Paste CSV text here...\nQuestion Text,Option A,Option B,Option C,Option D,Correct (A/B/C/D),Category,Difficulty'
                    : 'Paste JSON array here...'
                }
                className="w-full p-3 bg-slate-900 text-slate-100 font-mono text-xs rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            {/* Operational Reason */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                OPERATIONAL AUDIT REASON <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
              />
            </div>
          </div>
        ) : (
          /* Step 2: Validation Preview */
          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-slate-700">
            {/* Validation Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold font-mono text-base">
                  {validRows.length}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {validRows.length} questions ready to import
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Total parsed: {parsedRows.length} rows • Valid: {validRows.length} • Errors: {invalidRows.length}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep('INPUT')}
                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold text-xs flex items-center space-x-1.5 self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Adjust Raw Input</span>
              </button>
            </div>

            {/* Invalid Rows Warning */}
            {invalidRows.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
                <span className="font-bold flex items-center space-x-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>{invalidRows.length} rows have validation issues and will be skipped</span>
                </span>
                <ul className="list-disc list-inside text-[11px] text-amber-800 pl-2">
                  {invalidRows.slice(0, 3).map((r) => (
                    <li key={r.index}>
                      Row #{r.index}: {r.errors.join(', ')}
                    </li>
                  ))}
                  {invalidRows.length > 3 && (
                    <li>...and {invalidRows.length - 3} more invalid rows</li>
                  )}
                </ul>
              </div>
            )}

            {/* Preview Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 sticky top-0 text-[10px] uppercase font-bold text-slate-600">
                    <tr>
                      <th className="py-2 px-3 w-12 text-center">Row</th>
                      <th className="py-2 px-3">Question</th>
                      <th className="py-2 px-3 w-20 text-center">Correct</th>
                      <th className="py-2 px-3 w-28">Category</th>
                      <th className="py-2 px-3 w-24">Pool</th>
                      <th className="py-2 px-3 w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((r) => (
                      <tr
                        key={r.index}
                        className={r.isValid ? 'bg-white' : 'bg-rose-50/70 text-rose-900'}
                      >
                        <td className="py-2 px-3 text-center font-mono font-bold">
                          #{r.index}
                        </td>
                        <td className="py-2 px-3">
                          <p className="font-semibold line-clamp-1">{r.questionText}</p>
                          <p className="text-[10px] text-slate-500">
                            A: {r.optionA} | B: {r.optionB} | C: {r.optionC} | D: {r.optionD}
                          </p>
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-emerald-700">
                          {r.correctAnswer}
                        </td>
                        <td className="py-2 px-3">{r.category}</td>
                        <td className="py-2 px-3 font-semibold text-[10px]">
                          {r.pool === 'DAILY_CHALLENGE' ? 'DAILY' : `LVL ${r.levelNumber || 1}`}
                        </td>
                        <td className="py-2 px-3 font-bold">
                          {r.isValid ? (
                            <span className="text-emerald-600 flex items-center space-x-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Valid</span>
                            </span>
                          ) : (
                            <span className="text-rose-600">Skipped</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors"
          >
            Cancel
          </button>

          {step === 'INPUT' ? (
            <button
              type="button"
              onClick={handleProcessInput}
              className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
            >
              <span>Validate & Preview Rows</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={validRows.length === 0}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Import {validRows.length} Questions</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
