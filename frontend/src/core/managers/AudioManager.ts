export class AudioManager {
    private _ctx: AudioContext | null = null;
    private _isMuted: boolean = false;

    private _answerSelectedBuffer: AudioBuffer | null = null;
    private _correctAnswerBuffer: AudioBuffer | null = null;
    private _wrongAnswerBuffer: AudioBuffer | null = null;
    private _whistleBuffer: AudioBuffer | null = null;

    private _activeQuizSound: { source: AudioBufferSourceNode, gain: GainNode, timeoutId?: any } | null = null;

    constructor() {
        const savedMute = localStorage.getItem('ETHIO_FOOTBALL_MUTED');
        if (savedMute !== null) {
            this._isMuted = savedMute === 'true';
        }
        
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.stopAllQuizAudio(0.05);
                }
            });
        }
    }

    public stopAllQuizAudio(fadeDuration = 0.08): void {
        if (!this._ctx || !this._activeQuizSound) return;
        
        const sound = this._activeQuizSound;
        this._activeQuizSound = null;
        
        if (sound.timeoutId) clearTimeout(sound.timeoutId);
        
        const now = this._ctx.currentTime;
        try {
            sound.gain.gain.cancelScheduledValues(now);
            sound.gain.gain.setValueAtTime(sound.gain.gain.value, now);
            sound.gain.gain.linearRampToValueAtTime(0.01, now + fadeDuration);
            sound.source.stop(now + fadeDuration + 0.02);
        } catch(e) {}
    }

    private _playQuizSound(buffer: AudioBuffer | null, volume: number): Promise<void> {
        this.stopAllQuizAudio(0.02);
        if (!buffer) return Promise.resolve();
        this._initContext();
        if (!this._ctx) return Promise.resolve();

        return new Promise<void>((resolve) => {
            const source = this._ctx!.createBufferSource();
            source.buffer = buffer;
            
            const gain = this._ctx!.createGain();
            gain.gain.value = volume;

            source.connect(gain);
            gain.connect(this._ctx!.destination);
            
            source.onended = () => resolve();

            source.start(this._ctx!.currentTime);

            this._activeQuizSound = { source, gain, timeoutId: undefined as any };
        });
    }

    private _initContext(): void {
        if (!this._ctx) {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            this._ctx = new AudioCtx();
            console.log('[AudioManager] Football stadium Web AudioContext initialized.');
        }
        if (this._ctx.state === 'suspended') {
            this._ctx.resume();
        }
    }

    private _vibrate(pattern: number | number[]): void {
        if (this._isMuted) return;
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
                navigator.vibrate(pattern);
            } catch (e) {
                // Ignore if browser restricts
            }
        }
    }

    public playClick(): void {
        if (this._isMuted) return;
        this._vibrate(10);
        this._initContext();
        if (!this._ctx) return;

        const osc = this._ctx.createOscillator();
        const gain = this._ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this._ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, this._ctx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.15, this._ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this._ctx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(this._ctx.destination);

        osc.start();
        osc.stop(this._ctx.currentTime + 0.05);
    }

    public async preloadAssets(): Promise<void> {
        if (this._isMuted) return;
        try {
            const [selectRes, correctRes, wrongRes, whistleRes] = await Promise.all([
                fetch('/assets/audios/Answer%20selected.m4a'),
                fetch('/assets/audios/Right%20Answer%20or%20score%20goal.m4a'),
                fetch('/assets/audios/wrong%20answer.m4a'),
                fetch('/assets/audios/whistle%20when%20game%20ends.m4a')
            ]);
            
            if (!this._ctx) {
                const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                this._ctx = new AudioCtx();
            }

            if (selectRes.ok) {
                const arr = await selectRes.arrayBuffer();
                this._answerSelectedBuffer = await this._ctx.decodeAudioData(arr);
            }
            if (correctRes.ok) {
                const arr = await correctRes.arrayBuffer();
                this._correctAnswerBuffer = await this._ctx.decodeAudioData(arr);
            }
            if (wrongRes.ok) {
                const arr = await wrongRes.arrayBuffer();
                this._wrongAnswerBuffer = await this._ctx.decodeAudioData(arr);
            }
            if (whistleRes.ok) {
                const arr = await whistleRes.arrayBuffer();
                this._whistleBuffer = await this._ctx.decodeAudioData(arr);
            }
            console.log('[AudioManager] 4 Quiz Audio assets preloaded successfully.');
        } catch (err) {
            console.warn('[AudioManager] Failed to preload audio assets', err);
        }
    }

    public playQuizAnswerSelected(): Promise<void> {
        if (this._isMuted) return Promise.resolve();
        return this._playQuizSound(this._answerSelectedBuffer, 0.4);
    }

    public playQuizCorrectAnswer(): Promise<void> {
        if (this._isMuted) return Promise.resolve();
        this._vibrate([30, 40, 30]);
        return this._playQuizSound(this._correctAnswerBuffer, 0.8);
    }

    public playQuizWrongAnswer(): Promise<void> {
        if (this._isMuted) return Promise.resolve();
        this._vibrate([40, 20, 40]);
        return this._playQuizSound(this._wrongAnswerBuffer, 0.7);
    }

    public playQuizWhistle(): Promise<void> {
        if (this._isMuted) return Promise.resolve();
        this._vibrate([30, 40, 30]);
        return this._playQuizSound(this._whistleBuffer, 0.75);
    }

    public toggleMute(): boolean {
        this._isMuted = !this._isMuted;
        localStorage.setItem('ETHIO_FOOTBALL_MUTED', String(this._isMuted));
        if (this._isMuted) {
            this.stopAllQuizAudio();
        }
        return this._isMuted;
    }

    public get isMuted(): boolean {
        return this._isMuted;
    }
}
