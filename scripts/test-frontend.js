#!/usr/bin/env node

/**
 * Script de test pour le frontend React Native/Expo
 * Usage: node scripts/test-frontend.js [--api-url=https://your-api.workers.dev]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const args = process.argv.slice(2);
const apiUrlArg = args.find(arg => arg.startsWith('--api-url='));
const customApiUrl = apiUrlArg ? apiUrlArg.split('=')[1] : 'http://localhost:8787';

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function executeCommand(command, description, options = {}) {
  log(`\n🔄 ${description}...`, 'cyan');
  try {
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      cwd: options.cwd || process.cwd()
    });
    log(`✅ ${description} terminé`, 'green');
    return { success: true, output };
  } catch (error) {
    log(`❌ Erreur lors de ${description.toLowerCase()}:`, 'red');
    if (!options.silent) {
      console.error(error.stdout || error.message);
    }
    return { success: false, error };
  }
}

function checkPrerequisites() {
  log('🔍 Vérification des prérequis', 'cyan');
  
  // Vérifier Node.js
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    log(`✅ Node.js: ${nodeVersion}`, 'green');
  } catch (error) {
    log('❌ Node.js non trouvé', 'red');
    return false;
  }

  // Vérifier npm
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    log(`✅ npm: ${npmVersion}`, 'green');
  } catch (error) {
    log('❌ npm non trouvé', 'red');
    return false;
  }

  // Vérifier Expo CLI
  try {
    const expoVersion = execSync('expo --version', { encoding: 'utf8' }).trim();
    log(`✅ Expo CLI: ${expoVersion}`, 'green');
  } catch (error) {
    log('⚠️  Expo CLI non trouvé, installation...', 'yellow');
    const installResult = executeCommand('npm install -g @expo/cli', 'Installation d\'Expo CLI');
    if (!installResult.success) {
      return false;
    }
  }

  return true;
}

function setupEnvironment() {
  log('\n🔧 Configuration de l\'environnement', 'cyan');
  
  const envContent = `EXPO_PUBLIC_API_URL=${customApiUrl}\n`;
  const envPath = path.join(process.cwd(), '.env.local');
  
  try {
    fs.writeFileSync(envPath, envContent);
    log(`✅ Fichier .env.local créé avec API_URL: ${customApiUrl}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Erreur création .env.local: ${error.message}`, 'red');
    return false;
  }
}

function installDependencies() {
  log('\n📦 Installation des dépendances', 'cyan');
  
  // Vérifier si node_modules existe
  if (fs.existsSync('node_modules')) {
    log('✅ node_modules existe déjà', 'green');
    return true;
  }
  
  const result = executeCommand('npm install', 'Installation des dépendances');
  return result.success;
}

function checkProjectStructure() {
  log('\n🏗️  Vérification de la structure du projet', 'cyan');
  
  const requiredFiles = [
    'app.json',
    'package.json',
    'app/_layout.tsx',
    'app/(auth)/login.tsx',
    'app/(auth)/register.tsx',
    'app/(tabs)/favorites.tsx',
    'app/(tabs)/profile.tsx',
    'contexts/AuthContext.tsx',
    'services/api.ts'
  ];
  
  let allFilesExist = true;
  
  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      log(`✅ ${file}`, 'green');
    } else {
      log(`❌ ${file} manquant`, 'red');
      allFilesExist = false;
    }
  }
  
  return allFilesExist;
}

function validateConfiguration() {
  log('\n⚙️  Validation de la configuration', 'cyan');
  
  // Vérifier le fichier API
  try {
    const apiContent = fs.readFileSync('services/api.ts', 'utf8');
    if (apiContent.includes('EXPO_PUBLIC_API_URL')) {
      log('✅ Configuration API correcte', 'green');
    } else {
      log('⚠️  Configuration API pourrait nécessiter des ajustements', 'yellow');
    }
  } catch (error) {
    log('❌ Impossible de lire services/api.ts', 'red');
    return false;
  }
  
  // Vérifier AuthContext
  try {
    const authContent = fs.readFileSync('contexts/AuthContext.tsx', 'utf8');
    if (authContent.includes('createContext')) {
      log('✅ AuthContext configuré', 'green');
    } else {
      log('❌ AuthContext mal configuré', 'red');
      return false;
    }
  } catch (error) {
    log('❌ Impossible de lire contexts/AuthContext.tsx', 'red');
    return false;
  }
  
  return true;
}

function runTypeScriptCheck() {
  log('\n🔍 Vérification TypeScript', 'cyan');
  
  const result = executeCommand('npx tsc --noEmit', 'Vérification TypeScript', { silent: true });
  
  if (result.success) {
    log('✅ Aucune erreur TypeScript', 'green');
    return true;
  } else {
    log('⚠️  Erreurs TypeScript détectées:', 'yellow');
    console.log(result.error.stdout || result.error.message);
    return false;
  }
}

function testBuild() {
  log('\n🏗️  Test de build', 'cyan');
  
  const result = executeCommand('expo export --platform web', 'Build de test', { silent: true });
  
  if (result.success) {
    log('✅ Build réussi', 'green');
    return true;
  } else {
    log('❌ Échec du build:', 'red');
    console.log(result.error.stdout || result.error.message);
    return false;
  }
}

function generateTestReport(results) {
  log('\n📊 Rapport de test', 'cyan');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r).length;
  const failedTests = totalTests - passedTests;
  
  log(`✅ Tests réussis: ${passedTests}/${totalTests}`, 'green');
  log(`❌ Tests échoués: ${failedTests}/${totalTests}`, failedTests > 0 ? 'red' : 'green');
  
  log('\nDétail des tests:', 'blue');
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅' : '❌';
    const color = passed ? 'green' : 'red';
    log(`  ${status} ${test}`, color);
  });
  
  if (failedTests === 0) {
    log('\n🎉 Tous les tests frontend sont passés!', 'green');
    log('\n💡 Prochaines étapes:', 'cyan');
    log('  1. Démarrer l\'API backend: cd worker && npm run dev', 'blue');
    log('  2. Démarrer l\'application: npm run dev', 'blue');
    log('  3. Tester l\'inscription/connexion dans l\'app', 'blue');
  } else {
    log('\n⚠️  Certains tests ont échoué. Vérifiez les erreurs ci-dessus.', 'yellow');
  }
  
  return failedTests === 0;
}

async function main() {
  log('🚀 Tests Frontend Rock4you', 'cyan');
  log(`📍 API URL configurée: ${customApiUrl}`, 'blue');
  
  const results = {};
  
  // Tests séquentiels
  results['Prérequis'] = checkPrerequisites();
  if (!results['Prérequis']) {
    log('\n❌ Prérequis non satisfaits, arrêt des tests', 'red');
    process.exit(1);
  }
  
  results['Configuration environnement'] = setupEnvironment();
  results['Installation dépendances'] = installDependencies();
  results['Structure du projet'] = checkProjectStructure();
  results['Configuration'] = validateConfiguration();
  results['TypeScript'] = runTypeScriptCheck();
  results['Build'] = testBuild();
  
  const success = generateTestReport(results);
  process.exit(success ? 0 : 1);
}

// Affichage de l'aide
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Script de test pour le frontend Rock4you

Usage: node scripts/test-frontend.js [options]

Options:
  --api-url=URL    URL de l'API backend (défaut: http://localhost:8787)
  --help, -h       Afficher cette aide

Exemples:
  node scripts/test-frontend.js
  node scripts/test-frontend.js --api-url=https://rock4you-api.workers.dev
  `);
  process.exit(0);
}

main().catch(error => {
  log(`\n❌ Erreur inattendue: ${error.message}`, 'red');
  process.exit(1);
});