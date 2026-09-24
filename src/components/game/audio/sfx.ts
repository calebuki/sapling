"use client";

// All sound is synthesized at runtime: no asset downloads, and every effect
// shares one mixer so mute and music toggles behave predictably.

type AudioWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };

export type Sfx =
  | "step"
  | "click"
  | "open"
  | "close"
  | "pop"
  | "correct"
  | "wrong"
  | "levelup"
  | "discover"
  | "tile"
  | "whoosh"
  | "sparkle"
  | "ring";

class SoundEngine {
  ctx: AudioContext | null = null;
  master!: GainNode;
  sfxBus!: GainNode;
  musicBus!: GainNode;
  ambienceBus!: GainNode;
  delay!: DelayNode;
  muted = false;
  musicOn = true;
  private musicTimer: number | null = null;
  private birdTimer: number | null = null;
  private noise: AudioBuffer | null = null;
  private stepFlip = false;
  private duckUntil = 0;

  ensure() {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
      if (!Ctor) return null;
      const ctx = new Ctor();
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.9;
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -14;
      compressor.ratio.value = 3;
      this.master.connect(compressor).connect(ctx.destination);
      this.sfxBus = ctx.createGain();
      this.sfxBus.gain.value = 0.55;
      this.musicBus = ctx.createGain();
      this.musicBus.gain.value = this.musicOn ? 0.16 : 0;
      this.ambienceBus = ctx.createGain();
      this.ambienceBus.gain.value = 0.22;
      this.delay = ctx.createDelay(1);
      this.delay.delayTime.value = 0.36;
      const feedback = ctx.createGain();
      feedback.gain.value = 0.32;
      const tone = ctx.createBiquadFilter();
      tone.type = "lowpass";
      tone.frequency.value = 2400;
      this.delay.connect(tone).connect(feedback).connect(this.delay);
      tone.connect(this.master);
      this.sfxBus.connect(this.master);
      this.musicBus.connect(this.master);
      this.musicBus.connect(this.delay);
      this.ambienceBus.connect(this.master);
      const length = ctx.sampleRate * 2;
      this.noise = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      let brown = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        brown = (brown + 0.02 * white) / 1.02;
        data[i] = i % 2 ? white * 0.5 : brown * 3.5;
      }
    }
    if (this.ctx.state === "suspended") void this.ctx.resume().catch(() => {});
    return this.ctx;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.ctx) this.master.gain.setTargetAtTime(muted ? 0 : 0.9, this.ctx.currentTime, 0.05);
  }

  setMusic(on: boolean) {
    this.musicOn = on;
    if (this.ctx) this.musicBus.gain.setTargetAtTime(on ? 0.16 : 0, this.ctx.currentTime, 0.2);
  }

  // Lowers music while someone is speaking Swedish so the words stay clear.
  duck(ms: number) {
    const ctx = this.ctx;
    if (!ctx || !this.musicOn) return;
    this.duckUntil = performance.now() + ms;
    this.musicBus.gain.setTargetAtTime(0.05, ctx.currentTime, 0.08);
    window.setTimeout(() => {
      if (performance.now() >= this.duckUntil - 20 && this.musicOn && this.ctx) {
        this.musicBus.gain.setTargetAtTime(0.16, this.ctx.currentTime, 0.6);
      }
    }, ms);
  }

  private tone(freq: number, start: number, duration: number, opts: { type?: OscillatorType; gain?: number; bus?: AudioNode; glide?: number; attack?: number } = {}) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = opts.type ?? "sine";
    osc.frequency.setValueAtTime(freq, start);
    if (opts.glide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * opts.glide), start + duration);
    const peak = opts.gain ?? 0.3;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + (opts.attack ?? 0.008));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain).connect(opts.bus ?? this.sfxBus);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  private noiseBurst(start: number, duration: number, freq: number, gain: number, q = 1, type: BiquadFilterType = "bandpass") {
    const ctx = this.ctx!;
    const source = ctx.createBufferSource();
    source.buffer = this.noise;
    source.playbackRate.value = 0.8 + Math.random() * 0.4;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gain, start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter).connect(g).connect(this.sfxBus);
    source.start(start, Math.random());
    source.stop(start + duration + 0.05);
  }

  play(name: Sfx) {
    const ctx = this.ensure();
    if (!ctx || this.muted) return;
    const t = ctx.currentTime + 0.005;
    switch (name) {
      case "step": {
        this.stepFlip = !this.stepFlip;
        this.noiseBurst(t, 0.09, this.stepFlip ? 900 : 700, 0.12, 1.4);
        break;
      }
      case "click":
        this.tone(660, t, 0.07, { type: "triangle", gain: 0.15 });
        break;
      case "tile":
        this.tone(520 + Math.random() * 120, t, 0.09, { type: "triangle", gain: 0.2, glide: 1.4 });
        break;
      case "open":
        this.tone(392, t, 0.12, { type: "triangle", gain: 0.16 });
        this.tone(587, t + 0.06, 0.16, { type: "triangle", gain: 0.14 });
        break;
      case "close":
        this.tone(587, t, 0.1, { type: "triangle", gain: 0.12 });
        this.tone(392, t + 0.05, 0.14, { type: "triangle", gain: 0.12 });
        break;
      case "pop":
        this.tone(300, t, 0.14, { type: "sine", gain: 0.35, glide: 3 });
        break;
      case "whoosh":
        this.noiseBurst(t, 0.45, 1200, 0.18, 0.6, "bandpass");
        break;
      case "correct":
        [659, 831, 988, 1319].forEach((f, i) => this.tone(f, t + i * 0.065, 0.32, { type: "triangle", gain: 0.2 }));
        this.tone(1976, t + 0.26, 0.5, { type: "sine", gain: 0.06 });
        break;
      case "wrong":
        this.tone(330, t, 0.18, { type: "triangle", gain: 0.16, glide: 0.85 });
        this.tone(262, t + 0.13, 0.28, { type: "triangle", gain: 0.16, glide: 0.9 });
        break;
      case "discover":
        [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, t + i * 0.05, 0.4, { type: "sine", gain: 0.16 }));
        this.noiseBurst(t, 0.6, 6000, 0.05, 0.8, "highpass");
        break;
      case "sparkle":
        for (let i = 0; i < 6; i++) this.tone(1400 + Math.random() * 1600, t + i * 0.045, 0.25, { type: "sine", gain: 0.05 });
        break;
      case "ring":
        [880, 1109, 880, 1109].forEach((f, i) => this.tone(f, t + i * 0.12, 0.1, { type: "sine", gain: 0.12 }));
        break;
      case "levelup": {
        const notes = [523, 659, 784, 1047, 784, 1047, 1319];
        notes.forEach((f, i) => this.tone(f, t + i * 0.09, i === notes.length - 1 ? 1.2 : 0.28, { type: "triangle", gain: 0.2 }));
        [262, 330, 392].forEach((f) => this.tone(f, t + 0.54, 1.4, { type: "sine", gain: 0.09, attack: 0.1 }));
        this.noiseBurst(t + 0.5, 1.2, 7000, 0.04, 0.5, "highpass");
        break;
      }
    }
  }

  // Villager "voices": short pitched syllables under typed dialogue.
  blip(pitch: number) {
    const ctx = this.ensure();
    if (!ctx || this.muted) return;
    const t = ctx.currentTime + 0.002;
    const base = 240 * pitch * (0.9 + Math.random() * 0.25);
    this.tone(base, t, 0.06, { type: "square", gain: 0.035, glide: 1.12 });
  }

  startAmbience() {
    const ctx = this.ensure();
    if (!ctx || this.birdTimer !== null) return;
    // Waves: slowly breathing filtered noise.
    const source = ctx.createBufferSource();
    source.buffer = this.noise;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 520;
    const swell = ctx.createGain();
    swell.gain.value = 0.35;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.11;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.25;
    lfo.connect(lfoGain).connect(swell.gain);
    source.connect(filter).connect(swell).connect(this.ambienceBus);
    source.start();
    lfo.start();
    const chirp = () => {
      if (this.ctx && !this.muted) {
        const t = this.ctx.currentTime;
        const base = 2200 + Math.random() * 1800;
        const count = 2 + Math.floor(Math.random() * 4);
        for (let i = 0; i < count; i++) {
          this.tone(base * (1 + Math.random() * 0.15), t + i * 0.11, 0.09, { type: "sine", gain: 0.025, glide: 1.35, bus: this.ambienceBus });
        }
      }
      this.birdTimer = window.setTimeout(chirp, 2500 + Math.random() * 6000);
    };
    this.birdTimer = window.setTimeout(chirp, 1500);
  }

  // A gentle generative music box in D major pentatonic, loosely folk-flavoured.
  startMusic() {
    const ctx = this.ensure();
    if (!ctx || this.musicTimer !== null) return;
    const scale = [293.66, 329.63, 369.99, 440, 493.88, 587.33, 659.25, 739.99, 880];
    const chords = [
      [146.83, 220, 293.66],
      [123.47, 185, 246.94],
      [98, 146.83, 196],
      [110, 164.81, 220],
    ];
    const beat = 60 / 84 / 2;
    let step = 0;
    let degree = 4;
    let next = ctx.currentTime + 0.3;
    const schedule = () => {
      if (!this.ctx) return;
      while (next < this.ctx.currentTime + 0.4) {
        const bar = Math.floor(step / 8) % chords.length;
        if (step % 8 === 0) {
          chords[bar].forEach((f, i) =>
            this.tone(f, next + i * 0.02, beat * 7.5, { type: "sine", gain: 0.12, bus: this.musicBus, attack: 0.25 }),
          );
        }
        const rest = step % 8 === 7 || Math.random() < 0.28;
        if (!rest) {
          degree = Math.max(0, Math.min(scale.length - 1, degree + [-2, -1, -1, 0, 1, 1, 2][Math.floor(Math.random() * 7)]));
          this.tone(scale[degree], next, beat * 2.4, { type: "triangle", gain: 0.1, bus: this.musicBus });
          this.tone(scale[degree] * 2, next, beat * 1.2, { type: "sine", gain: 0.03, bus: this.musicBus });
        }
        step++;
        next += beat;
      }
      this.musicTimer = window.setTimeout(schedule, 120);
    };
    schedule();
  }
}

export const sound = new SoundEngine();
