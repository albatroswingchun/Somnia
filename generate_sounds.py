#!/usr/bin/env python3
"""
generate_sounds.py — Générateur de sons basiques pour Somnia
============================================================
Crée des fichiers WAV synthétiques dans /assets/audio/
Ces fichiers sont des placeholders fonctionnels — remplacez-les
par des sons libres de droits pour une meilleure qualité.

Utilisation :
  pip install numpy scipy
  python generate_sounds.py

Sources de sons libres de droits (vérifiez les licences) :
  - https://freesound.org              (CC0 / CC-BY)
  - https://pixabay.com/sound-effects  (Pixabay License)
  - https://www.zapsplat.com           (Standard License)
  - https://sound-effects.bbcrewind.co.uk (BBC — usage personnel)
  - https://www.youtube.com/audiolibrary (YouTube Audio Library)
"""

import numpy as np
import wave
import struct
import os
import math

SAMPLE_RATE = 44100
DURATION    = 8        # secondes par fichier (boucle bien)
OUTPUT_DIR  = os.path.join(os.path.dirname(__file__), 'assets', 'audio')

os.makedirs(OUTPUT_DIR, exist_ok=True)


def write_wav(filename, data_L, data_R=None, sr=SAMPLE_RATE):
    """Écrit un fichier WAV stéréo ou mono 16-bit."""
    if data_R is None:
        data_R = data_L
    # Clip & convert to int16
    L = np.clip(data_L, -1, 1)
    R = np.clip(data_R, -1, 1)
    L16 = (L * 32767).astype(np.int16)
    R16 = (R * 32767).astype(np.int16)
    # Interleave
    stereo = np.empty(len(L16) + len(R16), dtype=np.int16)
    stereo[0::2] = L16
    stereo[1::2] = R16

    path = os.path.join(OUTPUT_DIR, filename)
    with wave.open(path, 'w') as f:
        f.setnchannels(2)
        f.setsampwidth(2)
        f.setframerate(sr)
        f.writeframes(stereo.tobytes())
    print(f'  ✓ {filename}')


def lowpass(data, cutoff_hz, sr=SAMPLE_RATE):
    """Filtre passe-bas simple 1er ordre."""
    rc = 1.0 - (2 * math.pi * cutoff_hz / sr)
    rc = max(0, min(0.9999, rc))
    out = np.zeros_like(data)
    s = 0.0
    for i in range(len(data)):
        s = s * rc + data[i] * (1 - rc)
        out[i] = s
    return out


def noise(n):
    return np.random.uniform(-1, 1, n)


def gen_rain(sr=SAMPLE_RATE, dur=DURATION):
    n = sr * dur
    L = lowpass(noise(n), 400) * 0.5
    R = lowpass(noise(n), 400) * 0.5
    # Gouttes
    rng = np.random.default_rng(42)
    for _ in range(int(dur * 80)):
        pos = rng.integers(0, n - 200)
        amp = rng.uniform(0.2, 0.6)
        for j in range(150):
            if pos + j < n:
                L[pos+j] += amp * math.exp(-j * 0.08) * rng.uniform(-1,1)
                R[pos+j] += amp * 0.8 * math.exp(-j * 0.08) * rng.uniform(-1,1)
    return np.clip(L, -1, 1), np.clip(R, -1, 1)


def gen_wind(sr=SAMPLE_RATE, dur=DURATION):
    n = sr * dur
    t = np.linspace(0, dur, n)
    L = lowpass(noise(n), 150) * 0.6
    R = lowpass(noise(n), 150) * 0.6
    mod = 0.5 + 0.5 * np.sin(2 * math.pi * 0.2 * t)
    L *= mod; R *= mod
    return L, R


def gen_thunder(sr=SAMPLE_RATE, dur=DURATION):
    n = sr * dur
    L = lowpass(noise(n), 60) * 0.05
    R = lowpass(noise(n), 60) * 0.05
    # 2 grondements
    for start_frac, amp in [(0.15, 0.7), (0.6, 0.55)]:
        start = int(start_frac * n)
        rlen = int(sr * 0.8)
        for i in range(rlen):
            if start + i < n:
                env = math.sin(math.pi * i / rlen) ** 2
                v = noise(1)[0] * amp * env
                L[start+i] += v
                R[start+i] += v * 0.9
    L = lowpass(L, 120); R = lowpass(R, 120)
    return np.clip(L, -1, 1), np.clip(R, -1, 1)


def gen_forest(sr=SAMPLE_RATE, dur=DURATION):
    n = sr * dur
    L = lowpass(noise(n), 80) * 0.08
    R = lowpass(noise(n), 80) * 0.08
    # Grillons
    t = np.linspace(0, dur, n)
    cricket_freq = 4200
    L += np.sin(2 * math.pi * cricket_freq * t) * 0.06 * (0.5 + 0.5 * np.sin(2*math.pi*8*t))
    R += np.sin(2 * math.pi * (cricket_freq+3) * t) * 0.06 * (0.5 + 0.5 * np.sin(2*math.pi*8.1*t))
    return np.clip(L, -1, 1), np.clip(R, -1, 1)


def gen_river(sr=SAMPLE_RATE, dur=DURATION):
    n = sr * dur
    # Bruit filtré bande moyenne
    base = noise(n)
    hi = lowpass(base, 1200)
    lo = lowpass(base.copy(), 60)
    L = (hi - lo) * 0.4
    R = ((lowpass(noise(n), 1200) - lowpass(noise(n), 60))) * 0.4
    return np.clip(L, -1, 1), np.clip(R, -1, 1)


def gen_fire(sr=SAMPLE_RATE, dur=DURATION):
    n = sr * dur
    L = lowpass(noise(n), 300) * 0.3
    R = lowpass(noise(n), 300) * 0.3
    rng = np.random.default_rng(7)
    for _ in range(int(dur * 20)):
        pos = rng.integers(0, n - 200)
        amp = rng.uniform(0.15, 0.45)
        for j in range(100):
            if pos + j < n:
                L[pos+j] += amp * math.exp(-j*0.07) * rng.uniform(-1,1)
                R[pos+j] += amp*0.9 * math.exp(-j*0.07) * rng.uniform(-1,1)
    return np.clip(L, -1, 1), np.clip(R, -1, 1)


def gen_white(sr=SAMPLE_RATE, dur=DURATION):
    n = sr * dur
    L = noise(n) * 0.35
    R = noise(n) * 0.35
    return L, R


def gen_birds(sr=SAMPLE_RATE, dur=DURATION):
    n = sr * dur
    t = np.linspace(0, dur, n)
    L = lowpass(noise(n), 100) * 0.05
    R = lowpass(noise(n), 100) * 0.05
    freqs = [2200, 2600, 3000, 2800, 1900, 3300]
    rng = np.random.default_rng(13)
    for _ in range(18):
        f = freqs[rng.integers(0, len(freqs))]
        start = rng.integers(0, n - sr//4)
        clen = rng.integers(int(sr*0.06), int(sr*0.15))
        amp = rng.uniform(0.1, 0.2)
        for i in range(clen):
            if start + i < n:
                env = math.sin(math.pi * i / clen)
                L[start+i] += amp * math.sin(2*math.pi*f*i/sr) * env
                R[start+i] += amp*0.7 * math.sin(2*math.pi*(f+2)*i/sr) * env
    return np.clip(L, -1, 1), np.clip(R, -1, 1)


def gen_taps(sr=SAMPLE_RATE, dur=DURATION):
    n = sr * dur
    L = noise(n) * 0.01
    R = noise(n) * 0.01
    rng = np.random.default_rng(99)
    interval = int(sr * 0.7)
    pos = int(sr * 0.1)
    while pos < n:
        amp = rng.uniform(0.15, 0.3)
        tlen = int(sr * 0.04)
        for i in range(tlen):
            if pos + i < n:
                env = math.exp(-i * 0.12)
                v = rng.uniform(-1,1) * amp * env
                L[pos+i] += v
                R[pos+i] += v * 0.7
        pos += interval + rng.integers(-int(sr*0.1), int(sr*0.2))
    return np.clip(L, -1, 1), np.clip(R, -1, 1)


def gen_bowl(sr=SAMPLE_RATE, dur=DURATION):
    n = sr * dur
    L = np.zeros(n); R = np.zeros(n)
    base = 220  # Hz
    harmonics = [(1.0, 0.5), (2.76, 0.2), (5.4, 0.08)]
    for strike_pos in [0, n//2]:
        decay = sr * 3.0
        for h, amp in harmonics:
            for i in range(int(decay)):
                if strike_pos + i < n:
                    env = math.exp(-i / decay * 2)
                    sig = amp * math.sin(2*math.pi*base*h*i/sr) * env
                    L[strike_pos+i] += sig
                    R[strike_pos+i] += amp * 0.85 * math.sin(2*math.pi*(base*h+1.5)*i/sr) * env
    return np.clip(L, -1, 1), np.clip(R, -1, 1)


def gen_breath(sr=SAMPLE_RATE, dur=DURATION):
    n = sr * dur
    t = np.linspace(0, dur, n)
    cycle = 4.5  # secondes par cycle respiratoire
    env = 0.3 + 0.7 * np.sin(math.pi * t / cycle) ** 2
    L = lowpass(noise(n), 250) * env * 0.4
    R = lowpass(noise(n), 250) * env * 0.4
    return np.clip(L, -1, 1), np.clip(R, -1, 1)


def gen_texture(sr=SAMPLE_RATE, dur=DURATION):
    n = sr * dur
    t = np.linspace(0, dur, n)
    L = lowpass(noise(n), 200) * 0.3
    R = lowpass(noise(n), 200) * 0.3
    mod = 0.4 + 0.6 * np.abs(np.sin(math.pi * 0.12 * t))
    L *= mod; R *= mod
    return np.clip(L, -1, 1), np.clip(R, -1, 1)


if __name__ == '__main__':
    print(f'\n🎵 Génération des sons Somnia → {OUTPUT_DIR}\n')

    sounds = [
        ('rain.wav',    gen_rain),
        ('thunder.wav', gen_thunder),
        ('wind.wav',    gen_wind),
        ('forest.wav',  gen_forest),
        ('birds.wav',   gen_birds),
        ('river.wav',   gen_river),
        ('fire.wav',    gen_fire),
        ('white.wav',   gen_white),
        ('taps.wav',    gen_taps),
        ('bowl.wav',    gen_bowl),
        ('breath.wav',  gen_breath),
        ('texture.wav', gen_texture),
    ]

    for filename, fn in sounds:
        L, R = fn()
        write_wav(filename, L, R)

    print(f'\n✅ {len(sounds)} fichiers générés dans {OUTPUT_DIR}')
    print('\n📌 Pour une meilleure qualité, remplacez ces fichiers par des sons libres de droits.')
    print('   Consultez le README.md pour les sources recommandées.\n')
