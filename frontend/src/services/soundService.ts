/**
 * Web Audio API synthesizer for authentic football mobile game sound effects.
 * 100% self-contained, zero external network requests, instant playback.
 */

class SoundService {
  private ctx: AudioContext | null = null;
  private soundEnabled = true;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  // 1. Button tap
  public playTap() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // 2. Correct Answer: Bright melodic chime + whistle pop
  public playCorrect() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + i * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });

    // Whistle pop
    this.playWhistle(0.08);
  }

  // 3. Wrong Answer: Low buzzer
  public playWrong() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(95, now + 0.3);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  // 4. Referee Whistle
  public playWhistle(delay = 0) {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime + delay;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Whistle has 2 beating frequencies around 2500Hz & 2800Hz with fast trill
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(2600, now);
    osc2.frequency.setValueAtTime(2850, now);

    // subtle frequency vibrato
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(35, now);
    lfoGain.gain.setValueAtTime(80, now);
    lfo.connect(osc1.frequency);
    lfo.connect(osc2.frequency);
    lfo.start(now);
    lfo.stop(now + 0.22);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
    gain.gain.setValueAtTime(0.2, now + 0.16);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.22);
    osc2.stop(now + 0.22);
  }

  // 5. GOAL! Stadium explosion sound: Kick thud + crowd roar + trumpet fanfare
  public playGoal() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Kick thud (heavy sub kick)
    const kickOsc = this.ctx.createOscillator();
    const kickGain = this.ctx.createGain();
    kickOsc.type = 'sine';
    kickOsc.frequency.setValueAtTime(150, now);
    kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.25);
    kickGain.gain.setValueAtTime(0.5, now);
    kickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    kickOsc.connect(kickGain);
    kickGain.connect(this.ctx.destination);
    kickOsc.start(now);
    kickOsc.stop(now + 0.35);

    // Whistle blast
    this.playWhistle(0.05);

    // Stadium crowd cheer simulation (filtered noise buffer)
    const bufferSize = this.ctx.sampleRate * 1.5;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, now);
    filter.Q.setValueAtTime(1.5, now);

    const crowdGain = this.ctx.createGain();
    crowdGain.gain.setValueAtTime(0.01, now);
    crowdGain.gain.linearRampToValueAtTime(0.3, now + 0.15);
    crowdGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

    whiteNoise.connect(filter);
    filter.connect(crowdGain);
    crowdGain.connect(this.ctx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + 1.5);

    // Stadium Horn Fanfare
    const trumpetNotes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    trumpetNotes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const tOsc = this.ctx.createOscillator();
      const tGain = this.ctx.createGain();
      const tStart = now + 0.1 + idx * 0.09;

      tOsc.type = 'sawtooth';
      tOsc.frequency.setValueAtTime(freq, tStart);

      tGain.gain.setValueAtTime(0, tStart);
      tGain.gain.linearRampToValueAtTime(0.2, tStart + 0.03);
      tGain.gain.exponentialRampToValueAtTime(0.001, tStart + 0.4);

      tOsc.connect(tGain);
      tGain.connect(this.ctx.destination);

      tOsc.start(tStart);
      tOsc.stop(tStart + 0.4);
    });
  }

  // 6. Coin Reward Ping
  public playCoin(offset = 0) {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime + offset;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1318.5, now); // E6
    osc.frequency.setValueAtTime(1760.0, now + 0.06); // A6

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  // 7. Level Complete Trophy Victory
  public playVictory() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const chords = [
      { notes: [261.63, 329.63, 392.0], time: 0, dur: 0.25 }, // C
      { notes: [293.66, 369.99, 440.0], time: 0.25, dur: 0.25 }, // D
      { notes: [329.63, 415.3, 493.88], time: 0.5, dur: 0.25 }, // E
      { notes: [392.0, 493.88, 587.33], time: 0.75, dur: 0.35 }, // G
      { notes: [523.25, 659.25, 783.99, 1046.5], time: 1.1, dur: 0.8 }, // Big C
    ];

    chords.forEach((chord) => {
      chord.notes.forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + chord.time;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.2 / chord.notes.length, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + chord.dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + chord.dur);
      });
    });
  }

  // 8. Spin Wheel Tick
  public playWheelTick() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.02);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.025);
  }

  // 9. Countdown Timer Tick
  public playTimerTick() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  }
}

export const sound = new SoundService();
