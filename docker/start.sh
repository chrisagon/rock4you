#!/bin/sh

# Script de démarrage pour le container Docker Rock4you
echo "🚀 Démarrage de Rock4you..."

# Créer le répertoire pour la base de données
mkdir -p /app/backend/data

# Initialiser la base de données SQLite si elle n'existe pas
if [ ! -f /app/backend/data/database.sqlite ]; then
    echo "📊 Initialisation de la base de données..."
    cd /app/backend
    
    # Créer la base de données et appliquer les migrations
    sqlite3 /app/backend/data/database.sqlite < migrations/0001_initial.sql || echo "⚠️  Migrations non trouvées, création manuelle de la DB"
fi

# Démarrer le backend Node.js en arrière-plan
echo "🔧 Démarrage du backend API..."
cd /app/backend
npm start &

# Attendre que le backend soit prêt
echo "⏳ Attente du backend..."
sleep 5

# Démarrer Nginx
echo "🌐 Démarrage du serveur web..."
nginx -g 'daemon off;'
