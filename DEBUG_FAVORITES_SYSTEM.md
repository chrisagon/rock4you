# 🔍 Diagnostic du Système de Favoris - Rock4you

## Problème Identifié

**Symptôme** : Les passes sélectionnées via l'icône cœur sur les pages Accueil et Recherche ne s'enregistrent pas dans la page Favoris.

## Analyse Technique

### 1. Architecture Actuelle

```
Pages Accueil/Recherche → État Local (non persistant)
                       ↓
                    [RUPTURE]
                       ↓
Page Favoris ← API Backend (persistant)
```

### 2. Problèmes Détectés

#### A. Déconnexion UI/API
- **Fichier** : `app/(tabs)/index.tsx` ligne 15-19
- **Problème** : `toggleFavorite()` modifie seulement `moves` local
- **Impact** : Changements non sauvegardés en base

#### B. Absence d'Appels API
- **Fichier** : `app/(tabs)/search.tsx` ligne 62-66
- **Problème** : Même logique défaillante que l'accueil
- **Impact** : Favoris perdus au redémarrage

#### C. Gestion d'État Fragmentée
- **Fichier** : `app/(tabs)/favorites.tsx` ligne 40-41
- **Problème** : Deux systèmes de favoris parallèles
- **Impact** : Incohérence des données

### 3. Flux de Données Attendu vs Réel

#### Flux Attendu ✅
```
Clic Cœur → API Call → Base de Données → Synchronisation UI
```

#### Flux Réel ❌
```
Clic Cœur → État Local → [ARRÊT] (pas de persistance)
```

## Solution Proposée

### Phase 1 : Intégration API
1. Connecter `toggleFavorite()` à l'API
2. Ajouter gestion d'erreurs
3. Feedback utilisateur

### Phase 2 : Contexte Global
1. Créer `FavoritesContext`
2. Synchroniser tous les composants
3. Cache local optimisé

### Phase 3 : Tests
1. Vérifier persistance
2. Tester synchronisation
3. Valider UX

## Méthodologie de Débogage

### Étape 1 : Vérification API
```bash
node test-favorites-api.js
```

### Étape 2 : Logs Frontend
```javascript
console.log('🔄 Ajout favori:', moveId);
console.log('✅ Réponse API:', response);
```

### Étape 3 : Test Intégration
1. Cliquer cœur page Accueil
2. Vérifier appel API (Network tab)
3. Contrôler page Favoris
4. Redémarrer app → vérifier persistance

## Outils de Debug

### 1. Script de Test API
- **Fichier** : `test-favorites-api.js`
- **Usage** : Valide backend

### 2. Logs Console
- **Activation** : Mode développement
- **Filtres** : `🔄`, `✅`, `❌`

### 3. Network Monitor
- **Outil** : DevTools → Network
- **Endpoints** : `/api/favorites`

## Indicateurs de Succès

- [ ] Clic cœur → Appel API visible
- [ ] Favori apparaît immédiatement
- [ ] Persistance après redémarrage
- [ ] Synchronisation entre pages
- [ ] Gestion d'erreurs fonctionnelle

## Prochaines Étapes

1. **Corriger toggleFavorite()** dans Accueil/Recherche
2. **Créer FavoritesContext** pour synchronisation
3. **Ajouter feedback utilisateur** (loading, erreurs)
4. **Tester flux complet** end-to-end