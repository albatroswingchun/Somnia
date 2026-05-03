(() => {
  'use strict';

  const BUILTIN_SOUNDS = [
    { id: 'rain', name: 'Pluie douce', icon: '🌧️', color: '#6ba4e8', file: 'assets/audio/RAIN.aac', kind: 'rain' },
    { id: 'thunder', name: 'Orage lointain', icon: '⛈️', color: '#8b7cf6', file: 'assets/audio/THUNDER.aac', kind: 'thunder' },
    { id: 'birds', name: 'Oiseaux', icon: '🐦', color: '#f9d66b', file: 'assets/audio/BIRDS.aac', kind: 'birds' },
    { id: 'river', name: 'Rivière', icon: '🌊', color: '#5ad8ff', file: 'assets/audio/RIVER.aac', kind: 'river' },
    { id: 'asmr-pure-hand', name: 'ASMR mains', icon: '👐', color: '#d6b4ff', file: 'assets/audio/ASMR_PURE_HAND.aac', kind: 'asmr' },
  ];

  let ctx = null;
  const channels = new Map();

  function getCtx() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function makeNoiseBuffer(context, seconds = 2) {
    const length = Math.floor(context.sampleRate * seconds);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  function makeBandNoise(context, gainValue, lowFreq, highFreq) {
    const source = context.createBufferSource();
    source.buffer = makeNoiseBuffer(context, 2);
    source.loop = true;

    const low = context.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.value = highFreq;
    low.Q.value = 0.7;

    const high = context.createBiquadFilter();
    high.type = 'highpass';
    high.frequency.value = lowFreq;
    high.Q.value = 0.7;

    const gain = context.createGain();
    gain.gain.value = gainValue;

    source.connect(low).connect(high).connect(gain);
    source.start();
    return { input: gain, nodes: [source, low, high, gain] };
  }

  function createChannel(sound) {
    const context = getCtx();
    const master = context.createGain();
    master.gain.value = 0;
    master.connect(context.destination);

    const nodes = [];

    if (sound.kind === 'rain') {
      const n = makeBandNoise(context, 0.55, 900, 6200);
      n.input.connect(master);
      nodes.push(...n.nodes);
    }

    if (sound.kind === 'river') {
      const n1 = makeBandNoise(context, 0.45, 180, 2600);
      const n2 = makeBandNoise(context, 0.20, 1200, 5200);
      n1.input.connect(master);
      n2.input.connect(master);
      nodes.push(...n1.nodes, ...n2.nodes);
    }

    if (sound.kind === 'thunder') {
      const rumble = makeBandNoise(context, 0.35, 25, 160);
      rumble.input.connect(master);
      nodes.push(...rumble.nodes);
      const interval = setInterval(() => {
        if (master.gain.value <= 0.001) return;
        const osc = context.createOscillator();
        const g = context.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(55, context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(28, context.currentTime + 1.8);
        g.gain.setValueAtTime(0.0001, context.currentTime);
        g.gain.exponentialRampToValueAtTime(0.55, context.currentTime + 0.08);
        g.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 2.3);
        osc.connect(g).connect(master);
        osc.start();
        osc.stop(context.currentTime + 2.4);
      }, 7000);
      nodes.push({ stop: () => clearInterval(interval) });
    }

    if (sound.kind === 'birds') {
      const interval = setInterval(() => {
        if (master.gain.value <= 0.001) return;
        const osc = context.createOscillator();
        const g = context.createGain();
        osc.type = 'sine';
        const base = 1300 + Math.random() * 1800;
        osc.frequency.setValueAtTime(base, context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(base * (1.2 + Math.random() * 0.5), context.currentTime + 0.12);
        g.gain.setValueAtTime(0.0001, context.currentTime);
        g.gain.exponentialRampToValueAtTime(0.28, context.currentTime + 0.025);
        g.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.22);
        osc.connect(g).connect(master);
        osc.start();
        osc.stop(context.currentTime + 0.25);
      }, 450);
      nodes.push({ stop: () => clearInterval(interval) });
    }

    if (sound.kind === 'asmr') {
      const interval = setInterval(() => {
        if (master.gain.value <= 0.001) return;
        const src = context.createBufferSource();
        src.buffer = makeNoiseBuffer(context, 0.08);
        const bp = context.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 1800 + Math.random() * 2400;
        bp.Q.value = 8;
        const g = context.createGain();
        g.gain.setValueAtTime(0.0001, context.currentTime);
        g.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.09);
        src.connect(bp).connect(g).connect(master);
        src.start();
        src.stop(context.currentTime + 0.1);
      }, 160);
      nodes.push({ stop: () => clearInterval(interval) });
    }

    return { master, nodes };
  }

  function setVolume(sound, level) {
    const context = getCtx();
    let channel = channels.get(sound.id);
    if (!channel) {
      channel = createChannel(sound);
      channels.set(sound.id, channel);
    }
    const volume = Math.max(0, Math.min(1, level / 10));
    channel.master.gain.cancelScheduledValues(context.currentTime);
    channel.master.gain.setTargetAtTime(volume * 0.7, context.currentTime, 0.035);
  }

  function stopAll() {
    document.querySelectorAll('.track-slider[data-somnia-runtime="1"]').forEach(input => {
      input.value = '0';
      input.style.setProperty('--pct', '0%');
      const row = input.closest('.track-row');
      if (row) row.classList.remove('active');
      const val = row && row.querySelector('.track-val');
      if (val) val.textContent = '0';
    });
    BUILTIN_SOUNDS.forEach(sound => setVolume(sound, 0));
  }

  function renderBuiltinSounds() {
    const trackList = document.getElementById('track-list');
    if (!trackList) return false;

    trackList.innerHTML = BUILTIN_SOUNDS.map(sound => `
      <div class="track-row" data-sound-id="${sound.id}" style="--track-color:${sound.color}">
        <div class="track-icon">${sound.icon}</div>
        <div class="track-name">${sound.name}</div>
        <div class="track-slider-wrap">
          <input class="track-slider" data-somnia-runtime="1" data-sound-id="${sound.id}" type="range" min="0" max="10" step="1" value="0" style="--pct:0%" />
          <div class="track-val">0</div>
          <div class="wave"><span class="wave-bar"></span><span class="wave-bar"></span><span class="wave-bar"></span></div>
        </div>
      </div>
    `).join('');

    trackList.querySelectorAll('.track-slider[data-somnia-runtime="1"]').forEach(input => {
      input.addEventListener('input', () => {
        const sound = BUILTIN_SOUNDS.find(item => item.id === input.dataset.soundId);
        if (!sound) return;

        const row = input.closest('.track-row');
        const val = row && row.querySelector('.track-val');
        const level = Number(input.value || 0);
        const pct = `${level * 10}%`;

        input.style.setProperty('--pct', pct);
        if (val) val.textContent = String(level);
        if (row) row.classList.toggle('active', level > 0);

        setVolume(sound, level);
      });
    });

    const stopButton = document.getElementById('btn-stop');
    if (stopButton && !stopButton.dataset.somniaRuntimeBound) {
      stopButton.dataset.somniaRuntimeBound = '1';
      stopButton.addEventListener('click', stopAll, true);
    }

    console.info('[Somnia] Moteur audio intégré actif. Les fichiers AAC actuels semblent illisibles; WebAudio prend le relais.', BUILTIN_SOUNDS);
    return true;
  }

  function boot() {
    renderBuiltinSounds();
    setTimeout(renderBuiltinSounds, 500);
    setTimeout(renderBuiltinSounds, 1500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
