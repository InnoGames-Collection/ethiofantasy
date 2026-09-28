import React, { useState, useEffect } from 'react';
import { Sidebar, NavPage } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { DailyChallengePage } from './pages/DailyChallengePage';
import { WeeklyCompetitionPage } from './pages/WeeklyCompetitionPage';
import { PrizesPage } from './pages/PrizesPage';
import { PlayersPage } from './pages/PlayersPage';
import { QuizManagementPage } from './pages/QuizManagementPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { api } from './services/api';
import { AdminUser, DashboardStats } from './types';

export default function App() {
  const [currentPage, setCurrentPage] = useState<NavPage>('DASHBOARD');
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [availableAdmins, setAvailableAdmins] = useState<AdminUser[]>([]);
  const [systemMode, setSystemMode] = useState<'DEMO' | 'PRODUCTION'>('DEMO');
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Initialize auth and stats
  const initApp = async () => {
    try {
      setIsRefreshing(true);
      const [authData, statsData] = await Promise.all([
        api.getAuthMe(),
        api.getDashboardStats(),
      ]);
      setCurrentAdmin(authData.currentAdmin);
      setAvailableAdmins(authData.availableAdmins);
      setDashboardStats(statsData);
      setSystemMode(statsData.mode);
    } catch (err) {
      console.error('Failed to initialize admin session:', err);
    } finally {
      setIsRefreshing(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    initApp();
  }, []);

  const handleSwitchAdmin = async (adminId: string) => {
    try {
      const res = await api.switchAdmin(adminId);
      setCurrentAdmin(res.currentAdmin);
      await initApp();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleMode = async (mode: 'DEMO' | 'PRODUCTION') => {
    const confirmSwitch = window.confirm(
      `Switch to ${mode} dataset mode?\n\n- DEMO: Includes realistic sample tournament participants, questions & scores for staging.\n- PRODUCTION: Clean empty-state for live Ethio Telecom operations.`
    );
    if (!confirmSwitch) return;

    try {
      setIsRefreshing(true);
      const res = await api.switchSystemMode(mode);
      setSystemMode(res.mode);
      await initApp();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Page title mapping
  const getPageInfo = (): { title: string; subtitle: string } => {
    switch (currentPage) {
      case 'DASHBOARD':
        return {
          title: 'Operations Dashboard',
          subtitle: 'Real-time overview of EthioFantasy active players, challenges, and prize operations.',
        };
      case 'DAILY_CHALLENGE':
        return {
          title: 'Daily Challenge Operations',
          subtitle: 'Schedule and manage daily football quiz tournaments, rank rewards, and subscriber results.',
        };
      case 'WEEKLY_COMPETITION':
        return {
          title: 'Weekly 7-Day Competition',
          subtitle: 'Tournament lifecycle, top 10 leaderboard, prize allocation, and official winner finalization.',
        };
      case 'PRIZES_WINNERS':
        return {
          title: 'Prize & Winner Management',
          subtitle: 'Control individual player prize overrides, review allocations, and disburse Telebirr cash.',
        };
      case 'PLAYERS':
        return {
          title: 'Subscriber Account Management',
          subtitle: 'Search player profiles by MSISDN, audit game progression, and manage service access.',
        };
      case 'LEVELS_QUESTIONS':
        return {
          title: 'Football Quiz Content Management',
          subtitle: 'Draft, verify, preview, and publish trivia questions across all 4 quiz difficulty tiers.',
        };
      case 'SUBSCRIPTIONS':
        return {
          title: 'Ethio Telecom Subscriptions (9401)',
          subtitle: 'Monitor 2 Birr/day recurring billing records, SMS activations, and cancellation statuses.',
        };
      case 'REPORTS':
        return {
          title: 'Operational & Compliance Reports',
          subtitle: 'Generate and export official Daily, Weekly, Winner, and Subscription reports for Ethio Telecom.',
        };
      case 'SETTINGS':
        return {
          title: 'Service Integration Settings',
          subtitle: 'Authoritative shortcode (9401), daily pricing (2 ETB), and tournament feature configuration.',
        };
      case 'ADMIN_USERS':
        return {
          title: 'Administrative Access & Governance',
          subtitle: 'Manage authorized operator credentials and Role-Based Access Control (RBAC).',
        };
      case 'AUDIT_LOG':
        return {
          title: 'Compliance & Audit Log',
          subtitle: 'Complete searchable record of who changed what, old vs new values, and operational reasons.',
        };
      default:
        return { title: 'Admin Portal', subtitle: 'EthioFantasy Management' };
    }
  };

  const { title, subtitle } = getPageInfo();
  const currentRole = currentAdmin?.role || 'OPERATIONS_ADMIN';

  if (initialLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white space-y-4">
        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-xl tracking-wider animate-pulse">
          EF
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-base font-bold tracking-tight">ETHIOFANTASY ADMIN CONTROL PORTAL</h2>
          <p className="text-xs text-slate-400 font-mono">Authenticating administrative session & loading authoritative records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafc] text-slate-900 font-sans antialiased">
      {/* Desktop Left Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={(p) => setCurrentPage(p)}
        currentAdmin={currentAdmin}
        availableAdmins={availableAdmins}
        onSwitchAdmin={handleSwitchAdmin}
        systemMode={systemMode}
        onToggleMode={handleToggleMode}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <Header
          title={title}
          subtitle={subtitle}
          onRefresh={initApp}
          isRefreshing={isRefreshing}
          currentAdmin={currentAdmin}
          systemMode={systemMode}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto">
          {currentPage === 'DASHBOARD' && (
            <DashboardPage
              stats={dashboardStats}
              onNavigate={(p) => setCurrentPage(p)}
              onRefresh={initApp}
            />
          )}

          {currentPage === 'DAILY_CHALLENGE' && (
            <DailyChallengePage currentRole={currentRole} />
          )}

          {currentPage === 'WEEKLY_COMPETITION' && (
            <WeeklyCompetitionPage currentRole={currentRole} />
          )}

          {currentPage === 'PRIZES_WINNERS' && (
            <PrizesPage currentRole={currentRole} />
          )}

          {currentPage === 'PLAYERS' && (
            <PlayersPage currentRole={currentRole} />
          )}

          {currentPage === 'LEVELS_QUESTIONS' && (
            <QuizManagementPage currentRole={currentRole} />
          )}

          {currentPage === 'SUBSCRIPTIONS' && (
            <SubscriptionsPage currentRole={currentRole} />
          )}

          {currentPage === 'REPORTS' && (
            <ReportsPage currentRole={currentRole} />
          )}

          {currentPage === 'SETTINGS' && (
            <SettingsPage currentRole={currentRole} />
          )}

          {currentPage === 'ADMIN_USERS' && (
            <AdminUsersPage currentRole={currentRole} />
          )}

          {currentPage === 'AUDIT_LOG' && (
            <AuditLogPage />
          )}
        </main>
      </div>
    </div>
  );
}
