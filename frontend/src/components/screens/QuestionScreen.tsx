import React, { useState, useEffect, useRef } from 'react';
import { LevelData, Question, QuestionResult } from '../../types/quiz';
import { HeaderHud } from '../common/HeaderHud';
import { QuestionImageCard } from '../common/QuestionImageCard';
import { GoalAnimation } from '../common/GoalAnimation';
import { sound } from '../../services/soundService';
import {
  calculateQuestionScore,
  calculateSpeedPoints,
  submitDailyChallengeAnswer,
} from '../../services/ethioFantasyService';
import { Clock, ChevronRight } from 'lucide-react';

interface QuestionScreenProps {
  level: LevelData;
  score: number;
  hearts: number;
  isDailyChallenge?: boolean;
  userMsisdn?: string;
  sessionId?: string;
  attemptId?: string;
  initialQuestionIndex?: number;
  initialResults?: QuestionResult[];
  initialScore?: number;
  onUpdateScore: (newScore: number) => void;
  onUpdateHearts: (newHearts: number) => void;
  onFinishLevel: (results: QuestionResult[], earnedScore: number, totalResponseTime?: number) => void;
  onBackToLevels: () => void;
}

export const QuestionScreen: React.FC<QuestionScreenProps> = ({
  level,
  score,
  hearts,
  isDailyChallenge = false,
  userMsisdn = '',
  sessionId,
  attemptId,
  initialQuestionIndex = 0,
  initialResults = [],
  initialScore = 0,
  onUpdateScore,
  onUpdateHearts,
  onFinishLevel,
  onBackToLevels,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialQuestionIndex);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isAnswerLocked, setIsAnswerLocked] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [results, setResults] = useState<QuestionResult[]>(initialResults);

  // 10s for Daily Challenge, 60s for standard training levels
  const QUESTION_TIME_LIMIT = isDailyChallenge ? 10 : 60;
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const [eliminatedOptions, setEliminatedOptions] = useState<number[]>([]);
  const [hintUsed, setHintUsed] = useState(false);
  const [expertUsed, setExpertUsed] = useState(false);

  const [challengeScoreEarned, setChallengeScoreEarned] = useState(initialScore);
  const [totalResponseTime, setTotalResponseTime] = useState(0);
  const [lastQuestionEarned, setLastQuestionEarned] = useState(0);
  const [isTimedOut, setIsTimedOut] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTimeRef = useRef<number>(Date.now());
  const currentQuestion: Question = level.questions[currentQuestionIndex] || level.questions[0] || {
    id: 'placeholder',
    categoryTitle: 'FOOTBALL QUIZ',
    questionText: 'Loading question...',
    type: 'trivia',
    options: ['A', 'B', 'C', 'D'],
    correctAnswerIndex: 0,
  };

  // Reset 1 life per level on level start or replay (for level games)
  useEffect(() => {
    setHintUsed(false);
    setExpertUsed(false);
    if (!isDailyChallenge) {
      setCurrentQuestionIndex(0);
      setResults([]);
      setChallengeScoreEarned(0);
      setTotalResponseTime(0);
    }
  }, [level.id, isDailyChallenge]);

  // Reset question-specific state on each new question
  useEffect(() => {
    setTimeLeft(QUESTION_TIME_LIMIT);
    setSelectedOptionIndex(null);
    setIsAnswerLocked(false);
    setIsTimedOut(false);
    setShowGoalModal(false);
    setEliminatedOptions([]);
    questionStartTimeRef.current = Date.now();

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        if (isDailyChallenge ? prev <= 3 : prev <= 5) {
          sound.playTimerTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuestionIndex]);

  // Detect when countdown reaches 0 and trigger timeout
  useEffect(() => {
    if (timeLeft === 0 && !isAnswerLocked) {
      handleTimeout();
    }
  }, [timeLeft, isAnswerLocked]);

  // Timeout handler: 0 points (Base = 0, Speed = 0)
  const handleTimeout = async () => {
    if (isAnswerLocked) return;
    setIsAnswerLocked(true);
    setIsTimedOut(true);
    sound.playWrong();

    if (timerRef.current) clearInterval(timerRef.current);

    if (!isDailyChallenge) {
      const nextHearts = Math.max(0, hearts - 1);
      onUpdateHearts(nextHearts);
    }

    const elapsedSeconds = QUESTION_TIME_LIMIT;

    if (isDailyChallenge) {
      // Authoritative async submission to PostgreSQL
      submitDailyChallengeAnswer({
        msisdn: userMsisdn,
        sessionId,
        attemptId,
        questionId: currentQuestion.id,
        selectedOptionIndex: null,
      }).catch((err) => console.warn('[Daily timeout sync error]', err));
    }

    const questionResult: QuestionResult = {
      questionNumber: currentQuestionIndex + 1,
      questionText: currentQuestion.questionText,
      categoryTitle: currentQuestion.categoryTitle,
      imageType: currentQuestion.imageType,
      imageIdentifier: currentQuestion.imageIdentifier,
      options: currentQuestion.options,
      selectedOptionIndex: null,
      userAnswer: 'Timed Out',
      correctAnswer: typeof currentQuestion.correctAnswerIndex === 'number'
        ? currentQuestion.options[currentQuestion.correctAnswerIndex] || ''
        : '',
      correctAnswerIndex: currentQuestion.correctAnswerIndex ?? 0,
      isCorrect: false,
      timeRemaining: 0,
      elapsedSeconds,
      baseScore: 0,
      speedScore: 0,
      finalQuestionScore: 0,
    };

    const newResults = [...results, questionResult];
    setResults(newResults);

    setTimeout(() => {
      advanceNextQuestion(newResults);
    }, isDailyChallenge ? 500 : 1600);
  };

  // Option selection
  const handleSelectOption = async (index: number) => {
    if (isAnswerLocked || eliminatedOptions.includes(index)) return;

    if (timerRef.current) clearInterval(timerRef.current);
    setIsAnswerLocked(true);
    setSelectedOptionIndex(index);

    const elapsedMs = Date.now() - questionStartTimeRef.current;
    const elapsedSeconds = Math.min(QUESTION_TIME_LIMIT, Math.max(0.1, elapsedMs / 1000));

    let isCorrect = false;
    let baseScore = 0;
    let speedScore = 0;
    let finalQuestionScore = 0;

    if (isDailyChallenge) {
      // Authoritative PostgreSQL answer submission
      try {
        const resp = await submitDailyChallengeAnswer({
          msisdn: userMsisdn,
          sessionId,
          attemptId,
          questionId: currentQuestion.id,
          selectedOptionIndex: index,
        });

        if (resp && resp.success) {
          isCorrect = Boolean(resp.isCorrect);
          baseScore = resp.baseScore ?? (isCorrect ? 1 : 0);
          speedScore = resp.speedScore ?? (isCorrect ? calculateSpeedPoints(elapsedSeconds) : 0);
          finalQuestionScore = resp.questionScore ?? (baseScore + speedScore);
        } else {
          // Client-side fallback if server unreachable
          isCorrect = typeof currentQuestion.correctAnswerIndex === 'number' && index === currentQuestion.correctAnswerIndex;
          const scoreCalc = calculateQuestionScore(isCorrect, elapsedSeconds);
          baseScore = scoreCalc.baseScore;
          speedScore = scoreCalc.speedScore;
          finalQuestionScore = scoreCalc.finalScore;
        }
      } catch {
        isCorrect = typeof currentQuestion.correctAnswerIndex === 'number' && index === currentQuestion.correctAnswerIndex;
        const scoreCalc = calculateQuestionScore(isCorrect, elapsedSeconds);
        baseScore = scoreCalc.baseScore;
        speedScore = scoreCalc.speedScore;
        finalQuestionScore = scoreCalc.finalScore;
      }

      setTotalResponseTime((prev) => prev + elapsedSeconds);
      if (isCorrect) {
        setChallengeScoreEarned((prev) => prev + finalQuestionScore);
        setLastQuestionEarned(finalQuestionScore);
      }
    } else {
      // Level-Based Game: Calibrated points (1 base pt, +1 speed pt if answered <= 20s, max 2 pts per question)
      isCorrect = index === currentQuestion.correctAnswerIndex;
      const pointsEarned = isCorrect ? (1 + (timeLeft >= 40 ? 1 : 0)) : 0;
      finalQuestionScore = pointsEarned;
      baseScore = isCorrect ? 1 : 0;
      speedScore = pointsEarned > 1 ? 1 : 0;
      if (isCorrect) {
        setChallengeScoreEarned((prev) => prev + pointsEarned);
        setLastQuestionEarned(pointsEarned);
      }
    }

    const selectedAnswerText = currentQuestion.options[index] || '';
    const correctAnswerText = typeof currentQuestion.correctAnswerIndex === 'number'
      ? currentQuestion.options[currentQuestion.correctAnswerIndex] || ''
      : '';

    const questionResult: QuestionResult = {
      questionNumber: currentQuestionIndex + 1,
      questionText: currentQuestion.questionText,
      categoryTitle: currentQuestion.categoryTitle,
      imageType: currentQuestion.imageType,
      imageIdentifier: currentQuestion.imageIdentifier,
      options: currentQuestion.options,
      selectedOptionIndex: index,
      userAnswer: selectedAnswerText,
      correctAnswer: correctAnswerText,
      correctAnswerIndex: currentQuestion.correctAnswerIndex ?? 0,
      isCorrect,
      timeRemaining: timeLeft,
      elapsedSeconds: parseFloat(elapsedSeconds.toFixed(3)),
      baseScore,
      speedScore,
      finalQuestionScore,
    };

    const newResults = [...results, questionResult];
    setResults(newResults);

    if (isDailyChallenge) {
      // DAILY CHALLENGE CRITICAL RULE: DO NOT reveal whether answer is correct or wrong during gameplay!
      sound.playTap();
      setTimeout(() => {
        advanceNextQuestion(newResults);
      }, 450);
    } else {
      // LEVEL-BASED GAME: Reveal answer feedback
      if (isCorrect) {
        sound.playCorrect();
        setTimeout(() => {
          setShowGoalModal(true);
        }, 350);
      } else {
        sound.playWrong();
        const nextHearts = Math.max(0, hearts - 1);
        onUpdateHearts(nextHearts);

        // Wait 1.6s so player clearly perceives the revealed correct option
        setTimeout(() => {
          advanceNextQuestion(newResults);
        }, 1600);
      }
    }
  };

  // Advance to next question or complete level ONLY after final question!
  const advanceNextQuestion = (latestResults: QuestionResult[]) => {
    setShowGoalModal(false);
    if (currentQuestionIndex + 1 < level.questions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Completed ALL questions in level!
      // Synchronously compute total earned points and total time directly from complete latestResults
      const totalEarned = latestResults.reduce((sum, r) => sum + r.finalQuestionScore, 0);
      const totalTime = latestResults.reduce((sum, r) => sum + r.elapsedSeconds, 0);
      onFinishLevel(latestResults, totalEarned, totalTime);
    }
  };

  // Hint (50/50 elimination)
  const handleUseHint = () => {
    if (hintUsed || isAnswerLocked) return;
    sound.playTap();
    setHintUsed(true);

    const wrongIndices = [0, 1, 2, 3].filter((i) => i !== currentQuestion.correctAnswerIndex);
    const toEliminate = wrongIndices.slice(0, 2);
    setEliminatedOptions(toEliminate);
  };

  // Expert (Reveal correct)
  const handleUseExpert = () => {
    if (expertUsed || isAnswerLocked) return;
    sound.playTap();
    setExpertUsed(true);

    const wrongIndices = [0, 1, 2, 3].filter((i) => i !== currentQuestion.correctAnswerIndex);
    setEliminatedOptions(wrongIndices);
  };

  const progressPercent = Math.round(((currentQuestionIndex + 1) / level.questions.length) * 100);

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-gradient-to-b from-[#eef6ff] via-[#f7fbff] to-[#e8f3fe] text-slate-800 relative overflow-hidden select-none pb-4">
      {/* Soft pitch grass aura and subtle curves */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-blue-100/60 to-transparent pointer-events-none" />

      {/* Top HUD */}
      <div className="w-full max-w-md mx-auto">
        <HeaderHud
          mode="question"
          isDailyChallenge={isDailyChallenge}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={level.questions.length}
          timeLeft={timeLeft}
          score={isDailyChallenge ? score : (score + challengeScoreEarned)}
          hearts={hearts}
          levelNumber={level.levelNumber}
          onBackClick={() => {
            sound.playTap();
            onBackToLevels();
          }}
        />

        {/* Level-based secondary bar (only for Level-based game, not for daily challenge) */}
        {!isDailyChallenge && (
          <div className="flex items-center justify-between px-5 py-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-blue-900">
              <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-black text-[11px]">
                Question {currentQuestionIndex + 1}/{level.questions.length}
              </span>
            </div>

            {/* Countdown Timer */}
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono font-bold text-xs shadow-xs ${
              timeLeft <= 10
                ? 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse'
                : 'bg-white text-blue-800 border border-blue-200'
            }`}>
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span>
            </div>
          </div>
        )}

        {/* Progress Bar (Bright Blue & Green) */}
        <div className="w-full px-5 mt-1">
          <div className="w-full h-2 rounded-full bg-blue-100 overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question Card Container */}
      <div className="w-full max-w-md mx-auto px-4 flex flex-col items-center justify-center flex-1 my-2">
        {/* Category Header */}
        <span className="text-xs font-black tracking-widest text-blue-800 uppercase mb-2 text-center drop-shadow-xs">
          {currentQuestion.categoryTitle}
        </span>

        {/* White Question Image Card */}
        <div className="w-full mb-3">
          <QuestionImageCard
            question={currentQuestion}
            onUseHint={handleUseHint}
            onUseExpert={handleUseExpert}
            hintUsed={hintUsed}
            expertUsed={expertUsed}
            isDailyChallenge={isDailyChallenge}
          />
        </div>

        {/* Question Text in Dark High-Readability Font on White surface */}
        <div className="w-full max-w-[350px] p-3 rounded-2xl bg-white border border-blue-100 shadow-sm text-center mb-3">
          <p className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
            {currentQuestion.questionText}
          </p>
        </div>

        {/* Time expired banner */}
        {isTimedOut && (
          <div className="mb-2 px-3 py-1 rounded-full bg-rose-600 text-white font-black text-xs uppercase tracking-wider animate-shake shadow-md">
            Time's Up! Moving to next question...
          </div>
        )}

        {/* 2x2 Answer Grid */}
        <div className="w-full max-w-[350px] grid grid-cols-2 gap-2.5">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedOptionIndex === index;
            const isCorrect = typeof currentQuestion.correctAnswerIndex === 'number' && index === currentQuestion.correctAnswerIndex;
            const isEliminated = eliminatedOptions.includes(index);

            // Default: Crisp white button with blue border and slate text
            let buttonClasses = 'bg-white border-2 border-blue-100 text-slate-800 hover:border-blue-400 hover:bg-blue-50/60 shadow-xs';
            let badge = null;

            if (isAnswerLocked) {
              if (isDailyChallenge) {
                // DAILY CHALLENGE CRITICAL RULE: DO NOT reveal whether answer is correct or wrong!
                if (isSelected) {
                  buttonClasses = 'bg-blue-600 border-2 border-blue-600 text-white shadow-md';
                } else {
                  buttonClasses = 'opacity-40 bg-slate-100 border-slate-200 text-slate-400';
                }
                badge = null;
              } else {
                // LEVEL-BASED GAME: Keep existing rich feedback (green/red, Correct/Wrong badges)
                if (isSelected) {
                  if (isCorrect) {
                    buttonClasses = 'bg-emerald-600 border-2 border-emerald-500 text-white shadow-md animate-scaleUp';
                    badge = (
                      <span className="absolute -top-2.5 inset-x-0 mx-auto w-max px-2 py-0.5 rounded-full bg-emerald-700 text-[9px] font-black text-white tracking-widest uppercase shadow-xs">
                        CORRECT ✓
                      </span>
                    );
                  } else {
                    buttonClasses = 'bg-rose-600 border-2 border-rose-500 text-white shadow-md animate-shake';
                    badge = (
                      <span className="absolute -top-2.5 inset-x-0 mx-auto w-max px-2 py-0.5 rounded-full bg-rose-700 text-[9px] font-black text-white tracking-widest uppercase shadow-xs">
                        WRONG ✕
                      </span>
                    );
                  }
                } else if (isCorrect) {
                  // Revealed correct answer in Green
                  buttonClasses = 'bg-emerald-600 border-2 border-emerald-500 text-white shadow-md';
                  badge = (
                    <span className="absolute -top-2.5 inset-x-0 mx-auto w-max px-2 py-0.5 rounded-full bg-emerald-700 text-[9px] font-black text-white tracking-widest uppercase shadow-xs">
                      CORRECT ✓
                    </span>
                  );
                } else {
                  buttonClasses = 'opacity-40 bg-slate-100 border-slate-200 text-slate-400';
                }
              }
            } else if (isEliminated) {
              buttonClasses = 'opacity-30 bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through';
            }

            return (
              <button
                key={index}
                onClick={() => handleSelectOption(index)}
                disabled={isAnswerLocked || isEliminated}
                className={`relative min-h-[52px] px-3 py-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center text-center transition-all duration-150 active:scale-97 cursor-pointer ${buttonClasses}`}
              >
                {badge}
                <span className="line-clamp-2 leading-tight">
                  {option}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Sub-Navigation Bar */}
      <div className="w-full max-w-md mx-auto px-5 pt-2 flex items-center justify-between">
        <button
          onClick={() => {
            sound.playTap();
            onBackToLevels();
          }}
          className="text-xs font-bold text-slate-500 hover:text-blue-700 transition-colors cursor-pointer"
        >
          {isDailyChallenge ? 'Pause / Hold Challenge' : 'Exit Level'}
        </button>

        {isAnswerLocked && !isDailyChallenge && (
          <button
            onClick={() => {
              sound.playTap();
              advanceNextQuestion(results);
            }}
            className="flex items-center gap-1 px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wide shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <span>Next Question</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* GOAL! Celebratory Modal (Level game only) */}
      {showGoalModal && !isDailyChallenge && (
        <GoalAnimation
          rewardCoins={lastQuestionEarned}
          questionIndex={currentQuestionIndex}
          totalQuestions={level.questions.length}
          onContinue={() => advanceNextQuestion(results)}
        />
      )}
    </div>
  );
};
