# Bibliothèque audio Somnia

Déposez ici vos fichiers audio partagés avec tous les utilisateurs.

## Process
1. Gardez les IDs existants (`rain`, `wind`, etc.) ou ajoutez-en de nouveaux.
2. Placez les fichiers dans `assets/audio/`.
3. Mettez à jour `assets/audio/library.json`.
4. Committez les fichiers audio + JSON pour qu'ils soient déployés à tous.

L'application lit automatiquement `library.json` au démarrage et remplace les chemins `file` des sons existants.
Si un fichier est manquant, Somnia utilise le fallback générateur.
