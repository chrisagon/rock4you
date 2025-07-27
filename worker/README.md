# Rock4you API - Backend Cloudflare Workers

API backend pour l'application Rock4you.mobile, construite avec Cloudflare Workers, Hono et D1.

## 🚀 Fonctionnalités

- **Authentification JWT** : Inscription, connexion et gestion des sessions
- **Gestion des listes** : Création, modification et partage de listes de passes favorites
- **Système de rôles** : Administrateur, Professeur, Utilisateur
- **Partage sécurisé** : Partage de listes avec tokens uniques
- **API RESTful** : Endpoints complets pour toutes les opérations
- **Base de données D1** : Stockage persistant avec Cloudflare D1

## 📋 Prérequis

- Node.js 18+
- npm ou yarn
- Compte Cloudflare avec Workers et D1 activés
- Wrangler CLI installé et configuré

```bash
npm install -g wrangler
wrangler login
```

## 🛠️ Installation

1. **Cloner et installer les dépendances**
```bash
cd worker
npm install
```

2. **Configurer wrangler.toml**
```bash
# Créer une base de données D1
wrangler d1 create rock4you-db

# Copier l'ID de base de données dans wrangler.toml
# Remplacer "your-database-id-here" par l'ID réel
```

3. **Configurer les variables d'environnement**
```bash
# Générer un secret JWT
openssl rand -base64 32

# Ajouter le secret dans wrangler.toml ou via le dashboard
wrangler secret put JWT_SECRET
```

## 🗄️ Base de données

### Migrations

Les migrations sont dans le dossier `migrations/` et doivent être appliquées dans l'ordre :

```bash
# Migration locale (développement)
node scripts/migrate.js --local

# Migration production
node scripts/migrate.js

# Réinitialiser la base locale (ATTENTION: perte de données)
node scripts/migrate.js --local --reset

# Aide
node scripts/migrate.js --help
```

### Schéma de base de données

- **Utilisateurs** : Gestion des comptes utilisateur avec rôles
- **ListesFavorites** : Listes de passes personnalisées
- **ListeMembres** : Partage de listes entre utilisateurs
- **PassesSauvegardes** : Passes stockées dans les listes
- **Tables avancées** : Sessions, logs, statistiques (optionnel)

## 🚀 Développement

### Démarrage local
```bash
npm run dev
```

L'API sera disponible sur `http://localhost:8787`

### Tests
```bash
npm test
```

### Déploiement
```bash
npm run deploy
```

## 📚 API Endpoints

### Authentification
- `POST /auth/register` - Inscription
- `POST /auth/login` - Connexion
- `POST /auth/refresh` - Rafraîchir le token

### Utilisateurs (protégé)
- `GET /api/users/profile` - Profil utilisateur
- `PUT /api/users/profile` - Modifier le profil

### Listes (protégé)
- `GET /api/lists` - Lister les listes
- `POST /api/lists` - Créer une liste
- `GET /api/lists/:id` - Détails d'une liste
- `PUT /api/lists/:id` - Modifier une liste
- `DELETE /api/lists/:id` - Supprimer une liste
- `POST /api/lists/:id/moves` - Ajouter une passe
- `DELETE /api/lists/:id/moves/:moveId` - Retirer une passe
- `POST /api/lists/:id/share` - Partager une liste
- `GET /api/lists/shared/:token` - Accéder à une liste partagée

### Santé
- `GET /health` - État de l'API

## 🔐 Authentification

L'API utilise JWT avec deux types de tokens :
- **Access Token** : Valide 1 heure, pour les requêtes API
- **Refresh Token** : Valide 7 jours, pour renouveler l'access token

### Headers requis
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

## 🛡️ Sécurité

- **Hachage bcrypt** : Mots de passe sécurisés (12 rounds)
- **JWT sécurisé** : Tokens signés avec secret fort
- **Validation stricte** : Validation Zod sur tous les inputs
- **CORS configuré** : Protection contre les requêtes non autorisées
- **SQL préparé** : Protection contre l'injection SQL
- **Rate limiting** : Protection contre les abus (à implémenter)

## 🏗️ Architecture

```
worker/
├── src/
│   ├── index.ts              # Point d'entrée principal
│   ├── types/                # Types TypeScript
│   ├── utils/                # Utilitaires (auth, db)
│   ├── middleware/           # Middleware Hono
│   ├── routes/              # Routes API
│   └── services/            # Logique métier
├── migrations/              # Migrations SQL
├── scripts/                 # Scripts utilitaires
└── tests/                   # Tests
```

## 🔧 Configuration

### Variables d'environnement

| Variable | Description | Requis |
|----------|-------------|---------|
| `JWT_SECRET` | Secret pour signer les JWT | ✅ |
| `CORS_ORIGIN` | Origine autorisée pour CORS | ✅ |
| `DB` | Binding D1 Database | ✅ |

### Rôles utilisateur

- **administrateur** : Accès complet, gestion des utilisateurs
- **professeur** : Création de listes publiques, gestion étendue
- **utilisateur** : Création de listes privées, partage limité

## 📝 Exemples d'utilisation

### Inscription
```bash
curl -X POST http://localhost:8787/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### Connexion
```bash
curl -X POST http://localhost:8787/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### Créer une liste
```bash
curl -X POST http://localhost:8787/api/lists \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nom_liste": "Mes passes favorites",
    "visibilite": "private"
  }'
```

## 🐛 Débogage

### Logs
```bash
# Voir les logs en temps réel
wrangler tail

# Logs locaux
npm run dev # Les logs apparaissent dans la console
```

### Base de données locale
```bash
# Accéder à la base de données locale
wrangler d1 execute rock4you-db --local --command="SELECT * FROM Utilisateurs;"
```

## 🚀 Déploiement en production

1. **Configurer les secrets**
```bash
wrangler secret put JWT_SECRET
wrangler secret put CORS_ORIGIN
```

2. **Appliquer les migrations**
```bash
node scripts/migrate.js
```

3. **Déployer**
```bash
npm run deploy
```

4. **Vérifier le déploiement**
```bash
curl https://your-worker.your-subdomain.workers.dev/health
```

## 📞 Support

Pour toute question ou problème :
1. Vérifiez les logs avec `wrangler tail`
2. Consultez la documentation Cloudflare Workers
3. Vérifiez la configuration dans `wrangler.toml`

## 🔄 Versions

- **v1.0.0** : Version initiale avec authentification et gestion des listes
- **v1.1.0** : Fonctionnalités avancées (sessions, logs, statistiques)
- **v2.0.0** : Intégration OAuth, notifications push (planifié)