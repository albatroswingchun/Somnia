#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LIB = ROOT / 'assets' / 'audio' / 'library.json'

AUDIO_MAGIC = (
    b'ID3',          # mp3 with ID3
    b'\xff\xfb',    # mp3 frame sync
    b'\xff\xf3',
    b'\xff\xf2',
    b'OggS',         # ogg
    b'RIFF',         # wav
    b'fLaC',         # flac
)


def looks_like_audio(header: bytes, ext: str) -> bool:
    h = header[:16]
    if h.startswith(b'<?xpacket') or h.startswith(b'<?xml'):
        return False
    if any(h.startswith(m) for m in AUDIO_MAGIC):
        return True
    # MP4/M4A brand box: ....ftyp....
    if len(h) >= 12 and h[4:8] == b'ftyp':
        return True
    # AAC ADTS syncword
    if len(h) >= 2 and h[0] == 0xFF and (h[1] & 0xF0) == 0xF0:
        return True
    # fallback by extension only if non-empty and not XML
    return len(h.strip()) > 0 and ext in {'.mp3', '.m4a', '.aac', '.wav', '.ogg', '.webm'}


def main():
    db = json.loads(LIB.read_text(encoding='utf-8'))
    tracks = db.get('tracks', [])
    bad = []
    missing = []

    for t in tracks:
      p = ROOT / t['file']
      if not p.exists():
          missing.append(str(p.relative_to(ROOT)))
          continue
      head = p.read_bytes()[:32]
      if not looks_like_audio(head, p.suffix.lower()):
          bad.append((str(p.relative_to(ROOT)), head))

    if missing:
      print('Missing files:')
      for m in missing:
        print(' -', m)

    if bad:
      print('Invalid audio-like files detected:')
      for rel, head in bad:
        print(f" - {rel}: head={head!r}")

    if not missing and not bad:
      print('OK: all library audio files look valid.')
      return 0

    return 1


if __name__ == '__main__':
    raise SystemExit(main())
