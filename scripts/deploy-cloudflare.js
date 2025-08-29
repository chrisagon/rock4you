#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Déploiement Rock4You sur Cloudflare Pages\n');

// Fonction pour exécuter des commandes
function runCommand(command, options = {}) {
  try {
    console.log(`📌 Exécution: ${command}`);
    execSync(command, { stdio: 'inherit', ...options });
    return true;
  } catch (error) {
    console.error(`❌ Erreur lors de l'exécution de: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Étapes de déploiement
async function deploy() {
  console.log('📦 Étape 1: Build de production\n');
  
  // Nettoyer le dossier dist
  if (fs.existsSync('dist')) {
    console.log('🧹 Nettoyage du dossier dist...');
    fs.rmSync('dist', { recursive: true, force: true });
  }

  // Build Expo pour le web
  console.log('🔨 Build de l\'application web...');
  if (!runCommand('npm run build:web:prod')) {
    console.error('❌ Échec du build web');
    process.exit(1);
  }

  console.log('\n✅ Build terminé avec succès!');
  
  // Créer un fichier _redirects pour Cloudflare Pages (SPA routing)
  const redirectsContent = '/*    /index.html   200';
  fs.writeFileSync(path.join('dist', '_redirects'), redirectsContent);
  console.log('📝 Fichier _redirects créé pour le routing SPA');

  // Instructions pour le déploiement manuel
  console.log('\n📋 Instructions pour déployer sur Cloudflare Pages:\n');
  console.log('1. Allez sur https://dash.cloudflare.com/');
  console.log('2. Sélectionnez "Pages" dans le menu de gauche');
  console.log('3. Cliquez sur "Create a project"');
  console.log('4. Choisissez "Direct Upload"');
  console.log('5. Glissez-déposez le dossier "dist" ou utilisez le bouton "Select folder"');
  console.log('6. Donnez un nom à votre projet (ex: rock4you)');
  console.log('7. Cliquez sur "Deploy site"');
  console.log('\n🌐 Votre site sera disponible sur: https://rock4you.pages.dev');
  
  // Option pour déploiement automatique avec Wrangler
  console.log('\n💡 Pour un déploiement automatique avec Wrangler CLI:');
  console.log('1. Installez Wrangler: npm install -g wrangler');
  console.log('2. Connectez-vous: wrangler login');
  console.log('3. Déployez: wrangler pages deploy dist --project-name=rock4you');
}

// Lancer le déploiement
deploy().catch(console.error);
