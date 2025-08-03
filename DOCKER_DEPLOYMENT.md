# 🐳 Guide de Déploiement Docker - Rock4you

Ce guide explique comment déployer l'application Rock4you avec Docker de plusieurs façons.

## 📋 Prérequis

- Docker installé (version 20.10+)
- Docker Compose installé (version 2.0+)
- 2 GB d'espace disque libre minimum

## 🚀 Déploiement Rapide

### Option 1: Docker Compose (Recommandé)

```bash
# 1. Cloner le projet
git clone <votre-repo>
cd rock4you

# 2. Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos valeurs

# 3. Démarrer l'application
docker-compose up -d

# 4. Vérifier le statut
docker-compose ps
```

L'application sera accessible sur :
- **Frontend Web** : http://localhost
- **API Backend** : http://localhost:3003

### Option 2: Docker Simple

```bash
# Build de l'image
docker build -t rock4you .

# Démarrage du container
docker run -d \
  --name rock4you-app \
  -p 80:80 \
  -p 3003:3000 \
  -e JWT_SECRET=your-secret-key \
  -v rock4you_data:/app/backend/data \
  rock4you
```

## 🔧 Configuration

### Variables d'Environnement

Créez un fichier `.env.local` :

```env
# Sécurité
JWT_SECRET=your-very-secure-secret-key-change-me

# CORS (pour le développement, utilisez * ; en production, spécifiez votre domaine)
CORS_ORIGIN=*

# Base de données
DATABASE_PATH=/app/backend/data/database.sqlite

# Mode
NODE_ENV=production
```

### Personnalisation Docker Compose

Éditez `docker-compose.yml` pour :
- Changer les ports exposés
- Ajouter des volumes personnalisés
- Configurer les ressources (CPU/RAM)

```yaml
services:
  rock4you-app:
    # ... autres configurations
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## 📊 Monitoring et Logs

### Voir les logs
```bash
# Logs en temps réel
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f rock4you-app
```

### Health Check
```bash
# Vérifier la santé de l'API
curl http://localhost:3003/api/health

# Vérifier le frontend
curl http://localhost
```

### Monitoring des ressources
```bash
# Statistiques des containers
docker stats

# Espace disque utilisé
docker system df
```

## 🔄 Mise à Jour

```bash
# 1. Arrêter l'application
docker-compose down

# 2. Mettre à jour le code
git pull

# 3. Rebuild et redémarrer
docker-compose up -d --build
```

## 🗄️ Gestion de la Base de Données

### Backup
```bash
# Backup automatique (inclus dans docker-compose.yml)
docker-compose exec rock4you-app sqlite3 /app/backend/data/database.sqlite '.backup /tmp/backup.sqlite'

# Copier le backup vers l'hôte
docker cp $(docker-compose ps -q rock4you-app):/tmp/backup.sqlite ./backup-$(date +%Y%m%d).sqlite
```

### Restauration
```bash
# Copier le backup dans le container
docker cp ./backup.sqlite $(docker-compose ps -q rock4you-app):/tmp/restore.sqlite

# Restaurer
docker-compose exec rock4you-app sqlite3 /app/backend/data/database.sqlite '.restore /tmp/restore.sqlite'
```

## 🔒 Sécurité en Production

### 1. Variables d'environnement sécurisées
```bash
# Générer une clé JWT sécurisée
openssl rand -hex 32

# Utiliser Docker secrets (Docker Swarm)
echo "your-jwt-secret" | docker secret create jwt_secret -
```

### 2. Reverse Proxy (Nginx/Traefik)
```yaml
# Exemple avec Traefik
services:
  rock4you-app:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.rock4you.rule=Host(\`votre-domaine.com\`)"
      - "traefik.http.routers.rock4you.tls.certresolver=letsencrypt"
```

### 3. Firewall
```bash
# Limiter l'accès aux ports
ufw allow 80/tcp
ufw allow 443/tcp
ufw deny 3000/tcp  # API interne seulement
```

## 🐛 Dépannage

### Problèmes courants

#### Container qui ne démarre pas
```bash
# Vérifier les logs
docker-compose logs rock4you-app

# Vérifier l'état
docker-compose ps
```

#### Base de données corrompue
```bash
# Vérifier l'intégrité
docker-compose exec rock4you-app sqlite3 /app/backend/data/database.sqlite 'PRAGMA integrity_check;'

# Réparer si nécessaire
docker-compose exec rock4you-app sqlite3 /app/backend/data/database.sqlite '.recover'
```

#### Problèmes de permissions
```bash
# Corriger les permissions des volumes
docker-compose exec rock4you-app chown -R node:node /app/backend/data
```

### Commandes utiles

```bash
# Redémarrer un service
docker-compose restart rock4you-app

# Reconstruire sans cache
docker-compose build --no-cache

# Nettoyer les images inutilisées
docker system prune -a

# Accéder au shell du container
docker-compose exec rock4you-app sh

# Tester l'API sur le nouveau port
curl http://localhost:3003/api/health
```

## 📈 Optimisations

### Performance
- Utilisez un volume SSD pour la base de données
- Configurez les limites de ressources appropriées
- Activez la compression gzip (déjà configurée)

### Scalabilité
```yaml
# Exemple de scaling horizontal
services:
  rock4you-app:
    deploy:
      replicas: 3
  
  load-balancer:
    image: nginx:alpine
    # Configuration du load balancer
```

## 🌐 Déploiement Cloud

### AWS ECS
```bash
# Utiliser AWS CLI
aws ecs create-service --service-name rock4you --task-definition rock4you:1
```

### Google Cloud Run
```bash
# Build et push
docker build -t gcr.io/your-project/rock4you .
docker push gcr.io/your-project/rock4you

# Deploy
gcloud run deploy rock4you --image gcr.io/your-project/rock4you
```

### DigitalOcean App Platform
```yaml
# app.yaml
name: rock4you
services:
- name: web
  source_dir: /
  github:
    repo: your-username/rock4you
    branch: main
  run_command: docker-compose up
```

---

## 📞 Support

En cas de problème :
1. Vérifiez les logs : `docker-compose logs -f`
2. Consultez la documentation Docker
3. Ouvrez une issue sur le repository GitHub

**Bonne containerisation ! 🚀**
