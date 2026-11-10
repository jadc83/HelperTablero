// Motor de Síntesis Web Audio API + Reproductor de Audio Personalizado (.ogg / .mp3)
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.activeLoops = {};
    this.activeAudioTags = {};
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  createNoiseBuffer(seconds = 2) {
    const bufferSize = this.ctx.sampleRate * seconds;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  stopLoop(id) {
    if (this.activeLoops[id]) {
      try {
        this.activeLoops[id].stop();
        this.activeLoops[id].disconnect();
      } catch {
        // Ignorar errores de nodos ya detenidos
      }
      delete this.activeLoops[id];
    }
    if (this.activeAudioTags[id]) {
      try {
        this.activeAudioTags[id].pause();
        this.activeAudioTags[id].currentTime = 0;
      } catch {
        // Ignorar errores de reproducción detenida
      }
      delete this.activeAudioTags[id];
    }
  }

  stopAll() {
    Object.keys(this.activeLoops).forEach(id => this.stopLoop(id));
    Object.keys(this.activeAudioTags).forEach(id => this.stopLoop(id));
  }

  play(soundOrId, customAudioSrc = null, isLoop = false) {
    const id = typeof soundOrId === 'object' ? soundOrId.id : soundOrId;
    const audioDataUrl = typeof soundOrId === 'object' ? soundOrId.audioDataUrl : customAudioSrc;
    const loopFlag = typeof soundOrId === 'object' ? Boolean(soundOrId.loop) : Boolean(isLoop);

    if (audioDataUrl) {
      if (loopFlag && this.activeAudioTags[id]) {
        this.stopLoop(id);
        return false;
      }
      try {
        const audio = new Audio(audioDataUrl);
        audio.loop = loopFlag;
        audio.volume = 0.85;
        audio.play().catch(() => {});
        if (loopFlag) {
          this.activeAudioTags[id] = audio;
        }
      } catch (e) {
        console.error('Error reproduciendo audio personalizado:', e);
      }
      return true;
    }

    this.init();
    const now = this.ctx.currentTime;

    if (id.startsWith('amb_')) {
      if (this.activeLoops[id]) {
        this.stopLoop(id);
        return false;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer(4);
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      if (id === 'amb_rain') {
        filter.type = 'bandpass';
        filter.frequency.value = 1100;
        filter.Q.value = 0.7;
        gain.gain.value = 0.18;
      } else if (id === 'amb_wind') {
        filter.type = 'lowpass';
        filter.frequency.value = 320;
        gain.gain.value = 0.25;
      } else if (id === 'amb_fire') {
        filter.type = 'highpass';
        filter.frequency.value = 1500;
        gain.gain.value = 0.08;
      } else if (id === 'amb_dungeon') {
        filter.type = 'lowpass';
        filter.frequency.value = 110;
        gain.gain.value = 0.45;
      } else if (id === 'amb_tavern') {
        filter.type = 'bandpass';
        filter.frequency.value = 480;
        filter.Q.value = 1.4;
        gain.gain.value = 0.16;
      }

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
      this.activeLoops[id] = noise;
      return true;
    }

    switch (id) {
      case 'sfx_door_open': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(95, now);
        osc.frequency.linearRampToValueAtTime(145, now + 0.35);
        osc.frequency.linearRampToValueAtTime(80, now + 0.8);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.85);
        break;
      }
      case 'sfx_door_slam':
      case 'sfx_hit': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(id === 'sfx_door_slam' ? 120 : 150, now);
        osc.frequency.exponentialRampToValueAtTime(22, now + 0.35);
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
      }
      case 'sfx_glass': {
        for (let i = 0; i < 8; i++) {
          const delay = i * 0.045;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(2200 + Math.random() * 2800, now + delay);
          gain.gain.setValueAtTime(0.15, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.14);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + delay);
          osc.stop(now + delay + 0.15);
        }
        break;
      }
      case 'sfx_sword': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(920, now);
        osc.frequency.exponentialRampToValueAtTime(2600, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.35);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
      }
      case 'sfx_arrow': {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(0.4);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(600, now);
        filter.frequency.exponentialRampToValueAtTime(2800, now + 0.15);
        filter.frequency.exponentialRampToValueAtTime(400, now + 0.35);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(now);
        break;
      }
      case 'sfx_fireball':
      case 'sfx_thunder': {
        const dur = id === 'sfx_thunder' ? 2.2 : 1.1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(dur);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(id === 'sfx_thunder' ? 400 : 800, now);
        filter.frequency.exponentialRampToValueAtTime(45, now + dur);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(now);
        break;
      }
      case 'sfx_magic': {
        [440, 554.37, 659.25, 880, 1108.73].forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + idx * 0.06 + 0.6);
          gain.gain.setValueAtTime(0.12, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.65);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.7);
        });
        break;
      }
      case 'sfx_wolf':
      case 'sfx_ghost': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(id === 'sfx_wolf' ? 260 : 380, now);
        osc.frequency.exponentialRampToValueAtTime(id === 'sfx_wolf' ? 520 : 620, now + 0.6);
        osc.frequency.exponentialRampToValueAtTime(id === 'sfx_wolf' ? 390 : 280, now + 1.7);
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.28, now + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 1.85);
        break;
      }
      case 'sfx_roar': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.linearRampToValueAtTime(55, now + 1.1);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 1.25);
        break;
      }
      case 'sfx_crow': {
        [0, 0.28].forEach(offset => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(820, now + offset);
          osc.frequency.linearRampToValueAtTime(520, now + offset + 0.18);
          gain.gain.setValueAtTime(0.18, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.2);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + offset);
          osc.stop(now + offset + 0.22);
        });
        break;
      }
      default: {
        [0, 0.08, 0.16].forEach((offset, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(1200 + i * 400, now + offset);
          gain.gain.setValueAtTime(0.2, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.12);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + offset);
          osc.stop(now + offset + 0.14);
        });
      }
    }
    return true;
  }
}

export const playerSoundEngine = new SoundEngine();
