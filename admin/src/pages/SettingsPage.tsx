import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  CheckCircle,
  AlertTriangle,
  Radio,
  Phone,
  HelpCircle,
  Shield,
} from 'lucide-react';
import { ServiceSettings, AdminRole } from '../types';
import { api } from '../services/api';
import { ConfirmModal } from '../components/ConfirmModal';

interface SettingsPageProps {
  currentRole: AdminRole;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ currentRole }) => {
  const [settings, setSettings] = useState<ServiceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form fields
  const [serviceName, setServiceName] = useState('');
  const [shortcode, setShortcode] = useState('');
  const [subscriptionInstruction, setSubscriptionInstruction] = useState('');
  const [dailyPrice, setDailyPrice] = useState(2);
  const [dailyChallengeEnabled, setDailyChallengeEnabled] = useState(true);
  const [weeklyCompetitionEnabled, setWeeklyCompetitionEnabled] = useState(true);
  const [autoFinalizeWinners, setAutoFinalizeWinners] = useState(false);
  const [telebirrDisbursementEnabled, setTelebirrDisbursementEnabled] = useState(true);
  const [publicLeaderboardTopN, setPublicLeaderboardTopN] = useState(10);
  const [supportContact, setSupportContact] = useState('');
  const [serviceNoticeBanner, setServiceNoticeBanner] = useState('');
  const [systemMode, setSystemMode] = useState<'DEMO' | 'PRODUCTION'>('PRODUCTION');

  const [confirmOpen, setConfirmOpen] = useState(false);

  const isSuperAdmin = currentRole === 'SUPER_ADMIN';

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await api.getSettings();
      setSettings(data);
      setServiceName(data.serviceName);
      setShortcode(data.shortcode);
      setSubscriptionInstruction(data.subscriptionInstruction);
      setDailyPrice(data.dailySubscriptionPriceBirr);
      setDailyChallengeEnabled(data.dailyChallengeEnabled);
      setWeeklyCompetitionEnabled(data.weeklyCompetitionEnabled);
      setAutoFinalizeWinners(Boolean(data.autoFinalizeWinners));
      setTelebirrDisbursementEnabled(data.telebirrDisbursementEnabled);
      setPublicLeaderboardTopN(data.publicLeaderboardTopN);
      setSupportContact(data.supportContact);
      setServiceNoticeBanner(data.serviceNoticeBanner);
      setSystemMode(data.systemMode || 'PRODUCTION');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (reason: string) => {
    try {
      await api.updateSettings(
        {
          serviceName,
          shortcode,
          subscriptionInstruction,
          dailySubscriptionPriceBirr: Number(dailyPrice),
          dailyChallengeEnabled,
          weeklyCompetitionEnabled,
          autoFinalizeWinners,
          telebirrDisbursementEnabled,
          publicLeaderboardTopN: Number(publicLeaderboardTopN),
          supportContact,
          serviceNoticeBanner,
          systemMode,
        },
        reason
      );
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
      await loadSettings();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading service configuration...</div>;
  }

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
          <Settings className="w-5 h-5 text-blue-700" />
          <span>EthioFantasy Service Settings</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Authoritative telecom integration parameters and operational configuration (Section 24 & 25).
        </p>
      </div>

      {!isSuperAdmin && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center space-x-2">
          <Shield className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Read-only view. Only administrators with <strong>SUPER ADMIN</strong> privileges can modify telecom service settings.</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Service configuration updated successfully and recorded to audit trail.</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6 text-xs">
        {/* Telecom Pricing & Shortcode Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
            Telecom Subscription & Shortcode
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Service Name</label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 font-medium disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ethio Telecom Shortcode</label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={shortcode}
                onChange={(e) => setShortcode(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 font-mono font-bold text-blue-900 disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Daily Subscription Tariff (Birr)</label>
              <input
                type="number"
                disabled={!isSuperAdmin}
                value={dailyPrice}
                onChange={(e) => setDailyPrice(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg p-2.5 font-mono font-bold text-emerald-700 disabled:bg-slate-50"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Subscriber SMS Activation Instruction</label>
            <input
              type="text"
              disabled={!isSuperAdmin}
              value={subscriptionInstruction}
              onChange={(e) => setSubscriptionInstruction(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 font-mono text-slate-800 disabled:bg-slate-50"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Default: "Send OK to 9401"</span>
          </div>
        </div>

        {/* Feature & Operation Toggles */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
            Operational Feature Controls
          </h3>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-800 block">Daily Challenge Feature</span>
                <span className="text-slate-400 text-[11px]">Enables daily trivia tournaments for all active subscribers</span>
              </div>
              <input
                type="checkbox"
                disabled={!isSuperAdmin}
                checked={dailyChallengeEnabled}
                onChange={(e) => setDailyChallengeEnabled(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-800 block">Weekly Competition Feature</span>
                <span className="text-slate-400 text-[11px]">Enables 7-day cumulative championship leaderboard and prize pool</span>
              </div>
              <input
                type="checkbox"
                disabled={!isSuperAdmin}
                checked={weeklyCompetitionEnabled}
                onChange={(e) => setWeeklyCompetitionEnabled(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-800 block">Automatic Winner Finalization</span>
                <span className="text-slate-400 text-[11px]">Automatically finalize weekly cycle winners upon cycle completion without manual auditor trigger</span>
              </div>
              <input
                type="checkbox"
                disabled={!isSuperAdmin}
                checked={autoFinalizeWinners}
                onChange={(e) => setAutoFinalizeWinners(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-800 block">Telebirr Cash Disbursement Gateway</span>
                <span className="text-slate-400 text-[11px]">Direct automated prize settlement via Telebirr API to winner MSISDN</span>
              </div>
              <input
                type="checkbox"
                disabled={!isSuperAdmin}
                checked={telebirrDisbursementEnabled}
                onChange={(e) => setTelebirrDisbursementEnabled(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
            </label>
          </div>
        </div>

        {/* Operational Environment Mode (DEMO vs PRODUCTION) */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Operational Environment Mode
              </h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Controls SMS gateway behavior. In DEMO / Pre-production mode, test verification codes are presented on-screen and whitelisted for seamless UAT.
              </p>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                systemMode === 'PRODUCTION'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {systemMode} MODE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label
              className={`flex items-start p-3.5 rounded-xl border cursor-pointer transition-all ${
                systemMode === 'PRODUCTION'
                  ? 'border-blue-600 bg-blue-50/40 shadow-xs'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="systemMode"
                value="PRODUCTION"
                disabled={!isSuperAdmin}
                checked={systemMode === 'PRODUCTION'}
                onChange={() => setSystemMode('PRODUCTION')}
                className="mt-0.5 mr-3"
              />
              <div>
                <span className="font-bold text-slate-800 block">Production Commercial Mode</span>
                <span className="text-slate-500 text-[11px]">
                  Requires live Ethio Telecom Shortcode 9401 SMSC dispatch. Standard billing gate active.
                </span>
              </div>
            </label>

            <label
              className={`flex items-start p-3.5 rounded-xl border cursor-pointer transition-all ${
                systemMode === 'DEMO'
                  ? 'border-amber-600 bg-amber-50/40 shadow-xs'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="systemMode"
                value="DEMO"
                disabled={!isSuperAdmin}
                checked={systemMode === 'DEMO'}
                onChange={() => setSystemMode('DEMO')}
                className="mt-0.5 mr-3"
              />
              <div>
                <span className="font-bold text-slate-800 block">Staging & Pre-Production Mode</span>
                <span className="text-slate-500 text-[11px]">
                  Auto-generates visible OTP codes for testers and accepts default test PINs (849201 / 123456).
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Support & Notice banner */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
            Service Communications
          </h3>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">VAS Customer Care Hotline</label>
            <input
              type="text"
              disabled={!isSuperAdmin}
              value={supportContact}
              onChange={(e) => setSupportContact(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 font-mono disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Public Service Announcement Banner</label>
            <textarea
              disabled={!isSuperAdmin}
              value={serviceNoticeBanner}
              onChange={(e) => setServiceNoticeBanner(e.target.value)}
              rows={2}
              className="w-full border border-slate-300 rounded-lg p-2.5 disabled:bg-slate-50"
            />
          </div>
        </div>

        {isSuperAdmin && (
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => setConfirmOpen(true)}
              className="px-5 py-2.5 bg-blue-800 hover:bg-blue-900 text-white rounded-lg font-semibold flex items-center space-x-2 shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Service Configuration</span>
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleSave}
        title="Confirm Service Configuration Update"
        actionName="Update EthioFantasy Service Settings"
        currentValue={settings?.serviceName}
        newValue={serviceName}
        warningNote="Changes to shortcode or price affect live billing and telecom integration parameters."
        danger={true}
        confirmButtonText="Save & Record Audit"
      />
    </div>
  );
};
