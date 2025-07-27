# 🎵 Rock4you - Système d'Authentification et Favoris

Un système complet d'authentification et de gestion des favoris musicaux, construit avec React Native/Expo et Cloudflare Workers.

## 🚀 Aperçu

Rock4you est une application mobile qui permet aux utilisateurs de :
- ✅ S'inscrire et se connecter de manière sécurisée
- ✅ Gérer leurs morceaux favoris
- ✅ Synchroniser leurs données en temps réel
- ✅ Profiter d'une interface moderne et intuitive

## 🏗️ Architecture

### Frontend
- **Framework** : React Native avec Expo Router
- **Navigation** : Expo Router avec onglets protégés
- **État global** : React Context API
- **Styling** : React Native StyleSheet
- **TypeScript** : Support complet

### Backend
- **Runtime** : Cloudflare Workers
- **Framework** : Hono.js
- **Base de données** : Cloudflare D1 (SQLite)
- **Authentification** : JWT avec cookies HttpOnly
- **Sécurité** : PBKDF2 pour les mots de passe, CORS configuré

## 📦 Installation

### Prérequis
- Node.js 18+
- npm ou yarn
- Compte Cloudflare
- Wrangler CLI

### Installation rapide
```bash
# Cloner le projet
git clone <votre-repo>
cd rock4you

# Installer les dépendances
npm install
cd worker && npm install && cd ..

# Configuration
cp .env.example .env.local
# Éditer .env.local avec vos paramètres

# Déploiement automatisé
npm run deploy
```

## 🛠️ Scripts Disponibles

### Développement
```bash
npm run dev                 # Démarrer l'app Expo
npm run migrate:local       # Migrer la DB locale
npm run test               # Tests frontend
npm run test:backend       # Tests backend local
```

### Déploiement
```bash
npm run deploy             # Déploiement staging complet
npm run deploy:prod        # Déploiement production
npm run deploy:quick       # Déploiement rapide sans tests
```

### Base de données
```bash
npm run migrate            # Migration production
npm run migrate:local      # Migration locale
npm run migrate:reset      # Reset DB locale
```

## 🔧 Configuration

### Variables d'environnement

Créez un fichier `.env.local` :
```env
EXPO_PUBLIC_API_URL=https://votre-api.workers.dev
```

### Configuration Cloudflare

Dans [`worker/wrangler.toml`](worker/wrangler.toml) :
```toml
[vars]
JWT_SECRET = "votre-secret-jwt-securise"
CORS_ORIGIN = "https://votre-domaine.com"
DEFAULT_FAVORITES_LIST_NAME = "Mes Favoris"
```

## 🧪 Tests

### Tests automatisés
```bash
# Tests complets
npm run deploy

# Tests individuels
npm run test                    # Frontend
npm run test:backend           # Backend local
npm run test:api              # API déployée
```

### Tests manuels
1. **Inscription** : Créer un nouveau compte
2. **Connexion** : Se connecter avec les identifiants
3. **Favoris** : Ajouter, voir, supprimer des favoris
4. **Profil** : Voir les informations utilisateur
5. **Déconnexion** : Se déconnecter proprement

## 📱 Utilisation

### Interface utilisateur

1. **Écran de connexion** : Point d'entrée de l'application
2. **Onglet Favoris** : Gestion des morceaux favoris
3. **Onglet Profil** : Informations utilisateur et déconnexion

### Fonctionnalités

- **Authentification sécurisée** avec JWT
- **Gestion des favoris** en temps réel
- **Interface responsive** et moderne
- **Synchronisation automatique** des données
- **Mode hors ligne** pour la consultation

## 🔐 Sécurité

### Authentification
- Mots de passe chiffrés avec PBKDF2 + salt
- Tokens JWT signés avec HMAC-SHA256
- Cookies HttpOnly et Secure
- Protection CORS configurée

### Base de données
- Requêtes préparées (protection SQL injection)
- Validation des entrées avec Zod
- Gestion des erreurs sécurisée

## 📊 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/logout` - Déconnexion

### Favoris
- `GET /api/favorites` - Liste des favoris
- `POST /api/favorites` - Ajouter un favori
- `DELETE /api/favorites/:id` - Supprimer un favori

### Utilitaires
- `GET /health` - Vérification de l'état de l'API

## 🗄️ Base de Données

### Tables principales
- **Utilisateurs** : Informations des utilisateurs
- **ListesFavorites** : Listes de favoris par utilisateur
- **PassesSauvegardes** : Morceaux sauvegardés

### Migrations
Les migrations sont dans [`worker/migrations/`](worker/migrations/) et s'exécutent automatiquement.

## 🚀 Déploiement

### Déploiement automatisé
```bash
# Staging avec tests complets
npm run deploy

# Production
npm run deploy:prod

# Rapide sans tests
npm run deploy:quick
```

### Déploiement manuel
```bash
# 1. Migrer la base de données
npm run migrate

# 2. Déployer le Worker
cd worker && wrangler deploy

# 3. Configurer le frontend
echo "EXPO_PUBLIC_API_URL=https://votre-api.workers.dev" > .env.local

# 4. Tester
npm run test:api
```

## 📚 Documentation

- **[Guide de Déploiement](DEPLOYMENT_GUIDE.md)** : Instructions détaillées de déploiement
- **[Guide d'Utilisation](USAGE_GUIDE.md)** : Manuel utilisateur complet
- **[Documentation API](worker/README.md)** : Référence de l'API backend

## 🐛 Dépannage

### Problèmes courants

**Erreur de connexion à l'API**
```bash
# Vérifier l'état du Worker
cd worker && wrangler tail

# Tester l'API
npm run test:backend
```

**Problèmes de build**
```bash
# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install

# Vérifier TypeScript
npx tsc --noEmit
```

**Base de données corrompue**
```bash
# Reset en local
npm run migrate:reset

# Vérifier les données
cd worker && wrangler d1 execute rock4you-db --command "SELECT COUNT(*) FROM Utilisateurs"
```

## 🤝 Contribution

### Développement local
```bash
# Setup complet
git clone <repo>
cd rock4you
npm install
cd worker && npm install && cd ..

# Environnement de dev
npm run migrate:local
cd worker && npm run dev &
npm run dev
```

### Tests avant commit
```bash
npm run test
npm run test:backend
npm run lint
```

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🔗 Liens Utiles

- **[Cloudflare Workers](https://workers.cloudflare.com/)** - Documentation officielle
- **[Expo](https://expo.dev/)** - Framework React Native
- **[Hono.js](https://hono.dev/)** - Framework web pour Workers
- **[Cloudflare D1](https://developers.cloudflare.com/d1/)** - Base de données SQLite

---

**Version** : 1.0.0  
**Auteur** : Équipe Rock4you  
**Support** : [Issues GitHub](https://github.com/votre-repo/issues)