# Dockerfile principal pour Rock4you
# Multi-stage build pour optimiser la taille de l'image

# Stage 1: Build du frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY app.json ./
COPY expo-env.d.ts ./
COPY tsconfig.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source du frontend
COPY app/ ./app/
COPY components/ ./components/
COPY contexts/ ./contexts/
COPY data/ ./data/
COPY hooks/ ./hooks/
COPY services/ ./services/
COPY types/ ./types/
COPY utils/ ./utils/
COPY assets/ ./assets/

# Build pour le web
RUN npm run build:web

# Stage 2: Setup du backend (adaptation Cloudflare Workers)
FROM node:18-alpine AS backend-builder

WORKDIR /app/worker

# Copier les fichiers du worker
COPY worker/package*.json ./
RUN npm ci

COPY worker/src/ ./src/
COPY worker/migrations/ ./migrations/
COPY worker/wrangler.toml ./

# Stage 3: Image finale avec serveur web
FROM nginx:alpine AS production

# Installer Node.js pour le backend
RUN apk add --no-cache nodejs npm sqlite

# Copier la build web du frontend
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Copier le backend
COPY --from=backend-builder /app/worker /app/backend

# Configuration Nginx
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Script de démarrage
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3000
ENV WEB_PORT=80

EXPOSE 80 3000

CMD ["/start.sh"]
