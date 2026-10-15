// Web Audio API synthesizer for tactile typing effects
import type { SoundProfileType } from '../types/diary';

export { SoundProfileType };

export interface SoundProfileMeta {
  id: SoundProfileType;
  label: string;
  desc: string;
}

export const SOUND_PROFILES: SoundProfileMeta[] = [
  { id: 'typewriter', label: 'Typewriter', desc: 'Vintage metallic hammer & bell' },
  { id: 'mechanical', label: 'Mechanical', desc: 'Crisp clicky tactile switch' },
  { id: 'soft_click', label: 'Soft Keys', desc: 'Subtle muted gentle clicks' },
  { id: 'bubble', label: 'Bubble Pop', desc: 'Satisfying water droplet pops' },
  { id: 'retro_game', label: '8-Bit Retro', desc: 'Nostalgic arcade chip blips' },
  { id: 'rain_tap', label: 'Raindrop', desc: 'Calming rain taps on glass' },
  { id: 'wood_block', label: 'Wood Block', desc: 'Warm acoustic percussion' },
  { id: 'mute', label: 'Mute', desc: 'Silent typing' },
];

class TypewriterSoundEngine {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = true;
  private volume: number = 0.3;
  private soundProfile: SoundProfileType = 'typewriter';

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
      this.ctx.resume();
    }
  }

  public getSoundProfile(): SoundProfileType {
    return this.soundProfile;
  }

  public setSoundProfile(profile: SoundProfileType) {
    this.soundProfile = profile;
    this.isEnabled = profile !== 'mute';
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public playKeySound(key: string = '') {
    if (!this.isEnabled || this.soundProfile === 'mute') return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      if (key === 'Enter') {
        this.playCarriageReturn(now);
      } else if (key === ' ') {
        this.playSpacebar(now);
      } else if (key === 'Backspace') {
        this.playBackspace(now);
      } else {
        this.playNormalKey(now);
      }
    } catch {
      // Audio playback fails gracefully if browser policies block audio
    }
  }

  private playNormalKey(now: number) {
    if (!this.ctx) return;

    if (this.soundProfile === 'typewriter') {
      // Vintage metallic hammer strike
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450 + Math.random() * 80, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.04);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800, now);
      filter.Q.setValueAtTime(3.0, now);

      gain.gain.setValueAtTime(this.volume * 0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);

      this.playNoiseBurst(now, 0.02, 0.25 * this.volume);
    } else if (this.soundProfile === 'mechanical') {
      // Crisp mechanical switch click (Cherry MX Blue)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(800 + Math.random() * 120, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.025);

      gain.gain.setValueAtTime(this.volume * 0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.035);
      this.playNoiseBurst(now, 0.015, 0.3 * this.volume);
    } else if (this.soundProfile === 'bubble') {
      // Water droplet / bubble pop
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const baseFreq = 540 + Math.random() * 180;
      osc.frequency.setValueAtTime(baseFreq * 0.7, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.02);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, now + 0.05);

      gain.gain.setValueAtTime(this.volume * 0.75, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } else if (this.soundProfile === 'retro_game') {
      // 8-bit arcade blip
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const scale = [440, 523, 587, 659, 784, 880];
      const freq = scale[Math.floor(Math.random() * scale.length)];

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.setValueAtTime(freq * 1.25, now + 0.015);

      gain.gain.setValueAtTime(this.volume * 0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.045);
    } else if (this.soundProfile === 'rain_tap') {
      // Soft raindrop on glass (gentle resonant tap)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      const freq = 1200 + Math.random() * 400;
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.025);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, now);

      gain.gain.setValueAtTime(this.volume * 0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.035);
      this.playNoiseBurst(now, 0.015, 0.1 * this.volume, 2400);
    } else if (this.soundProfile === 'wood_block') {
      // Warm acoustic wood block
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      const freq = 850 + Math.random() * 100;
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.03);

      gain.gain.setValueAtTime(this.volume * 0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
      this.playNoiseBurst(now, 0.01, 0.2 * this.volume, 1800);
    } else {
      // Soft tactile click
      this.playNoiseBurst(now, 0.025, 0.2 * this.volume);
    }
  }

  private playSpacebar(now: number) {
    if (!this.ctx) return;

    if (this.soundProfile === 'bubble') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(480, now + 0.03);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.07);

      gain.gain.setValueAtTime(this.volume * 0.85, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.085);
      return;
    }

    if (this.soundProfile === 'retro_game') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.04);

      gain.gain.setValueAtTime(this.volume * 0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.065);
      return;
    }

    if (this.soundProfile === 'wood_block') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.05);

      gain.gain.setValueAtTime(this.volume * 0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
      return;
    }

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.06);

    gain.gain.setValueAtTime(this.volume * 0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
    this.playNoiseBurst(now, 0.035, 0.25 * this.volume);
  }

  private playBackspace(now: number) {
    if (!this.ctx) return;

    if (this.soundProfile === 'bubble') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(460, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.045);

      gain.gain.setValueAtTime(this.volume * 0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.055);
      return;
    }

    if (this.soundProfile === 'retro_game') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.exponentialRampToValueAtTime(165, now + 0.04);

      gain.gain.setValueAtTime(this.volume * 0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
      return;
    }

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.04);

    gain.gain.setValueAtTime(this.volume * 0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  private playCarriageReturn(now: number) {
    if (!this.ctx) return;

    if (this.soundProfile === 'bubble') {
      // Pleasant water droplet chime
      [660, 880].forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        const start = now + idx * 0.08;
        osc.frequency.setValueAtTime(freq, start);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.2, start + 0.03);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, start + 0.12);

        gain.gain.setValueAtTime(this.volume * 0.6, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.14);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.15);
      });
      return;
    }

    if (this.soundProfile === 'retro_game') {
      // 8-bit victory arpeggio chime
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        const start = now + idx * 0.06;
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(this.volume * 0.35, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.1);
      });
      return;
    }

    if (this.soundProfile === 'wood_block') {
      // Double wood tap
      [750, 1050].forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        const start = now + idx * 0.07;
        osc.frequency.setValueAtTime(freq, start);
        osc.frequency.exponentialRampToValueAtTime(200, start + 0.04);

        gain.gain.setValueAtTime(this.volume * 0.7, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.06);
      });
      return;
    }

    // Classic pleasant typewriter bell 'Ding!'
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1760, now); // A6 bell note
    osc.frequency.exponentialRampToValueAtTime(1750, now + 0.4);

    gain.gain.setValueAtTime(this.volume * 0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  private playNoiseBurst(now: number, duration: number, volume: number, filterFreq: number = 1000) {
    if (!this.ctx) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = filterFreq > 2000 ? 'lowpass' : 'highpass';
    filter.frequency.setValueAtTime(filterFreq, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + duration);
  }
}

export const typewriterAudio = new TypewriterSoundEngine();
