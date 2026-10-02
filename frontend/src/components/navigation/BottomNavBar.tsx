import React from 'react';
import { BottomNavTab } from '../../types/quiz';
import { Home, Trophy, Award, User } from 'lucide-react';
import { sound } from '../../services/soundService';

interface BottomNavBarProps {
  activeTab: BottomNavTab;
  onTabChange: (tab: BottomNavTab) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onTabChange }) => {
  const tabs: Array<{ id: BottomNavTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'HOME', label: 'HOME', icon: Home },
    { id: 'GAME', label: 'GAME', icon: Trophy },
    { id: 'LEADERBOARD', label: 'LEADERBOARD', icon: Award },
    { id: 'PROFILE', label: 'PROFILE', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/98 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] select-none">
      <div className="max-w-md mx-auto h-16 flex items-center justify-around px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                sound.playTap();
                onTabChange(tab.id);
              }}
              className={`flex-1 h-12 mx-1 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200 active:scale-95 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/25 ring-1 ring-emerald-500/30'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white stroke-[2.5]' : 'stroke-[2]'}`} />
              <span className={`text-[10px] font-black uppercase tracking-wider leading-none ${isActive ? 'text-white' : 'text-slate-600'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
