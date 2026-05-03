(() => {
  'use strict';

  const SOUNDS = [
    { id: 'rain', name: 'Pluie douce', icon: '🌧️', color: '#6ba4e8', kind: 'rain' },
    { id: 'thunder', name: 'Orage lointain', icon: '⛈️', color: '#8b7cf6', kind: 'thunder' },
    { id: 'birds', name: 'Oiseaux', icon: '🐦', color: '#f9d66b', kind: 'birds' },
    { id: 'river', name: 'Rivière', icon: '🌊', color: '#5ad8ff', kind: 'river' },
    { id: 'asmr', name: 'ASMR mains', icon: '👐', color: '#d6b4ff', kind: 'asmr' },
  ];

  let ctx;
  const channels = new Map();

  function audioContext() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!ctx) ctx = new AC();
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    return ctx;
  }

  function noiseBuffer(c, seconds = 1.5) {
    const buffer = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  function startNoise(c, low, high, gainAmount) {
    const source = c.createBufferSource();
    source.buffer = noiseBuffer(c);
    source.loop = true;
    const hp = c.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = low;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = high;
    const g = c.createGain();
    g.gain.value = gainAmount;
    source.connect(hp).connect(lp).connect(g);
    source.start();
    return { output: g, source };
  }

  function makeChannel(sound) {
    const c = audioContext();
    const master = c.createGain();
    master.gain.value = 0;
    master.connect(c.destination);

    if (sound.kind === 'rain') {
      const n = startNoise(c, 600, 7000, 0.95);
      n.output.connect(master);
    }

    if (sound.kind === 'river') {
      const n1 = startNoise(c, 120, 2400, 0.75);
      const n2 = startNoise(c, 1600, 6500, 0.30);
      n1.output.connect(master); n2.output.connect(master);
    }

    if (sound.kind === 'thunder') {
      const rumble = startNoise(c, 20, 180, 0.65);
      rumble.output.connect(master);
      setInterval(() => {
        if (master.gain.value < 0.01) return;
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.frequency.value = 42;
        g.gain.setValueAtTime(0.001, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.95, c.currentTime + 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.2);
        osc.connect(g).connect(master);
        osc.start(); osc.stop(c.currentTime + 1.25);
      }, 3000);
    }

    if (sound.kind === 'birds') {
      setInterval(() => {
        if (master.gain.value < 0.01) return;
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = 'sine';
        osc.frequency.value = 1000 + Math.random() * 2500;
        g.gain.setValueAtTime(0.001, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.55, c.currentTime + 0.015);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.16);
        osc.connect(g).connect(master);
        osc.start(); osc.stop(c.currentTime + 0.18);
      }, 320);
    }

    if (sound.kind === 'asmr') {
      setInterval(() => {
        if (master.gain.value < 0.01) return;
        const src = c.createBufferSource();
        src.buffer = noiseBuffer(c, 0.05);
        const bp = c.createBiquadFilter();
        bp.type = 'bandpass'; bp.frequency.value = 2200 + Math.random() * 2600; bp.Q.value = 10;
        const g = c.createGain();
        g.gain.setValueAtTime(0.001, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.45, c.currentTime + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.055);
        src.connect(bp).connect(g).connect(master);
        src.start(); src.stop(c.currentTime + 0.06);
      }, 115);
    }

    return { master };
  }

  function setVolume(index, level) {
    const sound = SOUNDS[index] || SOUNDS[0];
    const c = audioContext();
    let channel = channels.get(sound.id);
    if (!channel) {
      channel = makeChannel(sound);
      channels.set(sound.id, channel);
    }
    const vol = Math.max(0, Math.min(1, Number(level || 0) / 10));
    channel.master.gain.cancelScheduledValues(c.currentTime);
    channel.master.gain.setTargetAtTime(vol, c.currentTime, 0.015);
  }

  function syncExistingSliders() {
    const sliders = [...document.querySelectorAll('.track-row input[type="range"], .track-slider')];
    sliders.forEach((slider, index) => {
      if (slider.dataset.somniaAudioBound === '1') return;
      slider.dataset.somniaAudioBound = '1';
      const apply = () => setVolume(index, slider.value || 0);
      ['pointerdown', 'touchstart', 'mousedown', 'input', 'change', 'pointerup', 'touchend'].forEach(evt => {
        slider.addEventListener(evt, apply, { passive: true });
      });
      if (Number(slider.value || 0) > 0) {
        slider.addEventListener('pointerdown', apply, { once: true, passive: true });
      }
    });
  }

  function renderIfEmpty() {
    const trackList = document.getElementById('track-list');
    if (!trackList || trackList.children.length > 0) return;
    trackList.innerHTML = SOUNDS.map((s, i) => `
      <div class="track-row" style="--track-color:${s.color}">
        <div class="track-icon">${s.icon}</div><div class="track-name">${s.name}</div>
        <div class="track-slider-wrap"><input class="track-slider" type="range" min="0" max="10" step="1" value="0" style="--pct:0%"><div class="track-val">0</div><div class="wave"><span class="wave-bar"></span><span class="wave-bar"></span><span class="wave-bar"></span></div></div>
      </div>`).join('');
    syncExistingSliders();
  }

  function stopAll() {
    [...document.querySelectorAll('.track-row input[type="range"], .track-slider')].forEach(slider => {
      slider.value = 0;
      slider.dispatchEvent(new Event('input', { bubbles: true }));
    });
    SOUNDS.forEach((_, i) => setVolume(i, 0));
  }

  function boot() {
    renderIfEmpty();
    syncExistingSliders();
    document.addEventListener('pointerdown', () => {
      audioContext();
      syncExistingSliders();
      [...document.querySelectorAll('.track-row input[type="range"], .track-slider')].forEach((slider, i) => {
        if (Number(slider.value || 0) > 0) setVolume(i, slider.value);
      });
    }, { passive: true });
    const stop = document.getElementById('btn-stop');
    if (stop && stop.dataset.somniaStopBound !== '1') {
      stop.dataset.somniaStopBound = '1';
      stop.addEventListener('click', stopAll, true);
    }
    setInterval(syncExistingSliders, 1000);
    console.info('[Somnia] Audio fix actif v3');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
