import React, { useState } from 'react';
import { UserProfile, DailyChallengeState, UserProgress } from '../../types/quiz';
import { sound } from '../../services/soundService';
import { EthioFantasyLogo } from '../common/EthioFantasyLogo';
import { OFFICIAL_FAQ_ITEMS, OFFICIAL_TERMS_SECTIONS } from '../../data/ethioFantasyLegal';
import {
  Trophy,
  BarChart3,
  Award,
  User,
  Share2,
  Mail,
  CreditCard,
  Settings,
  HelpCircle,
  Info,
  FileQuestion,
  FileText,
  LogOut,
  ChevronRight,
  ChevronDown,
  X,
  CheckCircle2,
  Shield,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  Globe,
  Copy,
  Check,
  Send,
  Calendar,
  Percent,
  Flame,
  Phone,
  PhoneCall,
  Sparkles,
  ShieldCheck,
  Coins,
  Headphones,
} from 'lucide-react';

export type ProfileSubScreen =
  | 'STATISTICS'
  | 'IDENTITY'
  | 'INVITE'
  | 'MESSAGES'
  | 'SUBSCRIPTION'
  | 'SETTINGS'
  | 'HELP'
  | 'ABOUT'
  | 'FAQ'
  | 'TERMS'
  | 'PRICING'
  | 'LOGOUT_CONFIRM'
  | null;

interface ProfileTabProps {
  userProfile: UserProfile;
  dailyState: DailyChallengeState;
  userProgress: UserProgress;
  onOpenLeaderboard: () => void;
  onToggleSound: () => void;
  onToggleSubscription: () => void;
  onUpdateLanguage: (lang: 'en' | 'am' | 'om') => void;
  onToggleNotifications: () => void;
  onLogout: () => void;
  activeSubScreen?: ProfileSubScreen;
  onSetSubScreen?: (screen: ProfileSubScreen) => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  userProfile,
  dailyState,
  userProgress,
  onOpenLeaderboard,
  onToggleSound,
  onToggleSubscription,
  onUpdateLanguage,
  onToggleNotifications,
  onLogout,
  activeSubScreen,
  onSetSubScreen,
}) => {
  const [internalSubScreen, setInternalSubScreen] = useState<ProfileSubScreen>(null);
  const currentSubScreen = activeSubScreen !== undefined ? activeSubScreen : internalSubScreen;

  const setSubScreen = (screen: ProfileSubScreen) => {
    if (onSetSubScreen) {
      onSetSubScreen(screen);
    } else {
      setInternalSubScreen(screen);
    }
  };

  const [copiedLink, setCopiedLink] = useState(false);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  // Computed metrics from real progress
  const levelsCompletedCount = userProgress.completedLevelIds.length;
  const currentLevelNumber = Math.min(100, Math.max(...userProgress.unlockedLevelIds, 1));
  const totalQuestionsAnswered = levelsCompletedCount * 10;
  const totalCorrectAnswers = Object.values(userProgress.levelScores).reduce(
    (acc, score) => acc + Math.round(score / 100),
    0
  );
  const accuracyPercent =
    totalQuestionsAnswered > 0
      ? Math.round((totalCorrectAnswers / totalQuestionsAnswered) * 100)
      : 0;

  const handleInviteFriends = async () => {
    sound.playTap();
    const shareData = {
      title: 'EthioFantasy - Football Quiz & 7-Day Competition',
      text: 'Join me on EthioFantasy! Test your football knowledge across 100 championship levels and compete for 7-day prizes.',
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User cancelled or fallback
      }
    }

    try {
      await navigator.clipboard.writeText(
        `Join me on EthioFantasy! Subscribe by sending OK to 9401 and play the Football Quiz: ${window.location.href}`
      );
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="w-full flex flex-col space-y-7 pb-28 select-none">
      {/* ============================================================== */}
      {/* 1. PREMIUM PROFILE HEADER WITH OFFICIAL ETHIOFANTASY LOGO      */}
      {/* ============================================================== */}
      <div className="w-full pt-1">
        {/* Top Logo Display (Clean, Sharp, Responsive) */}
        <div className="w-full flex justify-center py-2">
          <EthioFantasyLogo size="lg" />
        </div>

        {/* Premium Membership Identity Card */}
        <div className="w-full mt-3 p-5 rounded-3xl bg-white border border-slate-200/80 shadow-md shadow-slate-900/5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-600 to-blue-600 p-0.5 shadow-sm">
                <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center text-2xl">
                  👤
                </div>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-base font-black font-mono tracking-wider text-slate-900">
                  {userProfile.maskedMsisdn}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Ethio Telecom Customer
                </span>
              </div>
            </div>

            {/* Subscription Status Pill */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-extrabold ${
              userProfile.isSubscribed
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{userProfile.isSubscribed ? 'Active' : 'Inactive'}</span>
            </div>
          </div>

          {/* Quick Metrics Bar: Today's Score, Best Daily, 7-Day Score */}
          {(() => {
            const bestDailyScore = Math.max(
              0,
              ...Object.values(dailyState.history || {}),
              dailyState.todayScore || 0
            );
            return (
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3.5 border-t border-slate-100">
                <div className="flex flex-col items-center p-2 rounded-2xl bg-slate-50/80 border border-slate-100 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Today
                  </span>
                  <span className="text-sm font-black text-amber-700 tabular-nums mt-0.5">
                    {dailyState.completed ? dailyState.todayScore : 0}{' '}
                    <span className="text-[10px] font-bold text-slate-500">pts</span>
                  </span>
                </div>

                <div className="flex flex-col items-center p-2 rounded-2xl bg-slate-50/80 border border-slate-100 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Best Daily
                  </span>
                  <span className="text-sm font-black text-blue-900 tabular-nums mt-0.5">
                    {bestDailyScore}{' '}
                    <span className="text-[10px] font-bold text-slate-500">pts</span>
                  </span>
                </div>

                <div className="flex flex-col items-center p-2 rounded-2xl bg-slate-50/80 border border-slate-100 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    7-Day Score
                  </span>
                  <span className="text-sm font-black text-emerald-700 tabular-nums mt-0.5">
                    {dailyState.sevenDayTotal.toLocaleString()}{' '}
                    <span className="text-[10px] font-bold text-slate-500">pts</span>
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. SECTION: PERFORMANCE (LARGE 80px ACTION CARDS)              */}
      {/* ============================================================== */}
      <section className="space-y-3">
        <div className="px-1 text-left">
          <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
            PERFORMANCE
          </span>
        </div>

        <div className="space-y-3">
          {/* Card: Statistics */}
          <button
            onClick={() => {
              sound.playTap();
              setSubScreen('STATISTICS');
            }}
            className="w-full min-h-[80px] p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm shadow-slate-900/5 hover:border-blue-400 active:scale-[0.99] transition-all flex items-center justify-between cursor-pointer group text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <BarChart3 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Statistics
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-snug mt-0.5">
                  View accuracy, levels and performance
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </button>

          {/* Card: Leaderboard */}
          <button
            onClick={() => {
              sound.playTap();
              onOpenLeaderboard();
            }}
            className="w-full min-h-[80px] p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm shadow-slate-900/5 hover:border-emerald-400 active:scale-[0.99] transition-all flex items-center justify-between cursor-pointer group text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Trophy className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Leaderboard
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-snug mt-0.5">
                  Top 10 players and rankings
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </button>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. SECTION: ACCOUNT (LARGE 80px ACTION CARDS)                  */}
      {/* ============================================================== */}
      <section className="space-y-3">
        <div className="px-1 text-left">
          <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
            ACCOUNT
          </span>
        </div>

        <div className="space-y-3">
          {/* Card: Identity */}
          <button
            onClick={() => {
              sound.playTap();
              setSubScreen('IDENTITY');
            }}
            className="w-full min-h-[80px] p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm shadow-slate-900/5 hover:border-indigo-400 active:scale-[0.99] transition-all flex items-center justify-between cursor-pointer group text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <User className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Identity
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-snug mt-0.5">
                  Account status and masked MSISDN
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </button>

          {/* Card: Invite Friends */}
          <button
            onClick={() => {
              sound.playTap();
              setSubScreen('INVITE');
            }}
            className="w-full min-h-[80px] p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm shadow-slate-900/5 hover:border-amber-400 active:scale-[0.99] transition-all flex items-center justify-between cursor-pointer group text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Share2 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Invite Friends
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-snug mt-0.5">
                  Share with family and friends
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </button>

          {/* Card: Messages */}
          <button
            onClick={() => {
              sound.playTap();
              setSubScreen('MESSAGES');
            }}
            className="w-full min-h-[80px] p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm shadow-slate-900/5 hover:border-sky-400 active:scale-[0.99] transition-all flex items-center justify-between cursor-pointer group text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Mail className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Messages
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-snug mt-0.5">
                  Service updates and competition alerts
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </button>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. SECTION: SERVICE (SPECIAL SUBSCRIPTION CARD & SETTINGS)      */}
      {/* ============================================================== */}
      <section className="space-y-3">
        <div className="px-1 text-left">
          <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
            SERVICE
          </span>
        </div>

        <div className="space-y-3">
          {/* Card: Subscription (Key Feature Card) */}
          <button
            onClick={() => {
              sound.playTap();
              setSubScreen('SUBSCRIPTION');
            }}
            className="w-full min-h-[84px] p-4 rounded-2xl bg-white border border-emerald-300 shadow-sm shadow-emerald-900/5 hover:border-emerald-500 active:scale-[0.99] transition-all flex items-center justify-between cursor-pointer group text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <CreditCard className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Subscription
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                </div>
                <p className="text-xs font-bold text-emerald-700 leading-snug mt-0.5">
                  2 Birr / Day · Shortcode 9401
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </button>

          {/* Card: Settings */}
          <button
            onClick={() => {
              sound.playTap();
              setSubScreen('SETTINGS');
            }}
            className="w-full min-h-[80px] p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm shadow-slate-900/5 hover:border-slate-400 active:scale-[0.99] transition-all flex items-center justify-between cursor-pointer group text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Settings className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Settings
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-snug mt-0.5">
                  Sound, language and notifications
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </button>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 5. SECTION: INFORMATION & SUPPORT (4 LARGE ACTION CARDS)      */}
      {/* ============================================================== */}
      <section className="space-y-3">
        <div className="px-1 text-left">
          <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
            INFORMATION & SUPPORT
          </span>
        </div>

        <div className="space-y-3">
          {/* Card 1: FAQ */}
          <button
            onClick={() => {
              sound.playTap();
              setSubScreen('FAQ');
            }}
            className="w-full min-h-[80px] p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm shadow-slate-900/5 hover:border-amber-400 active:scale-[0.99] transition-all flex items-center justify-between cursor-pointer group text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <HelpCircle className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  FAQ
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-snug mt-0.5">
                  Frequently asked questions
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </button>

          {/* Card 2: Terms & Conditions */}
          <button
            onClick={() => {
              sound.playTap();
              setSubScreen('TERMS');
            }}
            className="w-full min-h-[80px] p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm shadow-slate-900/5 hover:border-indigo-400 active:scale-[0.99] transition-all flex items-center justify-between cursor-pointer group text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileText className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Terms & Conditions
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-snug mt-0.5">
                  Service terms and conditions
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </button>

          {/* Card 3: Pricing */}
          <button
            onClick={() => {
              sound.playTap();
              setSubScreen('PRICING');
            }}
            className="w-full min-h-[80px] p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm shadow-slate-900/5 hover:border-emerald-400 active:scale-[0.99] transition-all flex items-center justify-between cursor-pointer group text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Coins className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Pricing
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-snug mt-0.5">
                  Subscription pricing and details
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </button>

          {/* Card 4: Help & Support */}
          <button
            onClick={() => {
              sound.playTap();
              setSubScreen('HELP');
            }}
            className="w-full min-h-[80px] p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm shadow-slate-900/5 hover:border-sky-400 active:scale-[0.99] transition-all flex items-center justify-between cursor-pointer group text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Headphones className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Help & Support
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-snug mt-0.5">
                  Get help and contact support
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </button>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 6. LOGOUT BUTTON                                               */}
      {/* ============================================================== */}
      <div className="w-full pt-1">
        <button
          onClick={() => {
            sound.playTap();
            setSubScreen('LOGOUT_CONFIRM');
          }}
          className="w-full py-4 px-4 rounded-2xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 active:scale-[0.99] font-black text-xs uppercase tracking-wider shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* SUB-SCREEN MODAL OVERLAYS (All working and preserved)           */}
      {/* ============================================================== */}

      {/* 1. STATISTICS */}
      {currentSubScreen === 'STATISTICS' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase">
                  Player Statistics
                </h3>
              </div>
              <button
                onClick={() => setSubScreen(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SECTION 1: 7-DAY COMPETITION (DAILY CHALLENGE) */}
            <div className="space-y-2 text-left">
              <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>7-Day Competition (Daily Challenge)</span>
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">7-Day Score</span>
                  <p className="text-base font-black text-amber-950 tabular-nums">
                    {dailyState.sevenDayTotal.toLocaleString()} pts
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Today's Score</span>
                  <p className="text-base font-black text-blue-900 tabular-nums">
                    {dailyState.completed ? dailyState.todayScore : 0} pts
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Best Daily</span>
                  <p className="text-base font-black text-indigo-900 tabular-nums">
                    {Math.max(0, ...Object.values(dailyState.history || {}), dailyState.todayScore || 0)} pts
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Status</span>
                  <p className="text-xs font-black text-emerald-800 uppercase mt-0.5">
                    {dailyState.completed ? 'Completed' : 'Available'}
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 2: TRAINING & PRACTICE (LEVEL GAMES) */}
            <div className="space-y-2 text-left pt-2 border-t border-slate-100">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-blue-600" />
                <span>Level Games (Training & Practice)</span>
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Current Level</span>
                  <p className="text-base font-black text-slate-900 tabular-nums">
                    Lvl {currentLevelNumber} / 100
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Completed</span>
                  <p className="text-base font-black text-slate-900 tabular-nums">
                    {levelsCompletedCount} Levels
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Training Points</span>
                  <p className="text-base font-black text-slate-900 tabular-nums">
                    {userProgress.score.toLocaleString()} pts
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Stars Collected</span>
                  <p className="text-base font-black text-amber-600 tabular-nums">
                    {userProgress.stars} ⭐
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-medium px-1">
                * Level training scores do not affect the 7-day competition leaderboard or prize ranking.
              </p>
            </div>

            <button
              onClick={() => setSubScreen(null)}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs uppercase cursor-pointer transition-colors"
            >
              Close Statistics
            </button>
          </div>
        </div>
      )}

      {/* 2. IDENTITY */}
      {currentSubScreen === 'IDENTITY' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase">
                EthioFantasy Account
              </h3>
              <button
                onClick={() => setSubScreen(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-left">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  Registered MSISDN
                </span>
                <p className="font-mono text-base font-black text-slate-900">
                  {userProfile.maskedMsisdn}
                </p>
                <span className="text-[10px] text-slate-400">
                  Protected with 5-digit public privacy masking
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  Subscription Status
                </span>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${userProfile.isSubscribed ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <span className="text-sm font-bold text-slate-800">
                    {userProfile.isSubscribed ? 'Active (2 Birr/day)' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  Telecommunications Provider
                </span>
                <p className="text-xs font-bold text-slate-800">
                  Ethio Telecom
                </p>
              </div>
            </div>

            <button
              onClick={() => setSubScreen(null)}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs uppercase cursor-pointer transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* 3. INVITE FRIENDS */}
      {currentSubScreen === 'INVITE' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase">
                Invite Friends
              </h3>
              <button
                onClick={() => setSubScreen(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-2xl shadow-xs">
              🎁
            </div>

            <div>
              <h4 className="text-base font-black text-slate-900">
                Invite Friends to EthioFantasy
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-snug">
                Share the football quiz and challenge your friends to compete on the 7-day leaderboard!
              </p>
            </div>

            <button
              onClick={handleInviteFriends}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-98 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copied to Clipboard!' : 'INVITE FRIENDS'}</span>
            </button>

            <p className="text-[10px] text-slate-400">
              Friends subscribe by sending OK to 9401 on Ethio Telecom.
            </p>
          </div>
        </div>
      )}

      {/* 4. MESSAGES */}
      {currentSubScreen === 'MESSAGES' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase">
                Service Messages
              </h3>
              <button
                onClick={() => setSubScreen(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-8 flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Mail className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-black text-slate-800">No new messages</h4>
              <p className="text-xs text-slate-500 max-w-[220px]">
                You are all caught up! Competition results and alerts will appear here.
              </p>
            </div>

            <button
              onClick={() => setSubScreen(null)}
              className="w-full py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 5. SUBSCRIPTION */}
      {currentSubScreen === 'SUBSCRIPTION' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase">
                Subscription Plan
              </h3>
              <button
                onClick={() => setSubScreen(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-3xl bg-emerald-50/80 border border-emerald-200 space-y-2 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-emerald-950">
                  EthioFantasy
                </span>
                <span className="text-sm font-black text-emerald-700 font-mono">
                  2 Birr / Day
                </span>
              </div>
              <p className="text-xs text-slate-700">
                Subscribe by sending <strong className="text-emerald-950">OK</strong> to <strong className="text-emerald-950">9401</strong>
              </p>
              <p className="text-[11px] text-slate-500">
                To cancel anytime, send STOP to 9401. Daily renewal charge applies on active Ethio Telecom prepaid/postpaid lines.
              </p>
            </div>

            <a
              href="sms:9401?body=OK"
              onClick={() => {
                sound.playTap();
                onToggleSubscription();
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Send className="w-4 h-4" />
              <span>SUBSCRIBE (SEND OK TO 9401)</span>
            </a>

            <button
              onClick={() => {
                sound.playTap();
                onToggleSubscription();
              }}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 underline block mx-auto cursor-pointer"
            >
              Toggle Demo Subscription State
            </button>
          </div>
        </div>
      )}

      {/* 6. SETTINGS */}
      {currentSubScreen === 'SETTINGS' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase">
                App Settings
              </h3>
              <button
                onClick={() => setSubScreen(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Sound */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2.5">
                  {userProgress.soundEnabled ? <Volume2 className="w-5 h-5 text-emerald-600" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
                  <span className="text-xs font-bold text-slate-800">Sound Effects</span>
                </div>
                <button
                  onClick={() => {
                    sound.playTap();
                    onToggleSound();
                  }}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                    userProgress.soundEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${userProgress.soundEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Notifications */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2.5">
                  {userProfile.notificationsEnabled ? <Bell className="w-5 h-5 text-emerald-600" /> : <BellOff className="w-5 h-5 text-slate-400" />}
                  <span className="text-xs font-bold text-slate-800">Notifications</span>
                </div>
                <button
                  onClick={() => {
                    sound.playTap();
                    onToggleNotifications();
                  }}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                    userProfile.notificationsEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${userProfile.notificationsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Language */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Globe className="w-5 h-5 text-blue-600" />
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-800">Language</span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {userProfile.language === 'en' ? 'English' : userProfile.language === 'am' ? 'Amharic (አማርኛ)' : 'Oromo (Afaan Oromoo)'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  {[
                    { id: 'en', label: 'EN' },
                    { id: 'am', label: 'አማ' },
                    { id: 'om', label: 'OR' },
                  ].map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => {
                        sound.playTap();
                        onUpdateLanguage(lang.id as 'en' | 'am' | 'om');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        userProfile.language === lang.id ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSubScreen(null)}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs uppercase cursor-pointer transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* 7. HELP & SUPPORT */}
      {currentSubScreen === 'HELP' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Headphones className="w-5 h-5 text-sky-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase">
                  Help & Support
                </h3>
              </div>
              <button
                onClick={() => setSubScreen(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Support Channels */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Support Channels
              </span>

              {/* Ethio Telecom Hotline 994 */}
              <div className="p-3.5 rounded-2xl bg-sky-50/80 border border-sky-200/90 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-sky-950">Ethio Telecom Hotline</span>
                    <span className="text-[11px] font-bold text-sky-700">Dial 994 (Toll-Free)</span>
                    <span className="text-[10px] text-slate-500">24/7 Customer Care</span>
                  </div>
                </div>
                <a
                  href="tel:994"
                  onClick={() => sound.playTap()}
                  className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black shadow-xs cursor-pointer transition-colors"
                >
                  Call
                </a>
              </div>

              {/* SMS Shortcode 9401 */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/90 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Send className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-emerald-950">SMS Service (9401)</span>
                    <span className="text-[11px] font-bold text-emerald-700">Send OK or STOP</span>
                    <span className="text-[10px] text-slate-500">2 Birr / day</span>
                  </div>
                </div>
                <a
                  href="sms:9401?body=OK"
                  onClick={() => sound.playTap()}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-xs cursor-pointer transition-colors"
                >
                  SMS
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  sound.playTap();
                  setSubScreen('FAQ');
                }}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
              >
                <HelpCircle className="w-5 h-5 text-amber-500 mb-1" />
                <span className="text-xs font-black text-slate-800">View FAQ</span>
                <span className="text-[10px] text-slate-500">Top questions</span>
              </button>

              <button
                onClick={() => {
                  sound.playTap();
                  setSubScreen('TERMS');
                }}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
              >
                <FileText className="w-5 h-5 text-indigo-500 mb-1" />
                <span className="text-xs font-black text-slate-800">Terms & Rules</span>
                <span className="text-[10px] text-slate-500">Official conditions</span>
              </button>
            </div>

            {/* FAQ Summary Guides */}
            <div className="space-y-2 text-xs">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Common Topics
              </span>
              {[
                { title: 'How to Play Quiz Levels', body: 'Go to the GAME tab to play 100 championship levels. Answer questions before the timer expires to earn stars and unlock further levels.' },
                { title: 'Daily Challenge & Prizes', body: 'Play the 10-question Daily Challenge each day. Your score accumulates on the 7-day leaderboard towards weekly rewards.' },
                { title: 'How to Cancel Subscription', body: 'Send an SMS containing STOP to shortcode 9401 anytime from your Ethio Telecom line to cancel with zero penalty.' },
              ].map((item, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs">{item.title}</h4>
                  <p className="text-slate-600 leading-relaxed text-[11px]">{item.body}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSubScreen(null)}
              className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase cursor-pointer transition-colors"
            >
              Close Help
            </button>
          </div>
        </div>
      )}

      {/* PRICING MODAL */}
      {currentSubScreen === 'PRICING' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4 max-h-[88vh] overflow-y-auto text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase">
                  Subscription & Pricing
                </h3>
              </div>
              <button
                onClick={() => setSubScreen(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Official Tariff Card */}
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-center space-y-1">
              <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
                Ethio Telecom Partner Service
              </span>
              <div className="flex items-baseline justify-center gap-1.5 pt-0.5">
                <span className="text-3xl font-black text-emerald-950 font-mono">2.00</span>
                <span className="text-sm font-black text-emerald-700">ETB / day</span>
              </div>
              <p className="text-[11px] text-emerald-800 font-medium">
                Automatic daily renewal from Ethio Telecom airtime balance
              </p>
            </div>

            {/* What is Included */}
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                What's Included
              </span>
              <div className="space-y-2 text-xs">
                {[
                  { text: '100 Progressive Championship Football Quiz levels' },
                  { text: 'Daily Challenge with 10 fresh questions every day' },
                  { text: 'Official 7-day cumulative prize competition entry' },
                  { text: 'Live public leaderboard tracking & ranking' },
                  { text: 'No extra data charges for standard quiz gameplay' },
                  { text: 'Cancel anytime with zero penalty or hidden fees' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-slate-800 font-medium text-[11px]">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shortcode Activation Details */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500 font-medium">Shortcode</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">9401</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500 font-medium">To Subscribe</span>
                <span className="font-bold text-emerald-700">Send OK to 9401</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500 font-medium">To Cancel</span>
                <span className="font-bold text-rose-600">Send STOP to 9401</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500 font-medium">Customer Support</span>
                <span className="font-mono font-bold text-blue-600">Dial 994</span>
              </div>
            </div>

            <a
              href="sms:9401?body=OK"
              onClick={() => sound.playTap()}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Subscribe (Send OK to 9401)</span>
            </a>

            <button
              onClick={() => setSubScreen(null)}
              className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase cursor-pointer transition-colors"
            >
              Close Pricing
            </button>
          </div>
        </div>
      )}

      {/* 8. ABOUT */}
      {currentSubScreen === 'ABOUT' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase">
                About EthioFantasy
              </h3>
              <button
                onClick={() => setSubScreen(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-center py-2">
              <EthioFantasyLogo size="md" />
            </div>

            <p className="text-xs text-slate-600 leading-relaxed text-left">
              EthioFantasy is the premier digital football quiz and prize competition service provided exclusively for Ethio Telecom mobile subscribers. Test your football trivia knowledge across 100 championship levels, complete daily challenges, and compete on the weekly leaderboard.
            </p>

            <div className="p-3.5 rounded-2xl bg-slate-50 text-[11px] text-slate-500 text-left space-y-0.5 border border-slate-200">
              <p>Service: EthioFantasy</p>
              <p>Provider: Ethio Telecom</p>
              <p>Tariff: 2.00 ETB / Day</p>
              <p>Shortcode: 9401</p>
              <p>Customer Support: 994</p>
              <p>Version: 2.3.0</p>
            </div>

            <button
              onClick={() => setSubScreen(null)}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs uppercase cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 9. FAQ */}
      {currentSubScreen === 'FAQ' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileQuestion className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-black text-slate-900 uppercase">
                  Frequently Asked Questions
                </h3>
              </div>
              <button
                onClick={() => setSubScreen(null)}
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
                        expandedFaqIndex === idx ? 'rotate-180 text-blue-600' : ''
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
              onClick={() => setSubScreen(null)}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs uppercase cursor-pointer transition-colors"
            >
              Close FAQ
            </button>
          </div>
        </div>
      )}

      {/* 10. TERMS */}
      {currentSubScreen === 'TERMS' && (
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
                onClick={() => setSubScreen(null)}
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
              onClick={() => setSubScreen(null)}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs uppercase cursor-pointer transition-colors"
            >
              Close Terms
            </button>
          </div>
        </div>
      )}

      {/* 11. LOG OUT CONFIRMATION */}
      {currentSubScreen === 'LOGOUT_CONFIRM' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black text-slate-900">
              Log Out
            </h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to log out of EthioFantasy?
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setSubScreen(null)}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase cursor-pointer transition-colors"
              >
                CANCEL
              </button>

              <button
                onClick={() => {
                  sound.playTap();
                  setSubScreen(null);
                  onLogout();
                }}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase shadow-md shadow-rose-600/25 cursor-pointer transition-colors"
              >
                LOG OUT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
