import React from 'react';
import {
  X,
  Home,
  Trophy,
  Flame,
  Award,
  User,
  BarChart3,
  CreditCard,
  Settings,
  HelpCircle,
  FileQuestion,
  FileText,
  Shield,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { sound } from '../../services/soundService';

export type HamburgerNavigationTarget =
  | 'HOME'
  | 'GAME'
  | 'DAILY_CHALLENGE'
  | 'LEADERBOARD'
  | 'PROFILE'
  | 'STATISTICS'
  | 'SUBSCRIPTION'
  | 'SETTINGS'
  | 'HELP'
  | 'FAQ'
  | 'TERMS'
  | 'PRIVACY'
  | 'LOGOUT';

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (target: HamburgerNavigationTarget) => void;
  maskedMsisdn: string;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  isOpen,
  onClose,
  onNavigate,
  maskedMsisdn,
}) => {
  if (!isOpen) return null;

  const menuSections = [
    {
      title: 'MAIN DESTINATIONS',
      items: [
        { id: 'HOME' as const, label: 'Home', icon: Home, color: 'text-blue-600' },
        { id: 'GAME' as const, label: 'Game (Football Quiz)', icon: Trophy, color: 'text-emerald-600' },
        { id: 'DAILY_CHALLENGE' as const, label: 'Daily Challenge', icon: Flame, color: 'text-amber-500' },
        { id: 'LEADERBOARD' as const, label: 'Leaderboard', icon: Award, color: 'text-indigo-600' },
        { id: 'PROFILE' as const, label: 'Profile', icon: User, color: 'text-slate-700' },
      ],
    },
    {
      title: 'PERFORMANCE & SERVICE',
      items: [
        { id: 'STATISTICS' as const, label: 'Statistics', icon: BarChart3, color: 'text-blue-600' },
        { id: 'SUBSCRIPTION' as const, label: 'Subscription', icon: CreditCard, color: 'text-emerald-600' },
        { id: 'SETTINGS' as const, label: 'Settings', icon: Settings, color: 'text-slate-600' },
        { id: 'HELP' as const, label: 'Help & Support', icon: HelpCircle, color: 'text-sky-600' },
      ],
    },
    {
      title: 'INFORMATION & LEGAL',
      items: [
        { id: 'FAQ' as const, label: 'FAQ', icon: FileQuestion, color: 'text-amber-600' },
        { id: 'TERMS' as const, label: 'Terms & Conditions', icon: FileText, color: 'text-slate-600' },
        { id: 'PRIVACY' as const, label: 'Privacy Policy', icon: Shield, color: 'text-emerald-600' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex select-none animate-fadeIn">
      {/* Backdrop */}
      <div
        onClick={() => {
          sound.playTap();
          onClose();
        }}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-xs h-full bg-white shadow-2xl flex flex-col justify-between z-10 overflow-y-auto">
        {/* Drawer Header */}
        <div className="p-5 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-xl shadow-xs">
              ⚽
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black uppercase tracking-wider">
                EthioFantasy
              </span>
              <span className="text-[11px] font-mono text-blue-200">
                {maskedMsisdn}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playTap();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white active:scale-95 transition-all cursor-pointer"
            title="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Navigation Items */}
        <div className="p-4 space-y-5 flex-1 overflow-y-auto">
          {menuSections.map((section, idx) => (
            <div key={idx} className="space-y-1.5">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider px-2">
                {section.title}
              </span>

              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        sound.playTap();
                        onClose();
                        onNavigate(item.id);
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-blue-50/70 text-slate-800 transition-colors active:scale-98 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-white flex items-center justify-center shadow-2xs">
                          <Icon className={`w-4 h-4 ${item.color}`} />
                        </div>
                        <span className="text-xs font-bold text-slate-800">
                          {item.label}
                        </span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Log Out Button */}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                sound.playTap();
                onClose();
                onNavigate('LOGOUT');
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl text-rose-600 hover:bg-rose-50 transition-colors active:scale-98 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center">
                  <LogOut className="w-4 h-4 text-rose-600" />
                </div>
                <span className="text-xs font-black">Log Out</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-rose-300" />
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 text-center">
          <p className="text-[10px] font-bold text-slate-400">
            Ethio Telecom · EthioFantasy v2.1.0
          </p>
          <p className="text-[9px] text-slate-400">
            Official 2 Birr/day Digital Entertainment Service
          </p>
        </div>
      </div>
    </div>
  );
};
