# Fonctionnalité de Sélection de Playlist

## Vue d'ensemble

Cette fonctionnalité permet aux utilisateurs d'ajouter des passes de danse à des listes personnalisées directement depuis les pages Accueil et Recherche. Elle remplace l'ancien bouton "Ajouter à ma liste" non fonctionnel par une interface de sélection complète.

## Architecture

### Composants créés

#### 1. PlaylistSelectionModal (`components/PlaylistSelectionModal.tsx`)
Modal de sélection de playlist avec les fonctionnalités suivantes :
- **Interface utilisateur intuitive** : Affichage des playlists avec couleurs et compteurs
- **Sélection interactive** : Indicateurs visuels de sélection
- **Validation** : Vérification avant confirmation d'ajout
- **Gestion des états vides** : Message informatif si aucune playlist n'existe
- **Design cohérent** : Style harmonisé avec l'application

#### 2. PlaylistContext (`contexts/PlaylistContext.tsx`)
Contexte React centralisé pour la gestion des playlists :
- **État global** : Gestion centralisée des playlists
- **Fonctions CRUD** : Création, suppression, modification des playlists
- **Gestion des passes** : Ajout/suppression de passes dans les playlists
- **Prévention des doublons** : Vérification automatique des doublons
- **Messages utilisateur** : Alertes de confirmation et d'erreur

### Modifications des pages existantes

#### 1. Page d'accueil (`app/(tabs)/index.tsx`)
- ✅ Import du `PlaylistSelectionModal` et `usePlaylist`
- ✅ Ajout des états pour la gestion du modal
- ✅ Handlers pour ouvrir/fermer le modal
- ✅ Intégration du modal dans le rendu

#### 2. Page de recherche (`app/(tabs)/search.tsx`)
- ✅ Ajout du bouton "Ajouter à ma liste" (précédemment absent)
- ✅ Intégration complète du système de playlist
- ✅ Interface cohérente avec la page d'accueil

#### 3. Page des favoris (`app/(tabs)/favorites.tsx`)
- ✅ Migration vers le nouveau contexte de playlist
- ✅ Amélioration de la gestion de suppression avec confirmation
- ✅ Suppression du code dupliqué

#### 4. Layout des tabs (`app/(tabs)/_layout.tsx`)
- ✅ Intégration du `PlaylistProvider` pour disponibilité globale

## Fonctionnalités

### 1. Sélection de Playlist
```typescript
// Ouverture du modal de sélection
const openPlaylistModal = (move: DanceMove) => {
  setSelectedMoveForPlaylist(move);
  setPlaylistModalVisible(true);
};

// Ajout à la playlist sélectionnée
const handleAddToPlaylist = (playlistId: string) => {
  if (selectedMoveForPlaylist) {
    addMoveToPlaylist(playlistId, selectedMoveForPlaylist);
  }
};
```

### 2. Gestion des Doublons
Le système vérifie automatiquement si une passe existe déjà dans la playlist :
```typescript
const moveExists = playlist.moves.some(m => m.id === move.id);
if (moveExists) {
  Alert.alert(
    'Déjà présent',
    `La passe "${move.movementName}" est déjà dans la liste "${playlist.name}".`
  );
  return false;
}
```

### 3. Messages de Confirmation
Chaque action génère un message informatif :
- ✅ **Ajout réussi** : "La passe [nom] a été ajoutée à la liste [nom]"
- ⚠️ **Doublon détecté** : "La passe [nom] est déjà dans la liste [nom]"
- ❌ **Erreur** : Messages d'erreur appropriés

### 4. Interface Responsive
- **Design adaptatif** : S'adapte à différentes tailles d'écran
- **Couleurs cohérentes** : Utilise la palette de couleurs de l'application
- **Animations fluides** : Transitions smooth pour une meilleure UX

## Utilisation

### Pour l'utilisateur
1. **Depuis la page d'accueil ou de recherche** :
   - Cliquer sur le bouton "Ajouter à ma liste" d'une passe
   - Sélectionner la playlist désirée dans le modal
   - Confirmer l'ajout
   - Recevoir une confirmation de succès

2. **Gestion des playlists** :
   - Créer de nouvelles playlists depuis la page Favoris
   - Supprimer des playlists existantes
   - Visualiser le nombre de passes par playlist

### Pour le développeur
```typescript
// Utilisation du contexte
const { playlists, addMoveToPlaylist, addPlaylist, deletePlaylist } = usePlaylist();

// Ajout d'une passe à une playlist
const success = addMoveToPlaylist(playlistId, danceMove);

// Création d'une nouvelle playlist
addPlaylist("Ma nouvelle liste", "#FF6B35");
```

## Structure des données

### Interface PlayList
```typescript
interface PlayList {
  id: string;           // Identifiant unique
  name: string;         // Nom de la playlist
  moves: DanceMove[];   // Passes de danse
  color: string;        // Couleur d'affichage (hex)
}
```

### Interface PlaylistContextType
```typescript
interface PlaylistContextType {
  playlists: PlayList[];
  addPlaylist: (name: string, color: string) => void;
  deletePlaylist: (playlistId: string) => void;
  addMoveToPlaylist: (playlistId: string, move: DanceMove) => boolean;
  removeMoveFromPlaylist: (playlistId: string, moveId: string) => void;
  isMoveInPlaylist: (playlistId: string, moveId: string) => boolean;
}
```

## Tests et Validation

Le script `scripts/test-playlist-functionality.js` valide :
- ✅ Création des nouveaux fichiers
- ✅ Modifications des fichiers existants
- ✅ Intégration des composants
- ✅ Fonctionnalités du modal
- ✅ Fonctionnalités du contexte

## Avantages

1. **Expérience utilisateur améliorée** :
   - Interface intuitive et cohérente
   - Feedback immédiat sur les actions
   - Prévention des erreurs utilisateur

2. **Architecture robuste** :
   - Gestion centralisée des états
   - Séparation des responsabilités
   - Code réutilisable et maintenable

3. **Fonctionnalités avancées** :
   - Gestion des doublons
   - Messages de confirmation
   - Interface responsive

4. **Cohérence** :
   - Disponible sur toutes les pages pertinentes
   - Design harmonisé avec l'application
   - Comportement prévisible

## Évolutions futures possibles

- **Réorganisation des passes** : Drag & drop dans les playlists
- **Partage de playlists** : Export/import de listes
- **Playlists intelligentes** : Création automatique basée sur des critères
- **Statistiques** : Analyse d'utilisation des playlists
- **Synchronisation cloud** : Sauvegarde des playlists en ligne

---

Cette fonctionnalité transforme l'expérience utilisateur en permettant une organisation personnalisée et intuitive des passes de danse, tout en maintenant une architecture technique solide et évolutive.