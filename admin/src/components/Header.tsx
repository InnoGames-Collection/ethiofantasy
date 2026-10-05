import { RefreshCw, Radio, Phone, Shield, LogOut } from 'lucide-react';
import { AdminUser } from '../types';

interface HeaderProps {
  title: string;
  subtitle: string;
  onRefresh: () => void;
  isRefreshing?: boolean;
  currentAdmin: AdminUser | null;
  systemMode: 'DEMO' | 'PRODUCTION';
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onRefresh,
  isRefreshing = false,
  currentAdmin,
  systemMode,
  onLogout,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-xs">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
          <span>{title}</span>
          {systemMode === 'DEMO' && (
            <span className="text-[10px] font-mono uppercase bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full font-bold">
              Demo Dataset Active
            </span>
          )}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>

      <div className="flex items-center space-x-4">
        {/* Ethio Telecom Info pill */}
        <div className="hidden lg:flex items-center space-x-2 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600">
          <Phone className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-medium text-slate-800">Shortcode: 9401</span>
          <span className="text-slate-300">|</span>
          <span className="text-emerald-700 font-semibold">2 Birr/Day</span>
        </div>

        {/* Admin identifier */}
        <div className="flex items-center space-x-2 text-xs bg-blue-50/70 border border-blue-100 px-3 py-1.5 rounded-lg text-blue-900">
          <Shield className="w-3.5 h-3.5 text-blue-700" />
          <span className="font-semibold">{currentAdmin?.name || 'Administrator'}</span>
          <span className="text-blue-500 font-mono text-[10px]">({currentAdmin?.role})</span>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh Authoritative Data"
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
        </button>

        {/* Sign Out button */}
        {onLogout && (
          <button
            onClick={onLogout}
            title="Terminate Administrative Session"
            className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200 flex items-center space-x-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
