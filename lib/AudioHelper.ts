// Web Audio API helper for custom call sound effects to avoid asset download failures

class AudioService {
  private ctx: AudioContext | null = null;
  private currentSource: OscillatorNode[] = [];
  private currentGain: GainNode | null = null;
  private activeInterval: any = null;
  private soundType: 'calling' | 'ringing' | 'none' = 'none';

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  play(type: string = 'ringing', loop?: boolean) {
    if (type === 'calling') {
      this.playCalling();
    } else if (type === 'message' || type === 'notification') {
      this.playNotification();
    } else {
      this.playRingtone();
    }
  }

  playNotification() {
    this.initCtx();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // High-quality double-tap synth chime
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(659.25, now); // E5
      osc2.frequency.exponentialRampToValueAtTime(987.77, now + 0.15); // B5

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.3);
      osc2.stop(now + 0.3);
    } catch (e) {}
  }

  stop() {
    this.soundType = 'none';
    if (this.activeInterval) {
      clearInterval(this.activeInterval);
      this.activeInterval = null;
    }
    this.currentSource.forEach(src => {
      try {
        src.stop();
      } catch (e) {}
    });
    this.currentSource = [];
    if (this.currentGain) {
      try {
        this.currentGain.disconnect();
      } catch (e) {}
      this.currentGain = null;
    }
  }

  // Ringback/Calling tone (classic double beep, e.g. "beep-beep... beep-beep...")
  playCalling() {
    this.stop();
    this.initCtx();
    if (!this.ctx) return;
    this.soundType = 'calling';

    const playBeepPair = () => {
      if (!this.ctx || this.soundType !== 'calling') return;
      
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(440, this.ctx.currentTime); // Standard 440Hz dial tone
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(480, this.ctx.currentTime); // Standard 480Hz mix

      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      
      // First beep: 0.0s to 0.4s
      gain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime + 0.35);
      gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.4);

      // Second beep: 0.6s to 1.0s
      gain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.65);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime + 0.95);
      gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.0);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(this.ctx.currentTime + 1.2);
      osc2.stop(this.ctx.currentTime + 1.2);

      this.currentSource.push(osc1, osc2);
    };

    playBeepPair();
    this.activeInterval = setInterval(playBeepPair, 3000);
  }

  // Custom sweet ringtone (beautiful harp-like melody for incoming call)
  playRingtone() {
    this.stop();
    this.initCtx();
    if (!this.ctx) return;
    this.soundType = 'ringing';

    const playMelody = () => {
      if (!this.ctx || this.soundType !== 'ringing') return;
      
      // Sweet melodic sequence (chords Cmaj7 -> Am9 -> Fmaj7)
      const notes = [
        { freq: 523.25, time: 0.0, dur: 0.25 }, // C5
        { freq: 659.25, time: 0.15, dur: 0.25 }, // E5
        { freq: 783.99, time: 0.3, dur: 0.25 }, // G5
        { freq: 987.77, time: 0.45, dur: 0.4 }, // B5
        
        { freq: 587.33, time: 0.8, dur: 0.25 }, // D5
        { freq: 698.46, time: 0.95, dur: 0.25 }, // F5
        { freq: 880.00, time: 1.1, dur: 0.25 }, // A5
        { freq: 1174.66, time: 1.25, dur: 0.5 }, // D6
      ];

      notes.forEach(note => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle'; // triangle has a softer, sweeter harp-like timbre
        osc.frequency.setValueAtTime(note.freq, this.ctx.currentTime + note.time);

        gain.gain.setValueAtTime(0, this.ctx.currentTime + note.time);
        gain.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + note.time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + note.time + note.dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + note.time);
        osc.stop(this.ctx.currentTime + note.time + note.dur + 0.1);

        this.currentSource.push(osc);
      });
    };

    playMelody();
    this.activeInterval = setInterval(playMelody, 2200);
  }

  // Short sharp decline bip bip
  playEndBip() {
    this.stop();
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.setValueAtTime(250, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.26);
    } catch (e) {}

    // Haptic vibration
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([80, 50, 80]);
      } catch (e) {}
    }
  }
}

export const audioHelper = new AudioService();
