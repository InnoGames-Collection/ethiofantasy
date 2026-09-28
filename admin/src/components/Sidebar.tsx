import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Trophy,
  Award,
  Users,
  BookOpen,
  PhoneCall,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
  ClipboardList,
  LogOut,
  ChevronDown,
  Database,
  Radio,
} from 'lucide-react';
import { AdminUser, AdminRole } from '../types';

export type NavPage =
  | 'DASHBOARD'
  | 'DAILY_CHALLENGE'
  | 'WEEKLY_COMPETITION'
  | 'PRIZES_WINNERS'
  | 'PLAYERS'
  | 'LEVELS_QUESTIONS'
  | 'SUBSCRIPTIONS'
  | 'REPORTS'
  | 'SETTINGS'
  | 'ADMIN_USERS'
  | 'AUDIT_LOG';

interface SidebarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  currentAdmin: AdminUser | null;
  availableAdmins: AdminUser[];
  onSwitchAdmin: (adminId: string) => void;
  systemMode: 'DEMO' | 'PRODUCTION';
  onToggleMode: (mode: 'DEMO' | 'PRODUCTION') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  currentAdmin,
  availableAdmins,
  onSwitchAdmin,
  systemMode,
  onToggleMode,
}) => {
  const [showAdminMenu, setShowAdminMenu] = React.useState(false);

  const getRoleBadge = (role: AdminRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="text-[10px] bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 px-1.5 py-0.5 rounded font-mono">SUPER ADMIN</span>;
      case 'OPERATIONS_ADMIN':
        return <span className="text-[10px] bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono">OPS ADMIN</span>;
      case 'REPORTING_ADMIN':
        return <span className="text-[10px] bg-amber-500/20 text-amber-200 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono">REPORTING</span>;
    }
  };

  const navItemClass = (page: NavPage) => {
    const isActive = currentPage === page;
    return `w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? 'bg-blue-600 text-white shadow-xs font-semibold'
        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
    }`;
  };

  return (
    <aside className="w-64 bg-[#0a192f] text-slate-100 flex flex-col h-screen shrink-0 select-none border-r border-slate-800 z-20">
      {/* Brand & Telecom Identification */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-inner tracking-wider">
            EF
          </div>
          <div>
            <div className="font-bold text-base tracking-tight text-white flex items-center space-x-1.5">
              <span>ETHIOFANTASY</span>
            </div>
            <div className="text-[11px] text-emerald-400 font-mono tracking-wide font-medium flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>ADMIN PORTAL</span>
            </div>
          </div>
        </div>

        {/* Operating Mode Indicator & Switch */}
        <div className="mt-3.5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5 text-slate-400">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono text-[11px]">DATASET:</span>
          </div>
          <button
            onClick={() => onToggleMode(systemMode === 'DEMO' ? 'PRODUCTION' : 'DEMO')}
            title="Click to switch between Demo Data and clean Production mode"
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider transition-all border ${
              systemMode === 'DEMO'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
            }`}
          >
            {systemMode === 'DEMO' ? 'DEMO DATA' : 'PRODUCTION'}
          </button>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
        {/* Main Dashboard */}
        <div>
          <button
            onClick={() => onNavigate('DASHBOARD')}
            className={navItemClass('DASHBOARD')}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0 text-blue-400" />
            <span>Dashboard</span>
          </button>
        </div>

        {/* OPERATIONS Group */}
        <div>
          <div className="px-3 text-[11px] font-bold font-mono tracking-wider uppercase text-slate-400 mb-2">
            Operations
          </div>
          <div className="space-y-1">
            <button
              onClick={() => onNavigate('DAILY_CHALLENGE')}
              className={navItemClass('DAILY_CHALLENGE')}
            >
              <CalendarDays className="w-4 h-4 shrink-0 text-slate-400" />
              <span>Daily Challenge</span>
            </button>
            <button
              onClick={() => onNavigate('WEEKLY_COMPETITION')}
              className={navItemClass('WEEKLY_COMPETITION')}
            >
              <Trophy className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Weekly Competition</span>
            </button>
            <button
              onClick={() => onNavigate('PRIZES_WINNERS')}
              className={navItemClass('PRIZES_WINNERS')}
            >
              <Award className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Prizes & Winners</span>
            </button>
          </div>
        </div>

        {/* USERS Group */}
        <div>
          <div className="px-3 text-[11px] font-bold font-mono tracking-wider uppercase text-slate-400 mb-2">
            Users
          </div>
          <div className="space-y-1">
            <button
              onClick={() => onNavigate('PLAYERS')}
              className={navItemClass('PLAYERS')}
            >
              <Users className="w-4 h-4 shrink-0 text-slate-400" />
              <span>Players</span>
            </button>
          </div>
        </div>

        {/* GAME Group */}
        <div>
          <div className="px-3 text-[11px] font-bold font-mono tracking-wider uppercase text-slate-400 mb-2">
            Game
          </div>
          <div className="space-y-1">
            <button
              onClick={() => onNavigate('LEVELS_QUESTIONS')}
              className={navItemClass('LEVELS_QUESTIONS')}
            >
              <BookOpen className="w-4 h-4 shrink-0 text-slate-400" />
              <span>Levels & Questions</span>
            </button>
          </div>
        </div>

        {/* SERVICE Group */}
        <div>
          <div className="px-3 text-[11px] font-bold font-mono tracking-wider uppercase text-slate-400 mb-2">
            Service
          </div>
          <div className="space-y-1">
            <button
              onClick={() => onNavigate('SUBSCRIPTIONS')}
              className={navItemClass('SUBSCRIPTIONS')}
            >
              <PhoneCall className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Subscriptions</span>
            </button>
          </div>
        </div>

        {/* REPORTS Group */}
        <div>
          <div className="px-3 text-[11px] font-bold font-mono tracking-wider uppercase text-slate-400 mb-2">
            Reports
          </div>
          <div className="space-y-1">
            <button
              onClick={() => onNavigate('REPORTS')}
              className={navItemClass('REPORTS')}
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0 text-blue-400" />
              <span>Reports</span>
            </button>
          </div>
        </div>

        {/* SYSTEM Group */}
        <div>
          <div className="px-3 text-[11px] font-bold font-mono tracking-wider uppercase text-slate-400 mb-2">
            System
          </div>
          <div className="space-y-1">
            <button
              onClick={() => onNavigate('SETTINGS')}
              className={navItemClass('SETTINGS')}
            >
              <Settings className="w-4 h-4 shrink-0 text-slate-400" />
              <span>Settings</span>
            </button>
            <button
              onClick={() => onNavigate('ADMIN_USERS')}
              className={navItemClass('ADMIN_USERS')}
            >
              <ShieldCheck className="w-4 h-4 shrink-0 text-slate-400" />
              <span>Admin Users</span>
            </button>
            <button
              onClick={() => onNavigate('AUDIT_LOG')}
              className={navItemClass('AUDIT_LOG')}
            >
              <ClipboardList className="w-4 h-4 shrink-0 text-slate-400" />
              <span>Audit Log</span>
            </button>
          </div>
        </div>
      </div>

      {/* Operator Session / Admin Footer */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-900/60 relative">
        <div
          onClick={() => setShowAdminMenu(!showAdminMenu)}
          className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
        >
          <div className="min-w-0 pr-2">
            <div className="text-xs font-semibold text-white truncate">
              {currentAdmin?.name || 'Administrator'}
            </div>
            <div className="flex items-center space-x-1.5 mt-0.5">
              {currentAdmin && getRoleBadge(currentAdmin.role)}
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        </div>

        {/* Admin Switch Menu popup */}
        {showAdminMenu && (
          <div className="absolute bottom-16 left-3 right-3 bg-[#0d213f] border border-slate-700 rounded-xl shadow-2xl p-2 z-30 space-y-1">
            <div className="px-2 py-1 text-[10px] font-mono text-slate-400 border-b border-slate-700/60 uppercase">
              Switch Admin Role (RBAC Simulation)
            </div>
            {availableAdmins.map((adm) => (
              <button
                key={adm.id}
                onClick={() => {
                  onSwitchAdmin(adm.id);
                  setShowAdminMenu(false);
                }}
                className={`w-full text-left p-2 rounded text-xs transition-colors flex items-center justify-between ${
                  currentAdmin?.id === adm.id
                    ? 'bg-blue-600/40 text-white font-medium'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="truncate">
                  <div className="font-semibold text-white truncate">{adm.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{adm.department}</div>
                </div>
                {getRoleBadge(adm.role)}
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
