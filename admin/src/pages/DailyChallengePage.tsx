import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  Play,
  Pause,
  StopCircle,
  Settings2,
  Award,
  Users,
  Trophy,
  CheckCircle2,
  AlertCircle,
  Edit,
} from 'lucide-react';
import { DailyChallenge, DailyChallengeParticipant, PrizeRankRule, AdminRole } from '../types';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import { ConfirmModal } from '../components/ConfirmModal';

interface DailyChallengePageProps {
  currentRole: AdminRole;
}

export const DailyChallengePage: React.FC<DailyChallengePageProps> = ({ currentRole }) => {
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<DailyChallenge | null>(null);
  const [participants, setParticipants] = useState<DailyChallengeParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
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

  // Edit / Form state
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formTitle, setFormTitle] = useState('Today Football Challenge');
  const [formStartTime, setFormStartTime] = useState('06:00');
  const [formEndTime, setFormEndTime] = useState('23:59');
  const [formLevel, setFormLevel] = useState('lvl-1');
  const [formQuestions, setFormQuestions] = useState(10);
  const [formTimeLimit, setFormTimeLimit] = useState(120);
  const [formMinScore, setFormMinScore] = useState(70);
  const [formEligibility, setFormEligibility] = useState('Requires active 2 Birr daily subscription to 9401.');
  const [editingPrizeRules, setEditingPrizeRules] = useState<PrizeRankRule[]>([]);
  const [formReason, setFormReason] = useState('');

  const canEdit = currentRole === 'SUPER_ADMIN' || currentRole === 'OPERATIONS_ADMIN';

  const loadChallenges = async () => {
    try {
      setLoading(true);
      const list = await api.getDailyChallenges();
      setChallenges(list);
      if (list.length > 0) {
        const target = selectedChallenge ? list.find((c) => c.id === selectedChallenge.id) || list[0] : list[0];
        setSelectedChallenge(target);
        const details = await api.getDailyChallengeDetails(target.id);
        setParticipants(details.participants || []);
      } else {
        setSelectedChallenge(null);
        setParticipants([]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChallenges();
  }, []);

  const handleSelectChallenge = async (ch: DailyChallenge) => {
    setSelectedChallenge(ch);
    try {
      const details = await api.getDailyChallengeDetails(ch.id);
      setParticipants(details.participants || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleStatusChange = (newStatus: 'OPEN' | 'PAUSED' | 'CLOSED') => {
    if (!selectedChallenge) return;
    setConfirmState({
      isOpen: true,
      title: `Update Challenge Status`,
      actionName: `Set Status to ${newStatus}`,
      currentValue: selectedChallenge.status,
      newValue: newStatus,
      danger: newStatus === 'CLOSED',
      warningNote:
        newStatus === 'CLOSED'
          ? 'Closing the challenge will lock today\'s submissions and calculate final daily rank prizes.'
          : undefined,
      actionFn: async (reason: string) => {
        await api.updateDailyStatus(selectedChallenge.id, newStatus, reason);
        await loadChallenges();
      },
    });
  };

  const openConfigModal = (challengeToEdit?: DailyChallenge) => {
    if (challengeToEdit) {
      setFormDate(challengeToEdit.date);
      setFormTitle(challengeToEdit.title);
      setFormStartTime(challengeToEdit.startTime);
      setFormEndTime(challengeToEdit.endTime);
      setFormLevel(challengeToEdit.quizLevelId);
      setFormQuestions(challengeToEdit.totalQuestions);
      setFormTimeLimit(challengeToEdit.timeLimitSeconds);
      setFormMinScore(challengeToEdit.minPassingScore);
      setFormEligibility(challengeToEdit.eligibilityNotes);
    } else {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      setFormDate(tomorrow);
      setFormTitle('Daily Premier League Trivia');
      setFormStartTime('06:00');
      setFormEndTime('23:59');
      setFormLevel('lvl-1');
      setFormQuestions(10);
      setFormTimeLimit(120);
      setFormMinScore(70);
      setFormEligibility('Requires active 2 Birr daily subscription to 9401.');
    }
    setFormReason('');
    setIsConfigModalOpen(true);
  };

  const saveChallengeConfig = async () => {
    if (!formReason.trim()) {
      alert('Please provide an operational reason for the change.');
      return;
    }
    try {
      await api.saveDailyChallenge(
        {
          id: selectedChallenge?.date === formDate ? selectedChallenge.id : undefined,
          date: formDate,
          title: formTitle,
          startTime: formStartTime,
          endTime: formEndTime,
          quizLevelId: formLevel,
          totalQuestions: Number(formQuestions),
          timeLimitSeconds: Number(formTimeLimit),
          minPassingScore: Number(formMinScore),
          eligibilityNotes: formEligibility,
        },
        formReason
      );
      setIsConfigModalOpen(false);
      await loadChallenges();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openPrizeModal = () => {
    if (!selectedChallenge) return;
    setEditingPrizeRules([...selectedChallenge.prizeRules]);
    setFormReason('');
    setIsPrizeModalOpen(true);
  };

  const savePrizeRules = async () => {
    if (!selectedChallenge) return;
    if (!formReason.trim()) {
      alert('Please provide an operational reason for changing prize values.');
      return;
    }
    try {
      await api.updateDailyPrizeRules(selectedChallenge.id, editingPrizeRules, formReason);
      setIsPrizeModalOpen(false);
      await loadChallenges();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <CalendarDays className="w-5 h-5 text-blue-700" />
            <span>Daily Challenge Operations</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure daily quiz schedules, status lifecycle, prize allocations per rank, and review participant results.
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => openConfigModal()}
            className="px-4 py-2 bg-blue-800 text-white rounded-lg text-xs font-semibold hover:bg-blue-900 shadow-xs transition-colors flex items-center space-x-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create / Schedule Challenge</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Challenge Selector Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {challenges.map((c) => (
          <button
            key={c.id}
            onClick={() => handleSelectChallenge(c)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center space-x-2 ${
              selectedChallenge?.id === c.id
                ? 'bg-blue-900 text-white font-semibold shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>{c.date}</span>
            <Badge status={c.status} size="sm" />
          </button>
        ))}
      </div>

      {/* Main Selected Challenge Details */}
      {selectedChallenge ? (
        <div className="space-y-6">
          {/* Status & Action Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-bold text-slate-900">{selectedChallenge.title}</h3>
                <Badge status={selectedChallenge.status} size="md" />
              </div>
              <div className="text-xs text-slate-500 font-mono flex items-center space-x-4">
                <span>Date: <strong className="text-slate-800">{selectedChallenge.date}</strong></span>
                <span>Active Window: <strong className="text-slate-800">{selectedChallenge.startTime} - {selectedChallenge.endTime}</strong></span>
                <span>Questions: <strong className="text-slate-800">{selectedChallenge.totalQuestions}</strong></span>
                <span>Time Limit: <strong className="text-slate-800">{selectedChallenge.timeLimitSeconds}s</strong></span>
              </div>
            </div>

            {/* Lifecycle Controls */}
            {canEdit && (
              <div className="flex items-center space-x-2 shrink-0">
                {selectedChallenge.status !== 'OPEN' && (
                  <button
                    onClick={() => handleStatusChange('OPEN')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Open Challenge</span>
                  </button>
                )}
                {selectedChallenge.status === 'OPEN' && (
                  <button
                    onClick={() => handleStatusChange('PAUSED')}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </button>
                )}
                {selectedChallenge.status !== 'CLOSED' && (
                  <button
                    onClick={() => handleStatusChange('CLOSED')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
                  >
                    <StopCircle className="w-3.5 h-3.5" />
                    <span>Close</span>
                  </button>
                )}
                <button
                  onClick={() => openConfigModal(selectedChallenge)}
                  className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit Config</span>
                </button>
              </div>
            )}
          </div>

          {/* Performance Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 uppercase font-mono">Participants</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {selectedChallenge.participantsCount.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Attempted today</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 uppercase font-mono">Completed</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {selectedChallenge.completedCount.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Finished all questions</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 uppercase font-mono">Highest Score</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1">
                {selectedChallenge.topScore} pts
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Top accuracy today</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 uppercase font-mono">Prize Pool</div>
              <div className="text-2xl font-bold text-blue-900 mt-1">
                {selectedChallenge.prizeRules.reduce((sum, r) => sum + r.prizeAmountBirr, 0).toLocaleString()} ETB
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">{selectedChallenge.prizeRules.length} reward positions</div>
            </div>
          </div>

          {/* Configured Prize Rules Section (Section 9: Configurable, not hard-coded) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Daily Challenge Prize Configuration
                </h3>
                <p className="text-xs text-slate-500">
                  Prize values configured per rank without database editing
                </p>
              </div>
              {canEdit && (
                <button
                  onClick={openPrizeModal}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-800 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center space-x-1.5"
                >
                  <Settings2 className="w-3.5 h-3.5 text-blue-700" />
                  <span>Configure Prize Ranks</span>
                </button>
              )}
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                {selectedChallenge.prizeRules.map((rule) => (
                  <div
                    key={rule.rank}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>{rule.label}</span>
                      <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                        Rank {rule.rank}
                      </span>
                    </div>
                    <div className="text-lg font-bold text-slate-900 font-mono">
                      {rule.prizeAmountBirr.toLocaleString()} ETB
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      Type: <span className="text-slate-800 font-semibold">{rule.prizeType}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate" title={rule.description}>
                      {rule.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Results & Leaderboard Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Participant Rankings & Results
                </h3>
                <p className="text-xs text-slate-500">
                  Scores, time spent, and assigned daily prizes
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500">
                {participants.length} Submissions
              </span>
            </div>

            <div className="overflow-x-auto">
              {participants.length > 0 ? (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono">
                    <tr>
                      <th className="px-6 py-3">Rank</th>
                      <th className="px-6 py-3">Player (MSISDN)</th>
                      <th className="px-6 py-3">Score</th>
                      <th className="px-6 py-3">Time</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Eligible</th>
                      <th className="px-6 py-3">Prize Assigned</th>
                      <th className="px-6 py-3">Submitted At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {participants.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-3.5 font-bold font-mono text-slate-900">
                          #{p.rank}
                        </td>
                        <td className="px-6 py-3.5 font-mono text-slate-800 font-medium">
                          {p.maskedMsisdn}
                        </td>
                        <td className="px-6 py-3.5 font-bold font-mono text-emerald-700">
                          {p.score} pts
                        </td>
                        <td className="px-6 py-3.5 text-slate-600 font-mono">
                          {p.timeSpentSeconds}s
                        </td>
                        <td className="px-6 py-3.5">
                          {p.completed ? (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-emerald-200">
                              Completed
                            </span>
                          ) : (
                            <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                              Partial
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3.5">
                          {p.eligibleForPrize ? (
                            <span className="text-emerald-700 font-medium flex items-center space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Yes</span>
                            </span>
                          ) : (
                            <span className="text-rose-600 font-medium">Ineligible</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 font-mono font-bold text-slate-900">
                          {p.prizeAssignedBirr > 0 ? (
                            <span className="text-blue-900">
                              {p.prizeAssignedBirr.toLocaleString()} ETB
                              {p.isOverride && <span className="ml-1 text-[10px] text-amber-600 font-normal">(Override)</span>}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">--</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-slate-400 font-mono">
                          {new Date(p.submittedAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No participant results found for this daily challenge.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-3">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800">No Daily Challenges Configured</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            There are currently no daily challenges stored. Authorized administrators can schedule a new challenge.
          </p>
          {canEdit && (
            <button
              onClick={() => openConfigModal()}
              className="px-4 py-2 bg-blue-800 text-white rounded-lg text-xs font-semibold hover:bg-blue-900 transition-colors"
            >
              Create First Daily Challenge
            </button>
          )}
        </div>
      )}

      {/* EDIT CONFIG MODAL */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 text-sm">
                Configure Daily Challenge Parameters
              </h3>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Challenge Date</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Challenge Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Time (HH:mm)</label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Time (HH:mm)</label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Questions</label>
                  <input
                    type="number"
                    value={formQuestions}
                    onChange={(e) => setFormQuestions(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Time Limit (sec)</label>
                  <input
                    type="number"
                    value={formTimeLimit}
                    onChange={(e) => setFormTimeLimit(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min Passing Pts</label>
                  <input
                    type="number"
                    value={formMinScore}
                    onChange={(e) => setFormMinScore(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Eligibility Rule</label>
                <input
                  type="text"
                  value={formEligibility}
                  onChange={(e) => setFormEligibility(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for Audit Record <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="e.g. Schedule updated per daily tournament rotation"
                  rows={2}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>
            </div>
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end space-x-2">
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium text-xs hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={saveChallengeConfig}
                className="px-4 py-2 bg-blue-800 text-white rounded-lg font-semibold text-xs hover:bg-blue-900"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIGURE PRIZE RULES MODAL */}
      {isPrizeModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 text-sm">
                Configure Daily Challenge Prize Ranks
              </h3>
              <button
                onClick={() => setIsPrizeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs max-h-[60vh] overflow-y-auto">
              <div className="text-slate-500">
                Define the prize amount in ETB and disbursement type for each rank position. Do not hard-code amounts.
              </div>

              {editingPrizeRules.map((rule, index) => (
                <div key={rule.rank} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between font-semibold text-slate-800">
                    <span>Rank {rule.rank} ({rule.label})</span>
                    <span className="text-[10px] font-mono text-blue-700">Position #{rule.rank}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase font-mono text-slate-500">Prize (ETB)</label>
                      <input
                        type="number"
                        value={rule.prizeAmountBirr}
                        onChange={(e) => {
                          const updated = [...editingPrizeRules];
                          updated[index].prizeAmountBirr = Number(e.target.value);
                          setEditingPrizeRules(updated);
                        }}
                        className="w-full border border-slate-300 rounded p-1.5 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-mono text-slate-500">Disbursement Type</label>
                      <select
                        value={rule.prizeType}
                        onChange={(e) => {
                          const updated = [...editingPrizeRules];
                          updated[index].prizeType = e.target.value as any;
                          setEditingPrizeRules(updated);
                        }}
                        className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white"
                      >
                        <option value="AIRTIME">Ethio Telecom Airtime</option>
                        <option value="TELEBIRR_CASH">Telebirr Cash</option>
                        <option value="MERCHANDISE">Merchandise</option>
                        <option value="SPECIAL">Special</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for Audit Record <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="e.g. Updated 1st place prize to 1,000 ETB per new VAS promotion agreement"
                  rows={2}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>
            </div>
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end space-x-2">
              <button
                onClick={() => setIsPrizeModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium text-xs hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={savePrizeRules}
                className="px-4 py-2 bg-blue-800 text-white rounded-lg font-semibold text-xs hover:bg-blue-900"
              >
                Save Prize Rules
              </button>
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
        confirmButtonText="Confirm Status Update"
      />
    </div>
  );
};
