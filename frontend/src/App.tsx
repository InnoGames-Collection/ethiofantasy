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
import {
  getDefaultUserProgress,
  fetchUserProgressFromDb,
  submitLevelProgressToDb,
  fetchLevelQuestionsFromDb,
} from './services/storageService';
import {
  getDefaultUserProfile,
  getDefaultDailyChallengeState,
  fetchDailyChallengeState,
  startDailyChallenge,
  completeDailyChallenge,
  fetchDailyChallengeReview,
  fetchTop10Leaderboard,
  getCurrentServiceDate,
  isDailyChallengeReviewLocked,
  maskMsisdn,
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

  // Strictly In-Memory & Database-Backed State (ZERO LocalStorage)
  const [userProgress, setUserProgress] = useState<UserProgress>(getDefaultUserProgress);
  const [userProfile, setUserProfile] = useState<UserProfile>(getDefaultUserProfile);
  const [dailyChallengeState, setDailyChallengeState] = useState<DailyChallengeState>(getDefaultDailyChallengeState);

  // Active Daily Challenge Session State (Loaded from PostgreSQL)
  const [dailySessionId, setDailySessionId] = useState<string | undefined>(undefined);
  const [dailyAttemptId, setDailyAttemptId] = useState<string | undefined>(undefined);
  const [dailyInitialIndex, setDailyInitialIndex] = useState<number>(0);
  const [dailyInitialResults, setDailyInitialResults] = useState<QuestionResult[]>([]);
  const [dailyInitialScore, setDailyInitialScore] = useState<number>(0);

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

  // Update total score in memory
  const handleUpdateScore = (newScore: number) => {
    setUserProgress((prev) => ({
      ...prev,
      score: Math.max(0, newScore),
    }));
  };

  // Update hearts in memory
  const handleUpdateHearts = (newHearts: number) => {
    setUserProgress((prev) => ({ ...prev, hearts: Math.max(0, newHearts) }));
  };

  // Toggle sound
  const handleToggleSound = () => {
    setUserProgress((prev) => {
      const nextSound = !prev.soundEnabled;
      sound.setSoundEnabled(nextSound);
      return { ...prev, soundEnabled: nextSound };
    });
  };

  // Safe progress check: refreshes from database
  const handleResetProgress = () => {
    if (userProfile.msisdn) {
      fetchUserProgressFromDb(userProfile.msisdn).then(setUserProgress);
    } else {
      setUserProgress(getDefaultUserProgress());
    }
  };

  // Start Level from 100 Championship Levels (Dynamic DB Question Fetching)
  const handleSelectLevel = async (level: LevelData) => {
    sound.playTap();
    // Query 10 fresh randomized questions from PostgreSQL for this level/category
    const dbQuestions = await fetchLevelQuestionsFromDb(level.id);
    const questionsToUse = (dbQuestions && dbQuestions.length > 0) ? dbQuestions : level.questions;

    const randomizedLevel: LevelData = {
      ...level,
      questions: questionsToUse,
    };

    setActiveLevel(randomizedLevel);
    setIsDailyChallenge(false);
    setDailyInitialIndex(0);
    setDailyInitialResults([]);
    setDailyInitialScore(0);
    setUserProgress((prev) => ({ ...prev, hearts: 5 }));
    window.history.pushState({ screen: 'PLAYING' }, '');
    setCurrentScreen('PLAYING');
  };

  // Start Daily Challenge (Strictly 1 Attempt per Day, Resumes In-Progress Session from PostgreSQL)
  const handleStartDailyChallenge = async () => {
    sound.playTap();
    const today = getCurrentServiceDate();
    setActiveDailyDate(today);

    if (dailyChallengeState.completed && dailyChallengeState.date === today) {
      alert("Today's Daily Challenge is already completed. Available again tomorrow!");
      return;
    }

    const session = await startDailyChallenge(userProfile.msisdn);
    if (!session.success || !session.questions || session.questions.length === 0) {
      alert(session.error || "Today's Daily Challenge already completed.");
      return;
    }

    const dailyQuestions = session.questions;
    const currentIndex = session.currentIndex || 0;
    const currentScore = session.currentScore || 0;
    const sessionAnswers = session.sessionAnswers || [];

    // Map existing answers already recorded in PostgreSQL
    const prevResults: QuestionResult[] = sessionAnswers.map((ans: any, idx: number) => {
      const q = dailyQuestions[idx];
      const selectedIdx = ans.selectedIndex ?? ans.selectedOptionIndex;
      return {
        questionNumber: idx + 1,
        questionText: q?.questionText || `Question ${idx + 1}`,
        categoryTitle: q?.categoryTitle || 'DAILY CHALLENGE',
        imageType: q?.imageType,
        imageIdentifier: q?.imageIdentifier,
        options: q?.options || [],
        selectedOptionIndex: selectedIdx,
        userAnswer: (selectedIdx !== null && selectedIdx !== undefined && q?.options?.[selectedIdx])
          ? q.options[selectedIdx]
          : 'Timed Out',
        correctAnswer: '',
        correctAnswerIndex: 0,
        isCorrect: Boolean(ans.isCorrect),
        timeRemaining: Math.max(0, 10 - Math.round(ans.elapsedSeconds || 10)),
        elapsedSeconds: ans.elapsedSeconds || 10,
        baseScore: ans.baseScore || 0,
        speedScore: ans.speedScore || 0,
        finalQuestionScore: ans.questionScore || 0,
      };
    });

    setDailySessionId(session.sessionId);
    setDailyAttemptId(session.attemptId);
    setDailyInitialIndex(currentIndex);
    setDailyInitialResults(prevResults);
    setDailyInitialScore(currentScore);

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
  const handleFinishLevel = async (
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
        // Finalize Daily Challenge Attempt in PostgreSQL and update 7-Day competition total
        if (dailyAttemptId && userProfile.msisdn) {
          await completeDailyChallenge({
            msisdn: userProfile.msisdn,
            attemptId: dailyAttemptId,
          });
        }
        // Refresh authoritative Daily Challenge State & Leaderboard directly from PostgreSQL
        const updatedState = await fetchDailyChallengeState(userProfile.msisdn);
        setDailyChallengeState(updatedState);
        fetchTop10Leaderboard(userProfile.msisdn).then((info) => {
          if (info && info.top10) setLeaderboardInfo(info);
        });
      } else {
        // Championship Level: Sequential unlocking in PostgreSQL
        // Passing requirement: at least 9/10 correct
        const earnedStars = correctCount === 10 ? 3 : correctCount === 9 ? 2 : 0;

        if (userProfile.msisdn) {
          const updatedProgress = await submitLevelProgressToDb({
            msisdn: userProfile.msisdn,
            levelId: activeLevel.id,
            stars: earnedStars,
            score: pointsEarned,
            percentage: pct,
          });
          setUserProgress(updatedProgress);
        } else {
          // Unauthenticated fallback
          setUserProgress((prev) => ({
            ...prev,
            score: prev.score + pointsEarned,
            stars: prev.stars + earnedStars,
            unlockedLevelIds: earnedStars >= 2
              ? Array.from(new Set([...prev.unlockedLevelIds, Math.min(100, activeLevel.id + 1)]))
              : prev.unlockedLevelIds,
            completedLevelIds: earnedStars >= 2
              ? Array.from(new Set([...prev.completedLevelIds, activeLevel.id]))
              : prev.completedLevelIds,
          }));
        }
      }
    }

    window.history.pushState({ screen: 'CONGRATULATIONS' }, '');
    setCurrentScreen('CONGRATULATIONS');
  };

  // Return to Level select / Home
  const handleBackToLevels = () => {
    setActiveLevel(null);
    if (isDailyChallenge) {
      // Refresh daily state so Home tab reflects held question index
      if (userProfile.msisdn) {
        fetchDailyChallengeState(userProfile.msisdn).then(setDailyChallengeState);
      }
      setActiveNavTab('HOME');
    } else {
      setActiveNavTab('GAME');
    }
    setCurrentScreen('MAIN');
  };

  // Replay current level (Permitted for training levels with dynamic DB question shuffle, STRICTLY DENIED for real Daily Challenge)
  const handleReplayLevel = async () => {
    if (isDailyChallenge) {
      setActiveLevel(null);
      setActiveNavTab('HOME');
      setCurrentScreen('MAIN');
      return;
    }
    if (activeLevel) {
      sound.playTap();
      const dbQuestions = await fetchLevelQuestionsFromDb(activeLevel.id);
      const questionsToUse = (dbQuestions && dbQuestions.length > 0) ? dbQuestions : activeLevel.questions;
      setActiveLevel({ ...activeLevel, questions: questionsToUse });
      setUserProgress((prev) => ({ ...prev, hearts: 5 }));
      setCurrentScreen('PLAYING');
    } else {
      setCurrentScreen('MAIN');
    }
  };

  // Open Review screen
  const handleOpenReview = async () => {
    if (isDailyChallenge && userProfile.msisdn) {
      const reviewData = await fetchDailyChallengeReview(
        userProfile.msisdn,
        activeDailyDate || dailyChallengeState.date
      );
      if (reviewData.success && reviewData.results.length > 0) {
        setLatestResults(reviewData.results);
        setLatestLevelScore(reviewData.levelScore);
      }
    }
    window.history.pushState({ screen: 'REVIEW' }, '');
    setCurrentScreen('REVIEW');
  };

  // Open Daily Challenge Review directly from Home tab
  const handleOpenDailyReviewFromHome = async () => {
    if (userProfile.msisdn) {
      const reviewData = await fetchDailyChallengeReview(userProfile.msisdn, dailyChallengeState.date);
      if (reviewData.success && reviewData.results.length > 0) {
        setLatestResults(reviewData.results);
        setLatestLevelScore(reviewData.levelScore);
      }
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
    setUserProfile((prev) => ({ ...prev, isSubscribed: !prev.isSubscribed }));
  };

  const handleUpdateLanguage = (lang: 'en' | 'am' | 'om') => {
    setUserProfile((prev) => ({ ...prev, language: lang }));
  };

  const handleToggleNotifications = () => {
    setUserProfile((prev) => ({ ...prev, notificationsEnabled: !prev.notificationsEnabled }));
  };

  // STRICT ACCOUNT LOGOUT (Zero residual localStorage state, everything resets in-memory)
  const handleLogout = () => {
    setUserProfile(getDefaultUserProfile());
    setUserProgress(getDefaultUserProgress());
    setDailyChallengeState(getDefaultDailyChallengeState());
    setDailySessionId(undefined);
    setDailyAttemptId(undefined);
    setDailyInitialIndex(0);
    setDailyInitialResults([]);
    setDailyInitialScore(0);
    setActiveLevel(null);
    setCurrentScreen('LOGIN');
  };

  // STRICT ACCOUNT LOGIN (Loads that specific MSISDN's isolated data directly from PostgreSQL)
  const handleLoginSuccess = async (msisdn: string) => {
    const updatedProfile: UserProfile = {
      ...getDefaultUserProfile(),
      msisdn,
      maskedMsisdn: maskMsisdn(msisdn),
      isLoggedIn: true,
    };
    setUserProfile(updatedProfile);

    // Fetch authoritative progression for this specific MSISDN directly from PostgreSQL
    const [progress, dailyState, leaderboard] = await Promise.all([
      fetchUserProgressFromDb(msisdn),
      fetchDailyChallengeState(msisdn),
      fetchTop10Leaderboard(msisdn),
    ]);

    setUserProgress(progress);
    setDailyChallengeState(dailyState);
    if (leaderboard && leaderboard.top10) {
      setLeaderboardInfo(leaderboard);
    }

    setCurrentScreen('MAIN');
    setActiveNavTab('HOME');
  };

  // 7-Day Top 10 Leaderboard Data (Real-Time API with graceful fallback)
  const [leaderboardInfo, setLeaderboardInfo] = useState<{
    top10: any[];
    userPosition: any;
  }>({ top10: [], userPosition: null });

  useEffect(() => {
    if (userProfile.msisdn) {
      fetchDailyChallengeState(userProfile.msisdn).then((state) => {
        if (state) setDailyChallengeState(state);
      });
      fetchTop10Leaderboard(userProfile.msisdn).then((info) => {
        if (info && info.top10) {
          setLeaderboardInfo(info);
        }
      });
    }
  }, [userProfile.msisdn, activeNavTab, dailyChallengeState.sevenDayTotal]);

  const currentLevelNumber = Math.min(100, Math.max(...userProgress.unlockedLevelIds, 1));

  return (
    <div className="w-full min-h-screen bg-white flex justify-center text-slate-800 font-sans antialiased overflow-x-hidden">
      {/* Mobile-constrained container for portrait phone (360-430px optimal) */}
      <div className="w-full max-w-md min-h-screen flex flex-col bg-white shadow-sm relative">
        {currentScreen === 'SPLASH' && (
          <SplashScreen
            onComplete={() => {
              setCurrentScreen(userProfile.isLoggedIn ? 'MAIN' : 'LOGIN');
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
            userMsisdn={userProfile.msisdn}
            sessionId={dailySessionId}
            attemptId={dailyAttemptId}
            initialQuestionIndex={dailyInitialIndex}
            initialResults={dailyInitialResults}
            initialScore={dailyInitialScore}
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
