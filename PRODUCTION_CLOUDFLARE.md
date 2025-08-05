# 🚀 Déploiement Production avec Cloudflare D1

Ce guide explique comment déployer Rock4you en production en utilisant Cloudflare D1 comme base de données.

## 📋 Architectures Disponibles

### Option 1: Architecture Hybride (Recommandée)
- **Frontend** : Container Docker ou Cloudflare Pages
- **Backend** : Cloudflare Workers + D1
- **Avantages** : Performance optimale, coûts réduits, scalabilité automatique

### Option 2: Container + D1 Remote
- **Frontend + Backend** : Container Docker
- **Base de données** : Cloudflare D1 via API REST
- **Avantages** : Contrôle total, infrastructure existante

---

## 🏗️ Option 1: Architecture Hybride

### 1. Déploiement du Backend sur Cloudflare Workers

```bash
# 1. Aller dans le dossier worker
cd worker

# 2. Configurer wrangler
npx wrangler login

# 3. Créer la base D1 en production
npx wrangler d1 create rock4you-prod

# 4. Mettre à jour wrangler.toml avec l'ID de production
# Copier l'ID affiché et l'ajouter dans wrangler.toml

# 5. Appliquer les migrations
npx wrangler d1 migrations apply rock4you-prod

# 6. Déployer le worker
npx wrangler deploy
```

### 2. Configuration wrangler.toml pour Production

```toml
name = "rock4you-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[env.production]
vars = { ENVIRONMENT = "production" }

[[env.production.d1_databases]]
binding = "DB"
database_name = "rock4you-prod"
database_id = "your-production-database-id"

[env.production.vars]
CORS_ORIGIN = "https://your-domain.com"
JWT_SECRET = "your-production-jwt-secret"
```

### 3. Déploiement Frontend

#### Option A: Cloudflare Pages
```bash
# 1. Build du frontend
npm run build:web

# 2. Déployer sur Pages
npx wrangler pages deploy dist --project-name rock4you-frontend
```

#### Option B: Container Docker (Frontend seul)
```dockerfile
# Dockerfile.frontend-only
FROM nginx:alpine

# Copier la build web
COPY dist /usr/share/nginx/html

# Configuration Nginx pour SPA
COPY docker/nginx-frontend-only.conf /etc/nginx/nginx.conf

EXPOSE 80
```

### 4. Variables d'Environnement Frontend

```env
# .env.production
EXPO_PUBLIC_API_URL=https://rock4you-api.your-username.workers.dev
```

---

## 🐳 Option 2: Container + D1 Remote

### 1. Adapter le Backend pour D1 Remote

Créer un adaptateur D1 via API REST :

```javascript
// docker/d1-remote-adapter.js
class CloudflareD1Remote {
  constructor(accountId, databaseId, apiToken) {
    this.accountId = accountId;
    this.databaseId = databaseId;
    this.apiToken = apiToken;
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}`;
  }

  async query(sql, params = []) {
    const response = await fetch(`${this.baseUrl}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sql,
        params
      })
    });

    if (!response.ok) {
      throw new Error(`D1 API Error: ${response.statusText}`);
    }

    return await response.json();
  }

  prepare(sql) {
    return {
      bind: (...params) => ({
        all: async () => {
          const result = await this.query(sql, params);
          return { results: result.result[0].results };
        },
        first: async () => {
          const result = await this.query(sql, params);
          return result.result[0].results[0] || null;
        },
        run: async () => {
          const result = await this.query(sql, params);
          return {
            success: result.success,
            meta: result.result[0].meta
          };
        }
      })
    };
  }
}

module.exports = { CloudflareD1Remote };
```

### 2. Configuration Docker pour D1 Remote

```yaml
# docker-compose.production.yml
version: '3.8'

services:
  rock4you-app:
    build:
      context: .
      dockerfile: Dockerfile.production
    ports:
      - "80:80"
      - "3003:3000"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - CORS_ORIGIN=${CORS_ORIGIN}
      - CLOUDFLARE_ACCOUNT_ID=${CLOUDFLARE_ACCOUNT_ID}
      - CLOUDFLARE_DATABASE_ID=${CLOUDFLARE_DATABASE_ID}
      - CLOUDFLARE_API_TOKEN=${CLOUDFLARE_API_TOKEN}
      - USE_CLOUDFLARE_D1=true
    restart: unless-stopped
```

### 3. Dockerfile pour Production D1

```dockerfile
# Dockerfile.production
FROM node:18-alpine AS frontend-builder
# ... même configuration que Dockerfile original

FROM node:18-alpine AS backend-builder
WORKDIR /app/worker
COPY worker/package*.json ./
RUN npm ci
COPY worker/src/ ./src/
COPY docker/d1-remote-adapter.js ./
COPY docker/backend-adapter-d1.js ./

FROM nginx:alpine AS production
RUN apk add --no-cache nodejs npm

# Copier la build web du frontend
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Copier le backend avec adaptateur D1
COPY --from=backend-builder /app/worker /app/backend

# Configuration Nginx
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Script de démarrage pour D1
COPY docker/start-d1.sh /start.sh
RUN chmod +x /start.sh

ENV NODE_ENV=production
ENV PORT=3000
ENV WEB_PORT=80

EXPOSE 80 3000
CMD ["/start.sh"]
```

---

## 🔧 Configuration des Variables

### Variables Cloudflare nécessaires

```env
# .env.production
JWT_SECRET=your-super-secure-production-jwt-secret
CORS_ORIGIN=https://your-domain.com

# Pour Option 2 (Container + D1 Remote)
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_DATABASE_ID=your-d1-database-id
CLOUDFLARE_API_TOKEN=your-api-token-with-d1-permissions
USE_CLOUDFLARE_D1=true
```

### Obtenir les identifiants Cloudflare

```bash
# 1. Account ID
npx wrangler whoami

# 2. Database ID
npx wrangler d1 list

# 3. API Token
# Aller sur https://dash.cloudflare.com/profile/api-tokens
# Créer un token avec permissions D1:Edit
```

---

## 🚀 Déploiement en Production

### Option 1: Hybride

```bash
# 1. Déployer le backend
cd worker
npx wrangler deploy --env production

# 2. Déployer le frontend
npm run build:web
npx wrangler pages deploy dist --project-name rock4you

# 3. Configurer le domaine personnalisé
npx wrangler pages domain add rock4you your-domain.com
```

### Option 2: Container + D1

```bash
# 1. Créer la base D1
cd worker
npx wrangler d1 create rock4you-prod
npx wrangler d1 migrations apply rock4you-prod

# 2. Configurer les variables
cp .env.example .env.production
# Éditer avec vos valeurs Cloudflare

# 3. Déployer le container
docker-compose -f docker-compose.production.yml up -d

# 4. Vérifier
curl https://your-domain.com/api/health
```

---

## 📊 Monitoring et Maintenance

### Logs Cloudflare Workers
```bash
# Voir les logs en temps réel
npx wrangler tail --env production

# Métriques
npx wrangler analytics --env production
```

### Backup D1
```bash
# Export de la base
npx wrangler d1 export rock4you-prod --output backup.sql

# Import
npx wrangler d1 execute rock4you-prod --file backup.sql
```

### Monitoring Container
```bash
# Si vous utilisez l'option container
docker-compose -f docker-compose.production.yml logs -f
```

---

## 🔒 Sécurité Production

### 1. Variables d'environnement sécurisées
- Utiliser des secrets managers (AWS Secrets, Azure Key Vault, etc.)
- Rotation régulière des tokens API
- JWT secrets forts (32+ caractères)

### 2. CORS restrictif
```env
CORS_ORIGIN=https://your-domain.com,https://www.your-domain.com
```

### 3. Rate limiting
```javascript
// Dans worker/src/middleware/rateLimit.ts
export const rateLimit = async (c, next) => {
  // Implémenter rate limiting avec Cloudflare KV
};
```

---

## 💰 Coûts et Performance

### Option 1 (Hybride)
- **Workers** : ~$5/mois pour 10M requêtes
- **D1** : Gratuit jusqu'à 5M lectures/jour
- **Pages** : Gratuit pour sites statiques
- **Performance** : Excellente (edge computing)

### Option 2 (Container)
- **Serveur** : Variable selon l'hébergeur
- **D1** : Même tarification
- **Bande passante** : Selon l'hébergeur
- **Performance** : Dépend de la localisation du serveur

---

## 🎯 Recommandation

**Pour la production, je recommande l'Option 1 (Architecture Hybride)** :
1. Coûts optimisés
2. Performance globale excellente
3. Scalabilité automatique
4. Maintenance simplifiée
5. Intégration native avec l'écosystème Cloudflare

Voulez-vous que je vous aide à implémenter une de ces options ?
