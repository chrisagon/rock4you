#!/usr/bin/env node

/**
 * Script de déploiement automatisé pour Rock4you
 * Usage: node scripts/deploy.js [--env=production|staging] [--skip-tests]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const args = process.argv.slice(2);
const envArg = args.find(arg => arg.startsWith('--env='));
const environment = envArg ? envArg.split('=')[1] : 'staging';
const skipTests = args.includes('--skip-tests');
const forceYes = args.includes('--yes') || args.includes('-y');

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

function askQuestion(question) {
  if (forceYes) return Promise.resolve('y');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`${colors.yellow}${question} (y/N): ${colors.reset}`, (answer) => {
      rl.close();
      resolve(answer.toLowerCase());
    });
  });
}

async function checkPrerequisites() {
  log('🔍 Vérification des prérequis', 'magenta');
  
  // Vérifier Wrangler
  try {
    const wranglerVersion = execSync('wrangler --version', { encoding: 'utf8' }).trim();
    log(`✅ Wrangler: ${wranglerVersion}`, 'green');
  } catch (error) {
    log('❌ Wrangler CLI non trouvé. Installez-le avec: npm install -g wrangler', 'red');
    return false;
  }

  // Vérifier l'authentification Cloudflare
  try {
    execSync('wrangler whoami', { encoding: 'utf8', stdio: 'pipe' });
    log('✅ Authentification Cloudflare OK', 'green');
  } catch (error) {
    log('❌ Non authentifié sur Cloudflare. Exécutez: wrangler auth login', 'red');
    return false;
  }

  // Vérifier la configuration wrangler.toml
  const wranglerPath = path.join('worker', 'wrangler.toml');
  if (!fs.existsSync(wranglerPath)) {
    log('❌ Fichier worker/wrangler.toml non trouvé', 'red');
    return false;
  }
  log('✅ Configuration wrangler.toml trouvée', 'green');

  return true;
}

async function runDatabaseMigration() {
  log('\n🗄️  Migration de la base de données', 'magenta');
  
  const isLocal = environment === 'local';
  const migrationCommand = `node scripts/migrate.js ${isLocal ? '--local' : ''}`;
  
  const result = executeCommand(migrationCommand, 'Migration de la base de données', { cwd: 'worker' });
  return result.success;
}

async function runBackendTests() {
  if (skipTests) {
    log('\n⏭️  Tests backend ignorés (--skip-tests)', 'yellow');
    return true;
  }

  log('\n🧪 Tests backend', 'magenta');
  
  // Démarrer le worker en local pour les tests
  log('Démarrage du worker local pour les tests...', 'cyan');
  
  // Détection de la plateforme pour la commande npm
  const isWindows = process.platform === 'win32';
  const npmCommand = isWindows ? 'npm.cmd' : 'npm';
  
  const workerProcess = require('child_process').spawn(npmCommand, ['run', 'dev'], {
    cwd: 'worker',
    stdio: 'pipe',
    shell: isWindows
  });

  // Attendre que le worker soit prêt
  await new Promise(resolve => setTimeout(resolve, 8000));

  try {
    const result = executeCommand('node scripts/test-api.js --local', 'Tests API', { cwd: 'worker' });
    workerProcess.kill();
    return result.success;
  } catch (error) {
    workerProcess.kill();
    return false;
  }
}

async function deployWorker() {
  log('\n🚀 Déploiement du Worker', 'magenta');
  
  const deployCommand = environment === 'production' 
    ? 'wrangler deploy --env production'
    : 'wrangler deploy';
  
  const result = executeCommand(deployCommand, 'Déploiement du Worker', { cwd: 'worker' });
  
  if (result.success) {
    // Extraire l'URL du worker depuis la sortie
    const output = result.output || '';
    const urlMatch = output.match(/https:\/\/[^\s]+/);
    if (urlMatch) {
      const workerUrl = urlMatch[0];
      log(`🌐 Worker déployé sur: ${workerUrl}`, 'green');
      return { success: true, url: workerUrl };
    }
  }
  
  return { success: result.success };
}

async function testDeployedAPI(workerUrl) {
  if (skipTests || !workerUrl) {
    log('\n⏭️  Tests API déployée ignorés', 'yellow');
    return true;
  }

  log('\n🧪 Tests de l\'API déployée', 'magenta');
  
  // Attendre que le déploiement soit propagé
  log('Attente de la propagation du déploiement...', 'cyan');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  const result = executeCommand(
    `node scripts/test-api.js --url=${workerUrl}`, 
    'Tests API déployée', 
    { cwd: 'worker' }
  );
  
  return result.success;
}

async function configureFrontend(workerUrl) {
  log('\n⚙️  Configuration du frontend', 'magenta');
  
  if (!workerUrl) {
    log('⚠️  URL du worker non disponible, configuration manuelle requise', 'yellow');
    return false;
  }

  const envContent = `EXPO_PUBLIC_API_URL=${workerUrl}\n`;
  const envPath = '.env.local';
  
  try {
    fs.writeFileSync(envPath, envContent);
    log(`✅ Fichier .env.local mis à jour avec: ${workerUrl}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Erreur lors de la mise à jour de .env.local: ${error.message}`, 'red');
    return false;
  }
}

async function runFrontendTests(workerUrl) {
  if (skipTests) {
    log('\n⏭️  Tests frontend ignorés (--skip-tests)', 'yellow');
    return true;
  }

  log('\n🧪 Tests frontend', 'magenta');
  
  const apiUrl = workerUrl || 'http://localhost:8787';
  const result = executeCommand(
    `node scripts/test-frontend.js --api-url=${apiUrl}`, 
    'Tests frontend'
  );
  
  return result.success;
}

async function generateDeploymentReport(results) {
  log('\n📊 Rapport de déploiement', 'magenta');
  
  const steps = [
    'Prérequis',
    'Migration DB',
    'Tests backend',
    'Déploiement Worker',
    'Tests API déployée',
    'Configuration frontend',
    'Tests frontend'
  ];
  
  const totalSteps = steps.length;
  const successfulSteps = steps.filter(step => results[step]).length;
  
  log(`✅ Étapes réussies: ${successfulSteps}/${totalSteps}`, 'green');
  log(`❌ Étapes échouées: ${totalSteps - successfulSteps}/${totalSteps}`, 
      successfulSteps === totalSteps ? 'green' : 'red');
  
  log('\nDétail des étapes:', 'blue');
  steps.forEach(step => {
    const status = results[step] ? '✅' : '❌';
    const color = results[step] ? 'green' : 'red';
    log(`  ${status} ${step}`, color);
  });
  
  if (successfulSteps === totalSteps) {
    log('\n🎉 Déploiement réussi!', 'green');
    log('\n📱 Prochaines étapes:', 'cyan');
    log('  1. Testez l\'application avec: npm run dev', 'blue');
    log('  2. Vérifiez l\'inscription/connexion', 'blue');
    log('  3. Testez la gestion des favoris', 'blue');
    
    if (results.workerUrl) {
      log(`\n🌐 API disponible sur: ${results.workerUrl}`, 'green');
    }
  } else {
    log('\n⚠️  Déploiement partiellement échoué', 'yellow');
    log('Consultez les erreurs ci-dessus pour plus de détails', 'yellow');
  }
  
  return successfulSteps === totalSteps;
}

async function main() {
  log('🚀 Déploiement automatisé Rock4you', 'magenta');
  log(`📍 Environnement: ${environment}`, 'blue');
  log(`🧪 Tests: ${skipTests ? 'Ignorés' : 'Activés'}`, 'blue');
  
  // Confirmation avant déploiement
  if (!forceYes) {
    const confirm = await askQuestion(`Confirmer le déploiement en ${environment}?`);
    if (confirm !== 'y' && confirm !== 'yes') {
      log('Déploiement annulé', 'yellow');
      process.exit(0);
    }
  }
  
  const results = {};
  let workerUrl = null;
  
  // Étapes de déploiement
  results['Prérequis'] = await checkPrerequisites();
  if (!results['Prérequis']) {
    log('\n❌ Prérequis non satisfaits, arrêt du déploiement', 'red');
    process.exit(1);
  }
  
  results['Migration DB'] = await runDatabaseMigration();
  results['Tests backend'] = await runBackendTests();
  
  const deployResult = await deployWorker();
  results['Déploiement Worker'] = deployResult.success;
  if (deployResult.url) {
    workerUrl = deployResult.url;
    results.workerUrl = workerUrl;
  }
  
  results['Tests API déployée'] = await testDeployedAPI(workerUrl);
  results['Configuration frontend'] = await configureFrontend(workerUrl);
  results['Tests frontend'] = await runFrontendTests(workerUrl);
  
  const success = await generateDeploymentReport(results);
  process.exit(success ? 0 : 1);
}

// Affichage de l'aide
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Script de déploiement automatisé pour Rock4you

Usage: node scripts/deploy.js [options]

Options:
  --env=ENV        Environnement de déploiement (staging|production, défaut: staging)
  --skip-tests     Ignorer les tests automatisés
  --yes, -y        Confirmer automatiquement toutes les questions
  --help, -h       Afficher cette aide

Exemples:
  node scripts/deploy.js                    # Déploiement staging avec tests
  node scripts/deploy.js --env=production   # Déploiement production
  node scripts/deploy.js --skip-tests -y    # Déploiement rapide sans tests
  `);
  process.exit(0);
}

main().catch(error => {
  log(`\n❌ Erreur inattendue: ${error.message}`, 'red');
  process.exit(1);
});