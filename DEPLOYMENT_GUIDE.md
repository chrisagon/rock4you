# 🚀 Guide de Déploiement - Rock4you Authentication System

Ce guide vous accompagne dans le déploiement complet du système d'authentification et de gestion des favoris.

## 📋 Prérequis

### 1. Outils nécessaires
```bash
# Installer Wrangler CLI (si pas déjà fait)
npm install -g wrangler

# Vérifier l'installation
wrangler --version
```

### 2. Authentification Cloudflare
```bash
# Se connecter à Cloudflare
wrangler auth login
```

### 3. Configuration du projet
Assurez-vous que votre [`worker/wrangler.toml`](worker/wrangler.toml) contient les bonnes informations :
- `database_id` pour votre base D1
- `JWT_SECRET` sécurisé pour la production

## 🗄️ Étape 1 : Déploiement de la Base de Données

### Migration en local (pour les tests)
```bash
cd worker
node scripts/migrate.js --local
```

### Migration en production
```bash
cd worker
node scripts/migrate.js
```

## ⚙️ Étape 2 : Déploiement du Worker

### Test en local
```bash
cd worker
npm run dev
# Le worker sera disponible sur http://localhost:8787
```

### Déploiement en production
```bash
cd worker
npm run deploy
# ou
wrangler deploy
```

Après le déploiement, notez l'URL de votre worker (ex: `https://rock4you-api.your-subdomain.workers.dev`)

## 📱 Étape 3 : Configuration du Frontend

### 1. Configurer l'URL de l'API
Créez un fichier `.env.local` à la racine du projet :

```env
EXPO_PUBLIC_API_URL=https://rock4you-api.your-subdomain.workers.dev
```

### 2. Pour le développement local
```env
EXPO_PUBLIC_API_URL=http://localhost:8787
```

### 3. Démarrer l'application
```bash
npm run dev
# ou
expo start
```

## 🧪 Étape 4 : Tests

### Tests Backend
```bash
cd worker
npm test
# ou utilisez les scripts de test que nous allons créer
```

### Tests Frontend
```bash
# Tester l'application Expo
npm run dev
```

## 🔧 Configuration de Production

### Variables d'environnement importantes

Dans [`worker/wrangler.toml`](worker/wrangler.toml) :

```toml
[env.production]
name = "rock4you-api"

[env.production.vars]
JWT_SECRET = "VOTRE_SECRET_JWT_SECURISE_POUR_PRODUCTION"
CORS_ORIGIN = "https://votre-domaine-frontend.com"
DEFAULT_FAVORITES_LIST_NAME = "Mes Favoris"
```

### Sécurité
- ✅ Changez le `JWT_SECRET` par une valeur sécurisée
- ✅ Configurez `CORS_ORIGIN` avec votre domaine de production
- ✅ Utilisez HTTPS en production

## 📊 Monitoring et Logs

### Voir les logs du Worker
```bash
wrangler tail
```

### Monitoring de la base de données
```bash
wrangler d1 info rock4you-db
```

## 🐛 Dépannage

### Problèmes courants

1. **Erreur de migration** : Vérifiez que vous êtes dans le dossier `worker/`
2. **Erreur CORS** : Vérifiez la configuration `CORS_ORIGIN`
3. **Token invalide** : Vérifiez que `JWT_SECRET` est identique entre les environnements

### Commandes utiles
```bash
# Voir les bases de données
wrangler d1 list

# Exécuter une requête SQL
wrangler d1 execute rock4you-db --command "SELECT * FROM Utilisateurs LIMIT 5"

# Voir les logs en temps réel
wrangler tail --format pretty
```

## ✅ Checklist de Déploiement

- [ ] Base de données D1 créée et migrée
- [ ] Worker déployé avec succès
- [ ] Variables d'environnement configurées
- [ ] Frontend configuré avec la bonne URL d'API
- [ ] Tests d'inscription/connexion fonctionnels
- [ ] Tests de gestion des favoris fonctionnels
- [ ] CORS configuré correctement
- [ ] Monitoring en place

## 🎯 URLs importantes

- **API de production** : `https://rock4you-api.your-subdomain.workers.dev`
- **Dashboard Cloudflare** : https://dash.cloudflare.com
- **Documentation D1** : https://developers.cloudflare.com/d1/

## 📞 Support

En cas de problème :
1. Vérifiez les logs avec `wrangler tail`
2. Consultez la documentation Cloudflare
3. Vérifiez la configuration dans `wrangler.toml`