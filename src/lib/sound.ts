// Sound notification manager that plays user's custom /success.mp3 and /fail.mp3 audio with Web Audio API synthesizer fallback
class SoundManager {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private preloadedSuccessAudio: HTMLAudioElement | null = null;
  private preloadedFailAudio: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('app_sound_enabled');
      if (stored !== null) {
        this.soundEnabled = stored === 'true';
      }
      try {
        this.preloadedSuccessAudio = new Audio('/success.mp3');
        this.preloadedSuccessAudio.preload = 'auto';
        this.preloadedFailAudio = new Audio('/fail.mp3');
        this.preloadedFailAudio.preload = 'auto';
      } catch {
        // ignore audio preload errors
      }
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public setEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_sound_enabled', String(enabled));
    }
  }

  public toggle(): boolean {
    this.setEnabled(!this.soundEnabled);
    if (this.soundEnabled) {
      this.playSuccess();
    }
    return this.soundEnabled;
  }

  /**
   * Plays the custom success sound (/success.mp3) or falls back to harmonic chime
   */
  public playSuccess() {
    if (!this.soundEnabled) return;
    
    try {
      // Create an audio instance to allow rapid overlapping triggers
      const audio = new Audio('/success.mp3');
      audio.volume = 1.0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Playback of /success.mp3 was prevented or failed, using synth chime fallback:', err);
          this.playSynthChime();
        });
      }
    } catch {
      this.playSynthChime();
    }
  }

  /**
   * Plays the custom failure sound (/fail.mp3) or falls back to warning tone
   */
  public playFail() {
    if (!this.soundEnabled) return;

    try {
      const audio = new Audio('/fail.mp3');
      audio.volume = 1.0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Playback of /fail.mp3 was prevented or failed, using synth fail fallback:', err);
          this.playSynthFail();
        });
      }
    } catch {
      this.playSynthFail();
    }
  }

  /**
   * Synthesized modern chime fallback (C-major harmonic triad: G5 -> C6 -> E6)
   */
  public playSynthChime() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Uplifting 3-note chime
      const notes = [
        { freq: 783.99, start: 0, duration: 0.18, gain: 0.14 },       // G5
        { freq: 1046.50, start: 0.07, duration: 0.22, gain: 0.16 },     // C6
        { freq: 1318.51, start: 0.14, duration: 0.38, gain: 0.20 }     // E6
      ];

      notes.forEach(({ freq, start, duration, gain: peakGain }) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + start);

        gainNode.gain.setValueAtTime(0.001, now + start);
        gainNode.gain.linearRampToValueAtTime(peakGain, now + start + 0.015);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + duration);
      });
    } catch (e) {
      console.warn('Synth sound play error:', e);
    }
  }

  /**
   * Synthesized failure / warning tone fallback
   */
  public playSynthFail() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [
        { freq: 330, start: 0, duration: 0.16, gain: 0.14 },      // E4
        { freq: 220, start: 0.12, duration: 0.26, gain: 0.16 }    // A3
      ];

      notes.forEach(({ freq, start, duration, gain: peakGain }) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + start);

        gainNode.gain.setValueAtTime(0.001, now + start);
        gainNode.gain.linearRampToValueAtTime(peakGain, now + start + 0.015);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + duration);
      });
    } catch (e) {
      console.warn('Synth fail sound error:', e);
    }
  }
}

export const sound = new SoundManager();
export const playSuccessSound = () => sound.playSuccess();
export const playFailSound = () => sound.playFail();

