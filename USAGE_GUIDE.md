# 📱 Guide d'Utilisation - Rock4you Authentication System

Ce guide explique comment utiliser le système d'authentification et de gestion des favoris de Rock4you.

## 🚀 Démarrage Rapide

### 1. Installation et Configuration

```bash
# Cloner le projet
git clone <votre-repo>
cd rock4you

# Installer les dépendances
npm install
cd worker && npm install && cd ..

# Configuration de l'environnement
cp .env.example .env.local
# Éditer .env.local avec vos paramètres
```

### 2. Déploiement Automatisé

```bash
# Déploiement complet avec tests
node scripts/deploy.js

# Déploiement en production
node scripts/deploy.js --env=production

# Déploiement rapide sans tests
node scripts/deploy.js --skip-tests -y
```

### 3. Tests Individuels

```bash
# Tests backend uniquement
cd worker && node scripts/test-api.js --local

# Tests frontend uniquement
node scripts/test-frontend.js

# Tests de l'API déployée
cd worker && node scripts/test-api.js --url=https://votre-api.workers.dev
```

## 🔐 Système d'Authentification

### Inscription d'un Nouvel Utilisateur

1. **Ouvrir l'application** : Lancez l'app avec `npm run dev`
2. **Accéder à l'inscription** : Cliquez sur "S'inscrire" depuis l'écran de connexion
3. **Remplir le formulaire** :
   - Nom : Votre nom de famille
   - Prénom : Votre prénom
   - Email : Adresse email valide (sera votre identifiant)
   - Mot de passe : Minimum 8 caractères avec majuscule, minuscule et chiffre

4. **Validation** : Le système vérifie automatiquement :
   - ✅ Format de l'email
   - ✅ Force du mot de passe
   - ✅ Unicité de l'email

### Connexion

1. **Écran de connexion** : Page d'accueil de l'application
2. **Saisir les identifiants** :
   - Email : Votre adresse email d'inscription
   - Mot de passe : Votre mot de passe

3. **Connexion automatique** : Une fois connecté, vous restez connecté jusqu'à déconnexion explicite

### Déconnexion

- **Depuis l'onglet Profil** : Bouton "Se déconnecter"
- **Depuis l'onglet Favoris** : Bouton "Déconnexion" en haut

## ⭐ Gestion des Favoris

### Ajouter un Favori

1. **Aller dans l'onglet Favoris**
2. **Cliquer sur "Ajouter un favori"**
3. **Remplir les informations** :
   - Titre : Nom de la chanson
   - Artiste : Nom de l'artiste
   - URL : Lien vers la chanson (optionnel)

4. **Sauvegarder** : Le favori apparaît immédiatement dans votre liste

### Voir ses Favoris

- **Liste complète** : Onglet "Favoris" affiche tous vos favoris
- **Informations affichées** : Titre, artiste, et lien si disponible
- **Tri automatique** : Les favoris sont triés par date d'ajout (plus récents en premier)

### Supprimer un Favori

1. **Dans la liste des favoris**
2. **Cliquer sur l'icône de suppression** (🗑️) à côté du favori
3. **Confirmation** : Le favori est supprimé immédiatement

## 👤 Gestion du Profil

### Voir ses Informations

- **Onglet Profil** : Affiche vos informations personnelles
  - Nom complet
  - Adresse email
  - Date d'inscription
  - Nombre de favoris

### Modifier ses Informations

*Fonctionnalité à venir dans une prochaine version*

## 🔧 Fonctionnalités Techniques

### Sécurité

- **Mots de passe chiffrés** : Utilisation de PBKDF2 avec salt
- **Tokens JWT sécurisés** : Stockés dans des cookies HttpOnly
- **Sessions persistantes** : Connexion maintenue entre les sessions
- **Protection CORS** : API protégée contre les requêtes non autorisées

### Synchronisation

- **Temps réel** : Les favoris sont synchronisés immédiatement
- **Gestion d'erreurs** : Messages d'erreur clairs en cas de problème
- **Mode hors ligne** : L'app fonctionne même sans connexion (lecture seule)

### Performance

- **Cache intelligent** : Les données utilisateur sont mises en cache
- **Chargement optimisé** : Interface réactive avec indicateurs de chargement
- **Base de données rapide** : Cloudflare D1 pour des performances optimales

## 🐛 Résolution de Problèmes

### Problèmes de Connexion

**Erreur "Email ou mot de passe incorrect"**
- ✅ Vérifiez l'orthographe de votre email
- ✅ Vérifiez votre mot de passe (sensible à la casse)
- ✅ Assurez-vous d'avoir créé un compte

**Erreur "Impossible de se connecter au serveur"**
- ✅ Vérifiez votre connexion internet
- ✅ Vérifiez que l'API backend est déployée
- ✅ Consultez les logs avec `wrangler tail`

### Problèmes de Favoris

**Les favoris ne s'affichent pas**
- ✅ Vérifiez que vous êtes bien connecté
- ✅ Actualisez l'application
- ✅ Vérifiez les logs de l'API

**Impossible d'ajouter un favori**
- ✅ Vérifiez que tous les champs requis sont remplis
- ✅ Vérifiez votre connexion internet
- ✅ Réessayez après quelques secondes

### Problèmes Techniques

**L'application ne démarre pas**
```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install

# Vérifier la configuration
node scripts/test-frontend.js
```

**Erreurs de build**
```bash
# Vérifier TypeScript
npx tsc --noEmit

# Nettoyer le cache
expo r -c
```

## 📞 Support et Développement

### Logs et Debugging

```bash
# Logs du Worker en temps réel
cd worker && wrangler tail

# Logs détaillés avec format
cd worker && wrangler tail --format pretty

# Vérifier la base de données
cd worker && wrangler d1 execute rock4you-db --command "SELECT COUNT(*) FROM Utilisateurs"
```

### Tests de Développement

```bash
# Environnement de développement complet
cd worker && npm run dev &
npm run dev

# Tests automatisés
node scripts/deploy.js --skip-tests
```

### Commandes Utiles

```bash
# Réinitialiser la base de données locale
cd worker && node scripts/migrate.js --local --reset

# Voir les utilisateurs inscrits
cd worker && wrangler d1 execute rock4you-db --command "SELECT email, prenom, nom FROM Utilisateurs"

# Voir les favoris d'un utilisateur
cd worker && wrangler d1 execute rock4you-db --command "SELECT * FROM PassesSauvegardes WHERE utilisateur_id = 1"
```

## 🎯 Bonnes Pratiques

### Pour les Utilisateurs

- ✅ Utilisez un mot de passe fort et unique
- ✅ Déconnectez-vous sur les appareils partagés
- ✅ Sauvegardez régulièrement vos favoris importants

### Pour les Développeurs

- ✅ Testez toujours en local avant le déploiement
- ✅ Utilisez les scripts automatisés pour le déploiement
- ✅ Surveillez les logs en production
- ✅ Sauvegardez la base de données régulièrement

## 🔄 Mises à Jour

### Déployer une Nouvelle Version

```bash
# Mise à jour complète avec tests
node scripts/deploy.js --env=production

# Vérification post-déploiement
cd worker && node scripts/test-api.js --url=https://votre-api.workers.dev
```

### Migrations de Base de Données

```bash
# Ajouter une nouvelle migration
# 1. Créer un fichier dans worker/migrations/
# 2. Exécuter la migration
cd worker && node scripts/migrate.js
```

---

**Version du guide** : 1.0  
**Dernière mise à jour** : Janvier 2025  
**Compatibilité** : Rock4you v1.0+