/**
 * Web Audio API procedural sound effects & Nigerian street audio synth
 * Zero external audio assets required; runs reliably in all browsers.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private bgmPlaying: boolean = false;
  private bgmInterval: number | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.bgmPlaying) {
      this.stopAfrobeatBgm();
    }
  }

  public getMuted() {
    return this.isMuted;
  }

  // --- WEAPON SOUNDS ---
  public playGunfire(type: 'AR' | 'SMG' | 'SNIPER' | 'MELEE' | 'TACTICAL') {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    if (type === 'MELEE') {
      // Whoosh knife swing
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.12);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
      return;
    }

    if (type === 'TACTICAL') {
      // Grenade pin pull / toss
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.exponentialRampToValueAtTime(900, t + 0.1);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.15);
      return;
    }

    // Gunshot crack + low end thud
    const dur = type === 'SNIPER' ? 0.35 : type === 'AR' ? 0.18 : 0.12;
    const baseFreq = type === 'SNIPER' ? 80 : type === 'AR' ? 120 : 160;

    // 1. Noise transient for gunshot snap
    const bufferSize = this.ctx.sampleRate * dur;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(type === 'SNIPER' ? 1200 : 2200, t);
    filter.Q.setValueAtTime(2, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(type === 'SNIPER' ? 0.7 : 0.45, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    whiteNoise.start(t);
    whiteNoise.stop(t + dur);

    // 2. Punchy Sub Oscillator
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(baseFreq, t);
    subOsc.frequency.exponentialRampToValueAtTime(30, t + dur);

    subGain.gain.setValueAtTime(0.6, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(t);
    subOsc.stop(t + dur);
  }

  public playReload() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Mechanical clicks (mag eject & lock)
    [0, 0.25, 0.5].forEach((offset, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(idx === 1 ? 900 : 650, t + offset);
      osc.frequency.exponentialRampToValueAtTime(300, t + offset + 0.04);
      gain.gain.setValueAtTime(0.18, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(t + offset);
      osc.stop(t + offset + 0.04);
    });
  }

  public playHitMarker(isHeadshot: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isHeadshot ? 1600 : 950, t);
    osc.frequency.exponentialRampToValueAtTime(isHeadshot ? 2200 : 1200, t + 0.05);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  // --- ICONIC LAGOS SOUNDS ---
  public playDanfoHorn() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Classic Nigerian two-tone Danfo bus air horn "PO-PO-POOO!"
    const notes = [
      { freq: 440, dur: 0.12, start: 0 },
      { freq: 440, dur: 0.12, start: 0.16 },
      { freq: 520, dur: 0.35, start: 0.32 },
    ];

    notes.forEach((n) => {
      const osc1 = this.ctx!.createOscillator();
      const osc2 = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(n.freq, t + n.start);
      osc2.frequency.setValueAtTime(n.freq * 1.01, t + n.start);

      gain.gain.setValueAtTime(0.22, t + n.start);
      gain.gain.exponentialRampToValueAtTime(0.01, t + n.start + n.dur);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx!.destination);

      osc1.start(t + n.start);
      osc1.stop(t + n.start + n.dur);
      osc2.start(t + n.start);
      osc2.stop(t + n.start + n.dur);
    });
  }

  public playNepaBlackout() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Electrical zap drop + generator shutoff
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + 0.8);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.8);
  }

  public playCashEarned() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Crisp high-frequency chime
    [1046.5, 1318.5, 1567.98].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);
      gain.gain.setValueAtTime(0.2, t + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(t + idx * 0.06);
      osc.stop(t + idx * 0.06 + 0.18);
    });
  }

  public playVoiceCallout(phrase: string) {
    if (this.isMuted) return;
    // Synthesize speech if SpeechSynthesis API is supported
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(phrase);
      utter.pitch = 1.1;
      utter.rate = 1.05;
      utter.volume = 0.85;
      window.speechSynthesis.speak(utter);
    }
  }

  // --- AFROBEAT PROCEDURAL BEAT GENERATOR ---
  public toggleAfrobeatBgm(): boolean {
    if (this.bgmPlaying) {
      this.stopAfrobeatBgm();
      return false;
    } else {
      this.startAfrobeatBgm();
      return true;
    }
  }

  public startAfrobeatBgm() {
    if (this.bgmPlaying || this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    this.bgmPlaying = true;
    let step = 0;
    // 108 BPM Afrobeat tempo: 16th note ~ 138.8ms
    const intervalMs = 138.8;

    this.bgmInterval = window.setInterval(() => {
      if (!this.ctx || !this.bgmPlaying || this.isMuted) return;
      const t = this.ctx.currentTime;
      const barStep = step % 16;

      // 1. Kick on 0, 6, 10
      if (barStep === 0 || barStep === 6 || barStep === 10) {
        const kick = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kick.type = 'sine';
        kick.frequency.setValueAtTime(140, t);
        kick.frequency.exponentialRampToValueAtTime(45, t + 0.09);
        kickGain.gain.setValueAtTime(0.25, t);
        kickGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        kick.connect(kickGain);
        kickGain.connect(this.ctx.destination);
        kick.start(t);
        kick.stop(t + 0.1);
      }

      // 2. Afrobeat Shaker / Percussion on every odd step
      if (barStep % 2 !== 0) {
        const noise = this.ctx.createBufferSource();
        const bSize = this.ctx.sampleRate * 0.03;
        const buf = this.ctx.createBuffer(1, bSize, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bSize; i++) data[i] = Math.random() * 2 - 1;
        noise.buffer = buf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(6000, t);
        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(barStep % 4 === 1 ? 0.06 : 0.03, t);
        nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(this.ctx.destination);
        noise.start(t);
        noise.stop(t + 0.03);
      }

      // 3. Rimshot / Woodblock syncopation on steps 4, 12
      if (barStep === 4 || barStep === 12) {
        const rim = this.ctx.createOscillator();
        const rimGain = this.ctx.createGain();
        rim.type = 'triangle';
        rim.frequency.setValueAtTime(800, t);
        rim.frequency.exponentialRampToValueAtTime(400, t + 0.05);
        rimGain.gain.setValueAtTime(0.12, t);
        rimGain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
        rim.connect(rimGain);
        rimGain.connect(this.ctx.destination);
        rim.start(t);
        rim.stop(t + 0.05);
      }

      step++;
    }, intervalMs);
  }

  public stopAfrobeatBgm() {
    this.bgmPlaying = false;
    if (this.bgmInterval !== null) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  public isBgmActive() {
    return this.bgmPlaying;
  }
}

export const soundEngine = new SoundEngine();
