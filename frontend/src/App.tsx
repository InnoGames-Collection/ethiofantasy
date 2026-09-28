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
  getDailyChallengeQuestions,
  getCurrentServiceDate,
} from './services/ethioFantasyService';
import { sound } from './services/soundService';

import { SplashScreen } from './components/screens/SplashScreen';
import { LevelSelectScreen } from './components/screens/LevelSelectScreen';
import { QuestionScreen } from './components/screens/QuestionScreen';
import { CongratulationsScreen } from './components/screens/CongratulationsScreen';
import { ReviewScreen } from './components/screens/ReviewScreen';
import { LoginScreen } from './components/screens/LoginScreen';

import { HomeTab } from './components/tabs/HomeTab';
import { LeaderboardTab } from './components/tabs/LeaderboardTab';
import { ProfileTab } from './components/tabs/ProfileTab';
import { BottomNavBar } from './components/navigation/BottomNavBar';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('SPLASH');
  const [activeNavTab, setActiveNavTab] = useState<BottomNavTab>('HOME');

  const [userProgress, setUserProgress] = useState<UserProgress>(loadUserProgress);
  const [userProfile, setUserProfile] = useState<UserProfile>(loadUserProfile);
  const [dailyChallengeState, setDailyChallengeState] = useState<DailyChallengeState>(() =>
    loadDailyChallengeState(userProfile.msisdn)
  );

  const [activeLevel, setActiveLevel] = useState<LevelData | null>(null);
  const [isDailyChallenge, setIsDailyChallenge] = useState<boolean>(false);
  const [latestResults, setLatestResults] = useState<QuestionResult[]>([]);
  const [latestLevelScore, setLatestLevelScore] = useState<number>(0);

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
    setUserProgress((prev) => {
      const updated = { ...prev, hearts: Math.max(0, newHearts) };
      saveUserProgress(updated);
      return updated;
    });
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

  // Reset all progress back to Level 1 unlocked only
  const handleResetProgress = () => {
    const fresh = resetUserProgress();
    setUserProgress(fresh);
    sound.setSoundEnabled(fresh.soundEnabled);
  };

  // Start Level from 100 Championship Levels
  const handleSelectLevel = (level: LevelData) => {
    setActiveLevel(level);
    setIsDailyChallenge(false);
    window.history.pushState({ screen: 'PLAYING' }, '');
    setCurrentScreen('PLAYING');
  };

  // Start Daily Challenge (Strictly 1 Attempt per Day)
  const handleStartDailyChallenge = async () => {
    const today = getCurrentServiceDate();
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
        // LEVEL GAME SCORES NEVER ENTER DAILY SCORE OR 7-DAY SCORE!
        const updatedDaily = recordDailyChallengeScore(
          userProfile.msisdn,
          pointsEarned,
          totalResponseTime || 45.0
        );
        setDailyChallengeState(updatedDaily);
      } else {
        // Championship Level: Sequential unlocking of next level
        // Level points are TRAINING points only and DO NOT affect 7-Day Competition
        const earnedStars = pct >= 90 ? 3 : pct >= 60 ? 2 : pct >= 30 ? 1 : 0;

        setUserProgress((prev) => {
          const prevStarsForLevel = prev.levelStars[activeLevel.id] || 0;
          const starDiff = Math.max(0, earnedStars - prevStarsForLevel);

          const nextLevelId = activeLevel.id + 1;
          const updatedUnlocked = [...prev.unlockedLevelIds];

          if (nextLevelId <= 100 && !updatedUnlocked.includes(nextLevelId)) {
            updatedUnlocked.push(nextLevelId);
          }

          const updatedCompleted = prev.completedLevelIds.includes(activeLevel.id)
            ? prev.completedLevelIds
            : [...prev.completedLevelIds, activeLevel.id];

          const updated: UserProgress = {
            ...prev,
            score: prev.score + pointsEarned,
            stars: prev.stars + starDiff,
            unlockedLevelIds: updatedUnlocked,
            completedLevelIds: updatedCompleted,
            levelStars: {
              ...prev.levelStars,
              [activeLevel.id]: Math.max(prevStarsForLevel, earnedStars),
            },
            levelScores: {
              ...prev.levelScores,
              [activeLevel.id]: Math.max(prev.levelScores[activeLevel.id] || 0, pointsEarned),
            },
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

  // Replay current level (Permitted for training levels, DENIED for Daily Challenge)
  const handleReplayLevel = () => {
    if (isDailyChallenge) {
      setActiveLevel(null);
      setActiveNavTab('HOME');
      setCurrentScreen('MAIN');
      return;
    }
    if (activeLevel) {
      setCurrentScreen('PLAYING');
    } else {
      setCurrentScreen('MAIN');
    }
  };

  // Open Review screen
  const handleOpenReview = () => {
    window.history.pushState({ screen: 'REVIEW' }, '');
    setCurrentScreen('REVIEW');
  };

  // Back to Result from Review
  const handleBackToResult = () => {
    setCurrentScreen('CONGRATULATIONS');
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

  // 7-Day Top 10 Leaderboard Data
  const leaderboardInfo = useMemo(() => {
    return getTop10Leaderboard(userProfile.msisdn, dailyChallengeState.sevenDayTotal);
  }, [userProfile.msisdn, dailyChallengeState.sevenDayTotal]);

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
                  onOpenFootballQuiz={() => setActiveNavTab('GAME')}
                  onOpenLeaderboard={() => setActiveNavTab('LEADERBOARD')}
                  currentLevelNumber={currentLevelNumber}
                  soundEnabled={userProgress.soundEnabled}
                  onToggleSound={handleToggleSound}
                  language={userProfile.language}
                  onUpdateLanguage={handleUpdateLanguage}
                  onLogout={handleLogout}
                />
              </div>
            )}

            {/* TAB 2: GAME (Preserved Football Quiz 100-Level Interface) */}
            {activeNavTab === 'GAME' && (
              <LevelSelectScreen
                levels={LEVELS}
                userProgress={userProgress}
                onSelectLevel={handleSelectLevel}
                onResetProgress={handleResetProgress}
                onToggleSound={handleToggleSound}
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
            onBackToResult={handleBackToResult}
            onBackToLevels={handleBackToLevels}
          />
        )}
      </div>
    </div>
  );
}
