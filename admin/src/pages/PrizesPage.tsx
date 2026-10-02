import React, { useState, useEffect } from 'react';
import {
  Award,
  Search,
  Plus,
  CheckCircle,
  Clock,
  Shield,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { PlayerPrizeOverride, Player, AdminRole } from '../types';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import { ConfirmModal } from '../components/ConfirmModal';

interface PrizesPageProps {
  currentRole: AdminRole;
}

export const PrizesPage: React.FC<PrizesPageProps> = ({ currentRole }) => {
  const [overrides, setOverrides] = useState<PlayerPrizeOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Override Form
  const [searchMsisdn, setSearchMsisdn] = useState('');
  const [matchingPlayers, setMatchingPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [overridePrize, setOverridePrize] = useState<number>(5000);
  const [context, setContext] = useState<PlayerPrizeOverride['context']>('SPECIAL_RECOGNITION');
  const [reason, setReason] = useState('');
  const [searching, setSearching] = useState(false);

  // Success message
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canEdit = currentRole === 'SUPER_ADMIN' || currentRole === 'OPERATIONS_ADMIN';

  const loadOverrides = async () => {
    try {
      setLoading(true);
      const data = await api.getPrizeOverrides();
      setOverrides(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverrides();
  }, []);

  const handleSearchPlayer = async () => {
    if (!searchMsisdn.trim()) return;
    try {
      setSearching(true);
      const players = await api.getPlayers(searchMsisdn.trim());
      setMatchingPlayers(players);
      if (players.length === 1) {
        setSelectedPlayer(players[0]);
      } else {
        setSelectedPlayer(null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleAssignOverride = async () => {
    if (!selectedPlayer) {
      alert('Please search and select a player first.');
      return;
    }
    if (!overridePrize || overridePrize <= 0) {
      alert('Please enter a valid override prize amount in Birr.');
      return;
    }
    if (!reason.trim() || reason.trim().length < 4) {
      alert('An operational reason / approval note is required.');
      return;
    }

    try {
      await api.createPlayerPrizeOverride({
        msisdn: selectedPlayer.msisdn,
        overridePrizeBirr: overridePrize,
        reason,
        context,
      });
      setSuccessMessage(`Successfully recorded prize override of ${overridePrize.toLocaleString()} ETB for ${selectedPlayer.maskedMsisdn}`);
      setSelectedPlayer(null);
      setSearchMsisdn('');
      setMatchingPlayers([]);
      setReason('');
      await loadOverrides();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header bar */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
          <Award className="w-5 h-5 text-emerald-600" />
          <span>Prizes & Winner Overrides</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Execute authorized player prize overrides with mandatory executive audit logging, and audit all prize allocations.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* INDIVIDUAL PRIZE OVERRIDE FORM (Section 10: Search -> Select -> Assign -> Enter Amount -> Reason -> Confirm -> Save) */}
      {canEdit && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2">
                <span>Assign Individual Player Prize Override</span>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-mono font-bold">
                  VAS Controlled
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Distinctly separates Standard Prize from Admin Override with permanent audit tracking
              </p>
            </div>
            <div className="text-xs text-slate-400 font-mono">Workflow: Step 1 → 2 → 3</div>
          </div>

          <div className="p-6 space-y-6">
            {/* Step 1: Search player by MSISDN */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                Step 1: Search Player by MSISDN
              </label>
              <div className="flex items-center space-x-2 max-w-md">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchMsisdn}
                    onChange={(e) => setSearchMsisdn(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchPlayer()}
                    placeholder="e.g. +251911223344 or 0911..."
                    className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSearchPlayer}
                  disabled={searching}
                  className="px-4 py-2 bg-blue-800 text-white rounded-lg text-xs font-semibold hover:bg-blue-900 transition-colors shrink-0"
                >
                  {searching ? 'Searching...' : 'Find Player'}
                </button>
              </div>

              {/* Matching players dropdown/list */}
              {matchingPlayers.length > 0 && !selectedPlayer && (
                <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg max-w-md space-y-2">
                  <div className="text-[11px] font-semibold text-slate-600 uppercase font-mono">
                    Found {matchingPlayers.length} subscriber(s):
                  </div>
                  {matchingPlayers.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlayer(p)}
                      className="p-2.5 bg-white border border-slate-200 rounded-md hover:border-blue-500 cursor-pointer flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <div className="font-mono font-bold text-slate-900">{p.maskedMsisdn}</div>
                        <div className="text-[10px] text-slate-500">
                          Subscription: {p.subscriptionStatus} | Best: {p.bestScore} pts
                        </div>
                      </div>
                      <button className="px-2.5 py-1 bg-blue-50 text-blue-700 font-semibold rounded text-xs hover:bg-blue-100">
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step 2 & 3: Configure Override when Player is selected */}
            {selectedPlayer && (
              <div className="p-5 bg-blue-50/50 border border-blue-200 rounded-xl space-y-4 max-w-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-blue-200/60">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-bold text-blue-950 uppercase font-mono">
                      Selected Player:
                    </span>
                    <span className="text-sm font-bold text-slate-900 font-mono">
                      {selectedPlayer.maskedMsisdn}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedPlayer(null)}
                    className="text-xs text-rose-600 hover:underline font-medium"
                  >
                    Change Player
                  </button>
                </div>

                {/* Clear distinction: Standard Prize vs Admin Override (Section 10 requirement) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                      Standard Prize
                    </span>
                    <span className="text-lg font-bold text-slate-600 font-mono block">
                      0 ETB
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Standard system rule allocation
                    </span>
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg space-y-1">
                    <span className="text-[10px] font-mono uppercase text-emerald-800 font-bold block">
                      Admin Override Amount (ETB) *
                    </span>
                    <input
                      type="number"
                      value={overridePrize}
                      onChange={(e) => setOverridePrize(Number(e.target.value))}
                      className="w-full text-base font-bold text-emerald-900 border border-emerald-300 rounded p-1 font-mono bg-white"
                    />
                    <span className="text-[11px] text-emerald-700">
                      Authoritative value to disburse
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Override Context / Type</label>
                    <select
                      value={context}
                      onChange={(e) => setContext(e.target.value as any)}
                      className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                    >
                      <option value="SPECIAL_RECOGNITION">Special Executive Recognition</option>
                      <option value="DISPUTE_RESOLUTION">Dispute / Network Tie-break Resolution</option>
                      <option value="DAILY_CHALLENGE">Daily Challenge Special Award</option>
                      <option value="WEEKLY_COMPETITION">Weekly Competition Adjustment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Disbursement Route</label>
                    <div className="p-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-mono text-xs">
                      Telebirr Cash Direct / Airtime
                    </div>
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Approval Reason & Authorizing Executive <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Approved special award of 15,000 ETB for perfect quiz accuracy across all levels - authorized by VAS Director."
                    rows={2}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    This note will be saved in the permanent audit trail and presented on Telecom compliance reports.
                  </span>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleAssignOverride}
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-200" />
                    <span>Confirm & Save Override</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DEDICATED PRIZE REPORT & OVERRIDES AUDIT TABLE (Section 22: Date, Competition, Rank, Player, Prize, Standard/Override, Status, Approval, Admin, Timestamp) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Official Prize Allocations & Overrides Log
            </h3>
            <p className="text-xs text-slate-500">
              Audit record for Ethio Telecom review without direct database access
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {overrides.length} Registered Records
          </span>
        </div>

        <div className="overflow-x-auto">
          {overrides.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Context</th>
                  <th className="px-6 py-3">Player</th>
                  <th className="px-6 py-3">Standard Prize</th>
                  <th className="px-6 py-3">Override Prize</th>
                  <th className="px-6 py-3">Prize Type</th>
                  <th className="px-6 py-3">Approval Reason</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Approved By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overrides.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-3.5 whitespace-nowrap text-slate-500 font-mono">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap font-mono text-slate-700">
                      {o.context}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap font-mono font-medium text-slate-900">
                      {o.playerMsisdn}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap font-mono text-slate-500">
                      {o.standardPrizeBirr} ETB
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap font-mono font-bold text-emerald-700">
                      {o.overridePrizeBirr.toLocaleString()} ETB
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[10px] font-mono font-bold">
                        ADMIN OVERRIDE
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 max-w-xs truncate" title={o.reason}>
                      {o.reason}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <Badge status={o.status} />
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-slate-800 font-medium">
                      <div>{o.adminName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(o.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              No individual prize overrides recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
