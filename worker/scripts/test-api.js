#!/usr/bin/env node

/**
 * Script de test pour l'API Rock4you
 * Usage: node scripts/test-api.js [--local] [--url=https://your-api.workers.dev]
 */

const https = require('https');
const http = require('http');

// Configuration
const args = process.argv.slice(2);
const isLocal = args.includes('--local');
const urlArg = args.find(arg => arg.startsWith('--url='));
const customUrl = urlArg ? urlArg.split('=')[1] : null;

const API_URL = customUrl || (isLocal ? 'http://localhost:8787' : 'https://rock4you-api.your-subdomain.workers.dev');

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

function makeRequest(method, path, data = null, cookies = '') {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL + path);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Rock4you-Test-Script/1.0'
      }
    };

    if (cookies) {
      options.headers['Cookie'] = cookies;
    }

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: jsonBody
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

function extractCookies(headers) {
  const setCookieHeader = headers['set-cookie'];
  if (!setCookieHeader) return '';
  
  return setCookieHeader
    .map(cookie => cookie.split(';')[0])
    .join('; ');
}

async function testHealthCheck() {
  log('\n🔍 Test 1: Health Check', 'cyan');
  try {
    const response = await makeRequest('GET', '/health');
    if (response.status === 200) {
      log('✅ Health check réussi', 'green');
      log(`   Status: ${response.body.status}`, 'blue');
      return true;
    } else {
      log(`❌ Health check échoué (${response.status})`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Erreur health check: ${error.message}`, 'red');
    return false;
  }
}

async function testUserRegistration() {
  log('\n🔍 Test 2: Inscription utilisateur', 'cyan');
  const testUser = {
    nom: 'Test',
    prenom: 'User',
    email: `test-${Date.now()}@example.com`,
    motDePasse: 'TestPassword123!'
  };

  try {
    const response = await makeRequest('POST', '/api/auth/register', testUser);
    if (response.status === 201) {
      log('✅ Inscription réussie', 'green');
      log(`   Email: ${testUser.email}`, 'blue');
      return { success: true, user: testUser, cookies: extractCookies(response.headers) };
    } else {
      log(`❌ Inscription échouée (${response.status})`, 'red');
      log(`   Erreur: ${JSON.stringify(response.body)}`, 'yellow');
      return { success: false };
    }
  } catch (error) {
    log(`❌ Erreur inscription: ${error.message}`, 'red');
    return { success: false };
  }
}

async function testUserLogin(user) {
  log('\n🔍 Test 3: Connexion utilisateur', 'cyan');
  const loginData = {
    email: user.email,
    motDePasse: user.motDePasse
  };

  try {
    const response = await makeRequest('POST', '/api/auth/login', loginData);
    if (response.status === 200) {
      log('✅ Connexion réussie', 'green');
      log(`   Utilisateur: ${response.body.user.prenom} ${response.body.user.nom}`, 'blue');
      return { success: true, cookies: extractCookies(response.headers) };
    } else {
      log(`❌ Connexion échouée (${response.status})`, 'red');
      log(`   Erreur: ${JSON.stringify(response.body)}`, 'yellow');
      return { success: false };
    }
  } catch (error) {
    log(`❌ Erreur connexion: ${error.message}`, 'red');
    return { success: false };
  }
}

async function testFavoritesAPI(cookies) {
  log('\n🔍 Test 4: API Favoris', 'cyan');
  
  // Test GET favoris (vide au début)
  try {
    const getResponse = await makeRequest('GET', '/api/favorites', null, cookies);
    if (getResponse.status === 200) {
      log('✅ Récupération des favoris réussie', 'green');
      log(`   Nombre de favoris: ${getResponse.body.length}`, 'blue');
    } else {
      log(`❌ Récupération des favoris échouée (${getResponse.status})`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Erreur récupération favoris: ${error.message}`, 'red');
    return false;
  }

  // Test POST nouveau favori
  const newFavorite = {
    titre: 'Test Song',
    artiste: 'Test Artist',
    url: 'https://example.com/test-song'
  };

  try {
    const postResponse = await makeRequest('POST', '/api/favorites', newFavorite, cookies);
    if (postResponse.status === 201) {
      log('✅ Ajout de favori réussi', 'green');
      log(`   Favori: ${newFavorite.titre} - ${newFavorite.artiste}`, 'blue');
      
      // Test GET favoris (avec le nouveau favori)
      const getResponse2 = await makeRequest('GET', '/api/favorites', null, cookies);
      if (getResponse2.status === 200 && getResponse2.body.length > 0) {
        log('✅ Vérification du favori ajouté réussie', 'green');
        
        // Test DELETE favori
        const favoriteId = getResponse2.body[0].id;
        const deleteResponse = await makeRequest('DELETE', `/api/favorites/${favoriteId}`, null, cookies);
        if (deleteResponse.status === 200) {
          log('✅ Suppression de favori réussie', 'green');
          return true;
        } else {
          log(`❌ Suppression de favori échouée (${deleteResponse.status})`, 'red');
          return false;
        }
      }
    } else {
      log(`❌ Ajout de favori échoué (${postResponse.status})`, 'red');
      log(`   Erreur: ${JSON.stringify(postResponse.body)}`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ Erreur API favoris: ${error.message}`, 'red');
    return false;
  }
}

async function testLogout(cookies) {
  log('\n🔍 Test 5: Déconnexion', 'cyan');
  try {
    const response = await makeRequest('POST', '/api/auth/logout', null, cookies);
    if (response.status === 200) {
      log('✅ Déconnexion réussie', 'green');
      return true;
    } else {
      log(`❌ Déconnexion échouée (${response.status})`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Erreur déconnexion: ${error.message}`, 'red');
    return false;
  }
}

async function runTests() {
  log('🚀 Démarrage des tests API Rock4you', 'cyan');
  log(`📍 URL de test: ${API_URL}`, 'blue');
  
  const results = {
    total: 5,
    passed: 0,
    failed: 0
  };

  // Test 1: Health Check
  if (await testHealthCheck()) {
    results.passed++;
  } else {
    results.failed++;
    log('\n❌ Arrêt des tests - API non accessible', 'red');
    return results;
  }

  // Test 2: Inscription
  const registrationResult = await testUserRegistration();
  if (registrationResult.success) {
    results.passed++;
  } else {
    results.failed++;
    log('\n❌ Arrêt des tests - Inscription échouée', 'red');
    return results;
  }

  // Test 3: Connexion
  const loginResult = await testUserLogin(registrationResult.user);
  if (loginResult.success) {
    results.passed++;
  } else {
    results.failed++;
    log('\n❌ Arrêt des tests - Connexion échouée', 'red');
    return results;
  }

  // Test 4: API Favoris
  if (await testFavoritesAPI(loginResult.cookies)) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 5: Déconnexion
  if (await testLogout(loginResult.cookies)) {
    results.passed++;
  } else {
    results.failed++;
  }

  return results;
}

async function main() {
  try {
    const results = await runTests();
    
    log('\n📊 Résultats des tests:', 'cyan');
    log(`✅ Tests réussis: ${results.passed}/${results.total}`, 'green');
    log(`❌ Tests échoués: ${results.failed}/${results.total}`, results.failed > 0 ? 'red' : 'green');
    
    if (results.failed === 0) {
      log('\n🎉 Tous les tests sont passés avec succès!', 'green');
      process.exit(0);
    } else {
      log('\n⚠️  Certains tests ont échoué', 'yellow');
      process.exit(1);
    }
  } catch (error) {
    log(`\n❌ Erreur inattendue: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Affichage de l'aide
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Script de test pour l'API Rock4you

Usage: node scripts/test-api.js [options]

Options:
  --local                    Tester l'API locale (http://localhost:8787)
  --url=https://example.com  URL personnalisée de l'API
  --help, -h                 Afficher cette aide

Exemples:
  node scripts/test-api.js --local
  node scripts/test-api.js --url=https://rock4you-api.workers.dev
  `);
  process.exit(0);
}

main();