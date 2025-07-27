#!/usr/bin/env node

/**
 * Script de migration pour Cloudflare D1
 * Usage: node scripts/migrate.js [--local] [--reset]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const DB_NAME = 'rock4you-db';
const MIGRATIONS_DIR = path.join(__dirname, '../migrations');

// Arguments de ligne de commande
const args = process.argv.slice(2);
const isLocal = args.includes('--local');
const shouldReset = args.includes('--reset');
const shouldHelp = args.includes('--help') || args.includes('-h');

function showHelp() {
  console.log(`
Script de migration pour Rock4you API

Usage: node scripts/migrate.js [options]

Options:
  --local     Exécuter les migrations sur la base de données locale
  --reset     Supprimer et recréer la base de données (ATTENTION: perte de données)
  --help, -h  Afficher cette aide

Exemples:
  node scripts/migrate.js                 # Migrer la base de données de production
  node scripts/migrate.js --local         # Migrer la base de données locale
  node scripts/migrate.js --local --reset # Réinitialiser la base de données locale

Note: Assurez-vous d'avoir configuré wrangler et d'être connecté à votre compte Cloudflare.
  `);
}

function executeCommand(command, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ ${description} terminé`);
    if (output.trim()) {
      console.log(output);
    }
    return true;
  } catch (error) {
    console.error(`❌ Erreur lors de ${description.toLowerCase()}:`);
    console.error(error.stdout || error.message);
    return false;
  }
}

function getMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.error(`❌ Dossier de migrations non trouvé: ${MIGRATIONS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.error('❌ Aucun fichier de migration trouvé');
    process.exit(1);
  }

  return files;
}

function createDatabase() {
  const localFlag = isLocal ? '--local' : '';
  const command = `wrangler d1 create ${DB_NAME} ${localFlag}`.trim();
  return executeCommand(command, 'Création de la base de données');
}

function resetDatabase() {
  console.log('\n⚠️  ATTENTION: Cette opération va supprimer toutes les données!');
  
  // En mode local, on peut supprimer le fichier de base de données
  if (isLocal) {
    const dbPath = path.join(process.cwd(), '.wrangler/state/d1', `${DB_NAME}.sqlite3`);
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      console.log('✅ Base de données locale supprimée');
    }
  } else {
    console.log('⚠️  Pour réinitialiser la base de données de production, vous devez:');
    console.log('1. Supprimer la base de données depuis le dashboard Cloudflare');
    console.log('2. Recréer une nouvelle base de données');
    console.log('3. Mettre à jour l\'ID de base de données dans wrangler.toml');
    process.exit(1);
  }
}

function runMigrations() {
  const migrationFiles = getMigrationFiles();
  const localFlag = isLocal ? '--local' : '';
  
  console.log(`\n📋 ${migrationFiles.length} migration(s) trouvée(s):`);
  migrationFiles.forEach(file => console.log(`   - ${file}`));

  for (const file of migrationFiles) {
    const migrationPath = path.join(MIGRATIONS_DIR, file);
    const command = `wrangler d1 execute ${DB_NAME} --file="${migrationPath}" ${localFlag}`.trim();
    
    if (!executeCommand(command, `Application de la migration ${file}`)) {
      console.error(`❌ Échec de la migration ${file}`);
      process.exit(1);
    }
  }
}

function checkWranglerConfig() {
  const wranglerPath = path.join(process.cwd(), 'wrangler.toml');
  if (!fs.existsSync(wranglerPath)) {
    console.error('❌ Fichier wrangler.toml non trouvé');
    console.error('Assurez-vous d\'être dans le dossier worker/');
    process.exit(1);
  }
}

function main() {
  if (shouldHelp) {
    showHelp();
    return;
  }

  console.log('🚀 Script de migration Rock4you API');
  console.log(`📍 Mode: ${isLocal ? 'LOCAL' : 'PRODUCTION'}`);
  
  checkWranglerConfig();

  if (shouldReset) {
    resetDatabase();
  }

  // Créer la base de données si elle n'existe pas (surtout en mode local)
  if (isLocal) {
    createDatabase();
  }

  runMigrations();

  console.log('\n🎉 Migrations terminées avec succès!');
  
  if (isLocal) {
    console.log('\n💡 Pour tester votre API localement:');
    console.log('   npm run dev');
  } else {
    console.log('\n💡 Pour déployer votre API:');
    console.log('   npm run deploy');
  }
}

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('\n❌ Erreur inattendue:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('\n❌ Promesse rejetée:', reason);
  process.exit(1);
});

main();