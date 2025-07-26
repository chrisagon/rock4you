# Rock4you.mobile

Application mobile d'apprentissage des passes de danse rock pour adultes.

## 📱 Fonctionnalités

- **Bibliothèque de passes** : Accès à toutes les passes de danse rock avec GIFs animés
- **Recherche avancée** : Filtrage par niveau, catégorie et recherche textuelle
- **Gestion de compte** : Inscription, connexion et profil utilisateur
- **Listes personnalisées** : Création de listes de passes favorites et à réviser
- **Interface mobile-first** : Optimisée pour Android et iPhone

## 🎨 Design

- **Palette de couleurs** : Noir (#000), Orange (#FF6B35), Blanc (#FFF)
- **Interface moderne** : Cards élégantes, animations fluides
- **Navigation intuitive** : Onglets avec icônes Lucide

## 📊 Sources de données

### Fichier de données principal
Le fichier Google Sheets contient toutes les informations des passes :
**URL :** `https://docs.google.com/spreadsheets/d/1gJ9qirGXrNsB0afyVkD80_l9obiNKFzJbXtHyk22sWo/edit?usp=sharing`

**Statut actuel :** ✅ Intégré avec les données réelles
**Nombre de passes :** Toutes les passes du fichier sont maintenant disponibles dans l'application

### 🔄 Comment mettre à jour les données

✅ **TERMINÉ** - Les données ont été mises à jour avec le contenu réel du fichier Google Sheets

Pour les futures mises à jour :
1. **Utilisez le script d'extraction** dans `scripts/simpleExtractor.js`
2. **Suivez les instructions** dans `INSTRUCTIONS_INTEGRATION.md`
3. **Remplacez le contenu** de `data/danceMoves.ts`

### ✅ GIFs configurés
Les GIFs sont maintenant configurés avec :
- **Permissions publiques** activées sur Google Drive
- **URLs directes** générées automatiquement
- **Gestion des fallbacks** pour les passes sans GIF

### Structure du fichier (colonnes A-R)
- **A** : Cours - nom du cours
- **B** : Ordre cours - numéro de séquence
- **C** : Nom du mouvement - titre de la passe (utilisé comme titre du GIF)
- **D** : GIF - "X" ou "XX" si GIF présent
- **E** : Difficulté - niveau numérique (1-5)
- **F** : Famille - famille de mouvement
- **G-J** : Type 1-4 - différents types de passe
- **K** : Position départ - position des mains au début
- **L** : Position arrivée - position des mains à la fin
- **M** : Nombre de temps - durée de la passe
- **N** : Déplacement - type de déplacement
- **O** : Remarques - commentaires du professeur
- **P** : Timmy - COLONNE IGNORÉE
- **Q** : Fichier GIF - nom du fichier GIF
- **R** : Lien Google Drive - lien direct vers le GIF

## 🏗️ Architecture technique

### Technologies utilisées
- **React Native** avec Expo
- **TypeScript** pour la sécurité des types
- **Expo Router** pour la navigation
- **Lucide React Native** pour les icônes

### Structure du projet
```
app/
├── (tabs)/
│   ├── index.tsx      # Écran d'accueil
│   ├── search.tsx     # Recherche et filtres
│   ├── favorites.tsx  # Favoris et listes
│   └── profile.tsx    # Profil utilisateur
├── _layout.tsx        # Layout racine
└── +not-found.tsx     # Page 404

data/
└── danceMoves.ts      # Données des passes

components/
└── documentation/
    └── AppDocumentation.tsx
```

## 🚀 Installation et démarrage

```bash
# Installation des dépendances
npm install

# Démarrage du serveur de développement
npm run dev
```

## 📱 Écrans principaux

### 1. Accueil
- Affichage de toutes les passes disponibles
- Recherche rapide
- Ajout aux favoris
- Visualisation des GIFs

### 2. Recherche
- Filtres par niveau (Débutant, Intermédiaire, Avancé)
- Filtres par catégorie (Bases, Tours, Déplacements, Figures)
- Recherche textuelle
- Résultats en temps réel

### 3. Favoris
- Gestion des passes favorites
- Création de listes personnalisées
- Organisation par couleurs
- Suppression de listes

### 4. Profil
- Authentification utilisateur
- Statistiques d'utilisation
- Paramètres de l'application
- Gestion du compte

## 🎯 Passes de danse intégrées

L'application traite automatiquement les données du fichier Google Sheets :
- **Filtrage intelligent** : Ignore les lignes de cours et ne garde que les passes
- **Niveaux de difficulté** : Conversion automatique des niveaux numériques en texte
- **Gestion des GIFs** : Affichage conditionnel selon la présence de GIF
- **Liens directs** : Extraction automatique des IDs Google Drive
- **Recherche avancée** : Par nom, cours, famille, remarques, types
- **Filtres multiples** : Niveau, famille, cours, difficulté

## 🔮 Évolutions futures

- [ ] Synchronisation automatique avec Google Sheets
- [ ] Import automatique des nouvelles passes
- [ ] Filtrage avancé par types de passes (Type 1-4)
- [ ] Recherche par position de départ/arrivée
- [ ] Système de notation et commentaires
- [ ] Mode hors ligne
- [ ] Partage de listes entre utilisateurs
- [ ] Notifications de rappel
- [ ] Lecteur vidéo intégré pour les GIFs
- [ ] Statistiques de progression par cours
- [ ] Système de badges et récompenses
- [ ] Export de listes personnalisées
- [ ] Historique des passes pratiquées

## 📄 Documentation

La documentation complète est disponible dans l'application via l'onglet Profil ou dans le fichier `components/documentation/AppDocumentation.tsx`.