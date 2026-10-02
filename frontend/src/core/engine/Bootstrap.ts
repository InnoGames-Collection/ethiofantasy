import { Game } from './Game';
import { GameRegistry } from '../managers/GameRegistry';
import { QuizGameMode } from '../../games/quiz/QuizGameMode';
import { AdminPanelScreen } from '../../ui/screens/AdminPanelScreen';
import { FootballLeagueHome } from '../../ui/screens/FootballLeagueHome';
import { PlayScreen } from '../../ui/screens/PlayScreen';
import { AuthManager } from '../auth/AuthManager';
import { AuthScreen } from '../../ui/screens/AuthScreen';
import { RealtimeService } from '../../networking/services/RealtimeService';

import { LeaderboardScreen } from '../../ui/screens/LeaderboardScreen';
import { ProfileScreen } from '../../ui/screens/ProfileScreen';
import { MatchmakingScreen } from '../../ui/screens/MatchmakingScreen';
import { MessageCenterScreen } from '../../ui/screens/MessageCenterScreen';
import { LiveMatchScreen } from '../../ui/screens/LiveMatchScreen';
import { QuestionBank } from '../quiz/QuestionBank';
import { BottomNav, TabId } from '../../ui/components/BottomNav';
import { SettingsScreen } from '../../ui/screens/SettingsScreen';
import { NotificationScreen } from '../../ui/screens/NotificationScreen';
import { DailyChallengeManager } from '../competition/DailyChallengeManager';
import { GameSessionManager } from '../quiz/GameSessionManager';

import { i18n } from '../../localization/i18n';
import { DetailedStatsScreen } from '../../ui/screens/DetailedStatsScreen';

import { SubscriptionScreen } from '../../ui/screens/SubscriptionScreen';
import { CacheManager } from '../cache/CacheManager';
import { EventBus } from '../events/EventBus';
import { MessageCenterService } from '../../networking/services/MessageCenterService';
import { AchievementsScreen } from '../../ui/screens/AchievementsScreen';
import { AwardsScreen } from '../../ui/screens/AwardsScreen';
import { InviteFriendsScreen } from '../../ui/screens/InviteFriendsScreen';
import { IdentityScreen } from '../../ui/screens/IdentityScreen';
import { FAQScreen } from '../../ui/screens/FAQScreen';
import { AboutScreen } from '../../ui/screens/AboutScreen';
import { TermsScreen } from '../../ui/screens/TermsScreen';

// --- Global Touch Interceptor ---
// Prevents rapid-tapping (double-taps) on all buttons by locking async handlers.
const originalAddEventListener = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function(type: string, listener: any, options?: boolean | AddEventListenerOptions) {
    if (type === 'click') {
        const originalListener = listener;
        listener = async function(this: any, event: Event) {
            const target = event.currentTarget as HTMLElement | null;
            if (target && target.nodeType === Node.ELEMENT_NODE) {
                if (target.hasAttribute('disabled') || target.hasAttribute('data-ethio-processing')) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    return;
                }
                
                target.setAttribute('data-ethio-processing', 'true');
                const prevPointerEvents = target.style.pointerEvents;
                target.style.pointerEvents = 'none';

                try {
                    const result = originalListener.call(this, event);
                    if (result instanceof Promise) {
                        await result;
                    }
                } finally {
                    setTimeout(() => {
                        target.removeAttribute('data-ethio-processing');
                        target.style.pointerEvents = prevPointerEvents;
                    }, 300);
                }
            } else {
                originalListener.call(this, event);
            }
        };
    }
    return originalAddEventListener.call(this, type, listener, options);
};
// --------------------------------

export async function bootstrapFootballLeague(): Promise<Game> {
    const game = new Game();
    await game.initialize();

    const authManager = AuthManager.getInstance(game.saveManager);
    const cacheManager = CacheManager.getInstance();
    const eventBus = EventBus.getInstance();
    const registry = new GameRegistry(game.uiManager);
    registry.registerGame(new QuizGameMode());

    MessageCenterService.getInstance().subscribeToBadgeUpdates((count) => {
        BottomNav.setBadge('profile', count);
    });

    const winAny = window as any;
    winAny.ethioAudio = game.audioManager;
    winAny.ethioSave = game.saveManager;
    winAny.ethioAuth = authManager;
    winAny.ethioCache = cacheManager;
    winAny.ethioEvents = eventBus;

    // Navigation Stack Management
    type RouteName = 'home' | 'play' | 'standings' | 'profile' | 'settings' | 'matchmaking' | 'live_match' | 'admin' | 'notifications' | 'stats' | 'messages' | 'subscription' | 'help' | 'faq' | 'about' | 'privacy' | 'terms' | 'quiz_game' | 'match_stats' | 'achievements' | 'awards' | 'invite' | 'identity' | 'play_single_path';

    let tabStacks: Record<TabId, RouteName[]> = {
        home: ['home'],
        play: ['play'],
        standings: ['standings'],
        profile: ['profile']
    };
    let currentTab: TabId = 'home';
    let activeScreen: any = null;

    // Single Page App (SPA) History Trap Pattern
    // We maintain exactly 2 states in browser history. When Android back is pressed,
    // we fall to the root state, instantly push the trap state again, and run our UI back logic.
    try {
        window.history.replaceState({ root: true }, '');
        window.history.pushState({ trap: true }, '');
    } catch (e) {}

    const renderRoute = async (route: RouteName, pushToStack: boolean = true) => {
        if (activeScreen && typeof activeScreen.destroy === 'function') {
            activeScreen.destroy();
        }
        game.audioManager.stopAllQuizAudio();
        activeScreen = null;
        if (pushToStack) {
            const stack = tabStacks[currentTab] || [];
            if (stack.length > 0 && stack[stack.length - 1] !== route) {
                stack.push(route);
            }
        }

        switch (route) {
            case 'home':
                BottomNav.setActiveTab('home');
                currentTab = 'home';
                cacheManager.setQuizActive(false);
                const homeScreen = new FootballLeagueHome(
                    game.saveManager, game.audioManager, game.uiManager,
                    {
                        onKickOff: async () => {
                            cacheManager.setQuizActive(true);
                            const quizMode = registry.getRegisteredGames().find(g => g.metadata.id === 'football-quiz') as QuizGameMode;
                            quizMode.setCompetition('walia-ibex');
                            
                            tabStacks[currentTab].push('quiz_game');
                            
                            await registry.launchGame('football-quiz');
                        },
                        onLiveMatch: () => renderRoute('matchmaking'),
                        onDailyChallenge: () => {
                            renderRoute('play_single_path', false);
                        },
                        onCompetitions: () => navigateToTab('standings'),
                        onLeaderboard: () => navigateToTab('standings'),
                        onAchievements: () => navigateToTab('profile'),
                        onAdminPanel: () => renderRoute('admin'),
                        onSettings: () => renderRoute('settings'),
                        onNotifications: () => renderRoute('notifications'),
                        onViewStats: () => renderRoute('stats'),
                        onMessages: () => renderRoute('messages'),
                        onCasualPlay: async () => {
                            const quizMode = registry.getRegisteredGames().find(g => g.metadata.id === 'football-quiz') as QuizGameMode;
                            quizMode.setCompetition('all');
                            quizMode.matchType = 'casual';
                            
                            tabStacks[currentTab].push('quiz_game');
                            
                            await registry.launchGame('football-quiz');
                        }
                    }
                );
                activeScreen = homeScreen;
                homeScreen.render();
                break;

            case 'play':
                BottomNav.setActiveTab('play');
                currentTab = 'play';
                cacheManager.setQuizActive(false);
                const playScreen = new PlayScreen(
                    game.uiManager, game.audioManager,
                    {
                        onCasualPlay: async (category?: string) => {
                            const quizMode = registry.getRegisteredGames().find(g => g.metadata.id === 'football-quiz') as QuizGameMode;
                            quizMode.setCompetition(category && category !== 'random' ? category : 'all');
                            quizMode.matchType = 'casual';
                            
                            tabStacks[currentTab].push('quiz_game');
                            
                            await registry.launchGame('football-quiz');
                        }
                    }
                );
                activeScreen = playScreen;
                playScreen.render();
                break;

            case 'standings':
                BottomNav.setActiveTab('standings');
                currentTab = 'standings';
                cacheManager.setQuizActive(false);
                const lbScreen = new LeaderboardScreen(
                    game.uiManager, game.saveManager, game.audioManager,
                    handleBack
                );
                activeScreen = lbScreen;
                await lbScreen.render();
                break;

            case 'play_single_path':
                cacheManager.setQuizActive(true);
                const challengeInfo = await DailyChallengeManager.getInstance().getTodayChallenge();
                const quizMode = registry.getRegisteredGames().find(g => g.metadata.id === 'football-quiz') as any;
                
                if (!challengeInfo.completed && challengeInfo.questions.length > 0) {
                    quizMode.setCompetition(challengeInfo.questions[0]?.category || 'world-cup');
                    quizMode.setPreloadedQuestions(challengeInfo.questions);
                    quizMode.matchType = 'daily';
                    quizMode.dailyChallengeId = challengeInfo.id;
                    
                    tabStacks[currentTab].push('quiz_game');
                    
                    await registry.launchGame('football-quiz');
                } else {
                    import('../../ui/components/Toast').then(m => m.Toast.show(i18n.currentLocale === 'am' ? 'የዕለቱ ውድድር አልቋል! 내일 ይሞክሩ' : 'Daily challenge already completed! Come back tomorrow.', 'error'));
                    cacheManager.setQuizActive(false);
                    navigateToTab('home');
                }
                break;

            case 'profile':
                BottomNav.setActiveTab('profile');
                currentTab = 'profile';
                cacheManager.setQuizActive(false);
                const profScreen = new ProfileScreen(
                    game.uiManager, game.saveManager, game.audioManager,
                    {
                        onAchievements: () => renderRoute('achievements'),
                        onStatistics: () => renderRoute('stats'),
                        onLeaderboard: () => navigateToTab('standings'),
                        onSubscription: () => renderRoute('subscription'),
                        onMessages: () => renderRoute('messages'),
                        onSettings: () => renderRoute('settings'),
                        onHelp: () => renderRoute('help'),
                        onAbout: () => renderRoute('about'),
                        onPrivacy: () => renderRoute('privacy'),
                        onTerms: () => renderRoute('terms'),
                        onAwards: () => renderRoute('awards'),
                        onInvite: () => renderRoute('invite'),
                        onIdentity: () => renderRoute('identity'),
                        onFaq: () => renderRoute('faq')
                    }
                );
                activeScreen = profScreen;
                profScreen.render();
                break;

            case 'messages':
                cacheManager.setQuizActive(false);
                const messageScreen = new MessageCenterScreen(
                    game.uiManager, game.audioManager, handleBack
                );
                activeScreen = messageScreen;
                messageScreen.render();
                break;

            case 'settings':
                cacheManager.setQuizActive(false);
                const settings = new SettingsScreen(
                    game.uiManager, game.saveManager, game.audioManager,
                    handleBack, 'main'
                );
                activeScreen = settings;
                settings.render();
                break;
                
            case 'help':
                cacheManager.setQuizActive(false);
                const help = new SettingsScreen(game.uiManager, game.saveManager, game.audioManager, handleBack, 'help');
                activeScreen = help;
                help.render();
                break;

            case 'achievements':
                cacheManager.setQuizActive(false);
                const achievements = new AchievementsScreen(
                    game.uiManager, game.saveManager, game.audioManager, handleBack
                );
                activeScreen = achievements;
                achievements.render();
                break;

            case 'awards':
                cacheManager.setQuizActive(false);
                const awards = new AwardsScreen(
                    game.uiManager, game.audioManager, handleBack
                );
                activeScreen = awards;
                awards.render();
                break;

            case 'invite':
                cacheManager.setQuizActive(false);
                const invite = new InviteFriendsScreen(
                    game.uiManager, game.saveManager, game.audioManager, handleBack
                );
                activeScreen = invite;
                invite.render();
                break;

            case 'identity':
                cacheManager.setQuizActive(false);
                const identityScreen = new IdentityScreen(
                    game.uiManager, game.saveManager, game.audioManager, handleBack
                );
                activeScreen = identityScreen;
                identityScreen.render();
                break;

            case 'faq':
                cacheManager.setQuizActive(false);
                const faqScreen = new FAQScreen(
                    game.uiManager, game.saveManager, game.audioManager, handleBack
                );
                activeScreen = faqScreen;
                faqScreen.render();
                break;

            case 'about':
                cacheManager.setQuizActive(false);
                const aboutScreen = new AboutScreen(
                    game.uiManager, game.saveManager, game.audioManager, handleBack
                );
                activeScreen = aboutScreen;
                aboutScreen.render();
                break;

            case 'privacy':
                cacheManager.setQuizActive(false);
                const privacy = new SettingsScreen(game.uiManager, game.saveManager, game.audioManager, handleBack, 'privacy');
                activeScreen = privacy;
                privacy.render();
                break;

            case 'terms':
                cacheManager.setQuizActive(false);
                const termsScreen = new TermsScreen(
                    game.uiManager, game.saveManager, game.audioManager, handleBack
                );
                activeScreen = termsScreen;
                termsScreen.render();
                break;

            case 'notifications':
                cacheManager.setQuizActive(false);
                const notifScreen = new NotificationScreen(
                    game.uiManager, game.audioManager,
                    handleBack
                );
                activeScreen = notifScreen;
                notifScreen.render();
                break;

            case 'admin':
                cacheManager.setQuizActive(false);
                BottomNav.hide();
                const admin = new AdminPanelScreen(game.uiManager, game.audioManager, handleBack);
                activeScreen = admin;
                await admin.render();
                break;

            case 'matchmaking':
                cacheManager.setQuizActive(false);
                const mmScreen = new MatchmakingScreen(
                    game.uiManager, game.audioManager, game.saveManager,
                    async (matchInfo) => {
                        winAny.ethioLiveMatchInfo = matchInfo;
                        renderRoute('live_match');
                    },
                    handleBack
                );
                activeScreen = mmScreen;
                await mmScreen.render();
                break;

            case 'live_match':
                cacheManager.setQuizActive(true);
                const matchInfo = winAny.ethioLiveMatchInfo;
                if (!matchInfo) {
                    handleBack();
                    return;
                }
                const questions = await QuestionBank.getInstance().fetchQuestionsByIds(matchInfo.questionIds, i18n.currentLocale as any);
                const liveMatch = new LiveMatchScreen(
                    game.uiManager, game.audioManager, game.saveManager,
                    matchInfo.liveMatchId, matchInfo.opponent, questions,
                    handleBack
                );
                activeScreen = liveMatch;
                liveMatch.startMatch();
                break;

            case 'stats':
                cacheManager.setQuizActive(false);
                const statsScreen = new DetailedStatsScreen(
                    game.uiManager, game.saveManager, game.audioManager,
                    handleBack
                );
                activeScreen = statsScreen;
                statsScreen.render();
                break;


            case 'subscription':
                cacheManager.setQuizActive(false);
                const subScreen = new SubscriptionScreen(
                    game.uiManager, game.audioManager,
                    handleBack
                );
                activeScreen = subScreen;
                subScreen.render();
                break;
        }
    };

    const navigateToTab = (tabId: TabId) => {
        const stack = tabStacks[tabId];
        const currentTopRoute = stack[stack.length - 1];

        if (currentTab === tabId) {
            if (currentTopRoute === tabId) {
                return; // Already at the root of this tab
            } else {
                // User clicked the active tab again while in a nested page.
                // Clear the nested stack and return to root.
                tabStacks[tabId] = [tabId as RouteName];
                renderRoute(tabId as RouteName, true);
                return;
            }
        }
        
        currentTab = tabId;
        // Restore the last active route on that tab's stack
        renderRoute(currentTopRoute, true);
    };

    winAny.ethioReloadHome = () => navigateToTab('home');
    winAny.ethioHandleBack = () => {
        handleBack();
    };
    winAny.ethioCloseGame = () => {
        cacheManager.setQuizActive(false);
        const stack = tabStacks[currentTab] || [];
        if (stack.length > 0 && (stack[stack.length - 1] === 'quiz_game' || stack[stack.length - 1] === 'match_stats')) {
            stack.pop();
        }
        const route = stack.length > 0 ? stack[stack.length - 1] : currentTab;
        renderRoute(route as RouteName, false);
    };
    
    winAny.ethioForceHome = () => {
        cacheManager.setQuizActive(false);
        // Clean up the current stack without rendering it
        const stack = tabStacks[currentTab] || [];
        if (stack.length > 0 && (stack[stack.length - 1] === 'quiz_game' || stack[stack.length - 1] === 'match_stats')) {
            stack.pop();
        }
        
        // Reset home stack and explicitly navigate
        tabStacks['home'] = ['home'];
        currentTab = 'home';
        renderRoute('home', true);
    };

    // Listen for EventBus view reload events
    eventBus.on('RELOAD_CURRENT_VIEW', () => {
        if (!cacheManager.isQuizActive) {
            console.log('[Bootstrap] Reloading current view upon event trigger.');
            renderRoute(currentTab as RouteName, false);
        }
    });

    // 1. App Resume Refresh (visibilitychange / window focus)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && !cacheManager.isQuizActive) {
            console.log('[Bootstrap] App resumed. Triggering background refresh for stale data.');
            eventBus.emit('DATA_REFRESHED');
        }
    });

    // 2. Network Reconnection Refresh
    const handleNetworkChange = () => {
        const isOnline = navigator.onLine;
        let offlineBanner = document.getElementById('ethio-offline-banner');

        if (!isOnline) {
            if (!offlineBanner) {
                offlineBanner = document.createElement('div');
                offlineBanner.id = 'ethio-offline-banner';
                offlineBanner.style.cssText = `
                    position: fixed; top: 0; left: 0; width: 100vw;
                    background: #EF4444; color: white; text-align: center;
                    font-size: 13px; font-weight: 800; padding: 8px 12px; z-index: 99999;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.3); display: flex;
                    align-items: center; justify-content: center; gap: 8px; font-family: sans-serif;
                `;
                offlineBanner.innerHTML = `<span>⚠️</span><span>No internet connection. Paused. Reconnecting...</span>`;
                document.body.appendChild(offlineBanner);
            }
        } else {
            if (offlineBanner) {
                offlineBanner.style.background = 'var(--fds-green-pitch)';
                offlineBanner.innerHTML = `<span>✅</span><span>Connection restored! Refreshing data...</span>`;
                setTimeout(() => { offlineBanner?.remove(); }, 2000);
            }
            if (!cacheManager.isQuizActive) {
                console.log('[Bootstrap] Network restored. Triggering reconnection data sync.');
                eventBus.emit('NETWORK_RESTORED');
                eventBus.emit('RELOAD_CURRENT_VIEW');
            }
        }
    };

    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);

    const handleBack = () => {
        const stack = tabStacks[currentTab] || [];

        if (typeof (window as any).ethioOnBackPress === 'function') {
            if ((window as any).ethioOnBackPress()) {
                // If handled by screen (e.g. Match Screen), prevent further routing
                return;
            }
        }

        game.audioManager.playClick();
        const activeOverlay = document.querySelector('#session-recovery-overlay, #ethio-exit-modal, #ethio-leave-modal, .glass-card-modal, [id*="modal"]');
        if (activeOverlay) {
            activeOverlay.remove();
            return;
        }

        if (cacheManager.isQuizActive) {
            showLeaveMatchDialog();
            return;
        }

        // Pop the chronological stack
        if (stack.length > 1) {
            stack.pop();
            const previousRoute = stack[stack.length - 1];
            
            if (previousRoute === 'quiz_game' || previousRoute === 'match_stats') {
                stack.pop();
            }
            
            const targetRoute = stack.length > 0 ? stack[stack.length - 1] : currentTab;
            renderRoute(targetRoute as RouteName, false);
        } else {
            // At root of tab history
            if (currentTab === 'home') {
                showMaterial3ExitDialog();
            } else {
                navigateToTab('home');
            }
        }
    };

    const showLeaveMatchDialog = () => {
        const existingExit = document.getElementById('ethio-leave-modal');
        if (existingExit) return;

        const modal = document.createElement('div');
        modal.id = 'ethio-leave-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(2, 6, 23, 0.88); backdrop-filter: blur(16px);
            z-index: 99999; display: flex; align-items: center; justify-content: center;
            padding: 20px; box-sizing: border-box; pointer-events: auto;
        `;
        modal.innerHTML = `
            <div class="glass-card fade-in-up" style="width: 100%; max-width: 360px; padding: 28px 24px; text-align: center; border-radius: 20px;">
                <h2 style="font-size: 20px; font-weight: 900; color: white; margin: 0 0 8px 0; text-transform: uppercase;">LEAVE MATCH?</h2>
                <p style="font-size: 13px; color: #CBD5E1; margin: 0 0 24px 0; line-height: 1.4;">Your progress will be suspended. You can resume later.</p>
                <div style="display: flex; gap: 10px;">
                    <button id="leave-btn-continue" class="ethio-btn ethio-btn-primary" style="flex: 1;">CONTINUE</button>
                    <button id="leave-btn-leave" class="ethio-btn ethio-btn-secondary" style="flex: 1;">LEAVE</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('leave-btn-continue')?.addEventListener('click', () => {
            game.audioManager.playClick();
            modal.remove();
        });

        document.getElementById('leave-btn-leave')?.addEventListener('click', () => {
            game.audioManager.playClick();
            modal.remove();
            cacheManager.setQuizActive(false);
            
            const stack = tabStacks[currentTab] || [];
            if (stack.length > 0 && stack[stack.length - 1] === 'quiz_game') {
                stack.pop();
            }
            const targetRoute = stack.length > 0 ? stack[stack.length - 1] : currentTab;
            renderRoute(targetRoute as RouteName, false);
        });
    };

    const showMaterial3ExitDialog = () => {
        const existingExit = document.getElementById('ethio-exit-modal');
        if (existingExit) return;

        const modal = document.createElement('div');
        modal.id = 'ethio-exit-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(2, 6, 23, 0.88); backdrop-filter: blur(16px);
            z-index: 99999; display: flex; align-items: center; justify-content: center;
            padding: 20px; box-sizing: border-box; pointer-events: auto;
        `;
        modal.innerHTML = `
            <div class="glass-card fade-in-up" style="width: 100%; max-width: 360px; padding: 28px 24px; text-align: center; border-color: var(--fds-gold-primary); border-radius: 20px;">
                <div style="font-size: 44px; margin-bottom: 8px;">⚽🏆</div>
                <h2 style="font-size: 20px; font-weight: 900; color: white; margin: 0 0 8px 0; text-transform: uppercase;">EXIT ETHIOFANTASY?</h2>
                <p style="font-size: 13px; color: #CBD5E1; margin: 0 0 24px 0; line-height: 1.4;">Are you sure you want to exit the Football Quiz League? Your streak is saved.</p>
                <div style="display: flex; gap: 10px;">
                    <button id="exit-btn-stay" class="ethio-btn ethio-btn-primary" style="flex: 1;">STAY IN GAME</button>
                    <button id="exit-btn-confirm" class="ethio-btn ethio-btn-secondary" style="flex: 1; border-color: #EF4444; color: #FCA5A5;">EXIT APP</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('exit-btn-stay')?.addEventListener('click', () => {
            game.audioManager.playClick();
            modal.remove();
        });

        document.getElementById('exit-btn-confirm')?.addEventListener('click', () => {
            game.audioManager.playClick();
            modal.remove();
            if ((window as any).navigator?.app?.exitApp) {
                (window as any).navigator.app.exitApp();
            } else if ((window as any).Android?.exitApp) {
                (window as any).Android.exitApp();
            } else {
                window.close();
            }
        });
    };

    window.addEventListener('popstate', (e) => {
        e.preventDefault();
        
        // Android Back pressed (or swipe back on iOS). We hit the root state.
        // Immediately push the trap state again to keep the history at length 2
        try { window.history.pushState({ trap: true }, ''); } catch(err){}
        
        // Execute predictable internal navigation logic
        handleBack();
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.key === 'Back') {
            handleBack();
        }
    });

    winAny.ethioReloadHome = () => navigateToTab('home');
    winAny.ethioNavigateToTab = (tabId: TabId) => navigateToTab(tabId);
    winAny.ethioPlayAgain = async (compId: string) => {
        cacheManager.setQuizActive(true);
        const quizMode = registry.getRegisteredGames().find(g => g.metadata.id === 'football-quiz') as QuizGameMode;
        quizMode.setCompetition(compId);
        
        if (!tabStacks[currentTab]) tabStacks[currentTab] = [currentTab as RouteName];
        tabStacks[currentTab].push('quiz_game');
        
        await registry.launchGame('football-quiz');
    };

    BottomNav.render((tabId) => {
        navigateToTab(tabId);
    });

    // 3. Login Refresh (Auth state change listener)
    let previousUserId: string | null = null;
    authManager.subscribe((user) => {
        const isStateChange = user?.id !== previousUserId;
        previousUserId = user?.id || null;

        if (!user) {
            console.log('[Bootstrap] User signed out. Invalidating cache.');
            cacheManager.clear();
            BottomNav.hide();
            const authScreen = new AuthScreen(
                game.uiManager, game.audioManager, authManager,
                () => {}
            );
            authScreen.render();
        } else {
            console.log('[Bootstrap] User authenticated. Refreshing profile & channels:', user.username);
            BottomNav.show();
            RealtimeService.getInstance().initUserChannels(user.id);
            eventBus.emit('PROFILE_UPDATED', user);

            if (isStateChange) {
                const activeSession = GameSessionManager.getInstance().getActiveSession();
                if (activeSession) {
                    GameSessionManager.getInstance().clearSession();
                }
                
                // BUG FIX: Reset navigation state and force render the Home screen.
                // Previously, navigateToTab('home') would return early because currentTab 
                // was already 'home' on launch, leaving the AuthScreen stuck on the screen.
                tabStacks = {
                    home: ['home'],
                    play: ['play'],
                    standings: ['standings'],
                    profile: ['profile']
                };
                currentTab = 'home';
                
                // Check if admin portal was directly requested via URL
                if (window.location.search.includes('admin=true') || window.location.hash.includes('admin')) {
                    renderRoute('admin', false);
                } else {
                    renderRoute('home', false);
                }
                
                // Clear any leftover history to prevent back-button returning to Login
                try {
                    window.history.replaceState({ root: true }, '');
                    window.history.pushState({ trap: true }, '');
                } catch (e) {}
            }
        }
    });

    console.log('[Bootstrap] ⚽ Smart Caching & Refresh Strategy initialized.');

    return game;
}
