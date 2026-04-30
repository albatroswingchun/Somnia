# 🌙 Somnia — Ambiance Sonore ASMR & Réveil Progressif

> Une PWA mobile-first pour composer votre environnement sonore idéal au coucher et au réveil.

---

## ✨ Fonctionnalités

| Fonctionnalité | Détail |
|---|---|
| **12 sons ASMR** | Pluie, orage, vent, forêt, oiseaux, rivière, feu, bruit blanc, taps, bols tibétains, respiration, texture |
| **Mixage en temps réel** | Knob circulaire par son, volume indépendant |
| **Volume maître** | Slider global |
| **Ambiance aléatoire** | Lance 2–4 sons au hasard |
| **Presets sauvegardés** | localStorage, chargement en un tap |
| **Minuteur d'endormissement** | 15/30/45/60 min avec fade-out progressif |
| **Réveil progressif** | Heure programmable, montée douce du volume sur 3 min |
| **Mode nuit** | Interface ultra-sombre, animations ralenties |
| **Lumière ambiante** | Halo animé synchronisé avec le son actif |
| **PWA installable** | Fonctionne hors ligne après la première visite |

---

## 🚀 Installation et lancement

### Prérequis
- Un navigateur moderne (Chrome, Safari, Firefox)
- Optionnel : un serveur local pour le service worker

### Lancer en local

```bash
# Cloner le projet
git clone https://github.com/TON-USERNAME/somnia-asmr-alarm.git
cd somnia-asmr-alarm

# Option 1 : Python (intégré sur macOS/Linux)
python3 -m http.server 8080

# Option 2 : Node.js
npx serve .

# Option 3 : VS Code Live Server
# Installez l'extension "Live Server" et cliquez sur "Go Live"

# Ouvrir dans le navigateur
# → http://localhost:8080
```

> ⚠️ **Important** : Le Service Worker ne fonctionne qu'en HTTPS ou sur `localhost`. Pour un test complet hors-ligne, utilisez l'option GitHub Pages (voir ci-dessous) ou un outil comme [`mkcert`](https://github.com/FiloSottile/mkcert) pour HTTPS local.

---

## 🎵 Ajouter ou remplacer les sons

### Sons générés automatiquement (par défaut)
L'application génère tous les sons en temps réel via **Web Audio API** — aucun fichier audio requis.

### Utiliser vos propres sons (meilleure qualité)

Les sons doivent être placés dans `/assets/audio/` avec ces noms exacts :

```
assets/
└── audio/
    ├── rain.wav      (ou .mp3, .ogg)
    ├── thunder.wav
    ├── wind.wav
    ├── forest.wav
    ├── birds.wav
    ├── river.wav
    ├── fire.wav
    ├── white.wav
    ├── taps.wav
    ├── bowl.wav
    ├── breath.wav
    └── texture.wav
```

Dans `index.html`, modifiez la définition des sons (tableau `SOUNDS`) pour pointer vers les fichiers :

```js
{ id:'rain', name:'Pluie douce', icon:'🌧', color:'#7eb8f7', file:'assets/audio/rain.mp3' }
```

Et dans la classe `AudioMixer`, méthode `loadTrack`, activez le chargement depuis fichier :

```js
async loadTrack(sound) {
  if (this.tracks[sound.id]) return;
  const response = await fetch(sound.file);
  const arrayBuffer = await response.arrayBuffer();
  const buf = await this.ctx.decodeAudioData(arrayBuffer);
  // ... suite identique
}
```

### Générer les sons basiques (Python)

```bash
pip install numpy scipy
python generate_sounds.py
```

---

## 🎧 Sources de sons libres de droits

> **Vérifiez toujours les licences** avant utilisation, même pour un projet personnel.

| Source | URL | Licence typique |
|---|---|---|
| **Freesound** | https://freesound.org | CC0 / CC-BY |
| **Pixabay Sound Effects** | https://pixabay.com/sound-effects | Pixabay License (libre) |
| **Zapsplat** | https://www.zapsplat.com | Standard (attribution requise) |
| **BBC Sound Effects** | https://sound-effects.bbcrewind.co.uk | RemArc (usage perso/éduc) |
| **YouTube Audio Library** | https://studio.youtube.com | YouTube License |
| **Incompetech** | https://incompetech.com | CC-BY |

---

## 🌐 Déploiement sur GitHub Pages

```bash
# 1. Créer un dépôt GitHub
# 2. Pousser le code
git init
git add .
git commit -m "feat: initial Somnia release"
git remote add origin https://github.com/TON-USERNAME/somnia-asmr-alarm.git
git push -u origin main

# 3. Activer GitHub Pages
# Settings → Pages → Source : "Deploy from a branch" → main / root
# URL : https://TON-USERNAME.github.io/somnia-asmr-alarm/
```

---

## 📱 Convertir en application mobile avec Capacitor

```bash
# 1. Initialiser npm (si pas encore fait)
npm init -y

# 2. Installer Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios

# 3. Initialiser Capacitor
npx cap init "Somnia" "com.somnia.app" --web-dir "."

# 4. Ajouter les plateformes
npx cap add android
npx cap add ios

# 5. Synchroniser le code
npx cap sync

# 6. Ouvrir dans les IDEs natifs
npx cap open android   # Android Studio requis
npx cap open ios       # Xcode requis (macOS seulement)
```

> **Note Android** : Ajoutez dans `AndroidManifest.xml` :
> ```xml
> <uses-permission android:name="android.permission.WAKE_LOCK" />
> <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
> ```

---

## 🔊 Limites du Web Audio API sur mobile

### Restriction fondamentale : user gesture
> Les navigateurs mobiles **refusent de jouer du son** jusqu'à ce que l'utilisateur interagisse avec la page (tap, clic). C'est une sécurité anti-autoplay imposée par Apple et Google.

**Somnia gère cette contrainte** : l'`AudioContext` s'initialise au premier tap sur un son.

### Autres limites à connaître
- **iOS Safari** : le contexte audio peut se suspendre quand l'app passe en arrière-plan. Solution : `audioContext.resume()` à chaque retour au premier plan.
- **Android Chrome** : généralement plus permissif, mais certains appareils limitent la lecture en arrière-plan.
- **Batterie** : générer des sons en temps réel consomme du CPU. Utilisez des fichiers audio pré-générés pour réduire la consommation.
- **Multitâche** : sur iOS, la lecture audio s'arrête si l'onglet est inactif trop longtemps. Envisagez Capacitor pour contourner cette limite en app native.

---

## 🛠 Structure du projet

```
somnia-asmr-alarm/
├── index.html          ← Application principale (single-file)
├── manifest.json       ← PWA manifest
├── sw.js               ← Service Worker (cache offline)
├── generate_sounds.py  ← Générateur de sons Python
├── README.md           ← Ce fichier
└── assets/
    ├── audio/          ← Sons (optionnel, générés par Web Audio par défaut)
    └── icons/
        ├── icon-192.png
        └── icon-512.png
```

---

## 🎨 Personnalisation

### Changer les couleurs
Modifiez les variables CSS dans `:root` :
```css
--accent:  #7eb8f7;   /* bleu par défaut */
--accent2: #a78bfa;   /* violet */
--warm:    #f4b97e;   /* réveil chaud */
```

### Ajouter un son
1. Dans le tableau `SOUNDS` de `index.html`, ajoutez :
```js
{ id:'mySound', name:'Mon son', icon:'🎸', color:'#ff6b6b', generate:'white' }
```
2. Optionnellement, créez un générateur `'mySound'` dans `generateBuffer()`.

---

## 🚧 Améliorations possibles

- [ ] Transitions entre sons (crossfade)
- [ ] EQ par piste (grave/aigu)
- [ ] Oscilloscope/visualiseur temps réel
- [ ] Notifications natives (Capacitor) pour le réveil
- [ ] Synchronisation Bluetooth (deux appareils)
- [ ] Intégration avec Fitbit / Apple Health pour phases de sommeil
- [ ] Mode méditation (minuteur + respiration guidée)
- [ ] Export du mix (fichier audio)
- [ ] Thèmes visuels (Aurora, Désert, Océan...)

---

## 📄 Licence

MIT — libre d'utilisation, modification et distribution.

---

*Somnia — Dormez mieux. Réveillez-vous doucement.*
