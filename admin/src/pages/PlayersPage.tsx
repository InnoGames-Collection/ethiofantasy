import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Eye,
  EyeOff,
  Shield,
  RotateCcw,
  CheckCircle,
  AlertOctagon,
  FileSpreadsheet,
  Award,
  Calendar,
  Phone,
} from 'lucide-react';
import { Player, AdminRole } from '../types';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import { ConfirmModal } from '../components/ConfirmModal';

interface PlayersPageProps {
  currentRole: AdminRole;
}

export const PlayersPage: React.FC<PlayersPageProps> = ({ currentRole }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected player for details modal/drawer
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [playerDetails, setPlayerDetails] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Unmask cache (Super Admin)
  const [unmaskedMap, setUnmaskedMap] = useState<Record<string, string>>({});

  // Confirmation modal
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
  const isSuperAdmin = currentRole === 'SUPER_ADMIN';

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const data = await api.getPlayers(search, statusFilter);
      setPlayers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadPlayers();
  };

  const handleOpenPlayer = async (player: Player) => {
    setSelectedPlayer(player);
    try {
      setDetailsLoading(true);
      const res = await api.getPlayerDetails(player.id);
      setPlayerDetails(res);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleUnmask = async (player: Player) => {
    if (!isSuperAdmin) {
      alert('Only Super Admin is authorized to view unmasked subscriber MSISDNs.');
      return;
    }
    const reason = prompt('Super Admin Audit: Enter justification to view unmasked MSISDN:');
    if (!reason || reason.trim().length < 4) {
      alert('A valid operational reason is required for compliance logging.');
      return;
    }
    try {
      const res = await api.unmaskMsisdn(player.id, reason);
      setUnmaskedMap((prev) => ({ ...prev, [player.id]: res.fullMsisdn }));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleChangeStatus = (player: Player, newStatus: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED') => {
    setConfirmState({
      isOpen: true,
      title: `Update Player Account Status`,
      actionName: `Set Status of ${player.maskedMsisdn} to ${newStatus}`,
      currentValue: player.accountStatus,
      newValue: newStatus,
      danger: newStatus !== 'ACTIVE',
      warningNote:
        newStatus !== 'ACTIVE'
          ? 'Suspending or deactivating stops this player from entering competitions and collecting prizes.'
          : undefined,
      actionFn: async (reason: string) => {
        await api.updatePlayerStatus(player.id, newStatus, reason);
        await loadPlayers();
        if (selectedPlayer && selectedPlayer.id === player.id) {
          setSelectedPlayer({ ...selectedPlayer, accountStatus: newStatus });
        }
      },
    });
  };

  const handleResetState = (player: Player) => {
    setConfirmState({
      isOpen: true,
      title: `Reset Player Progress State`,
      actionName: `Reset Level & Weekly Score for ${player.maskedMsisdn}`,
      currentValue: `Level: ${player.currentLevel}, Score: ${player.weeklyScore}`,
      newValue: 'Level: 1, Score: 0',
      danger: true,
      warningNote: 'This clears the current tournament score and resets quiz level progression to 1.',
      actionFn: async (reason: string) => {
        await api.resetPlayerState(player.id, reason);
        await loadPlayers();
        if (selectedPlayer && selectedPlayer.id === player.id) {
          setSelectedPlayer({ ...selectedPlayer, currentLevel: 1, weeklyScore: 0 });
        }
      },
    });
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-700" />
            <span>Player Account Operations</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Query subscriber gaming profiles, inspect level completions, manage status, and audit service states.
          </p>
        </div>

        {/* Filter bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by MSISDN..."
              className="text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none w-52 font-mono"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg p-2 bg-white text-slate-700 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="DEACTIVATED">Deactivated</option>
          </select>

          <button
            type="submit"
            className="px-3.5 py-2 bg-blue-800 text-white rounded-lg text-xs font-semibold hover:bg-blue-900 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Players Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Registered Subscribers & Game State
            </h3>
            <p className="text-xs text-slate-500">
              Authoritative player records synchronized with 9401 subscriptions
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {players.length} Players Found
          </span>
        </div>

        <div className="overflow-x-auto">
          {players.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono">
                <tr>
                  <th className="px-6 py-3">Player (MSISDN)</th>
                  <th className="px-6 py-3">Account Status</th>
                  <th className="px-6 py-3">9401 Subscription</th>
                  <th className="px-6 py-3">Level</th>
                  <th className="px-6 py-3">Best Score</th>
                  <th className="px-6 py-3">7-Day Score</th>
                  <th className="px-6 py-3">Challenges</th>
                  <th className="px-6 py-3">Total Won</th>
                  <th className="px-6 py-3">Last Activity</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {players.map((p) => {
                  const isUnmasked = Boolean(unmaskedMap[p.id]);
                  const displayMsisdn = isUnmasked ? unmaskedMap[p.id] : p.maskedMsisdn;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-3.5 font-mono text-slate-900 font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleOpenPlayer(p)}
                            className="hover:text-blue-700 underline font-bold"
                          >
                            {displayMsisdn}
                          </button>
                          {isSuperAdmin && (
                            <button
                              onClick={() => handleUnmask(p)}
                              title="Unmask MSISDN with audit log"
                              className="text-slate-400 hover:text-indigo-600"
                            >
                              {isUnmasked ? (
                                <EyeOff className="w-3.5 h-3.5 text-indigo-600" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">Region: {p.telecomCircle}</div>
                      </td>
                      <td className="px-6 py-3.5">
                        <Badge status={p.accountStatus} />
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center text-[11px] font-semibold ${
                          p.subscriptionStatus === 'ACTIVE' ? 'text-emerald-700' : 'text-slate-500'
                        }`}>
                          {p.subscriptionStatus === 'ACTIVE' ? '● 2 Birr Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-mono text-slate-700">
                        Level {p.currentLevel}
                      </td>
                      <td className="px-6 py-3.5 font-mono font-bold text-slate-800">
                        {p.bestScore}
                      </td>
                      <td className="px-6 py-3.5 font-mono font-bold text-blue-900">
                        {p.weeklyScore}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-slate-600">
                        {p.dailyChallengeParticipations}
                      </td>
                      <td className="px-6 py-3.5 font-mono font-bold text-emerald-700">
                        {p.totalPrizesWonBirr > 0 ? `${p.totalPrizesWonBirr.toLocaleString()} ETB` : '--'}
                      </td>
                      <td className="px-6 py-3.5 text-slate-400 font-mono text-[11px]">
                        {new Date(p.lastActivity).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3.5 text-right space-x-2">
                        <button
                          onClick={() => handleOpenPlayer(p)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition-colors"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              No players found matching current query.
            </div>
          )}
        </div>
      </div>

      {/* CONCISE PLAYER DETAILS DRAWER/MODAL (Section 14 & 15) */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">
                  Player Operations Dossier
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  MSISDN: {unmaskedMap[selectedPlayer.id] || selectedPlayer.maskedMsisdn}
                </p>
              </div>
              <button
                onClick={() => setSelectedPlayer(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              {/* Summary KPIs */}
              <div className="grid grid-cols-4 gap-3 text-center bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Status</span>
                  <div className="mt-1"><Badge status={selectedPlayer.accountStatus} size="sm" /></div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Level</span>
                  <span className="font-bold text-slate-900 mt-1 block">Level {selectedPlayer.currentLevel}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Weekly Score</span>
                  <span className="font-bold text-blue-900 mt-1 block">{selectedPlayer.weeklyScore} pts</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Total Won</span>
                  <span className="font-bold text-emerald-700 mt-1 block">{selectedPlayer.totalPrizesWonBirr} ETB</span>
                </div>
              </div>

              {/* Subscription details */}
              <div className="p-3 border border-slate-200 rounded-lg space-y-1">
                <span className="font-bold text-slate-800 uppercase tracking-wide block">
                  Ethio Telecom 9401 Subscription
                </span>
                <div className="grid grid-cols-3 gap-2 text-slate-600 font-mono text-[11px] pt-1">
                  <div>Status: <strong className="text-slate-900">{selectedPlayer.subscriptionStatus}</strong></div>
                  <div>Tariff: <strong className="text-slate-900">2 Birr / Day</strong></div>
                  <div>Registered: <strong className="text-slate-900">{new Date(selectedPlayer.registeredAt).toLocaleDateString()}</strong></div>
                </div>
              </div>

              {/* Predefined Administrative Actions */}
              {canEdit && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <span className="font-bold text-slate-800 uppercase tracking-wide block text-[11px]">
                    Authorized Administrative Actions
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedPlayer.accountStatus !== 'ACTIVE' && (
                      <button
                        onClick={() => handleChangeStatus(selectedPlayer, 'ACTIVE')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center space-x-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Activate Account</span>
                      </button>
                    )}
                    {selectedPlayer.accountStatus === 'ACTIVE' && (
                      <button
                        onClick={() => handleChangeStatus(selectedPlayer, 'SUSPENDED')}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold flex items-center space-x-1"
                      >
                        <AlertOctagon className="w-3.5 h-3.5" />
                        <span>Suspend Account</span>
                      </button>
                    )}
                    {selectedPlayer.accountStatus !== 'DEACTIVATED' && (
                      <button
                        onClick={() => handleChangeStatus(selectedPlayer, 'DEACTIVATED')}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold flex items-center space-x-1"
                      >
                        <AlertOctagon className="w-3.5 h-3.5" />
                        <span>Deactivate Account</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleResetState(selectedPlayer)}
                      className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded text-xs font-semibold flex items-center space-x-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      <span>Reset Progress State</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedPlayer(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900"
              >
                Close Dossier
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
        confirmButtonText="Confirm Operation"
      />
    </div>
  );
};
