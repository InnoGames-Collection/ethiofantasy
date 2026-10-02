import React, { useState } from 'react';
import { LevelData, UserProgress, MainTab, LeaderboardEntry } from '../../types/quiz';
import { HeaderHud } from '../common/HeaderHud';
import { sound } from '../../services/soundService';
import { Lock, Play, Star, Trophy, Volume2, VolumeX, RotateCcw, AlertCircle, Award, ShieldCheck } from 'lucide-react';

interface LevelSelectScreenProps {
  levels: LevelData[];
  userProgress: UserProgress;
  currentUserMaskedMsisdn?: string;
  onSelectLevel: (level: LevelData) => void;
  onResetProgress?: () => void;
  onToggleSound: () => void;
  onOpenAdminQuestionBank?: () => void;
}

export const LevelSelectScreen: React.FC<LevelSelectScreenProps> = ({
  levels,
  userProgress,
  currentUserMaskedMsisdn,
  onSelectLevel,
  onResetProgress,
  onToggleSound,
  onOpenAdminQuestionBank,
}) => {
  const [activeTab, setActiveTab] = useState<MainTab>('levels');
  const [lockedToastMessage, setLockedToastMessage] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Leaderboard mock data with EthioFantasy styling (Only masked MSISDNs, NO NAMES)
  const leaderboardData: LeaderboardEntry[] = [
    { rank: 1, maskedMsisdn: '251*****849', score: 9850, levelsCompleted: 88, avatar: '🇪🇹' },
    { rank: 2, maskedMsisdn: '251*****672', score: 8720, levelsCompleted: 75, avatar: '⚽' },
    { rank: 3, maskedMsisdn: '251*****401', score: 7940, levelsCompleted: 68, avatar: '🦁' },
    { rank: 4, maskedMsisdn: '251*****955', score: 6800, levelsCompleted: 54, avatar: '🥇' },
    { rank: 5, maskedMsisdn: currentUserMaskedMsisdn || '251*****122', score: userProgress.score, levelsCompleted: userProgress.completedLevelIds.length, avatar: '👤', isCurrentUser: true },
    { rank: 6, maskedMsisdn: '251*****318', score: 5400, levelsCompleted: 42, avatar: '⭐' },
    { rank: 7, maskedMsisdn: '251*****562', score: 4890, levelsCompleted: 39, avatar: '🏃' },
    { rank: 8, maskedMsisdn: '251*****780', score: 4200, levelsCompleted: 31, avatar: '🎯' },
  ].sort((a, b) => (b.isCurrentUser ? userProgress.score : b.score) - (a.isCurrentUser ? userProgress.score : a.score))
   .map((entry, idx) => ({ ...entry, rank: idx + 1 }));

  // Handle Level Card click
  const handleCardClick = (level: LevelData) => {
    const isUnlocked = userProgress.unlockedLevelIds.includes(level.id);

    if (isUnlocked) {
      sound.playTap();
      onSelectLevel(level);
    } else {
      // Locked level (Requirement #3: Show "COMPLETE LEVEL X TO UNLOCK")
      sound.playWrong();
      const prevLevelNum = level.levelNumber - 1;
      setLockedToastMessage(`Complete Level ${prevLevelNum} to unlock this level!`);

      setTimeout(() => {
        setLockedToastMessage(null);
      }, 2500);
    }
  };

  return (
    // BRIGHT, CLEAN ETHIOFANTASY PALETTE (White, Blue, Green)
    <div className="min-h-screen w-full bg-gradient-to-b from-[#edf5ff] via-[#f7fbff] to-[#e8f3fe] text-slate-800 flex flex-col justify-between relative overflow-x-hidden select-none">
      {/* Top HUD */}
      <div className="w-full max-w-md mx-auto sticky top-0 z-40 bg-white/95 backdrop-blur-md">
        <HeaderHud
          mode="level_select"
          stars={userProgress.stars}
          score={userProgress.score}
        />

        {/* 3 Main Destinations: LEVELS, LEADERBOARD, SETTINGS (Requirement #21) */}
        <div className="w-full px-4 pt-2 pb-2.5 bg-white border-b border-blue-100 flex items-center justify-around">
          <button
            onClick={() => {
              sound.playTap();
              setActiveTab('levels');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'levels'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-blue-700'
            }`}
          >
            LEVELS
          </button>

          <button
            onClick={() => {
              sound.playTap();
              setActiveTab('leaderboard');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-blue-700'
            }`}
          >
            LEADERBOARD
          </button>

          <button
            onClick={() => {
              sound.playTap();
              setActiveTab('settings');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-blue-700'
            }`}
          >
            SETTINGS
          </button>
        </div>
      </div>

      {/* Floating Locked Notice Toast */}
      {lockedToastMessage && (
        <div className="fixed top-28 inset-x-4 z-50 max-w-sm mx-auto p-3 rounded-2xl bg-rose-600 text-white shadow-xl flex items-center gap-2.5 animate-bounce">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-xs font-bold leading-tight">
            {lockedToastMessage}
          </span>
        </div>
      )}

      {/* TAB 1: LEVELS (Exactly 100 Sequential Levels - Requirements #1, #2, #3, #4) */}
      {activeTab === 'levels' && (
        <div className="w-full max-w-md mx-auto px-4 flex-1 flex flex-col pt-3 pb-24">
          {/* Header Stats Banner */}
          <div className="w-full p-4 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-200">
                CAMPAIGN PROGRESSION
              </span>
              <h2 className="text-lg font-black tracking-tight">
                100 Championship Levels
              </h2>
              <span className="text-xs text-blue-100 mt-0.5">
                {userProgress.unlockedLevelIds.length} of 100 Levels Unlocked
              </span>
            </div>

            {/* Circular Progress Badge */}
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex flex-col items-center justify-center">
              <span className="text-xs font-black text-amber-300">
                {userProgress.unlockedLevelIds.length}%
              </span>
              <span className="text-[9px] text-blue-100 font-bold uppercase">
                DONE
              </span>
            </div>
          </div>

          {/* List of 100 Levels */}
          <div className="w-full space-y-2.5">
            {levels.map((level) => {
              const isUnlocked = userProgress.unlockedLevelIds.includes(level.id);
              const isCompleted = userProgress.completedLevelIds.includes(level.id);
              const starsEarned = userProgress.levelStars[level.id] || 0;
              const levelScore = userProgress.levelScores[level.id] || 0;

              return (
                <div
                  key={level.id}
                  onClick={() => handleCardClick(level)}
                  className={`relative w-full rounded-2xl p-3.5 transition-all duration-200 border cursor-pointer ${
                    isUnlocked
                      ? isCompleted
                        ? 'bg-white hover:bg-emerald-50/40 border-emerald-300 shadow-xs hover:border-emerald-400'
                        : 'bg-white hover:bg-blue-50/50 border-blue-300 shadow-md ring-2 ring-blue-500/20'
                      : 'bg-slate-100 border-slate-200 opacity-65 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Level Number & Icon */}
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shadow-xs ${
                        isUnlocked
                          ? isCompleted
                            ? 'bg-emerald-600 text-white'
                            : 'bg-blue-600 text-white'
                          : 'bg-slate-300 text-slate-500'
                      }`}>
                        {level.levelNumber}
                      </div>

                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-black uppercase tracking-wider ${
                            isUnlocked ? 'text-blue-700' : 'text-slate-500'
                          }`}>
                            LEVEL {level.levelNumber}
                          </span>
                          {isCompleted && (
                            <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-sm">
                              COMPLETED
                            </span>
                          )}
                        </div>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                          {level.title}
                        </h3>
                        <span className="text-[11px] text-slate-500 line-clamp-1">
                          {level.subtitle}
                        </span>
                      </div>
                    </div>

                    {/* Right: Unlocked Play Action vs Locked Padlock (Requirement #2) */}
                    <div className="shrink-0 flex items-center">
                      {isUnlocked ? (
                        <div className="flex items-center gap-2">
                          {starsEarned > 0 && (
                            <div className="flex items-center gap-0.5 text-amber-500 font-bold text-xs bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                              <span>{starsEarned}</span>
                              <Star className="w-3.5 h-3.5 fill-amber-400" />
                            </div>
                          )}
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs ${
                            isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-600 text-white'
                          }`}>
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          </div>
                        </div>
                      ) : (
                        // Real Locked Visual State (Requirement #2)
                        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-200 border border-slate-300 text-slate-500">
                          <Lock className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold uppercase">Locked</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: LEADERBOARD (Requirement #21) */}
      {activeTab === 'leaderboard' && (
        <div className="w-full max-w-md mx-auto px-4 flex-1 flex flex-col pt-3 pb-24">
          <div className="w-full p-4 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-200">
                ETHIOFANTASY RANKINGS
              </span>
              <h2 className="text-lg font-black tracking-tight">
                Top Football Quiz Masters
              </h2>
              <span className="text-xs text-emerald-100 mt-0.5">
                Compete with fans across Ethiopia
              </span>
            </div>
            <Award className="w-10 h-10 text-yellow-300" />
          </div>

          <div className="w-full bg-white rounded-3xl border border-blue-100 shadow-xs overflow-hidden">
            {leaderboardData.map((player) => (
              <div
                key={player.rank}
                className={`p-3.5 flex items-center justify-between border-b border-slate-100 ${
                  player.isCurrentUser ? 'bg-blue-50/80 font-bold' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 text-center font-black text-xs ${
                    player.rank === 1 ? 'text-amber-500 font-extrabold text-sm' :
                    player.rank === 2 ? 'text-slate-400 font-extrabold text-sm' :
                    player.rank === 3 ? 'text-amber-700 font-extrabold text-sm' : 'text-slate-500'
                  }`}>
                    #{player.rank}
                  </span>

                  <span className="text-xl">{player.avatar}</span>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-slate-900 tracking-wider">
                        {player.maskedMsisdn}
                      </span>
                      {player.isCurrentUser && (
                        <span className="text-[9px] font-black bg-blue-600 text-white px-1.5 py-0.2 rounded-full">
                          YOU
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {player.levelsCompleted} Levels Completed
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-xs font-black text-blue-900 tabular-nums">
                    {player.score} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SETTINGS (Requirement #21) */}
      {activeTab === 'settings' && (
        <div className="w-full max-w-md mx-auto px-4 flex-1 flex flex-col pt-3 pb-24">
          <div className="w-full p-4 rounded-3xl bg-white border border-blue-100 shadow-xs space-y-4">
            <h2 className="text-sm font-black text-blue-900 uppercase tracking-wider mb-2">
              Game Settings & Audio
            </h2>

            {/* Sound Toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                {userProgress.soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-blue-600" />
                ) : (
                  <VolumeX className="w-5 h-5 text-slate-400" />
                )}
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Sound Effects</h4>
                  <p className="text-[10px] text-slate-500">Whistles, cheers, and feedback audio</p>
                </div>
              </div>

              <button
                onClick={() => {
                  sound.playTap();
                  onToggleSound();
                }}
                className={`w-12 h-7 rounded-full p-1 transition-colors ${
                  userProgress.soundEnabled ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    userProgress.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Permanent Progression Invariant Indicator */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <h4 className="text-xs font-black text-emerald-950 uppercase tracking-tight">
                  Permanent Level Progression
                </h4>
                <p className="text-[11px] text-emerald-800 leading-snug mt-0.5">
                  Once unlocked, levels remain unlocked permanently. All completed levels can be replayed at any time without relocking.
                </p>
              </div>
            </div>

            {/* Admin Question Bank Preview Button */}
            {onOpenAdminQuestionBank && (
              <button
                onClick={() => {
                  sound.playTap();
                  onOpenAdminQuestionBank();
                }}
                className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer border border-slate-700"
              >
                <span>Admin Question Bank Preview</span>
              </button>
            )}

            {/* Service info */}
            <div className="pt-3 border-t border-slate-100 flex flex-col items-center text-center">
              <span className="text-xs font-black text-blue-900">
                EthioFantasy Football Quiz
              </span>
              <span className="text-[11px] text-slate-500">
                Version 2.0.0 · 100 Championship Levels
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
