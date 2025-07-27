# Rock4you

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

### Stockage des GIFs
Les GIFs sont maintenant hébergés sur **Cloudflare R2** pour des performances optimales :
- **URLs directes** : Accès rapide aux GIFs via CDN Cloudflare
- **Gestion des fallbacks** : Affichage de placeholder pour les passes sans GIF
- **Configuration flexible** : Support des domaines personnalisés

### 🔄 Comment mettre à jour les données

✅ **TERMINÉ** - Les données ont été migrées vers Cloudflare R2

Pour les futures mises à jour :
1. **Utilisez le script d'extraction** dans [`scripts/extractGoogleData.js`](scripts/extractGoogleData.js)
2. **Suivez les instructions** dans [`INSTRUCTIONS_INTEGRATION.md`](INSTRUCTIONS_INTEGRATION.md)
3. **Remplacez le contenu** de [`data/danceMoves.ts`](data/danceMoves.ts)
4. **Configurez Cloudflare R2** via [`config/cloudflare.ts`](config/cloudflare.ts)

### ✅ Architecture de données

Les données sont structurées avec :
- **Interface TypeScript** : Type safety pour toutes les passes
- **URLs Cloudflare R2** : Liens directs vers les GIFs hébergés
- **Métadonnées complètes** : Difficulté, famille, positions, remarques
- **Système de catégories** : Classification automatique des passes

### Structure des données (colonnes sources)
- **A** : Cours - nom du cours
- **B** : Ordre cours - numéro de séquence
- **C** : Nom du mouvement - titre de la passe
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
- **R** : Lien source - lien original (maintenant migré vers Cloudflare)

## 🏗️ Architecture technique

### Technologies utilisées
- **React Native** avec Expo SDK 53
- **TypeScript** pour la sécurité des types
- **Expo Router** pour la navigation
- **Lucide React Native** pour les icônes
- **Cloudflare R2** pour le stockage des GIFs
- **React Native WebView** pour l'affichage des GIFs
- **Expo Blur** pour les effets visuels

### Structure du projet
```
app/
├── (tabs)/
│   ├── index.tsx      # Écran d'accueil - liste des passes
│   ├── search.tsx     # Recherche et filtres avancés
│   ├── favorites.tsx  # Favoris et listes personnalisées
│   └── profile.tsx    # Profil utilisateur et paramètres
├── _layout.tsx        # Layout racine avec navigation
└── +not-found.tsx     # Page 404

components/
├── Wrapper.tsx        # Composant wrapper principal
└── documentation/
    └── AppDocumentation.tsx  # Documentation intégrée

config/
└── cloudflare.ts      # Configuration Cloudflare R2

data/
├── danceMoves.ts      # Données des passes (128+ passes)
└── sampleDanceMoves.ts # Exemples pour développement

hooks/
└── useFrameworkReady.ts # Hook pour l'initialisation

scripts/
├── extractGoogleData.js    # Script d'extraction des données
├── simpleExtractor.js      # Extracteur simplifié
└── howToUseScript.md      # Instructions d'utilisation

types/
└── env.d.ts          # Types pour les variables d'environnement

utils/
└── googleSheetsImporter.ts # Utilitaires d'import de données
```

## 🚀 Installation et démarrage

```bash
# Installation des dépendances
npm install

# Démarrage du serveur de développement
npm run dev

# Alternative avec Expo CLI
npx expo start
```

### Variables d'environnement (optionnel)
Pour configurer Cloudflare R2 avec un domaine personnalisé :
```env
EXPO_PUBLIC_CLOUDFLARE_R2_BUCKET_NAME=your-bucket-name
EXPO_PUBLIC_CLOUDFLARE_R2_ACCOUNT_ID=your-account-id
EXPO_PUBLIC_CLOUDFLARE_R2_CUSTOM_DOMAIN=your-custom-domain.com
```

## 📱 Écrans principaux

### 1. Accueil
- Affichage de toutes les passes disponibles (128+ passes)
- Recherche rapide par nom
- Ajout aux favoris en un clic
- Visualisation des GIFs haute qualité

### 2. Recherche
- Filtres par niveau (Débutant, Intermédiaire, Avancé)
- Filtres par catégorie (Base, Tours, Déplacements, Figures, etc.)
- Recherche textuelle dans noms, cours, familles et remarques
- Résultats en temps réel avec highlighting

### 3. Favoris
- Gestion des passes favorites
- Création de listes personnalisées par thème
- Organisation par couleurs et catégories
- Export et partage de listes

### 4. Profil
- Authentification utilisateur
- Statistiques d'utilisation et progression
- Paramètres de l'application
- Documentation intégrée

## 🎯 Passes de danse intégrées

L'application contient **128+ passes** organisées en **24 cours** :
- **Filtrage intelligent** : Ignore automatiquement les lignes de cours
- **Niveaux de difficulté** : Conversion automatique (1-2: Débutant, 3-4: Intermédiaire, 5: Avancé)
- **Gestion des GIFs** : Affichage conditionnel avec fallbacks élégants
- **URLs optimisées** : Cloudflare R2 pour des temps de chargement rapides
- **Recherche avancée** : Par nom, cours, famille, remarques, types
- **Filtres multiples** : Niveau, famille, cours, difficulté, position

### Catégories disponibles
- Base, Balade, Barrage, 3 tapes
- Spaghetti, Enroulés, Changements de mains
- Jeux de regards, Penchés, Tombés, Bossus
- Espagnoles, Satellites, Fenêtre, Catapultes
- Amené à l'épaule, Coups de fouet
- Variantes des bases, Tapes, Diverses passes
- Portés, Acrobatiques

## 🔮 Évolutions futures

- [x] Import automatique des nouvelles passes
- [x] Filtrage avancé par types de passes (Type 1-4)
- [x] Migration vers Cloudflare R2 pour les performances
- [ ] Synchronisation automatique avec sources de données
- [ ] Recherche par position de départ/arrivée
- [ ] Système de notation et commentaires utilisateurs
- [ ] Mode hors ligne avec cache intelligent
- [ ] Partage de listes entre utilisateurs
- [ ] Notifications de rappel d'entraînement
- [ ] Lecteur vidéo intégré avec contrôles avancés
- [ ] Statistiques de progression par cours
- [ ] Système de badges et récompenses
- [ ] Export de listes personnalisées (PDF, JSON)
- [ ] Historique des passes pratiquées
- [ ] Mode entraîneur avec séquences personnalisées

## 🛠️ Développement

### Scripts disponibles
- `npm run dev` : Démarrage en mode développement
- `npm run build:web` : Build pour le web
- `npm run lint` : Vérification du code

### Configuration Cloudflare R2
Voir [`config/cloudflare.ts`](config/cloudflare.ts) pour :
- Configuration des URLs de base
- Gestion des domaines personnalisés
- Fonctions utilitaires pour les GIFs
- Tests de connectivité

### Mise à jour des données
Utilisez [`utils/googleSheetsImporter.ts`](utils/googleSheetsImporter.ts) pour :
- Convertir les données sources
- Valider la structure
- Générer les URLs Cloudflare
- Tester l'accessibilité des GIFs

## 📄 Documentation

La documentation complète est disponible :
- **Dans l'application** : Onglet Profil > Documentation
- **Fichier source** : [`components/documentation/AppDocumentation.tsx`](components/documentation/AppDocumentation.tsx)
- **Instructions d'intégration** : [`INSTRUCTIONS_INTEGRATION.md`](INSTRUCTIONS_INTEGRATION.md)

## 🤝 Contribution

Pour contribuer au projet :
1. Fork le repository
2. Créez une branche pour votre fonctionnalité
3. Testez vos modifications
4. Soumettez une Pull Request

## 📝 Licence

Ce projet est destiné à l'apprentissage de la danse rock. Tous droits réservés pour les contenus pédagogiques.