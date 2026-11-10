import { SOUND_CATALOG } from '../constants/gamePresets';

// Motor de Reproducción Web Audio API (archivos reales + loops sin cortes + recorte de silencio inicial)
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.ambientGain = null;
    this.sfxGain = null;
    this.activeLoops = {};
    this.activeAudioTags = {};
    this.oneShotAudioTags = new Set();
    this.activeOneShotSources = new Set();
    this.pendingLoopIds = new Set();
    this.bufferCache = new Map();
    this.bufferPromises = new Map();
    this.settings = {
      masterVolume: 85,
      ambientVolume: 70,
      sfxVolume: 85,
      isMuted: false
    };
  }

  getEffectiveAudioVolume(isLoop = false) {
    if (this.settings.isMuted) return 0;
    const channel = isLoop ? this.settings.ambientVolume : this.settings.sfxVolume;
    return Math.min(1, Math.max(0, this.settings.masterVolume * channel));
  }

  applyGainSettings() {
    if (this.masterGain && this.ctx) {
      const targetMaster = this.settings.isMuted ? 0 : this.settings.masterVolume;
      this.masterGain.gain.setTargetAtTime(targetMaster, this.ctx.currentTime, 0.02);
    }
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setTargetAtTime(this.settings.ambientVolume, this.ctx.currentTime, 0.02);
    }
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.settings.sfxVolume, this.ctx.currentTime, 0.02);
    }

    const loopVol = this.getEffectiveAudioVolume(true);
    Object.values(this.activeAudioTags).forEach((audio) => {
      try {
        audio.volume = loopVol;
      } catch {
        /* ignore */
      }
    });

    const sfxVol = this.getEffectiveAudioVolume(false);
    this.oneShotAudioTags.forEach((audio) => {
      try {
        audio.volume = sfxVol;
      } catch {
        /* ignore */
      }
    });
  }

  updateSettings({ masterVolume, ambientVolume, sfxVolume, isMuted } = {}) {
    if (Number.isFinite(masterVolume)) {
      this.settings.masterVolume = Math.min(1, Math.max(0, masterVolume / 100));
    }
    if (Number.isFinite(ambientVolume)) {
      this.settings.ambientVolume = Math.min(1, Math.max(0, ambientVolume / 100));
    }
    if (Number.isFinite(sfxVolume)) {
      this.settings.sfxVolume = Math.min(1, Math.max(0, sfxVolume / 100));
    }
    if (typeof isMuted === 'boolean') {
      this.settings.isMuted = isMuted;
    }
    this.applyGainSettings();
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.ambientGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.ambientGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      this.applyGainSettings();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  async loadAudioBuffer(src) {
    if (this.bufferCache.has(src)) {
      return this.bufferCache.get(src);
    }
    if (this.bufferPromises.has(src)) {
      return this.bufferPromises.get(src);
    }

    const promise = (async () => {
      const resp = await fetch(src);
      if (!resp.ok) throw new Error(`HTTP ${resp.status} al cargar ${src}`);
      const arr = await resp.arrayBuffer();
      const buffer = await this.ctx.decodeAudioData(arr);
      this.bufferCache.set(src, buffer);
      return buffer;
    })();

    this.bufferPromises.set(src, promise);
    try {
      return await promise;
    } finally {
      this.bufferPromises.delete(src);
    }
  }

  findAudioOnsetOffset(buffer, threshold = 0.015) {
    const channels = buffer.numberOfChannels;
    const sr = buffer.sampleRate;
    const maxScanSamples = Math.min(buffer.length, Math.floor(sr * 5));
    const step = Math.max(1, Math.floor(sr / 200));

    for (let i = 0; i < maxScanSamples; i += step) {
      for (let c = 0; c < channels; c += 1) {
        if (Math.abs(buffer.getChannelData(c)[i]) >= threshold) {
          return Math.max(0, (i / sr) - 0.03);
        }
      }
    }
    return 0;
  }

  playBufferNode(id, buffer, { isLoop = false, maxDuration = null } = {}) {
    if (!this.ctx) return;
    if (isLoop && !this.pendingLoopIds.has(id)) {
      return;
    }

    const now = this.ctx.currentTime;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = isLoop;

    const envGain = this.ctx.createGain();
    const dest = isLoop ? this.ambientGain : this.sfxGain;
    source.connect(envGain);
    envGain.connect(dest || this.ctx.destination);

    if (isLoop) {
      this.pendingLoopIds.delete(id);
      envGain.gain.setValueAtTime(0.001, now);
      envGain.gain.linearRampToValueAtTime(1, now + 0.25);
      source.start(now);
      this.activeLoops[id] = source;
      return;
    }

    const startOffset = this.findAudioOnsetOffset(buffer);
    const available = Math.max(0.15, buffer.duration - startOffset);
    const playDur = maxDuration && available > maxDuration ? maxDuration : available;
    const fadeOut = Math.min(0.45, playDur * 0.25);

    envGain.gain.setValueAtTime(1, now);
    if (maxDuration && available > maxDuration) {
      envGain.gain.setValueAtTime(1, now + Math.max(0.05, playDur - fadeOut));
      envGain.gain.linearRampToValueAtTime(0.001, now + playDur);
    }

    source.onended = () => {
      this.activeOneShotSources.delete(source);
      try {
        source.disconnect();
        envGain.disconnect();
      } catch {
        /* ignore */
      }
    };

    this.activeOneShotSources.add(source);
    source.start(now, startOffset, maxDuration && available > maxDuration ? playDur : undefined);
  }

  playFallbackTag(id, src, loopFlag) {
    try {
      const audio = new Audio(src);
      audio.loop = loopFlag;
      audio.volume = this.getEffectiveAudioVolume(loopFlag);
      if (loopFlag) {
        this.activeAudioTags[id] = audio;
      } else {
        this.oneShotAudioTags.add(audio);
        const cleanup = () => this.oneShotAudioTags.delete(audio);
        audio.addEventListener('ended', cleanup, { once: true });
        audio.addEventListener('error', cleanup, { once: true });
      }
      audio.play().catch(() => {});
    } catch (e) {
      console.error('Error reproduciendo audio:', e);
    }
  }

  stopLoop(id) {
    this.pendingLoopIds.delete(id);
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
    this.pendingLoopIds.clear();
    Object.keys(this.activeLoops).forEach(id => this.stopLoop(id));
    Object.keys(this.activeAudioTags).forEach(id => this.stopLoop(id));
    this.activeOneShotSources.forEach((src) => {
      try {
        src.stop();
        src.disconnect();
      } catch {
        /* ignore */
      }
    });
    this.activeOneShotSources.clear();
    this.oneShotAudioTags.forEach((audio) => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {
        /* ignore */
      }
    });
    this.oneShotAudioTags.clear();
  }

  play(soundOrId, customAudioSrc = null, isLoop = false) {
    const rawId = typeof soundOrId === 'object' ? soundOrId.id : soundOrId;
    const catalogEntry = SOUND_CATALOG.find(item => item.id === rawId);
    const id = rawId;
    const src = (typeof soundOrId === 'object' ? (soundOrId.audioDataUrl || soundOrId.audioSrc) : null)
      || customAudioSrc
      || catalogEntry?.audioSrc;
    const loopFlag = typeof soundOrId === 'object'
      ? Boolean(soundOrId.loop)
      : Boolean(isLoop || catalogEntry?.loop);
    const maxDuration = (typeof soundOrId === 'object' ? soundOrId.maxDuration : null) || catalogEntry?.maxDuration || null;

    if (loopFlag && (this.activeLoops[id] || this.activeAudioTags[id] || this.pendingLoopIds.has(id))) {
      this.stopLoop(id);
      return false;
    }

    if (!src) {
      return false;
    }

    this.init();
    if (loopFlag) {
      this.pendingLoopIds.add(id);
    }

    if (this.bufferCache.has(src)) {
      this.playBufferNode(id, this.bufferCache.get(src), { isLoop: loopFlag, maxDuration });
      return true;
    }

    this.loadAudioBuffer(src)
      .then((buffer) => {
        this.playBufferNode(id, buffer, { isLoop: loopFlag, maxDuration });
      })
      .catch(() => {
        if (!loopFlag || this.pendingLoopIds.has(id)) {
          this.pendingLoopIds.delete(id);
          this.playFallbackTag(id, src, loopFlag);
        }
      });

    return true;
  }
}

export const playerSoundEngine = new SoundEngine();
