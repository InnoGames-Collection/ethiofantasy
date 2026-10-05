import React from 'react';
import {
  Users,
  Trophy,
  Award,
  Calendar,
  AlertCircle,
  Clock,
  ArrowRight,
  Shield,
  FileSpreadsheet,
} from 'lucide-react';
import { DashboardStats } from '../types';
import { Badge } from '../components/Badge';
import { NavPage } from '../components/Sidebar';

interface DashboardPageProps {
  stats: DashboardStats | null;
  onNavigate: (page: NavPage) => void;
  onRefresh: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ stats, onNavigate, onRefresh }) => {
  if (!stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-3 text-slate-500 text-sm">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading EthioFantasy operational status...</span>
        </div>
      </div>
    );
  }

  const { kpis, todayChallenge, currentCompetition, recentActivity, mode } = stats;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Critical KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Active Players */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Players</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {kpis.activePlayers.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Verified 9401 accounts
          </div>
        </div>

        {/* Today's Participants */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Today's Participants</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {kpis.todayParticipants.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Challenge players today
          </div>
        </div>

        {/* Today's Challenge Status */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Today's Challenge</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-1">
            <Badge status={kpis.todayChallengeStatus} size="md" />
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            {todayChallenge?.date || 'No Date'}
          </div>
        </div>

        {/* Current 7-Day Competition */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">7-Day Competition</span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-1">
            <Badge status={kpis.currentWeeklyStatus} size="md" />
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">
            {currentCompetition?.periodLabel || 'Not Active'}
          </div>
        </div>

        {/* Pending Prize Actions */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Prize Actions</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {kpis.pendingPrizeActions}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Overrides requiring review
          </div>
        </div>
      </div>

      {/* Quick Operational Action Buttons (Prompt Requirement: small number of important quick actions) */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center space-x-2">
          <Shield className="w-4 h-4 text-blue-700" />
          <span>Quick Operational Controls:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('DAILY_CHALLENGE')}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-800 hover:bg-slate-100 hover:border-slate-400 shadow-2xs transition-colors flex items-center space-x-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Configure Daily Challenge</span>
          </button>
          <button
            onClick={() => onNavigate('WEEKLY_COMPETITION')}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-800 hover:bg-slate-100 hover:border-slate-400 shadow-2xs transition-colors flex items-center space-x-1.5"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span>Manage Weekly Competition</span>
          </button>
          <button
            onClick={() => onNavigate('PRIZES_WINNERS')}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-800 hover:bg-slate-100 hover:border-slate-400 shadow-2xs transition-colors flex items-center space-x-1.5"
          >
            <Award className="w-3.5 h-3.5 text-emerald-600" />
            <span>Manage Prizes</span>
          </button>
          <button
            onClick={() => onNavigate('WEEKLY_COMPETITION')}
            className="px-3.5 py-2 text-xs font-semibold bg-blue-800 text-white rounded-lg hover:bg-blue-900 shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-300" />
            <span>View Winners</span>
          </button>
          <button
            onClick={() => onNavigate('REPORTS')}
            className="px-3.5 py-2 text-xs font-semibold bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* Operational Modules: TODAY vs CURRENT WEEK */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TODAY'S DAILY CHALLENGE CARD */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-blue-700">Today</span>
              <h2 className="text-base font-bold text-slate-900">Daily Challenge</h2>
            </div>
            <button
              onClick={() => onNavigate('DAILY_CHALLENGE')}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center space-x-1 transition-colors"
            >
              <span>Manage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-6">
            {todayChallenge ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-800">
                    {todayChallenge.title}
                  </div>
                  <Badge status={todayChallenge.status} />
                </div>

                <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center font-mono">
                  <div>
                    <div className="text-xs text-slate-400 font-sans uppercase">Participants</div>
                    <div className="text-xl font-bold text-slate-900 mt-1">
                      {todayChallenge.participantsCount.toLocaleString()}
                    </div>
                  </div>
                  <div className="border-x border-slate-200">
                    <div className="text-xs text-slate-400 font-sans uppercase">Completed</div>
                    <div className="text-xl font-bold text-slate-900 mt-1">
                      {todayChallenge.completedCount.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-sans uppercase">Top Score</div>
                    <div className="text-xl font-bold text-emerald-600 mt-1">
                      {todayChallenge.topScore} pts
                    </div>
                  </div>
                </div>

                {/* Configured Prize Rules Preview */}
                <div className="pt-2">
                  <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Configured Daily Prizes ({todayChallenge.prizeRules.length} ranks)
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {todayChallenge.prizeRules.slice(0, 3).map((rule) => (
                      <span
                        key={rule.rank}
                        className="text-xs bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-md font-mono"
                      >
                        Rank {rule.rank}: <strong className="text-slate-900">{rule.prizeAmountBirr} ETB</strong> ({rule.prizeType})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <div className="text-sm font-medium text-slate-700">No Daily Challenge Configured</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No challenge is configured for today. Click below to launch or schedule today's challenge.
                </p>
                <button
                  onClick={() => onNavigate('DAILY_CHALLENGE')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-800 rounded-lg hover:bg-blue-900 transition-colors"
                >
                  Configure Daily Challenge
                </button>
              </div>
            )}
          </div>
        </div>

        {/* CURRENT WEEK 7-DAY COMPETITION CARD */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-amber-700">Current Week</span>
              <h2 className="text-base font-bold text-slate-900">7-Day Competition</h2>
            </div>
            <button
              onClick={() => onNavigate('WEEKLY_COMPETITION')}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center space-x-1 transition-colors"
            >
              <span>Manage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-6">
            {currentCompetition ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-800">
                    {currentCompetition.title}
                  </div>
                  <Badge status={currentCompetition.status} />
                </div>

                <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center font-mono">
                  <div>
                    <div className="text-xs text-slate-400 font-sans uppercase">Participants</div>
                    <div className="text-xl font-bold text-slate-900 mt-1">
                      {currentCompetition.participantsCount.toLocaleString()}
                    </div>
                  </div>
                  <div className="border-x border-slate-200">
                    <div className="text-xs text-slate-400 font-sans uppercase">Current Leader</div>
                    <div className="text-sm font-bold text-blue-900 mt-1 truncate px-1">
                      {currentCompetition.currentLeader?.maskedMsisdn || 'None'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-sans uppercase">Top Score</div>
                    <div className="text-xl font-bold text-emerald-600 mt-1">
                      {currentCompetition.topScore} pts
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-slate-600">
                  <span>Period: <strong className="text-slate-800 font-mono">{currentCompetition.periodLabel}</strong></span>
                  <button
                    onClick={() => onNavigate('WEEKLY_COMPETITION')}
                    className="font-semibold text-amber-700 hover:text-amber-800 underline"
                  >
                    Review Final Rankings
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <div className="text-sm font-medium text-slate-700">No Active Competition</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No 7-day tournament is currently running. You can create a new competition period.
                </p>
                <button
                  onClick={() => onNavigate('WEEKLY_COMPETITION')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-800 rounded-lg hover:bg-blue-900 transition-colors"
                >
                  Create Competition
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RECENT ADMIN ACTIVITY (Required in Section 7) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Admin Activity</h3>
            <p className="text-xs text-slate-500">Most recent operational modifications with audit records</p>
          </div>
          <button
            onClick={() => onNavigate('AUDIT_LOG')}
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center space-x-1"
          >
            <span>Full Audit Trail</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          {recentActivity.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono">
                <tr>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">Administrator</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Target Object</th>
                  <th className="px-6 py-3">Operational Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentActivity.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-3.5 whitespace-nowrap text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap font-medium text-slate-900">
                      <div>{log.adminName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.adminRole}</div>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span className="font-mono font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap font-mono text-slate-600">
                      {log.objectType}: {log.objectId}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 max-w-xs truncate" title={log.reason}>
                      {log.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              No recent administrative activity recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
