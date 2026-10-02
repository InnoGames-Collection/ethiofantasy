import React from 'react';
import { Menu } from 'lucide-react';
import { sound } from '../../services/soundService';

interface AppShellHeaderProps {
  onOpenMenu: () => void;
  title?: string;
  subtitle?: string;
}

export const AppShellHeader: React.FC<AppShellHeaderProps> = ({
  onOpenMenu,
  title = 'EthioFantasy',
  subtitle = 'Ethio Telecom Official Service',
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs select-none">
      <div className="max-w-md mx-auto px-4 h-15 flex items-center justify-between">
        {/* Ethio Telecom / EthioFantasy Brand Branding */}
        <div className="flex items-center gap-2.5">
          {/* Ethio Telecom Inspired Logo Icon */}
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#005cb9] via-[#0089cf] to-[#78be20] p-0.5 shadow-md shadow-blue-900/10 flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center font-black text-sm">
              <span className="text-transparent bg-clip-text bg-gradient-to-tr from-[#005cb9] to-[#78be20]">
                ⚽
              </span>
            </div>
          </div>

          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-[#005cb9] tracking-tight uppercase">
                {title}
              </span>
              <span className="text-[9px] font-black bg-[#78be20]/20 text-[#4c8010] px-1.5 py-0.2 rounded-sm uppercase tracking-wider">
                Ethio Telecom
              </span>
            </div>
            <span className="text-[10px] font-semibold text-slate-500 -mt-0.5">
              {subtitle}
            </span>
          </div>
        </div>

        {/* Hamburger Menu Button (NO COINS, NO WALLET, NO BUY COINS) */}
        <button
          onClick={() => {
            sound.playTap();
            onOpenMenu();
          }}
          className="w-10 h-10 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 active:scale-95 transition-all cursor-pointer shadow-2xs"
          title="Open Menu"
        >
          <Menu className="w-5 h-5 text-slate-800 stroke-[2.2]" />
        </button>
      </div>
    </header>
  );
};
