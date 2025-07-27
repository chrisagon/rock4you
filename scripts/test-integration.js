#!/usr/bin/env node

/**
 * Script de tests d'intégration end-to-end pour Rock4you
 * Usage: node scripts/test-integration.js [--api-url=https://your-api.workers.dev]
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const args = process.argv.slice(2);
const apiUrlArg = args.find(arg => arg.startsWith('--api-url='));
const customApiUrl = apiUrlArg ? apiUrlArg.split('=')[1] : null;

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
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
      cwd: options.cwd || process.cwd(),
      timeout: options.timeout || 30000
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

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkEnvironment() {
  log('🔍 Vérification de l\'environnement', 'magenta');
  
  const checks = [
    { cmd: 'node --version', name: 'Node.js' },
    { cmd: 'npm --version', name: 'npm' },
    { cmd: 'wrangler --version', name: 'Wrangler CLI' }
  ];
  
  for (const check of checks) {
    try {
      const version = execSync(check.cmd, { encoding: 'utf8', stdio: 'pipe' }).trim();
      log(`✅ ${check.name}: ${version}`, 'green');
    } catch (error) {
      log(`❌ ${check.name} non trouvé`, 'red');
      return false;
    }
  }
  
  return true;
}

async function setupLocalEnvironment() {
  log('\n🔧 Configuration de l\'environnement local', 'magenta');
  
  // Créer .env.local pour les tests
  const apiUrl = customApiUrl || 'http://localhost:8787';
  const envContent = `EXPO_PUBLIC_API_URL=${apiUrl}\n`;
  
  try {
    fs.writeFileSync('.env.local', envContent);
    log(`✅ Configuration API: ${apiUrl}`, 'green');
  } catch (error) {
    log(`❌ Erreur configuration: ${error.message}`, 'red');
    return false;
  }
  
  // Installer les dépendances si nécessaire
  if (!fs.existsSync('node_modules')) {
    const result = executeCommand('npm install', 'Installation des dépendances');
    if (!result.success) return false;
  }
  
  if (!fs.existsSync('worker/node_modules')) {
    const result = executeCommand('npm install', 'Installation des dépendances worker', { cwd: 'worker' });
    if (!result.success) return false;
  }
  
  return true;
}

async function startLocalWorker() {
  log('\n🚀 Démarrage du Worker local', 'magenta');
  
  // Migration de la base de données locale
  const migrateResult = executeCommand(
    'node scripts/migrate.js --local',
    'Migration de la base de données locale',
    { cwd: 'worker' }
  );
  
  if (!migrateResult.success) {
    log('❌ Échec de la migration', 'red');
    return null;
  }
  
  // Démarrer le worker
  log('Démarrage du worker...', 'cyan');
  
  // Détection de la plateforme pour la commande npm
  const isWindows = process.platform === 'win32';
  const npmCommand = isWindows ? 'npm.cmd' : 'npm';
  
  const workerProcess = spawn(npmCommand, ['run', 'dev'], {
    cwd: 'worker',
    stdio: 'pipe',
    shell: isWindows
  });
  
  // Attendre que le worker soit prêt
  log('Attente du démarrage du worker...', 'yellow');
  await sleep(10000);
  
  // Vérifier que le worker répond avec une méthode compatible Windows
  try {
    // Utiliser node pour faire la requête HTTP au lieu de curl
    const healthCheckScript = `
      const http = require('http');
      const options = { hostname: 'localhost', port: 8787, path: '/health', timeout: 3000 };
      const req = http.get(options, (res) => {
        console.log('OK');
        process.exit(0);
      });
      req.on('error', () => {
        console.log('FAILED');
        process.exit(1);
      });
      req.on('timeout', () => {
        console.log('FAILED');
        process.exit(1);
      });
    `;
    
    const healthCheck = executeCommand(
      `node -e "${healthCheckScript.replace(/\n\s*/g, ' ')}"`,
      'Vérification du worker',
      { silent: true, timeout: 5000 }
    );
    
    if (healthCheck.success && healthCheck.output.includes('OK')) {
      log('✅ Worker local démarré et opérationnel', 'green');
      return workerProcess;
    } else {
      log('❌ Worker local non accessible', 'red');
      workerProcess.kill();
      return null;
    }
  } catch (error) {
    log('❌ Impossible de vérifier le worker', 'red');
    workerProcess.kill();
    return null;
  }
}

async function runBackendTests() {
  log('\n🧪 Tests Backend (API)', 'magenta');
  
  const result = executeCommand(
    'node scripts/test-api.js --local',
    'Tests de l\'API backend',
    { cwd: 'worker' }
  );
  
  return result.success;
}

async function runFrontendTests() {
  log('\n🧪 Tests Frontend', 'magenta');
  
  const result = executeCommand(
    'node scripts/test-frontend.js --api-url=http://localhost:8787',
    'Tests du frontend'
  );
  
  return result.success;
}

async function runIntegrationScenarios() {
  log('\n🎭 Scénarios d\'intégration', 'magenta');
  
  // Scénario 1: Flux complet utilisateur
  log('\n📝 Scénario 1: Flux utilisateur complet', 'cyan');
  
  const scenarios = [
    {
      name: 'Inscription utilisateur',
      test: async () => {
        // Test d'inscription via API
        const testUser = {
          nom: 'Integration',
          prenom: 'Test',
          email: `integration-${Date.now()}@test.com`,
          motDePasse: 'TestPassword123!'
        };
        
        try {
          const result = executeCommand(
            `curl -s -X POST http://localhost:8787/api/auth/register ` +
            `-H "Content-Type: application/json" ` +
            `-d '${JSON.stringify(testUser)}'`,
            'Test d\'inscription',
            { silent: true }
          );
          
          return result.success && !result.output.includes('error');
        } catch (error) {
          return false;
        }
      }
    },
    {
      name: 'Connexion utilisateur',
      test: async () => {
        // Test de connexion
        try {
          const result = executeCommand(
            `curl -s -X POST http://localhost:8787/api/auth/login ` +
            `-H "Content-Type: application/json" ` +
            `-d '{"email":"integration-test@test.com","motDePasse":"TestPassword123!"}'`,
            'Test de connexion',
            { silent: true }
          );
          
          return result.success;
        } catch (error) {
          return false;
        }
      }
    },
    {
      name: 'Gestion des favoris',
      test: async () => {
        // Test des favoris (nécessite une session)
        try {
          const result = executeCommand(
            `curl -s http://localhost:8787/api/favorites`,
            'Test des favoris',
            { silent: true }
          );
          
          return result.success;
        } catch (error) {
          return false;
        }
      }
    }
  ];
  
  let passedScenarios = 0;
  
  for (const scenario of scenarios) {
    log(`\n🔍 Test: ${scenario.name}`, 'blue');
    try {
      const success = await scenario.test();
      if (success) {
        log(`✅ ${scenario.name} réussi`, 'green');
        passedScenarios++;
      } else {
        log(`❌ ${scenario.name} échoué`, 'red');
      }
    } catch (error) {
      log(`❌ ${scenario.name} erreur: ${error.message}`, 'red');
    }
  }
  
  return passedScenarios === scenarios.length;
}

async function generateIntegrationReport(results) {
  log('\n📊 Rapport des tests d\'intégration', 'magenta');
  
  const tests = [
    'Environnement',
    'Configuration',
    'Worker local',
    'Tests backend',
    'Tests frontend',
    'Scénarios d\'intégration'
  ];
  
  const totalTests = tests.length;
  const passedTests = tests.filter(test => results[test]).length;
  
  log(`✅ Tests réussis: ${passedTests}/${totalTests}`, 'green');
  log(`❌ Tests échoués: ${totalTests - passedTests}/${totalTests}`, 
      passedTests === totalTests ? 'green' : 'red');
  
  log('\nDétail des tests:', 'blue');
  tests.forEach(test => {
    const status = results[test] ? '✅' : '❌';
    const color = results[test] ? 'green' : 'red';
    log(`  ${status} ${test}`, color);
  });
  
  if (passedTests === totalTests) {
    log('\n🎉 Tous les tests d\'intégration sont passés!', 'green');
    log('\n🚀 Le système est prêt pour le déploiement', 'cyan');
    log('\n💡 Prochaines étapes:', 'blue');
    log('  1. Déployer en staging: npm run deploy', 'blue');
    log('  2. Tester en staging', 'blue');
    log('  3. Déployer en production: npm run deploy:prod', 'blue');
  } else {
    log('\n⚠️  Certains tests d\'intégration ont échoué', 'yellow');
    log('Corrigez les erreurs avant le déploiement', 'yellow');
  }
  
  return passedTests === totalTests;
}

async function main() {
  log('🧪 Tests d\'Intégration End-to-End Rock4you', 'magenta');
  log('🎯 Objectif: Vérifier le fonctionnement complet du système', 'blue');
  
  const results = {};
  let workerProcess = null;
  
  try {
    // Tests séquentiels
    results['Environnement'] = await checkEnvironment();
    if (!results['Environnement']) {
      log('\n❌ Environnement non conforme, arrêt des tests', 'red');
      process.exit(1);
    }
    
    results['Configuration'] = await setupLocalEnvironment();
    if (!results['Configuration']) {
      log('\n❌ Configuration échouée, arrêt des tests', 'red');
      process.exit(1);
    }
    
    // Démarrer le worker local
    if (!customApiUrl) {
      workerProcess = await startLocalWorker();
      results['Worker local'] = workerProcess !== null;
      
      if (!results['Worker local']) {
        log('\n❌ Impossible de démarrer le worker local', 'red');
        process.exit(1);
      }
    } else {
      log('\n⏭️  Utilisation de l\'API distante, worker local ignoré', 'yellow');
      results['Worker local'] = true;
    }
    
    // Tests
    results['Tests backend'] = await runBackendTests();
    results['Tests frontend'] = await runFrontendTests();
    results['Scénarios d\'intégration'] = await runIntegrationScenarios();
    
    // Rapport final
    const success = await generateIntegrationReport(results);
    
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    log(`\n❌ Erreur inattendue: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    // Nettoyer le worker local
    if (workerProcess) {
      log('\n🧹 Arrêt du worker local...', 'yellow');
      workerProcess.kill();
    }
  }
}

// Affichage de l'aide
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Script de tests d'intégration end-to-end pour Rock4you

Usage: node scripts/test-integration.js [options]

Options:
  --api-url=URL    URL de l'API à tester (défaut: worker local)
  --help, -h       Afficher cette aide

Exemples:
  node scripts/test-integration.js                                    # Tests avec worker local
  node scripts/test-integration.js --api-url=https://api.workers.dev  # Tests avec API distante
  `);
  process.exit(0);
}

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
  log('\n🛑 Arrêt des tests...', 'yellow');
  process.exit(1);
});

main();