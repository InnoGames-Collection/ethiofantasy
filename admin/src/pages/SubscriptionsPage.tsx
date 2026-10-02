import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  Search,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  Radio,
  RefreshCw,
} from 'lucide-react';
import { SubscriptionRecord, AdminRole } from '../types';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import { ConfirmModal } from '../components/ConfirmModal';

interface SubscriptionsPageProps {
  currentRole: AdminRole;
}

export const SubscriptionsPage: React.FC<SubscriptionsPageProps> = ({ currentRole }) => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const list = await api.getSubscriptions(search, statusFilter);
      setSubscriptions(list);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleToggleStatus = (sub: SubscriptionRecord, newStatus: 'ACTIVE' | 'CANCELLED') => {
    setConfirmState({
      isOpen: true,
      title: 'Update Telecom Subscription Status',
      actionName: `Set 9401 status for ${sub.maskedMsisdn} to ${newStatus}`,
      currentValue: sub.status,
      newValue: newStatus,
      danger: newStatus === 'CANCELLED',
      warningNote:
        newStatus === 'CANCELLED'
          ? 'Deactivating subscription will cancel daily 2 Birr renewal and revoke daily tournament eligibility.'
          : undefined,
      actionFn: async (reason: string) => {
        await api.updateSubscriptionStatus(sub.id, newStatus, reason);
        await loadData();
      },
    });
  };

  const activeCount = subscriptions.filter((s) => s.status === 'ACTIVE').length;
  const cancelledCount = subscriptions.filter((s) => s.status === 'CANCELLED').length;

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <PhoneCall className="w-5 h-5 text-emerald-600" />
            <span>Ethio Telecom Subscriptions (Shortcode 9401)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational monitoring and administration of recurring 2 Birr / day subscriber billing states.
          </p>
        </div>

        {/* Search & Filter */}
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search MSISDN..."
              className="text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none w-52 font-mono"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg p-2 bg-white text-slate-700 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active (Renewing)</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="PENDING">Pending</option>
          </select>

          <button
            type="submit"
            className="px-3.5 py-2 bg-blue-800 text-white rounded-lg text-xs font-semibold hover:bg-blue-900 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Operational Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 uppercase font-mono">Active Subscriptions</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {activeCount.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">2 Birr/day active tariff</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 uppercase font-mono">Cancelled / Inactive</div>
          <div className="text-2xl font-bold text-slate-500 mt-1">
            {cancelledCount.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">STOP or insufficient balance</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 uppercase font-mono">Daily Tariff</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            2.00 ETB
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Shortcode: 9401</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 uppercase font-mono">Primary Channel</div>
          <div className="text-2xl font-bold text-blue-900 mt-1 font-mono">
            SMS / USSD
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Send OK to 9401</div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Subscriber Provisioning & Billing Records
            </h3>
            <p className="text-xs text-slate-500">
              Live status synchronized with telecom network gateway
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {subscriptions.length} Subscriptions
          </span>
        </div>

        <div className="overflow-x-auto">
          {subscriptions.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono">
                <tr>
                  <th className="px-6 py-3">Subscriber (MSISDN)</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Tariff Plan</th>
                  <th className="px-6 py-3">Channel</th>
                  <th className="px-6 py-3">Activated At</th>
                  <th className="px-6 py-3">Last Billed</th>
                  <th className="px-6 py-3">Auto Renew</th>
                  <th className="px-6 py-3">Notes / Gateway State</th>
                  {canEdit && <th className="px-6 py-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subscriptions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-3.5 font-mono font-bold text-slate-900">
                      {s.maskedMsisdn}
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge status={s.status} />
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-700">
                      {s.priceBirr} ETB / Day
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-600">
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {s.channel}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 font-mono">
                      {new Date(s.activatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 font-mono">
                      {new Date(s.lastBilledAt).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-3.5">
                      {s.autoRenew ? (
                        <span className="text-emerald-700 font-semibold font-mono">TRUE</span>
                      ) : (
                        <span className="text-slate-400 font-mono">FALSE</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 max-w-xs truncate" title={s.failureReason}>
                      {s.failureReason || 'Normal Recurring'}
                    </td>
                    {canEdit && (
                      <td className="px-6 py-3.5 text-right">
                        {s.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleToggleStatus(s, 'CANCELLED')}
                            className="px-2.5 py-1 text-[11px] bg-rose-50 text-rose-700 border border-rose-200 rounded font-semibold hover:bg-rose-100 transition-colors"
                          >
                            Cancel Sub
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(s, 'ACTIVE')}
                            className="px-2.5 py-1 text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-semibold hover:bg-emerald-100 transition-colors"
                          >
                            Reactivate
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              No subscription records found.
            </div>
          )}
        </div>
      </div>

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
        confirmButtonText="Confirm Subscription Status"
      />
    </div>
  );
};
