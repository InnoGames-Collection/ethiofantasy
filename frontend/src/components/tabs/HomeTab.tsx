import React, { useState } from 'react';
import { UserProfile, DailyChallengeState, UserProgress } from '../../types/quiz';
import { sound } from '../../services/soundService';
import { EthioFantasyLogo } from '../common/EthioFantasyLogo';
import {
  Trophy,
  Calendar,
  CheckCircle2,
  Play,
  ChevronRight,
  ChevronDown,
  Award,
  Flame,
  Star,
  ShieldCheck,
  Menu,
  X,
  Globe,
  Volume2,
  VolumeX,
  HelpCircle,
  FileText,
  LogOut,
  Eye,
  Lock,
  ImageIcon,
} from 'lucide-react';
import { OFFICIAL_FAQ_ITEMS, OFFICIAL_TERMS_SECTIONS } from '../../data/ethioFantasyLegal';

interface HomeTabProps {
  userProfile: UserProfile;
  dailyState: DailyChallengeState;
  onPlayDailyChallenge: () => void;
  onOpenDailyReview?: () => void;
  onOpenFootballQuiz: () => void;
  onOpenLeaderboard: () => void;
  currentLevelNumber: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  language: 'en' | 'am' | 'om';
  onUpdateLanguage: (lang: 'en' | 'am' | 'om') => void;
  onLogout?: () => void;
  onOpenAdminQuestionBank?: () => void;
}

type HomeModalType = 'FAQ' | 'TERMS' | 'LANGUAGE' | null;

export const HomeTab: React.FC<HomeTabProps> = ({
  userProfile,
  dailyState,
  onPlayDailyChallenge,
  onOpenDailyReview,
  onOpenFootballQuiz,
  onOpenLeaderboard,
  currentLevelNumber,
  soundEnabled,
  onToggleSound,
  language,
  onUpdateLanguage,
  onLogout,
  onOpenAdminQuestionBank,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<HomeModalType>(null);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  return (
    <div className="w-full flex flex-col space-y-4 pb-20 select-none">
      {/* ============================================================== */}
      {/* TOP HOME HEADER (POST-LOGIN): [ MENU (LEFT) ]     [ ETHIOFANTASY LOGO (RIGHT) ] */}
      {/* ============================================================== */}
      <header className="w-full pt-1 pb-2 flex items-center justify-between border-b border-slate-100">
        {/* Working 3-line Hamburger Menu Button on TOP LEFT (Post-Login) */}
        <div className="relative">
          <button
            onClick={() => {
              sound.playTap();
              setIsMenuOpen((prev) => !prev);
            }}
            aria-label="Open menu"
            className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 border border-slate-200 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
          >
            {isMenuOpen ? (
              <X className="w-5 h-5 text-slate-800" />
            ) : (
              <>
                <span className="w-5 h-0.5 bg-slate-800 rounded-full" />
                <span className="w-5 h-0.5 bg-slate-800 rounded-full" />
                <span className="w-5 h-0.5 bg-slate-800 rounded-full" />
              </>
            )}
          </button>

          {/* Compact Dropdown Menu (opens from top-left) */}
          {isMenuOpen && (
            <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-2xl py-2 z-40 animate-fadeIn divide-y divide-slate-100">
              {/* Language Selection: English / Amharic / Oromo */}
              <div className="px-3 py-1.5 space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider px-2">
                  Language
                </span>
                {[
                  { id: 'en' as const, label: 'English', native: 'English' },
                  { id: 'am' as const, label: 'Amharic', native: 'አማርኛ' },
                  { id: 'om' as const, label: 'Oromo', native: 'Afaan Oromoo' },
                ].map((item) => {
                  const isSelected = language === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        sound.playTap();
                        onUpdateLanguage(item.id);
                        setIsMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 rounded-xl flex items-center justify-between text-left text-xs font-bold transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 text-blue-700 font-black'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{item.label}</span>
                        <span className="text-[11px] text-slate-400 font-medium">({item.native})</span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                    </button>
                  );
                })}
              </div>

              {/* Settings / Info */}
              <div className="px-3 py-1.5 space-y-1">
                {/* Sound */}
                <button
                  onClick={() => {
                    sound.playTap();
                    onToggleSound();
                  }}
                  className="w-full px-3 py-2 rounded-xl flex items-center justify-between text-left hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    {soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-slate-400" />
                    )}
                    <span>Sound Effects</span>
                  </div>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                      soundEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {soundEnabled ? 'ON' : 'OFF'}
                  </span>
                </button>

                {/* FAQ */}
                <button
                  onClick={() => {
                    sound.playTap();
                    setIsMenuOpen(false);
                    setActiveModal('FAQ');
                  }}
                  className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 text-left hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4 text-amber-500" />
                  <span>FAQ</span>
                </button>

                {/* Terms */}
                <button
                  onClick={() => {
                    sound.playTap();
                    setIsMenuOpen(false);
                    setActiveModal('TERMS');
                  }}
                  className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 text-left hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Terms & Conditions</span>
                </button>

                {/* Admin Question Bank (Image Registry Preview) */}
                {onOpenAdminQuestionBank && (
                  <button
                    onClick={() => {
                      sound.playTap();
                      setIsMenuOpen(false);
                      onOpenAdminQuestionBank();
                    }}
                    className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 text-left hover:bg-purple-50 text-xs font-bold text-purple-700 cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 text-purple-600" />
                    <span>Admin Question Bank</span>
                  </button>
                )}
              </div>

              {/* Log Out at the bottom */}
              <div className="p-2 pt-2">
                <button
                  onClick={() => {
                    sound.playTap();
                    setIsMenuOpen(false);
                    if (onLogout) {
                      onLogout();
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-rose-500">Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Post-Login EthioFantasy Logo (Right) */}
        <EthioFantasyLogo size="md" />
      </header>

      {/* Menu overlay backdrop */}
      {isMenuOpen && (
        <div
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 z-20 bg-transparent"
        />
      )}

      {/* HERO CARD: DAILY CHALLENGE (COMPETITION SYSTEM) */}
      <div className="w-full rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-blue-800 text-white p-5 shadow-xl shadow-emerald-950/15 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col">
          {/* Header Tag */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 border border-white/20 text-[10px] font-black uppercase tracking-wider text-amber-300">
              <Flame className="w-3.5 h-3.5 fill-amber-300" />
              <span>DAILY CHALLENGE</span>
            </div>

            <span className={`text-[10px] font-extrabold border px-2.5 py-0.5 rounded-full ${
              dailyState.completed
                ? 'bg-emerald-500/30 border-emerald-300/50 text-emerald-100'
                : 'bg-amber-400 text-slate-950 border-amber-300'
            }`}>
              {dailyState.completed ? 'COMPLETED TODAY' : 'AVAILABLE TODAY'}
            </span>
          </div>

          <h2 className="text-xl font-black tracking-tight text-white mb-1">
            {dailyState.completed ? "Today's Challenge Completed" : "Today's Football Challenge"}
          </h2>
          <p className="text-xs text-emerald-100 leading-snug mb-4">
            {dailyState.completed
              ? 'Your score is locked and counted towards the 7-day prize leaderboard. Next challenge available tomorrow!'
              : 'Answer 10 exclusive competition questions (10s timer + speed points) for the 7-day leaderboard.'}
          </p>

          {/* Scores Breakdown: Today's Score & 7-Day Total */}
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            <div className="p-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">
                Today's Score
              </span>
              <span className="text-2xl font-black text-amber-300 tabular-nums">
                {dailyState.completed ? dailyState.todayScore : 0}{' '}
                <span className="text-xs text-amber-200 font-bold">POINTS</span>
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">
                7-Day Score
              </span>
              <span className="text-2xl font-black text-white tabular-nums">
                {dailyState.sevenDayTotal.toLocaleString()}{' '}
                <span className="text-xs text-emerald-200 font-bold">POINTS</span>
              </span>
            </div>
          </div>

          {/* Action CTA Button */}
          {dailyState.completed ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/20 border border-white/15 text-xs">
                <span className="text-slate-300 font-bold uppercase text-[10px] tracking-wider">
                  Next Challenge:
                </span>
                <span className="font-black text-amber-300 uppercase tracking-wide text-xs">
                  TOMORROW
                </span>
              </div>
              <button
                onClick={() => {
                  sound.playTap();
                  onOpenLeaderboard();
                }}
                className="w-full py-3 px-4 rounded-2xl bg-white text-emerald-950 font-black text-xs uppercase tracking-wider shadow-md hover:bg-slate-50 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Award className="w-4 h-4 text-amber-500" />
                <span>View Leaderboard</span>
              </button>

              {onOpenDailyReview && (
                <button
                  onClick={() => {
                    sound.playTap();
                    onOpenDailyReview();
                  }}
                  className="w-full py-2.5 px-4 rounded-2xl bg-emerald-800/80 hover:bg-emerald-700/80 active:scale-98 border border-emerald-400/40 text-emerald-100 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-emerald-300" />
                  <span>Review Daily Challenge</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => {
                  sound.playTap();
                  onPlayDailyChallenge();
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-950/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-300"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>PLAY NOW</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 7-DAY COMPETITION STATUS & PRIZE ELIGIBILITY */}
      <div className="w-full p-4 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-black uppercase text-slate-900 tracking-wider">
              7-DAY CHALLENGE
            </span>
          </div>

          <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Day {dailyState.currentDayInCycle} of 7
          </span>
        </div>

        {/* 7-Day progress bar indicator */}
        <div className="w-full">
          <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
            <span>Cycle Progress</span>
            <span>{7 - dailyState.currentDayInCycle} days remaining</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-500"
              style={{ width: `${(dailyState.currentDayInCycle / 7) * 100}%` }}
            />
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
          <Trophy className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex flex-col text-left">
            <span className="text-xs font-black text-amber-950 uppercase tracking-tight">
              WEEKLY PRIZES FOR TOP 10 PLAYERS
            </span>
            <p className="text-[11px] text-amber-800 leading-snug mt-0.5">
              The highest-scoring eligible players during the 7-day competition period qualify for prizes according to promotion terms.
            </p>
          </div>
        </div>
      </div>

      {/* FOOTBALL QUIZ 100-LEVEL CHAMPIONSHIP ENTRY (TRAINING & PRACTICE) */}
      <div className="w-full p-4 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>LEVEL GAMES · TRAINING & PRACTICE</span>
          </span>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            Unlimited Plays
          </span>
        </div>

        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-0.5 shadow-md flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center text-2xl">
              ⚽
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <h3 className="text-sm font-black text-slate-900">
              100 Championship Levels
            </h3>
            <span className="text-xs text-slate-500">
              Progress: <strong className="text-blue-700 font-extrabold">Level {currentLevelNumber}</strong> of 100
            </span>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5">
              Practice & learn · Does not affect 7-day competition score
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            sound.playTap();
            onOpenFootballQuiz();
          }}
          className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-extrabold text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <span>Practice Levels (Level {currentLevelNumber})</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* COMPACT "HOW IT WORKS" */}
      <div className="w-full p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2.5">
        <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
          HOW IT WORKS
        </span>

        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2.5 text-slate-700 font-semibold">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[11px] flex items-center justify-center shrink-0">1</span>
            <span>Play the Daily Challenge</span>
          </div>

          <div className="flex items-center gap-2.5 text-slate-700 font-semibold">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[11px] flex items-center justify-center shrink-0">2</span>
            <span>Play once each day</span>
          </div>

          <div className="flex items-center gap-2.5 text-slate-700 font-semibold">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[11px] flex items-center justify-center shrink-0">3</span>
            <span>Build your 7-day score</span>
          </div>

          <div className="flex items-center gap-2.5 text-slate-700 font-semibold">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[11px] flex items-center justify-center shrink-0">4</span>
            <span>Climb the Top 10 Leaderboard</span>
          </div>

          <div className="flex items-center gap-2.5 text-slate-700 font-semibold">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[11px] flex items-center justify-center shrink-0">5</span>
            <span className="font-bold text-emerald-800">Top players qualify for prizes</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODALS: FAQ, TERMS, LANGUAGE                                    */}
      {/* ============================================================== */}

      {/* FAQ MODAL */}
      {activeModal === 'FAQ' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-black text-slate-900 uppercase">
                  Frequently Asked Questions
                </h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {OFFICIAL_FAQ_ITEMS.map((item, idx) => (
                <div key={idx} className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50/50">
                  <button
                    onClick={() => {
                      sound.playTap();
                      setExpandedFaqIndex(expandedFaqIndex === idx ? null : idx);
                    }}
                    className="w-full p-3 flex items-center justify-between text-left font-bold text-slate-900 hover:bg-slate-100/70 transition-colors cursor-pointer"
                  >
                    <span className="text-[11px] pr-2">{item.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                        expandedFaqIndex === idx ? 'rotate-180 text-emerald-600' : ''
                      }`}
                    />
                  </button>
                  {expandedFaqIndex === idx && (
                    <div className="p-3 pt-0 text-[11px] text-slate-600 border-t border-slate-100 bg-white leading-relaxed">
                      {item.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase cursor-pointer"
            >
              Close FAQ
            </button>
          </div>
        </div>
      )}

      {/* TERMS MODAL */}
      {activeModal === 'TERMS' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase">
                  Terms & Conditions
                </h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              {OFFICIAL_TERMS_SECTIONS.map((sec, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <h4 className="font-bold text-slate-900 text-xs mb-1">{sec.title}</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{sec.content}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase cursor-pointer"
            >
              Close Terms
            </button>
          </div>
        </div>
      )}

      {/* LANGUAGE MODAL */}
      {activeModal === 'LANGUAGE' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4 text-center">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase">
                  Select Language
                </h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {[
                { id: 'en' as const, label: 'English', native: 'English' },
                { id: 'am' as const, label: 'Amharic', native: 'አማርኛ' },
                { id: 'om' as const, label: 'Afaan Oromoo', native: 'Afaan Oromoo' },
              ].map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => {
                    sound.playTap();
                    onUpdateLanguage(lang.id);
                    setActiveModal(null);
                  }}
                  className={`w-full p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    language === lang.id
                      ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 font-black'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold'
                  }`}
                >
                  <div className="flex flex-col text-left">
                    <span className="text-xs">{lang.label}</span>
                    <span className="text-[10px] text-slate-500">{lang.native}</span>
                  </div>
                  {language === lang.id && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
