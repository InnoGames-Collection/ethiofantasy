import React from 'react';
import { EthioLeaderboardEntry } from '../../types/quiz';
import { Trophy, Award, Shield, User } from 'lucide-react';

interface LeaderboardTabProps {
  top10: EthioLeaderboardEntry[];
  userPosition: EthioLeaderboardEntry | null;
  currentUserMaskedMsisdn: string;
}

export const LeaderboardTab: React.FC<LeaderboardTabProps> = ({
  top10,
  userPosition,
  currentUserMaskedMsisdn,
}) => {
  return (
    <div className="w-full flex flex-col space-y-4 pb-20 select-none">
      {/* Header Banner */}
      <div className="w-full p-5 rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white shadow-md flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase text-amber-300 tracking-wider">
            <Trophy className="w-4 h-4 fill-amber-300" />
            <span>7-DAY COMPETITION</span>
          </div>
          <h2 className="text-xl font-black tracking-tight mt-1">
            Top 10 Leaderboard
          </h2>
          <span className="text-xs text-blue-100 mt-0.5">
            Ranked strictly by 7-Day Cumulative Score
          </span>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl">
          🥇
        </div>
      </div>

      {/* Top 10 Ranking Table Card */}
      <div className="w-full bg-white rounded-3xl border border-blue-100 shadow-md overflow-hidden">
        <div className="px-4 py-3 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between text-[11px] font-black uppercase text-blue-900 tracking-wider">
          <span className="w-12">RANK</span>
          <span className="flex-1">PLAYER (MSISDN)</span>
          <span className="text-right">7-DAY SCORE</span>
        </div>

        {top10.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-bold text-xs">
            NO RANKINGS YET
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {top10.map((entry) => {
              const isCurrentUser = entry.maskedMsisdn === currentUserMaskedMsisdn;

              let rankBadge = (
                <span className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 font-extrabold text-xs flex items-center justify-center">
                  #{entry.rank}
                </span>
              );

              if (entry.rank === 1) {
                rankBadge = (
                  <span className="w-7 h-7 rounded-xl bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center shadow-xs">
                    🥇
                  </span>
                );
              } else if (entry.rank === 2) {
                rankBadge = (
                  <span className="w-7 h-7 rounded-xl bg-slate-300 text-slate-800 font-black text-xs flex items-center justify-center shadow-xs">
                    🥈
                  </span>
                );
              } else if (entry.rank === 3) {
                rankBadge = (
                  <span className="w-7 h-7 rounded-xl bg-amber-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    🥉
                  </span>
                );
              }

              return (
                <div
                  key={entry.rank}
                  className={`p-3.5 flex items-center justify-between transition-colors ${
                    isCurrentUser ? 'bg-blue-50/90 font-bold' : 'hover:bg-slate-50/50'
                  }`}
                >
                  {/* Rank */}
                  <div className="w-12 shrink-0">{rankBadge}</div>

                  {/* Masked MSISDN (NO NAMES, NO PICTURES) */}
                  <div className="flex-1 flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-slate-800 tracking-wider">
                      {entry.maskedMsisdn}
                    </span>
                    {isCurrentUser && (
                      <span className="text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-full">
                        YOU
                      </span>
                    )}
                  </div>

                  {/* 7-Day Score */}
                  <div className="text-right">
                    <span className="text-xs font-black text-blue-900 tabular-nums">
                      {(entry.sevenDayScore ?? (entry as any).score ?? 0).toLocaleString()}{' '}
                      <span className="text-[10px] text-blue-700 font-bold">pts</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SEPARATE "YOUR POSITION" CARD IF OUTSIDE TOP 10 */}
      {userPosition && (
        <div className="w-full p-4 rounded-3xl bg-blue-50 border-2 border-blue-300 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-2xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
              #{userPosition.rank}
            </span>

            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-blue-800 tracking-wider">
                YOUR POSITION
              </span>
              <span className="font-mono text-xs font-black text-slate-900">
                {userPosition.maskedMsisdn}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-sm font-black text-blue-950 tabular-nums">
              {(userPosition.sevenDayScore ?? (userPosition as any).score ?? 0).toLocaleString()}{' '}
              <span className="text-xs text-blue-700 font-bold">pts</span>
            </span>
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="w-full p-3 rounded-2xl bg-white border border-slate-100 text-center flex items-center justify-center gap-2 text-[11px] text-slate-400">
        <Shield className="w-3.5 h-3.5 text-slate-400" />
        <span>Only masked mobile numbers are displayed to protect customer privacy.</span>
      </div>
    </div>
  );
};
