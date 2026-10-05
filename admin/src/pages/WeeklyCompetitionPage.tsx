import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Plus,
  Play,
  Pause,
  StopCircle,
  Award,
  CheckCircle,
  Lock,
  Edit3,
  AlertTriangle,
  Eye,
  EyeOff,
  Settings2,
  FileSpreadsheet,
} from 'lucide-react';
import { WeeklyCompetition, CompetitionParticipant, PrizeRankRule, AdminRole } from '../types';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import { ConfirmModal } from '../components/ConfirmModal';

interface WeeklyCompetitionPageProps {
  currentRole: AdminRole;
}

export const WeeklyCompetitionPage: React.FC<WeeklyCompetitionPageProps> = ({ currentRole }) => {
  const [competitions, setCompetitions] = useState<WeeklyCompetition[]>([]);
  const [selectedComp, setSelectedComp] = useState<WeeklyCompetition | null>(null);
  const [participants, setParticipants] = useState<CompetitionParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Unmasking state (Super Admin only)
  const [unmaskedMsisdns, setUnmaskedMsisdns] = useState<Record<string, string>>({});

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideTarget, setOverrideTarget] = useState<CompetitionParticipant | null>(null);
  const [overrideAmount, setOverrideAmount] = useState<number>(0);
  const [overrideReason, setOverrideReason] = useState('');

  // Confirmation modal state
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

  // Create form state
  const [formTitle, setFormTitle] = useState('7-Day National Championship Cup');
  const [formPeriod, setFormPeriod] = useState(`Week ${Math.ceil(new Date().getDate() / 7)} - 2026`);
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [formEndDate, setFormEndDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
  const [formReason, setFormReason] = useState('');

  const canEdit = currentRole === 'SUPER_ADMIN' || currentRole === 'OPERATIONS_ADMIN';
  const isSuperAdmin = currentRole === 'SUPER_ADMIN';

  const loadCompetitions = async () => {
    try {
      setLoading(true);
      const list = await api.getWeeklyCompetitions();
      setCompetitions(list);
      if (list.length > 0) {
        const target = selectedComp ? list.find((c) => c.id === selectedComp.id) || list[0] : list[0];
        setSelectedComp(target);
        const details = await api.getWeeklyCompetitionDetails(target.id);
        setParticipants(details.participants || []);
      } else {
        setSelectedComp(null);
        setParticipants([]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompetitions();
  }, []);

  const handleSelectComp = async (comp: WeeklyCompetition) => {
    setSelectedComp(comp);
    try {
      const details = await api.getWeeklyCompetitionDetails(comp.id);
      setParticipants(details.participants || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleStatusChange = (newStatus: 'ACTIVE' | 'PAUSED' | 'CLOSED') => {
    if (!selectedComp) return;
    setConfirmState({
      isOpen: true,
      title: `Update Competition Status`,
      actionName: `Set Status to ${newStatus}`,
      currentValue: selectedComp.status,
      newValue: newStatus,
      danger: newStatus === 'CLOSED',
      warningNote:
        newStatus === 'CLOSED'
          ? 'Closing the competition halts new weekly score accumulation and enables winner finalization.'
          : undefined,
      actionFn: async (reason: string) => {
        await api.updateWeeklyStatus(selectedComp.id, newStatus, reason);
        await loadCompetitions();
      },
    });
  };

  const handleFinalizeWinners = () => {
    if (!selectedComp) return;
    setConfirmState({
      isOpen: true,
      title: 'Finalize Official Winners & Lock Prize Allocation',
      actionName: 'Finalize Winners for 7-Day Competition',
      currentValue: selectedComp.status,
      newValue: 'FINALIZED',
      warningNote:
        'CRITICAL: Finalizing locks winner records from ordinary changes. Grand cash and airtime prizes will be permanently assigned for Telebirr disbursement. Any subsequent modification requires an explicit administrative override.',
      danger: true,
      actionFn: async (reason: string) => {
        await api.finalizeWeeklyWinners(selectedComp.id, reason);
        await loadCompetitions();
      },
    });
  };

  const handleUnmask = async (participant: CompetitionParticipant) => {
    if (!isSuperAdmin) {
      alert('Only Super Admin role is authorized to unmask subscriber MSISDNs.');
      return;
    }
    const reason = prompt(`Super Admin Audit Required: Enter reason for viewing unmasked MSISDN for Rank #${participant.rank}:`);
    if (!reason || reason.trim().length < 4) {
      alert('Operational reason is required for MSISDN unmask audit log.');
      return;
    }
    try {
      const res = await api.unmaskMsisdn(participant.playerId, reason);
      setUnmaskedMsisdns((prev) => ({ ...prev, [participant.id]: res.fullMsisdn }));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenOverrideModal = (participant: CompetitionParticipant) => {
    if (!isSuperAdmin) {
      alert('Only Super Admin can execute post-finalization prize overrides.');
      return;
    }
    setOverrideTarget(participant);
    setOverrideAmount(participant.prizeAssignedBirr);
    setOverrideReason('');
    setIsOverrideModalOpen(true);
  };

  const handleSaveOverride = async () => {
    if (!selectedComp || !overrideTarget) return;
    if (!overrideReason.trim() || overrideReason.trim().length < 4) {
      alert('Please provide a detailed approval justification for this administrative prize override.');
      return;
    }
    try {
      await api.overrideParticipantPrize(selectedComp.id, overrideTarget.id, overrideAmount, overrideReason);
      setIsOverrideModalOpen(false);
      await loadCompetitions();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateComp = async () => {
    if (!formReason.trim()) {
      alert('Operational reason is required.');
      return;
    }
    try {
      await api.saveWeeklyCompetition(
        {
          title: formTitle,
          periodLabel: formPeriod,
          startDate: formStartDate,
          endDate: formEndDate,
          status: 'ACTIVE',
        },
        formReason
      );
      setIsCreateModalOpen(false);
      await loadCompetitions();
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
            <Trophy className="w-5 h-5 text-amber-500" />
            <span>Weekly Competition Operations</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage 7-day tournament cycles, leaderboard rankings, prize structures, and official winner finalization.
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-800 text-white rounded-lg text-xs font-semibold hover:bg-blue-900 shadow-xs transition-colors flex items-center space-x-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create New 7-Day Period</span>
          </button>
        )}
      </div>

      {/* Competition selector pills */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {competitions.map((c) => (
          <button
            key={c.id}
            onClick={() => handleSelectComp(c)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center space-x-2 ${
              selectedComp?.id === c.id
                ? 'bg-blue-900 text-white font-semibold shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>{c.periodLabel}</span>
            <Badge status={c.status} size="sm" />
          </button>
        ))}
      </div>

      {selectedComp ? (
        <div className="space-y-6">
          {/* Main Info Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-bold text-slate-900">{selectedComp.title}</h3>
                <Badge status={selectedComp.status} size="md" />
                {selectedComp.status === 'FINALIZED' && (
                  <span className="flex items-center space-x-1 text-xs text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-medium">
                    <Lock className="w-3 h-3 text-blue-700" />
                    <span>Locked from editing</span>
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 font-mono flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>Period: <strong className="text-slate-800">{selectedComp.periodLabel}</strong></span>
                <span>Window: <strong className="text-slate-800">{selectedComp.startDate} to {selectedComp.endDate}</strong></span>
                <span>Active Participants: <strong className="text-slate-800">{selectedComp.participantsCount.toLocaleString()}</strong></span>
                {selectedComp.finalizedAt && (
                  <span className="text-emerald-700 font-semibold">
                    Finalized: {new Date(selectedComp.finalizedAt).toLocaleDateString()} by {selectedComp.finalizedBy}
                  </span>
                )}
              </div>
            </div>

            {/* Lifecycle & Winner Finalization Actions */}
            {canEdit && (
              <div className="flex items-center space-x-2 shrink-0">
                {selectedComp.status === 'ACTIVE' && (
                  <>
                    <button
                      onClick={() => handleStatusChange('PAUSED')}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause Competition</span>
                    </button>
                    <button
                      onClick={() => handleStatusChange('CLOSED')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
                    >
                      <StopCircle className="w-3.5 h-3.5" />
                      <span>Close Period</span>
                    </button>
                  </>
                )}

                {selectedComp.status === 'PAUSED' && (
                  <button
                    onClick={() => handleStatusChange('ACTIVE')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Resume Competition</span>
                  </button>
                )}

                {selectedComp.status !== 'FINALIZED' && (
                  <button
                    onClick={handleFinalizeWinners}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-200" />
                    <span>Finalize Winners</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Configured Prize Structure */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Weekly Prize Allocation Structure
                </h4>
                <p className="text-xs text-slate-500">
                  Pre-configured reward tiers for 7-day tournament winners
                </p>
              </div>
              <div className="text-xs font-mono text-blue-900 font-bold">
                Total Pool: {selectedComp.prizeRules.reduce((s, r) => s + r.prizeAmountBirr, 0).toLocaleString()} ETB
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {selectedComp.prizeRules.map((rule) => (
                <div key={rule.rank} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Rank #{rule.rank}</span>
                    <span className="text-[10px] font-mono bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                      {rule.prizeType}
                    </span>
                  </div>
                  <div className="text-base font-bold text-slate-900 font-mono">
                    {rule.prizeAmountBirr.toLocaleString()} ETB
                  </div>
                  <div className="text-[11px] text-slate-500 truncate" title={rule.description}>
                    {rule.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FINAL RANKINGS & LEADERBOARD (Top 10 Section 12) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  {selectedComp.status === 'FINALIZED' ? 'Official Final Rankings & Winners' : 'Current Top Leaderboard'}
                </h3>
                <p className="text-xs text-slate-500">
                  Authoritative player scores, verified prize eligibility, and confirmed disbursements
                </p>
              </div>
              <div className="flex items-center space-x-3 text-xs">
                {isSuperAdmin && (
                  <span className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded font-mono">
                    Super Admin Unmask Enabled
                  </span>
                )}
                <span className="text-slate-400 font-mono">
                  {participants.length} Ranked Players
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              {participants.length > 0 ? (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono">
                    <tr>
                      <th className="px-6 py-3">Rank</th>
                      <th className="px-6 py-3">Player (MSISDN)</th>
                      <th className="px-6 py-3">Weekly Score</th>
                      <th className="px-6 py-3">Days Participated</th>
                      <th className="px-6 py-3">Time Spent</th>
                      <th className="px-6 py-3">Eligibility</th>
                      <th className="px-6 py-3">Assigned Prize</th>
                      <th className="px-6 py-3">Prize Status</th>
                      {isSuperAdmin && <th className="px-6 py-3 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {participants.map((p) => {
                      const isUnmasked = Boolean(unmaskedMsisdns[p.id]);
                      const displayMsisdn = isUnmasked ? unmaskedMsisdns[p.id] : p.maskedMsisdn;

                      return (
                        <tr
                          key={p.id}
                          className={`hover:bg-slate-50/60 transition-colors ${
                            p.rank <= 3 ? 'bg-amber-50/20' : ''
                          }`}
                        >
                          <td className="px-6 py-3.5 font-bold font-mono text-slate-900">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                              p.rank === 1
                                ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300'
                                : p.rank === 2
                                ? 'bg-slate-200 text-slate-800 font-bold'
                                : p.rank === 3
                                ? 'bg-amber-50 text-amber-800'
                                : 'text-slate-600'
                            }`}>
                              #{p.rank}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 font-mono text-slate-800 font-medium">
                            <div className="flex items-center space-x-2">
                              <span>{displayMsisdn}</span>
                              {isSuperAdmin && (
                                <button
                                  onClick={() => handleUnmask(p)}
                                  title="Unmask full MSISDN with audit log"
                                  className="text-slate-400 hover:text-indigo-600"
                                >
                                  {isUnmasked ? <EyeOff className="w-3.5 h-3.5 text-indigo-600" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-3.5 font-bold font-mono text-emerald-700">
                            {p.score} pts
                          </td>
                          <td className="px-6 py-3.5 font-mono text-slate-600">
                            {p.daysParticipated ?? p.levelsCompleted} / 7 days
                          </td>
                          <td className="px-6 py-3.5 font-mono text-slate-500">
                            {p.timeSpentSeconds}s
                          </td>
                          <td className="px-6 py-3.5">
                            {p.eligibleForPrize ? (
                              <span className="text-emerald-700 font-medium flex items-center space-x-1">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Verified Eligible</span>
                              </span>
                            ) : (
                              <span className="text-rose-600 font-medium">Disqualified</span>
                            )}
                          </td>
                          <td className="px-6 py-3.5 font-mono font-bold text-slate-900">
                            {p.prizeAssignedBirr > 0 ? (
                              <div>
                                <span className="text-blue-900">
                                  {p.prizeAssignedBirr.toLocaleString()} ETB
                                </span>
                                {p.isOverride && (
                                  <div className="text-[10px] text-amber-600 font-normal">
                                    ★ Admin Override
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 font-normal">--</span>
                            )}
                          </td>
                          <td className="px-6 py-3.5">
                            <Badge status={p.status} />
                          </td>
                          {isSuperAdmin && (
                            <td className="px-6 py-3.5 text-right">
                              {selectedComp.status === 'FINALIZED' && (
                                <button
                                  onClick={() => handleOpenOverrideModal(p)}
                                  title="Override finalized winner prize per special telecom approval"
                                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded text-[11px] font-semibold flex items-center space-x-1 ml-auto"
                                >
                                  <Edit3 className="w-3 h-3 text-amber-700" />
                                  <span>Override Prize</span>
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No participants or scores recorded for this competition period.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-3">
          <Trophy className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800">No Weekly Competitions Configured</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Create a 7-day tournament period to start collecting participant scores and configuring weekly winner prize rules.
          </p>
          {canEdit && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-800 text-white rounded-lg text-xs font-semibold hover:bg-blue-900 transition-colors"
            >
              Create Weekly Competition
            </button>
          )}
        </div>
      )}

      {/* CREATE COMPETITION MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 text-sm">Create New 7-Day Competition Period</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Competition Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Period Label (e.g. Week 39)</label>
                <input
                  type="text"
                  value={formPeriod}
                  onChange={(e) => setFormPeriod(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for Audit Record <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="e.g. New 7-day championship period initialized for active 9401 subscribers"
                  rows={2}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>
            </div>
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end space-x-2">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium text-xs hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateComp}
                className="px-4 py-2 bg-blue-800 text-white rounded-lg font-semibold text-xs hover:bg-blue-900"
              >
                Create Competition
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERRIDE FINALIZED WINNER MODAL (Section 12: explicit administrative override requirement) */}
      {isOverrideModalOpen && overrideTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-amber-200 bg-amber-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-700" />
                <h3 className="font-semibold text-amber-900 text-sm">
                  Super Admin Winner Prize Override
                </h3>
              </div>
              <button onClick={() => setIsOverrideModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <div className="text-slate-500">Player: <strong className="text-slate-900">{overrideTarget.maskedMsisdn}</strong></div>
                <div className="text-slate-500">Rank: <strong className="text-slate-900">#{overrideTarget.rank}</strong></div>
                <div className="text-slate-500">Current Prize: <strong className="text-slate-900">{overrideTarget.prizeAssignedBirr} ETB</strong></div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  New Override Prize Amount (ETB) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  value={overrideAmount}
                  onChange={(e) => setOverrideAmount(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Audit Reason / Executive Justification <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g. Approved special award for tie-break dispute resolution by VAS Director."
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
                <span className="text-slate-400 text-[11px] mt-1 block">
                  Mandatory: records who changed it, when, old value, new value, and justification.
                </span>
              </div>
            </div>
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end space-x-2">
              <button
                onClick={() => setIsOverrideModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium text-xs hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOverride}
                className="px-4 py-2 bg-amber-700 text-white rounded-lg font-semibold text-xs hover:bg-amber-800"
              >
                Save Override & Record Audit
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
        confirmButtonText="Confirm"
      />
    </div>
  );
};
