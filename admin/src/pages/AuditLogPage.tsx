import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Search,
  Filter,
  Calendar,
  FileSpreadsheet,
  Download,
  ShieldAlert,
} from 'lucide-react';
import { AuditLogEntry } from '../types';
import { api } from '../services/api';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [objectFilter, setObjectFilter] = useState('ALL');
  const [searchReason, setSearchReason] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditLogs({
        action: actionFilter,
        objectType: objectFilter,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setLogs(Array.isArray(data) ? data : (data as any)?.logs || []);
    } catch (err: any) {
      console.error(err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [actionFilter, objectFilter]);

  const safeLogs = Array.isArray(logs) ? logs : [];
  const filteredLogs = safeLogs.filter((l) => {
    if (!searchReason) return true;
    const q = searchReason.toLowerCase();
    return (
      (l.reason || '').toLowerCase().includes(q) ||
      (l.adminName || '').toLowerCase().includes(q) ||
      (l.action || '').toLowerCase().includes(q) ||
      (l.objectId || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <ClipboardList className="w-5 h-5 text-blue-700" />
            <span>Administrative Compliance & Audit Log</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable tracking of all operational actions, prize changes, winner finalizations, and administrative overrides (Section 27).
          </p>
        </div>

        <button
          onClick={() => {
            window.location.href = api.getExportUrl('AUDIT');
          }}
          className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-semibold hover:bg-emerald-800 shadow-xs transition-colors flex items-center space-x-1.5 shrink-0"
        >
          <Download className="w-4 h-4 text-emerald-200" />
          <span>Export Audit Log</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchReason}
              onChange={(e) => setSearchReason(e.target.value)}
              placeholder="Search admin, reason, ID..."
              className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg outline-none w-56 font-mono text-xs"
            />
          </div>

          <div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="border border-slate-300 rounded-lg p-1.5 bg-white text-slate-700 outline-none"
            >
              <option value="ALL">All Actions</option>
              <option value="FINALIZE_WINNERS">FINALIZE_WINNERS</option>
              <option value="ASSIGN_PRIZE_OVERRIDE">ASSIGN_PRIZE_OVERRIDE</option>
              <option value="OVERRIDE_PARTICIPANT_PRIZE">OVERRIDE_PARTICIPANT_PRIZE</option>
              <option value="UPDATE_CHALLENGE_STATUS">UPDATE_CHALLENGE_STATUS</option>
              <option value="UPDATE_COMPETITION_STATUS">UPDATE_COMPETITION_STATUS</option>
              <option value="UPDATE_PLAYER_STATUS">UPDATE_PLAYER_STATUS</option>
              <option value="UPDATE_SERVICE_SETTINGS">UPDATE_SERVICE_SETTINGS</option>
              <option value="VIEW_UNMASKED_MSISDN">VIEW_UNMASKED_MSISDN</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-slate-300 rounded-lg p-1 font-mono text-xs"
            />
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-slate-300 rounded-lg p-1 font-mono text-xs"
            />
          </div>

          <button
            onClick={loadLogs}
            className="px-3 py-1.5 bg-blue-800 text-white rounded-lg font-semibold hover:bg-blue-900 transition-colors"
          >
            Filter
          </button>
        </div>

        <span className="text-slate-400 font-mono text-[11px]">
          {filteredLogs.length} Events Logged
        </span>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {filteredLogs.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono">
                <tr>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">Administrator</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Target Object</th>
                  <th className="px-6 py-3">Change Summary (Old → New)</th>
                  <th className="px-6 py-3">Operational Reason</th>
                  <th className="px-6 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-3.5 whitespace-nowrap text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap font-medium text-slate-900">
                      <div>{log.adminName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.adminRole}</div>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span className="font-mono font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap font-mono text-slate-600">
                      {log.objectType}: {log.objectId}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 font-mono text-[11px] max-w-xs truncate">
                      <span className="text-slate-400 line-through mr-1">{log.oldValue.slice(0, 20)}</span>
                      → <span className="text-emerald-700 font-bold">{log.newValue.slice(0, 25)}</span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-700 max-w-sm truncate" title={log.reason}>
                      {log.reason}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-blue-700 hover:underline font-semibold"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-slate-500 text-xs">
              No audit log entries match current filter.
            </div>
          )}
        </div>
      </div>

      {/* INSPECT AUDIT ENTRY MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Audit Log Event Inspection</h3>
                <span className="text-[11px] font-mono text-slate-400">ID: {selectedLog.id}</span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">Admin Operator:</span>
                  <span className="font-bold text-slate-900 font-sans">{selectedLog.adminName}</span>
                  <span className="text-[10px] text-slate-500 block">({selectedLog.adminRole})</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block">Recorded Timestamp:</span>
                  <span className="text-slate-800">{new Date(selectedLog.timestamp).toISOString()}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 uppercase text-[10px] font-bold block mb-1">Action & Target:</span>
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded text-blue-900 font-bold">
                  {selectedLog.action} on {selectedLog.objectType} ({selectedLog.objectId})
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-slate-500 uppercase text-[10px] font-bold block">Delta Changes:</span>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2">
                  <div>
                    <span className="text-slate-400 block text-[10px]">OLD VALUE:</span>
                    <pre className="text-slate-700 whitespace-pre-wrap break-all text-[11px]">{selectedLog.oldValue}</pre>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-emerald-700 font-bold block text-[10px]">NEW VALUE:</span>
                    <pre className="text-emerald-800 font-bold whitespace-pre-wrap break-all text-[11px]">{selectedLog.newValue}</pre>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-slate-500 uppercase text-[10px] font-bold block mb-1">Operational Justification / Reason:</span>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-950 font-sans text-xs leading-relaxed">
                  {selectedLog.reason}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
