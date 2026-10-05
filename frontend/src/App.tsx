import React, { useState, useEffect, useMemo } from 'react';
import {
  ScreenType,
  LevelData,
  QuestionResult,
  UserProgress,
  BottomNavTab,
  UserProfile,
  DailyChallengeState,
} from './types/quiz';
import { LEVELS } from './data/levelsData';
import { loadUserProgress, saveUserProgress, resetUserProgress } from './services/storageService';
import {
  loadUserProfile,
  saveUserProfile,
  loadDailyChallengeState,
  recordDailyChallengeScore,
  startDailyChallenge,
  getTop10Leaderboard,
  fetchTop10Leaderboard,
  getDailyChallengeQuestions,
  getCurrentServiceDate,
  isDailyChallengeReviewLocked,
  saveDailyChallengeReview,
  getDailyChallengeReview,
} from './services/ethioFantasyService';
import { sound } from './services/soundService';

import { SplashScreen } from './components/screens/SplashScreen';
import { LevelSelectScreen } from './components/screens/LevelSelectScreen';
import { QuestionScreen } from './components/screens/QuestionScreen';
import { CongratulationsScreen } from './components/screens/CongratulationsScreen';
import { ReviewScreen } from './components/screens/ReviewScreen';
import { LoginScreen } from './components/screens/LoginScreen';
import { AdminQuestionBankModal } from './components/admin/AdminQuestionBankModal';

import { HomeTab } from './components/tabs/HomeTab';
import { LeaderboardTab } from './components/tabs/LeaderboardTab';
import { ProfileTab } from './components/tabs/ProfileTab';
import { BottomNavBar } from './components/navigation/BottomNavBar';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('SPLASH');
  const [activeNavTab, setActiveNavTab] = useState<BottomNavTab>('HOME');
  const [showAdminQuestionBank, setShowAdminQuestionBank] = useState<boolean>(false);

  const [userProgress, setUserProgress] = useState<UserProgress>(loadUserProgress);
  const [userProfile, setUserProfile] = useState<UserProfile>(loadUserProfile);
  const [dailyChallengeState, setDailyChallengeState] = useState<DailyChallengeState>(() =>
    loadDailyChallengeState(userProfile.msisdn)
  );

  const [activeLevel, setActiveLevel] = useState<LevelData | null>(null);
  const [isDailyChallenge, setIsDailyChallenge] = useState<boolean>(false);
  const [activeDailyDate, setActiveDailyDate] = useState<string>(() => getCurrentServiceDate());
  const [latestResults, setLatestResults] = useState<QuestionResult[]>([]);
  const [latestLevelScore, setLatestLevelScore] = useState<number>(0);

  // Authoritative Review Locking Determination:
  // If today's Daily Challenge is still active -> detailed Review is locked.
  // If today's Daily Challenge has expired -> detailed Review is unlocked.
  // Level-Based mode is NEVER locked.
  const isReviewLocked = useMemo(() => {
    if (!isDailyChallenge) {
      return false;
    }
    const challengeDate = activeDailyDate || dailyChallengeState.date;
    return isDailyChallengeReviewLocked(challengeDate);
  }, [isDailyChallenge, activeDailyDate, dailyChallengeState.date]);

  // Sync sound service with user progress
  useEffect(() => {
    sound.setSoundEnabled(userProgress.soundEnabled);
  }, [userProgress.soundEnabled]);

  // Handle hardware / browser back navigation
  useEffect(() => {
    const handlePopState = () => {
      if (currentScreen === 'REVIEW') {
        setCurrentScreen('CONGRATULATIONS');
      } else if (currentScreen === 'PLAYING' || currentScreen === 'CONGRATULATIONS') {
        setCurrentScreen('MAIN');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentScreen]);

  // Update total score
  const handleUpdateScore = (newScore: number) => {
    setUserProgress((prev) => {
      const updated = { ...prev, score: Math.max(0, newScore) };
      saveUserProgress(updated);
      return updated;
    });
  };

  // Update hearts
  const handleUpdateHearts = (newHearts: number) => {
    setUserProgress((prev) => ({ ...prev, hearts: Math.max(0, newHearts) }));
  };

  // Toggle sound
  const handleToggleSound = () => {
    setUserProgress((prev) => {
      const nextSound = !prev.soundEnabled;
      sound.setSoundEnabled(nextSound);
      const updated = { ...prev, soundEnabled: nextSound };
      saveUserProgress(updated);
      return updated;
    });
  };

  // Safe progress check: permanently preserves unlocked levels
  const handleResetProgress = () => {
    const safe = loadUserProgress();
    setUserProgress(safe);
    sound.setSoundEnabled(safe.soundEnabled);
  };

  // Start Level from 100 Championship Levels
  const handleSelectLevel = (level: LevelData) => {
    setActiveLevel(level);
    setIsDailyChallenge(false);
    setUserProgress((prev) => ({ ...prev, hearts: 5 }));
    window.history.pushState({ screen: 'PLAYING' }, '');
    setCurrentScreen('PLAYING');
  };

  // Start Daily Challenge (Strictly 1 Attempt per Day)
  const handleStartDailyChallenge = async () => {
    const today = getCurrentServiceDate();
    setActiveDailyDate(today);
    if (dailyChallengeState.completed && dailyChallengeState.date === today) {
      alert("Today's Daily Challenge is already completed. Available again tomorrow!");
      return;
    }

    const session = await startDailyChallenge(userProfile.msisdn);
    if (!session.success || !session.questions) {
      alert(session.error || "Today's Daily Challenge already completed.");
      return;
    }

    const dailyQuestions = session.questions;
    const dailyLevel: LevelData = {
      id: 99999,
      levelNumber: dailyChallengeState.currentDayInCycle,
      title: "Today's Daily Challenge",
      subtitle: 'Daily 7-Day Competition',
      category: 'DAILY CHALLENGE',
      totalQuestions: dailyQuestions.length,
      iconType: 'trophy',
      accentColor: 'from-amber-500 to-orange-600',
      questions: dailyQuestions,
    };
    setActiveLevel(dailyLevel);
    setIsDailyChallenge(true);
    window.history.pushState({ screen: 'PLAYING' }, '');
    setCurrentScreen('PLAYING');
  };

  // Level Finished (Called strictly after Question 10 is answered!)
  const handleFinishLevel = (
    results: QuestionResult[],
    earnedScore?: number,
    totalResponseTime?: number
  ) => {
    setLatestResults(results);

    if (activeLevel) {
      const correctCount = results.filter((r) => r.isCorrect).length;
      const pct = Math.round((correctCount / results.length) * 100);
      const pointsEarned = earnedScore !== undefined ? earnedScore : correctCount;
      setLatestLevelScore(pointsEarned);

      if (isDailyChallenge) {
        // Record Daily Challenge Score and update 7-Day competition total strictly
        saveDailyChallengeReview(
          userProfile.msisdn,
          dailyChallengeState.date,
          results,
          pointsEarned,
          totalResponseTime || 45.0
        );
        const updatedDaily = recordDailyChallengeScore(
          userProfile.msisdn,
          pointsEarned,
          totalResponseTime || 45.0
        );
        setDailyChallengeState(updatedDaily);
      } else {
        // Championship Level: Sequential unlocking of next level ONLY if passed (at least 9/10 correct)
        // Level points are TRAINING points only and DO NOT affect 7-Day Competition
        const isPassed = correctCount >= 9;
        const earnedStars = correctCount === 10 ? 3 : correctCount === 9 ? 2 : 0;

        setUserProgress((prev) => {
          const prevScoreForLevel = prev.levelScores[activeLevel.id] || 0;
          const scoreDiff = Math.max(0, pointsEarned - prevScoreForLevel);
          const prevStarsForLevel = prev.levelStars[activeLevel.id] || 0;
          const starDiff = Math.max(0, earnedStars - prevStarsForLevel);

          const updatedUnlocked = [...prev.unlockedLevelIds];
          const updatedCompleted = [...prev.completedLevelIds];

          // STRICT REQUIREMENT: Only when user has at least 9 correct answers should next level unlock
          if (isPassed) {
            const nextLevelId = activeLevel.id + 1;
            if (nextLevelId <= 100 && !updatedUnlocked.includes(nextLevelId)) {
              updatedUnlocked.push(nextLevelId);
            }
            if (!updatedCompleted.includes(activeLevel.id)) {
              updatedCompleted.push(activeLevel.id);
            }
          }

          const updatedLevelScores = {
            ...prev.levelScores,
            [activeLevel.id]: Math.max(prevScoreForLevel, pointsEarned),
          };

          const updated: UserProgress = {
            ...prev,
            score: prev.score + scoreDiff,
            stars: prev.stars + starDiff,
            hearts: 5,
            unlockedLevelIds: updatedUnlocked,
            completedLevelIds: updatedCompleted,
            levelStars: {
              ...prev.levelStars,
              [activeLevel.id]: Math.max(prevStarsForLevel, earnedStars),
            },
            levelScores: updatedLevelScores,
            levelPercentages: {
              ...prev.levelPercentages,
              [activeLevel.id]: Math.max(prev.levelPercentages[activeLevel.id] || 0, pct),
            },
          };

          saveUserProgress(updated);
          return updated;
        });
      }
    }

    window.history.pushState({ screen: 'CONGRATULATIONS' }, '');
    setCurrentScreen('CONGRATULATIONS');
  };

  // Return to Level select / Home
  const handleBackToLevels = () => {
    setActiveLevel(null);
    if (isDailyChallenge) {
      setActiveNavTab('HOME');
    } else {
      setActiveNavTab('GAME');
    }
    setCurrentScreen('MAIN');
  };

  // Replay current level (Permitted for training levels, STRICTLY DENIED for real Daily Challenge)
  const handleReplayLevel = () => {
    if (isDailyChallenge) {
      setActiveLevel(null);
      setActiveNavTab('HOME');
      setCurrentScreen('MAIN');
      return;
    }
    if (activeLevel) {
      setUserProgress((prev) => ({ ...prev, hearts: 5 }));
      setCurrentScreen('PLAYING');
    } else {
      setCurrentScreen('MAIN');
    }
  };

  // Open Review screen
  const handleOpenReview = () => {
    if (isDailyChallenge && latestResults.length === 0) {
      const savedReview = getDailyChallengeReview(
        userProfile.msisdn,
        activeDailyDate || dailyChallengeState.date
      );
      if (savedReview && savedReview.results && savedReview.results.length > 0) {
        setLatestResults(savedReview.results);
        setLatestLevelScore(savedReview.levelScore);
      }
    }
    window.history.pushState({ screen: 'REVIEW' }, '');
    setCurrentScreen('REVIEW');
  };

  // Open Daily Challenge Review directly from Home tab
  const handleOpenDailyReviewFromHome = () => {
    const savedReview = getDailyChallengeReview(userProfile.msisdn, dailyChallengeState.date);
    if (savedReview && savedReview.results && savedReview.results.length > 0) {
      setLatestResults(savedReview.results);
      setLatestLevelScore(savedReview.levelScore);
    }
    const dailyLevel: LevelData = {
      id: 99999,
      levelNumber: dailyChallengeState.currentDayInCycle,
      title: "Today's Daily Challenge",
      subtitle: 'Daily 7-Day Competition',
      category: 'DAILY CHALLENGE',
      totalQuestions: 10,
      iconType: 'trophy',
      accentColor: 'from-amber-500 to-orange-600',
      questions: [],
    };
    setActiveLevel(dailyLevel);
    setIsDailyChallenge(true);
    setActiveDailyDate(dailyChallengeState.date);
    window.history.pushState({ screen: 'REVIEW' }, '');
    setCurrentScreen('REVIEW');
  };

  // Back to Result from Review
  const handleBackToResult = () => {
    if (activeLevel && latestResults.length > 0) {
      setCurrentScreen('CONGRATULATIONS');
    } else {
      setCurrentScreen('MAIN');
    }
  };

  // User Profile handlers
  const handleToggleSubscription = () => {
    const updated = { ...userProfile, isSubscribed: !userProfile.isSubscribed };
    setUserProfile(updated);
    saveUserProfile(updated);
  };

  const handleUpdateLanguage = (lang: 'en' | 'am' | 'om') => {
    const updated = { ...userProfile, language: lang };
    setUserProfile(updated);
    saveUserProfile(updated);
  };

  const handleToggleNotifications = () => {
    const updated = { ...userProfile, notificationsEnabled: !userProfile.notificationsEnabled };
    setUserProfile(updated);
    saveUserProfile(updated);
  };

  const handleLogout = () => {
    const updated = { ...userProfile, isLoggedIn: false };
    setUserProfile(updated);
    saveUserProfile(updated);
    setCurrentScreen('LOGIN');
  };

  const handleLoginSuccess = (msisdn: string) => {
    const updated: UserProfile = {
      ...userProfile,
      msisdn,
      isLoggedIn: true,
    };
    setUserProfile(updated);
    saveUserProfile(updated);
    setDailyChallengeState(loadDailyChallengeState(msisdn));
    setCurrentScreen('MAIN');
    setActiveNavTab('HOME');
  };

  // 7-Day Top 10 Leaderboard Data (Real-Time API with graceful fallback)
  const [leaderboardInfo, setLeaderboardInfo] = useState(() =>
    getTop10Leaderboard(userProfile.msisdn, dailyChallengeState.sevenDayTotal)
  );

  useEffect(() => {
    fetchTop10Leaderboard(userProfile.msisdn).then((info) => {
      if (info && info.top10 && info.top10.length > 0) {
        setLeaderboardInfo(info);
      }
    });
  }, [userProfile.msisdn, activeNavTab, dailyChallengeState.sevenDayTotal]);

  const currentLevelNumber = Math.min(100, Math.max(...userProgress.unlockedLevelIds, 1));

  return (
    <div className="w-full min-h-screen bg-white flex justify-center text-slate-800 font-sans antialiased overflow-x-hidden">
      {/* Mobile-constrained container for portrait phone (360-430px optimal) */}
      <div className="w-full max-w-md min-h-screen flex flex-col bg-white shadow-sm relative">
        {currentScreen === 'SPLASH' && (
          <SplashScreen
            onComplete={() => {
              setCurrentScreen('MAIN');
            }}
          />
        )}

        {currentScreen === 'LOGIN' && (
          <LoginScreen
            onLoginSuccess={handleLoginSuccess}
            soundEnabled={userProgress.soundEnabled}
            onToggleSound={handleToggleSound}
            language={userProfile.language}
            onUpdateLanguage={handleUpdateLanguage}
            onLogout={handleLogout}
          />
        )}

        {currentScreen === 'MAIN' && (
          <div className="w-full flex-1 flex flex-col relative pb-16">
            {/* TAB 1: HOME */}
            {activeNavTab === 'HOME' && (
              <div className="w-full px-4 pt-2">
                <HomeTab
                  userProfile={userProfile}
                  dailyState={dailyChallengeState}
                  onPlayDailyChallenge={handleStartDailyChallenge}
                  onOpenDailyReview={handleOpenDailyReviewFromHome}
                  onOpenFootballQuiz={() => setActiveNavTab('GAME')}
                  onOpenLeaderboard={() => setActiveNavTab('LEADERBOARD')}
                  currentLevelNumber={currentLevelNumber}
                  soundEnabled={userProgress.soundEnabled}
                  onToggleSound={handleToggleSound}
                  language={userProfile.language}
                  onUpdateLanguage={handleUpdateLanguage}
                  onLogout={handleLogout}
                  onOpenAdminQuestionBank={() => setShowAdminQuestionBank(true)}
                />
              </div>
            )}

            {/* TAB 2: GAME (Preserved Football Quiz 100-Level Interface) */}
            {activeNavTab === 'GAME' && (
              <LevelSelectScreen
                levels={LEVELS}
                userProgress={userProgress}
                currentUserMaskedMsisdn={userProfile.maskedMsisdn}
                onSelectLevel={handleSelectLevel}
                onResetProgress={handleResetProgress}
                onToggleSound={handleToggleSound}
                onOpenAdminQuestionBank={() => setShowAdminQuestionBank(true)}
              />
            )}

            {/* TAB 3: LEADERBOARD (EthioFantasy 7-Day Competition Top 10) */}
            {activeNavTab === 'LEADERBOARD' && (
              <div className="w-full px-4 pt-2">
                <LeaderboardTab
                  top10={leaderboardInfo.top10}
                  userPosition={leaderboardInfo.userPosition}
                  currentUserMaskedMsisdn={userProfile.maskedMsisdn}
                />
              </div>
            )}

            {/* TAB 4: PROFILE */}
            {activeNavTab === 'PROFILE' && (
              <div className="w-full px-4 pt-2">
                <ProfileTab
                  userProfile={userProfile}
                  dailyState={dailyChallengeState}
                  userProgress={userProgress}
                  onOpenLeaderboard={() => setActiveNavTab('LEADERBOARD')}
                  onToggleSound={handleToggleSound}
                  onToggleSubscription={handleToggleSubscription}
                  onUpdateLanguage={handleUpdateLanguage}
                  onToggleNotifications={handleToggleNotifications}
                  onLogout={handleLogout}
                />
              </div>
            )}

            {/* Persistent EthioFantasy App-Level Bottom Navigation Bar */}
            <BottomNavBar
              activeTab={activeNavTab}
              onTabChange={(tab) => {
                setActiveNavTab(tab);
              }}
            />
          </div>
        )}

        {currentScreen === 'PLAYING' && activeLevel && (
          <QuestionScreen
            level={activeLevel}
            score={userProgress.score}
            hearts={userProgress.hearts}
            isDailyChallenge={isDailyChallenge}
            onUpdateScore={handleUpdateScore}
            onUpdateHearts={handleUpdateHearts}
            onFinishLevel={handleFinishLevel}
            onBackToLevels={handleBackToLevels}
          />
        )}

        {currentScreen === 'CONGRATULATIONS' && activeLevel && (
          <CongratulationsScreen
            level={activeLevel}
            results={latestResults}
            levelScore={latestLevelScore}
            isDailyChallenge={isDailyChallenge}
            isReviewLocked={isReviewLocked}
            challengeDate={activeDailyDate || dailyChallengeState.date}
            onOpenReview={handleOpenReview}
            onBackToLevels={handleBackToLevels}
            onReplayLevel={handleReplayLevel}
          />
        )}

        {currentScreen === 'REVIEW' && activeLevel && (
          <ReviewScreen
            levelNumber={activeLevel.levelNumber}
            levelTitle={activeLevel.title}
            results={latestResults}
            isDailyChallenge={isDailyChallenge}
            isReviewLocked={isReviewLocked}
            challengeDate={activeDailyDate || dailyChallengeState.date}
            levelScore={latestLevelScore}
            onBackToResult={handleBackToResult}
            onBackToLevels={handleBackToLevels}
          />
        )}

        {/* Admin Question Bank Image Preview Modal (Requirement #13) */}
        <AdminQuestionBankModal
          isOpen={showAdminQuestionBank}
          onClose={() => setShowAdminQuestionBank(false)}
        />
      </div>
    </div>
  );
}
