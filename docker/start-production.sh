#!/bin/sh

# Script de démarrage pour la production avec Cloudflare D1
echo "🚀 Démarrage de Rock4you en production..."

# Vérifier les variables d'environnement requises
if [ "$USE_CLOUDFLARE_D1" = "true" ]; then
    echo "📊 Mode production avec Cloudflare D1"
    
    if [ -z "$CLOUDFLARE_ACCOUNT_ID" ] || [ -z "$CLOUDFLARE_DATABASE_ID" ] || [ -z "$CLOUDFLARE_API_TOKEN" ]; then
        echo "❌ Variables d'environnement Cloudflare manquantes:"
        echo "   CLOUDFLARE_ACCOUNT_ID: ${CLOUDFLARE_ACCOUNT_ID:-❌ manquant}"
        echo "   CLOUDFLARE_DATABASE_ID: ${CLOUDFLARE_DATABASE_ID:-❌ manquant}"
        echo "   CLOUDFLARE_API_TOKEN: ${CLOUDFLARE_API_TOKEN:-❌ manquant}"
        echo ""
        echo "Consultez PRODUCTION_CLOUDFLARE.md pour les instructions."
        exit 1
    fi
    
    echo "✅ Configuration Cloudflare D1 détectée"
else
    echo "📊 Mode développement avec SQLite local"
    # Créer le répertoire pour la base de données locale si nécessaire
    mkdir -p /app/backend/data
fi

# Vérifier JWT_SECRET
if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "your-secret-key-change-me" ]; then
    echo "⚠️  ATTENTION: JWT_SECRET non configuré ou utilise la valeur par défaut"
    echo "   Générez une clé sécurisée avec: openssl rand -hex 32"
fi

# Démarrer le backend Node.js en arrière-plan
echo "🔧 Démarrage du backend API..."
cd /app/backend

# Test de connexion à la base de données
echo "🔍 Test de connexion à la base de données..."
if [ "$USE_CLOUDFLARE_D1" = "true" ]; then
    # Pour D1, on teste via l'API
    node -e "
    const { createD1Remote } = require('./d1-remote-adapter');
    (async () => {
        try {
            const db = createD1Remote();
            await db.testConnection();
            console.log('✅ Connexion D1 réussie');
        } catch (error) {
            console.error('❌ Connexion D1 échouée:', error.message);
            process.exit(1);
        }
    })();
    " || exit 1
fi

# Démarrer le serveur backend
npm start &
BACKEND_PID=$!

# Attendre que le backend soit prêt
echo "⏳ Attente du backend..."
for i in $(seq 1 30); do
    if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
        echo "✅ Backend prêt"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Timeout: le backend n'a pas démarré"
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
    sleep 1
done

# Afficher les informations de démarrage
echo ""
echo "🎉 Rock4you démarré avec succès !"
echo "   Frontend: http://localhost"
echo "   API: http://localhost:3003"
echo "   Health: http://localhost:3003/api/health"
echo "   Base de données: $([ "$USE_CLOUDFLARE_D1" = "true" ] && echo "Cloudflare D1" || echo "SQLite Local")"
echo ""

# Fonction de nettoyage
cleanup() {
    echo "🛑 Arrêt de Rock4you..."
    kill $BACKEND_PID 2>/dev/null
    nginx -s quit 2>/dev/null
    exit 0
}

# Capturer les signaux d'arrêt
trap cleanup TERM INT

# Démarrer Nginx
echo "🌐 Démarrage du serveur web..."
nginx -g 'daemon off;' &
NGINX_PID=$!

# Attendre les processus
wait $NGINX_PID $BACKEND_PID
