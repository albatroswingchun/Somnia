# 🌙 Somnia v2 — Table de mixage ASMR

> PWA mobile-first pour composer votre ambiance sonore idéale.
> Interface minimaliste type table de mixage. Visual ASMR intégré.

---

## Nouveautés v2

| Avant (v1) | Après (v2) |
|---|---|
| Cartes/grille | **Liste verticale** (table de mixage) |
| Volume 0–100 | **Volume 0–10** discret |
| Bouton ON/OFF séparé | **Volume = commutateur** (0 = off, ≥1 = on) |
| Réveil programmable | **Supprimé** |
| Augmenter/réduire luminosité | **Toggle dim seul** |
| Pas de visuel | **Visual ASMR (EMDR)** |
| Sons générés uniquement | **Vos fichiers audio uniquement** |

---

## Structure du projet

```
somnia/
├── index.html              ← Application complète (single-file)
├── sw.js                   ← Service Worker (cache audio + offline)
├── manifest.json           ← PWA installable
├── README.md
└── assets/
    ├── audio/              ← 📂 PLACEZ VOS SONS ICI
    │   ├── rain.m4a
    │   ├── thunder.m4a
    │   ├── wind.m4a
    │   ├── forest.m4a
    │   ├── birds.m4a
    │   ├── river.m4a
    │   ├── fire.m4a
    │   ├── white.m4a
    │   ├── taps.m4a
    │   ├── bowl.m4a
    │   ├── breath.m4a
    │   └── texture.m4a
    └── icons/
        ├── icon-192.png
        └── icon-512.png
```

---

## Intégration de vos fichiers audio

### Principe de fonctionnement

Somnia utilise uniquement les fichiers audio du dossier `assets/audio/` :

Si un fichier manque, la piste concernée ne pourra pas être lue. Assurez-vous que chaque entrée de `assets/audio/library.json` pointe vers un fichier présent dans le dépôt.

### Formats supportés

| Format | Extension | Recommandation |
|---|---|---|
| **AAC / M4A** | `.m4a` | ✅ **Recommandé** — meilleur rapport qualité/poids |
| MP3 | `.mp3` | ✅ Compatible partout |
| WAV | `.wav` | ⚠ Fichiers très lourds — évitez pour le web |
| OGG Vorbis | `.ogg` | ✅ Excellent, mais pas supporté sur Safari/iOS |

**Recommandation** : utilisez `.m4a` (AAC) à 128 kbps. C'est le format qui offre la meilleure qualité pour le plus petit poids, compatible avec tous les navigateurs modernes incluant Safari/iOS.

### Nommage des fichiers

Les fichiers doivent porter exactement ces noms (définis dans `SOUNDS` dans `index.html`) :

| Fichier | Son |
|---|---|
| `rain.m4a` | Pluie douce |
| `thunder.m4a` | Orage lointain |
| `wind.m4a` | Vent |
| `forest.m4a` | Forêt |
| `birds.m4a` | Oiseaux |
| `river.m4a` | Rivière |
| `fire.m4a` | Feu de cheminée |
| `white.m4a` | Bruit blanc |
| `taps.m4a` | Taps ASMR |
| `bowl.m4a` | Bols tibétains |
| `breath.m4a` | Respiration |
| `texture.m4a` | Texture |

### Optimisation audio

**Durée idéale** : 30–60 secondes  
La boucle doit être transparente. Préparez vos sons pour que le début et la fin se rejoignent naturellement (crossfade ou coupe propre sur une zone calme).

**Poids cible** : < 1–2 MB par fichier  
À 128 kbps AAC : 1 minute ≈ 960 KB. Idéal.

**Conversion avec ffmpeg** (gratuit) :
```bash
# Depuis n'importe quel format → M4A 128kbps mono (recommandé pour ASMR)
ffmpeg -i input.wav -c:a aac -b:a 128k -ac 1 output.m4a

# Stéréo si le son a un vrai intérêt spatial
ffmpeg -i input.wav -c:a aac -b:a 128k -ac 2 output.m4a

# Rogner à 45 secondes pour une boucle propre
ffmpeg -i input.wav -t 45 -c:a aac -b:a 128k output.m4a

# Normaliser le volume (utile pour homogénéiser les sources)
ffmpeg -i input.wav -af loudnorm=I=-16:TP=-1.5:LRA=11 -c:a aac -b:a 128k output.m4a
```

**Sources de sons libres de droits** :
- [freesound.org](https://freesound.org) — CC0 / CC-BY
- [pixabay.com/sound-effects](https://pixabay.com/sound-effects) — Pixabay License
- [mixkit.co/free-sound-effects](https://mixkit.co/free-sound-effects) — Mixkit License

### Ajouter un son personnalisé

1. Ajoutez votre fichier dans `assets/audio/monsound.m4a`
2. Dans `index.html`, dans le tableau `SOUNDS`, ajoutez :
```js
{ id:'monsound', name:'Mon son', icon:'🎸', color:'#ff6b6b',
  file:'assets/audio/monsound.m4a', gen:'white' }
```
Le champ `gen` indique quel générateur utiliser si le fichier est absent (`'white'`, `'rain'`, `'wind'`…).

---

## Fonctionnement offline

### Comment Somnia fonctionne sans connexion

1. **Premier chargement** (avec connexion) :
   - L'application se charge normalement
   - Le Service Worker s'installe et met en cache `index.html`, `manifest.json`
   - Les fichiers audio sont mis en cache lors du **premier accès** à chaque son

2. **Chargements suivants** (avec ou sans connexion) :
   - Le Service Worker sert les fichiers depuis le cache (Cache-First)
   - Les sons déjà joués une fois sont disponibles hors ligne
   - Les sons jamais joués → indisponibles tant que le fichier manque

3. **Sons audio du dépôt** :
   - Entièrement dans le navigateur, aucune connexion requise
   - Disponibles instantanément à chaque session

### Rendre tous les sons disponibles offline dès le premier chargement

Option 1 — Inclure les fichiers dans le repo GitHub :
```
Déposez vos sons dans assets/audio/ et committez-les dans le repo.
Lors du déploiement GitHub Pages, les sons font partie du bundle.
À la première visite, le SW les précharge en arrière-plan.
```

Option 2 — Précache explicite (à ajouter dans `index.html`) :
```js
// Après l'enregistrement du SW, demander le précache des sons
if (navigator.serviceWorker.controller) {
  navigator.serviceWorker.controller.postMessage({
    type: 'PRECACHE_AUDIO',
    files: [
      'assets/audio/rain.m4a',
      'assets/audio/wind.m4a',
      // etc.
    ]
  });
}
```

### Taille totale estimée du cache

| Composant | Taille estimée |
|---|---|
| `index.html` | ~100 KB |
| `manifest.json` | ~1 KB |
| Fonts Google (DM Mono + Syne) | ~200 KB |
| 12 sons × 1 MB | ~12 MB |
| **Total** | **~12.3 MB** |

Tout tient dans un cache PWA standard (limite : généralement 50–200 MB selon le navigateur).

---

## Installation et lancement

```bash
# Cloner le projet
git clone https://github.com/TON-USERNAME/somnia.git
cd somnia

# Serveur local Python (intégré)
python3 -m http.server 8080

# Ou Node.js
npx serve .

# Ou VS Code Live Server
# → Installer l'extension "Live Server" → clic droit index.html → Open with Live Server

# Ouvrir : http://localhost:8080
```

> ⚠️ Le Service Worker ne fonctionne qu'en HTTPS ou `localhost`.

---

## Déploiement GitHub Pages

```bash
git init
git add .
git commit -m "feat: Somnia v2"
git remote add origin https://github.com/TON-USERNAME/somnia.git
git push -u origin main

# Settings → Pages → Source : main / root
# URL : https://TON-USERNAME.github.io/somnia/
```

---

## Fonctionnalités

### Table de mixage

Chaque son est une ligne horizontale avec :
- **Icône** + **nom** du son
- **Slider 0–10** : volume discret
- **Volume 0** = son éteint (fade out automatique)
- **Volume ≥ 1** = son allumé (fade in automatique)
- Indicateur d'activité (barre colorée gauche + vague animée)

### Visual ASMR

Point lumineux animé pour focus visuel / EMDR doux.

**Mode latéral** : mouvement gauche ↔ droite continu  
**Mode libre** : trajectoire organique pseudo-aléatoire avec rebonds  
**Vitesse** : 1 (très lent) → 10 (rapide)  
**Son clic** : petit clic synthétique à chaque rebond (désactivable)

### Minuteur d'endormissement

4 durées : 15 / 30 / 45 / 60 minutes  
Fade out progressif sur les **45 dernières secondes**  
Barre de progression visuelle

### Presets

Sauvegarde l'état complet : volumes de chaque piste + volume maître  
Stockage localStorage — persistant entre les sessions

### Mode dim

Toggle luminosité réduite — overlay sombre quasi-opaque  
Tap sur l'overlay pour désactiver

---

## Limites Web Audio sur mobile

### Restriction user-gesture (iOS / Android)

> Les navigateurs mobiles bloquent le son jusqu'à un tap utilisateur.

Somnia gère cela : l'`AudioContext` s'initialise au **premier tap sur un slider ou un bouton**.

### iOS Safari spécifique

- L'audio peut se suspendre quand l'app passe en arrière-plan
- Solution native → convertir avec Capacitor (voir ci-dessous)
- En PWA pure : le son continue si l'écran reste actif

### Android Chrome

- Plus permissif qu'iOS pour le son en arrière-plan
- Certains appareils low-end peuvent avoir des latences sur la génération procédurale → utiliser des fichiers audio pré-générés

---

## Convertir en app native avec Capacitor

```bash
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init "Somnia" "com.somnia.app" --web-dir "."
npx cap add android
npx cap add ios
npx cap sync
npx cap open android  # Android Studio requis
npx cap open ios      # Xcode requis (macOS)
```

---

## Licence

MIT — libre d'utilisation, modification et distribution.

---

*Somnia — Dormez mieux.*

---

## Changements récents (avril 2026)

- Le **volume maître global** est retiré de l'expérience utilisateur.
- Le mix repose désormais uniquement sur les **volumes par son** (0 à 10).
- Une base de données de bibliothèque partagée est ajoutée : `assets/audio/library.json`.
- Tous les fichiers référencés dans cette bibliothèque, une fois commités, sont distribués à tous les utilisateurs.

