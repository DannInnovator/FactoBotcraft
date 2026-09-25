// Sonido sintetizado con WebAudio: cada fusión suena una nota más aguda de una
// escala pentatónica (la "canción" del Lumen) y la cueva tiene su propio ambiente.
const PENTA = [0, 2, 4, 7, 9];

export class Audio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfx: GainNode | null = null;
  private music: GainNode | null = null;
  private musicTimer = 0;
  private started = false;
  sfxVol = 0.7;
  musicVol = 0.45;
  private lastPlay = new Map<string, number>();

  start(): void {
    if (this.started) {
      void this.ctx?.resume();
      return;
    }
    try {
      this.ctx = new AudioContext();
    } catch {
      return;
    }
    this.started = true;
    const c = this.ctx;
    this.master = c.createGain();
    this.master.gain.value = 0.8;
    const comp = c.createDynamicsCompressor();
    this.master.connect(comp).connect(c.destination);
    this.sfx = c.createGain();
    this.sfx.gain.value = this.sfxVol;
    this.sfx.connect(this.master);
    this.music = c.createGain();
    this.music.gain.value = this.musicVol * 0.5;
    // Reverb de cueva: convolución con ruido que decae
    const rev = c.createConvolver();
    const len = c.sampleRate * 2.6;
    const buf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    rev.buffer = buf;
    const wet = c.createGain();
    wet.gain.value = 0.35;
    this.music.connect(this.master);
    this.music.connect(rev);
    this.sfx.connect(rev);
    rev.connect(wet).connect(this.master);
    this.drone();
    this.scheduleMusic();
  }

  setVolumes(sfx: number, music: number): void {
    this.sfxVol = sfx;
    this.musicVol = music;
    if (this.sfx) this.sfx.gain.value = sfx;
    if (this.music) this.music.gain.value = music * 0.5;
  }

  private throttle(key: string, ms: number): boolean {
    const now = performance.now();
    if ((this.lastPlay.get(key) ?? 0) + ms > now) return false;
    this.lastPlay.set(key, now);
    return true;
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, dest: AudioNode | null = this.sfx, attack = 0.005, when = 0): void {
    if (!this.ctx || !dest) return;
    const c = this.ctx;
    const t = c.currentTime + when;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private noise(dur: number, vol: number, freq: number): void {
    if (!this.ctx || !this.sfx) return;
    const c = this.ctx;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = freq;
    const g = c.createGain();
    g.gain.value = vol;
    src.connect(f).connect(g).connect(this.sfx);
    src.start();
  }

  private noteFreq(step: number, base = 261.63): number {
    const oct = Math.floor(step / 5);
    const semi = PENTA[((step % 5) + 5) % 5] + oct * 12;
    return base * Math.pow(2, semi / 12);
  }

  merge(lvl: number): void {
    if (!this.throttle('merge', 60)) return;
    const f = this.noteFreq(lvl + 2);
    this.tone(f, 0.5, 'triangle', 0.22);
    this.tone(f * 2, 0.35, 'sine', 0.08, this.sfx, 0.005, 0.03);
    if (lvl >= 5) this.tone(f * 1.5, 0.8, 'sine', 0.1, this.sfx, 0.02, 0.08);
  }

  sell(value: number): void {
    if (!this.throttle('sell', 80)) return;
    const n = Math.min(4, 1 + Math.floor(Math.log10(value + 1)));
    for (let i = 0; i < n; i++) this.tone(this.noteFreq(7 + i * 2), 0.25, 'sine', 0.12, this.sfx, 0.005, i * 0.06);
  }

  mine(): void {
    if (!this.throttle('mine', 70)) return;
    this.noise(0.08, 0.25, 2400);
    this.tone(880 + Math.random() * 200, 0.08, 'square', 0.03);
  }

  dig(): void {
    if (!this.throttle('dig', 90)) return;
    this.noise(0.3, 0.35, 700);
    this.tone(90, 0.25, 'sine', 0.2);
  }

  step(): void {
    if (!this.throttle('step', 110)) return;
    this.noise(0.04, 0.08, 500);
  }

  click(): void {
    this.tone(1200, 0.05, 'sine', 0.06);
  }

  fail(): void {
    if (!this.throttle('fail', 400)) return;
    this.tone(220, 0.15, 'square', 0.04);
    this.tone(180, 0.2, 'square', 0.04, this.sfx, 0.005, 0.08);
  }

  corrupt(): void {
    if (!this.throttle('corrupt', 300)) return;
    for (let i = 0; i < 6; i++) this.tone(200 + Math.random() * 900, 0.05, 'sawtooth', 0.05, this.sfx, 0.001, i * 0.03);
  }

  catch_(): void {
    for (let i = 0; i < 5; i++) this.tone(this.noteFreq(10 - i), 0.15, 'triangle', 0.1, this.sfx, 0.005, i * 0.04);
  }

  fanfare(): void {
    [0, 2, 4, 5, 7].forEach((s, i) => this.tone(this.noteFreq(s + 5), 0.6, 'triangle', 0.16, this.sfx, 0.01, i * 0.12));
    this.tone(this.noteFreq(5) / 2, 1.6, 'sine', 0.2, this.sfx, 0.05, 0.5);
  }

  rec(on: boolean): void {
    this.tone(on ? 660 : 440, 0.12, 'sine', 0.1);
    this.tone(on ? 990 : 330, 0.12, 'sine', 0.08, this.sfx, 0.005, 0.08);
  }

  capsule(): void {
    [9, 7, 9, 12].forEach((s, i) => this.tone(this.noteFreq(s), 0.4, 'sine', 0.1, this.sfx, 0.01, i * 0.15));
  }

  private drone(): void {
    if (!this.ctx || !this.music) return;
    const c = this.ctx;
    for (const f of [55, 82.4]) {
      const o = c.createOscillator();
      const g = c.createGain();
      const lfo = c.createOscillator();
      const lg = c.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.value = 0.05;
      lfo.frequency.value = 0.07 + Math.random() * 0.05;
      lg.gain.value = 0.03;
      lfo.connect(lg).connect(g.gain);
      o.connect(g).connect(this.music);
      o.start();
      lfo.start();
    }
  }

  private scheduleMusic(): void {
    // Arpegios lentos y gotas: música generativa, nunca se repite igual.
    const play = () => {
      if (!this.ctx || !this.music) return;
      const r = Math.random();
      if (r < 0.55) {
        const root = [0, 3, 5, 2][Math.floor(Math.random() * 4)];
        for (let i = 0; i < 4; i++) {
          if (Math.random() < 0.8) this.tone(this.noteFreq(root + i * 2, 196), 1.8, 'sine', 0.05, this.music, 0.08, i * 0.45);
        }
      } else if (r < 0.8) {
        this.tone(1400 + Math.random() * 1400, 0.3, 'sine', 0.03, this.music, 0.002);
      }
      this.musicTimer = window.setTimeout(play, 2200 + Math.random() * 2600);
    };
    this.musicTimer = window.setTimeout(play, 1500);
  }

  stop(): void {
    window.clearTimeout(this.musicTimer);
    void this.ctx?.suspend();
  }
}
