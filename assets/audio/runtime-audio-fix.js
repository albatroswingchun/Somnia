(() => {
  'use strict';

  const BUILTIN_SOUNDS = [
    { id: 'rain', name: 'Pluie douce', icon: '🌧️', color: '#6ba4e8', file: 'assets/audio/RAIN.aac' },
    { id: 'thunder', name: 'Orage lointain', icon: '⛈️', color: '#8b7cf6', file: 'assets/audio/THUNDER.aac' },
    { id: 'birds', name: 'Oiseaux', icon: '🐦', color: '#f9d66b', file: 'assets/audio/BIRDS.aac' },
    { id: 'river', name: 'Rivière', icon: '🌊', color: '#5ad8ff', file: 'assets/audio/RIVER.aac' },
    { id: 'asmr-pure-hand', name: 'ASMR mains', icon: '👐', color: '#d6b4ff', file: 'assets/audio/ASMR_PURE_HAND.aac' },
  ];

  const players = new Map();

  function resolveUrl(path) {
    return new URL(path, document.baseURI).href;
  }

  function ensureAudio(sound) {
    let audio = players.get(sound.id);
    if (!audio) {
      audio = new Audio(resolveUrl(sound.file));
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = 0;
      audio.onerror = () => console.error('[Somnia] Audio introuvable ou illisible:', sound.file, audio.error);
      players.set(sound.id, audio);
    }
    return audio;
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

    players.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 0;
    });
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
      input.addEventListener('input', async () => {
        const sound = BUILTIN_SOUNDS.find(item => item.id === input.dataset.soundId);
        if (!sound) return;

        const row = input.closest('.track-row');
        const val = row && row.querySelector('.track-val');
        const level = Number(input.value || 0);
        const pct = `${level * 10}%`;

        input.style.setProperty('--pct', pct);
        if (val) val.textContent = String(level);
        if (row) row.classList.toggle('active', level > 0);

        const audio = ensureAudio(sound);
        audio.volume = Math.max(0, Math.min(1, level / 10));

        if (level > 0) {
          try {
            await audio.play();
          } catch (error) {
            console.error('[Somnia] Lecture audio bloquée ou impossible:', sound.file, error);
          }
        } else {
          audio.pause();
        }
      });
    });

    const stopButton = document.getElementById('btn-stop');
    if (stopButton && !stopButton.dataset.somniaRuntimeBound) {
      stopButton.dataset.somniaRuntimeBound = '1';
      stopButton.addEventListener('click', stopAll, true);
    }

    console.info('[Somnia] Sons intégrés activés:', BUILTIN_SOUNDS);
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
