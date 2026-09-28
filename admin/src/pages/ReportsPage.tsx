import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Filter,
  Calendar,
  Eye,
  Shield,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { AdminRole, WeeklyCompetition } from '../types';
import { api } from '../services/api';

interface ReportsPageProps {
  currentRole: AdminRole;
}

type ReportType =
  | 'DAILY_CHALLENGE'
  | 'WEEKLY_COMPETITION'
  | 'WINNERS'
  | 'PRIZES'
  | 'PARTICIPATION'
  | 'SUBSCRIPTIONS'
  | 'LEADERBOARD'
  | 'AUDIT';

export const ReportsPage: React.FC<ReportsPageProps> = ({ currentRole }) => {
  const [reportType, setReportType] = useState<ReportType>('WINNERS');
  const [competitions, setCompetitions] = useState<WeeklyCompetition[]>([]);
  const [selectedCompId, setSelectedCompId] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [unmaskExport, setUnmaskExport] = useState(false);

  const [reportResult, setReportResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSuperAdmin = currentRole === 'SUPER_ADMIN';

  const reportOptions: { type: ReportType; label: string; desc: string }[] = [
    { type: 'WINNERS', label: '1. Winner Report', desc: 'Finalized winners, rankings, prizes & disbursement methods' },
    { type: 'DAILY_CHALLENGE', label: '2. Daily Challenge Report', desc: 'Daily participant scores, times & prize allocations' },
    { type: 'WEEKLY_COMPETITION', label: '3. Weekly Competition Report', desc: '7-day tournament results, top scorers & rank tiers' },
    { type: 'PRIZES', label: '4. Prize Report', desc: 'Detailed prize disbursements, overrides, reasons & approvals' },
    { type: 'PARTICIPATION', label: '5. Player Participation Report', desc: 'Subscriber engagement, levels reached, best scores & regions' },
    { type: 'SUBSCRIPTIONS', label: '6. Subscription Report', desc: 'Ethio Telecom 9401 billing states, channels & tariffs' },
    { type: 'LEADERBOARD', label: '7. Leaderboard Report', desc: 'Complete ranked standings with accurate score breakdown' },
    { type: 'AUDIT', label: '8. Audit Report', desc: 'Comprehensive compliance log of all administrative actions' },
  ];

  useEffect(() => {
    api.getWeeklyCompetitions().then(setCompetitions).catch(console.error);
  }, []);

  const generateReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getReportData(reportType, {
        competitionId: selectedCompId,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setReportResult(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateReport();
  }, [reportType, selectedCompId]);

  const handleExportCsv = () => {
    if (unmaskExport && !isSuperAdmin) {
      alert('Only Super Admin role can export unmasked subscriber MSISDNs.');
      return;
    }
    const url = api.getExportUrl(reportType, unmaskExport && isSuperAdmin);
    window.location.href = url;
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-700" />
            <span>Ethio Telecom Operational & Compliance Reports</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Instantly generate, preview, and export audited reports for telecom authorities without database access.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          {isSuperAdmin && (
            <label className="flex items-center space-x-1.5 text-xs text-slate-700 cursor-pointer mr-2 select-none">
              <input
                type="checkbox"
                checked={unmaskExport}
                onChange={(e) => setUnmaskExport(e.target.checked)}
                className="w-3.5 h-3.5 text-blue-600 rounded"
              />
              <span className="font-mono text-[11px]">Unmask MSISDN in Export</span>
            </label>
          )}

          <button
            onClick={handleExportCsv}
            className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <Download className="w-4 h-4 text-emerald-200" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Selector Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {reportOptions.map((opt) => {
          const isSelected = reportType === opt.type;
          return (
            <button
              key={opt.type}
              onClick={() => setReportType(opt.type)}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="font-bold text-xs">{opt.label}</div>
              <div className={`text-[11px] mt-1 line-clamp-2 ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                {opt.desc}
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter Toolbar (Section 20: Only useful filters) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {(reportType === 'WEEKLY_COMPETITION' || reportType === 'WINNERS') && (
            <div>
              <select
                value={selectedCompId}
                onChange={(e) => setSelectedCompId(e.target.value)}
                className="border border-slate-300 rounded-lg p-2 bg-white text-slate-800 outline-none"
              >
                <option value="ALL">All Competitions</option>
                {competitions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-slate-300 rounded-lg p-1.5 font-mono"
            />
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-slate-300 rounded-lg p-1.5 font-mono"
            />
          </div>

          <button
            onClick={generateReport}
            className="px-3.5 py-1.5 bg-blue-800 text-white rounded-lg font-semibold hover:bg-blue-900 transition-colors"
          >
            Apply Filters
          </button>
        </div>

        <div className="text-slate-400 font-mono text-[11px]">
          {reportResult ? `${reportResult.count} Rows Generated` : 'Ready'}
        </div>
      </div>

      {/* Live Report Preview Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              {reportResult?.title || 'Report Results Preview'}
            </h3>
            <p className="text-xs text-slate-500">
              Generated at: {reportResult?.generatedAt ? new Date(reportResult.generatedAt).toLocaleString() : 'N/A'}
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded font-semibold">
            Ready for Telecom Submission
          </span>
        </div>

        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Compiling operational report...
            </div>
          ) : reportResult && reportResult.data.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono sticky top-0 z-10 shadow-2xs">
                <tr>
                  {Object.keys(reportResult.data[0]).map((colKey) => (
                    <th key={colKey} className="px-6 py-3 whitespace-nowrap">
                      {colKey.replace(/([A-Z])/g, ' $1').toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportResult.data.map((row: any, rIdx: number) => (
                  <tr key={rIdx} className="hover:bg-slate-50/60 transition-colors">
                    {Object.values(row).map((val: any, cIdx: number) => (
                      <td key={cIdx} className="px-6 py-3.5 whitespace-nowrap text-slate-700 font-mono">
                        {String(val ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-slate-500 text-xs space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <div>No records found matching current report criteria.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
