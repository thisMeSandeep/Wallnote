/**
 * Synthesised sound effects — no audio files, for the same reason there are no
 * image assets: the app stays self-contained and nothing has to load.
 *
 * Paper noises are essentially filtered noise bursts; taps and clicks are short
 * decaying oscillators. Every sound jitters its own pitch and timing slightly
 * so repeats don't sound mechanical.
 */

export type SoundName =
  | 'stick' // a fresh note goes up on the wall
  | 'lift' // note picked up
  | 'place' // note set back down
  | 'peel' // note taken off the wall
  | 'pin'
  | 'tape'
  | 'magnet'
  | 'ui'; // toggles and small chrome

const STORAGE_KEY = 'wallnote:sound';
const LEGACY_STORAGE_KEY = 'wallnut:sound';

/** Random in [min, max) — used to keep repeated sounds from being identical. */
const rand = (min: number, max: number) => min + Math.random() * (max - min);

class SoundEngine {
  private ctx: AudioContext | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private master: GainNode | null = null;
  private on: boolean;

  constructor() {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    } catch {
      // Storage disabled; fall back to the default.
    }
    // Off unless asked for — sound that starts on its own is worse than sound
    // nobody found.
    this.on = stored === 'on';
  }

  get enabled(): boolean {
    return this.on;
  }

  setEnabled(next: boolean): void {
    this.on = next;
    try {
      localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off');
    } catch {
      // Preference just won't persist.
    }
    if (next) this.play('ui');
  }

  /**
   * Built on first use. Browsers create an AudioContext suspended until a user
   * gesture, and every call path here originates in a click or keypress.
   */
  private ready(): boolean {
    if (!this.on) return false;
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as never as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return false;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.3;
      this.master.connect(this.ctx.destination);

      // One second of white noise, reused by every paper sound.
      const len = Math.floor(this.ctx.sampleRate);
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return true;
  }

  /** A shaped burst of filtered noise — the basis of every paper sound. */
  private noise(opts: {
    dur: number;
    freq: number;
    endFreq?: number;
    q?: number;
    gain: number;
    type?: BiquadFilterType;
    delay?: number;
    attack?: number;
  }): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime + (opts.delay ?? 0);

    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf!;
    // Start somewhere random in the buffer so bursts never repeat exactly.
    const offset = rand(0, 0.5);

    const filter = ctx.createBiquadFilter();
    filter.type = opts.type ?? 'bandpass';
    filter.Q.value = opts.q ?? 1;
    filter.frequency.setValueAtTime(opts.freq, t);
    if (opts.endFreq) filter.frequency.exponentialRampToValueAtTime(opts.endFreq, t + opts.dur);

    const gain = ctx.createGain();
    const attack = opts.attack ?? 0.004;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(opts.gain, t + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + opts.dur);

    src.connect(filter).connect(gain).connect(this.master!);
    src.start(t, offset, opts.dur + 0.02);
    src.stop(t + opts.dur + 0.02);
  }

  /** A short decaying tone — thumps, clicks and clacks. */
  private tone(opts: {
    freq: number;
    endFreq?: number;
    dur: number;
    gain: number;
    type?: OscillatorType;
    delay?: number;
  }): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime + (opts.delay ?? 0);

    const osc = ctx.createOscillator();
    osc.type = opts.type ?? 'sine';
    osc.frequency.setValueAtTime(opts.freq, t);
    if (opts.endFreq) osc.frequency.exponentialRampToValueAtTime(opts.endFreq, t + opts.dur);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(opts.gain, t + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + opts.dur);

    osc.connect(gain).connect(this.master!);
    osc.start(t);
    osc.stop(t + opts.dur + 0.02);
  }

  play(name: SoundName): void {
    if (!this.ready()) return;

    switch (name) {
      // Paper slapped onto the wall: a bright crumple over a soft body thump.
      case 'stick':
        this.noise({ dur: 0.11, freq: rand(1500, 2100), q: 0.8, gain: 0.34 });
        this.tone({ freq: rand(150, 190), endFreq: 70, dur: 0.09, gain: 0.2, delay: 0.008 });
        break;

      // Peeling paper away from a surface: airy, sweeping upward.
      case 'lift':
        this.noise({
          dur: 0.16,
          freq: rand(1900, 2400),
          endFreq: 3600,
          q: 0.6,
          gain: 0.16,
          type: 'highpass',
          attack: 0.02,
        });
        break;

      case 'place':
        this.noise({ dur: 0.075, freq: rand(1000, 1400), q: 1.1, gain: 0.22 });
        this.tone({ freq: rand(120, 150), endFreq: 60, dur: 0.07, gain: 0.14 });
        break;

      // Longer tearing sweep — the note coming off the wall for good.
      case 'peel':
        this.noise({
          dur: 0.3,
          freq: 700,
          endFreq: rand(2800, 3400),
          q: 1.4,
          gain: 0.26,
          attack: 0.03,
        });
        this.noise({ dur: 0.09, freq: 900, q: 1, gain: 0.16, delay: 0.26 });
        break;

      // Pushpin: a hard little click into cork.
      case 'pin':
        this.tone({ freq: rand(2000, 2500), endFreq: 900, dur: 0.035, gain: 0.22, type: 'triangle' });
        this.noise({ dur: 0.04, freq: 3200, q: 0.7, gain: 0.18 });
        break;

      // Tape: a short rip, built from overlapping bursts.
      case 'tape':
        this.noise({ dur: 0.2, freq: 1800, endFreq: 2600, q: 0.9, gain: 0.24, attack: 0.02 });
        this.noise({ dur: 0.13, freq: 2600, q: 1.2, gain: 0.14, delay: 0.05 });
        break;

      // Magnet: dull, dense clack.
      case 'magnet':
        this.tone({ freq: rand(190, 230), endFreq: 90, dur: 0.075, gain: 0.26 });
        this.noise({ dur: 0.03, freq: 1400, q: 1.5, gain: 0.12 });
        break;

      case 'ui':
        this.tone({ freq: 880, endFreq: 1320, dur: 0.05, gain: 0.1, type: 'triangle' });
        break;
    }
  }
}

export const sound = new SoundEngine();
