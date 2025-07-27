/**
 * Tests d'intégration pour l'API Rock4you
 * 
 * Ces tests vérifient le bon fonctionnement des endpoints principaux
 * et peuvent être utilisés pour valider l'intégration avec le frontend.
 */

// Configuration de test
const API_BASE_URL = 'http://localhost:8787';
const TEST_USER = {
  nom: 'Test',
  prenom: 'User',
  email: 'test@example.com',
  mot_de_passe: 'TestPassword123!'
};

let authToken = null;
let testListId = null;

/**
 * Utilitaire pour faire des requêtes HTTP
 */
async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    defaultHeaders.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  const data = await response.json();
  return { response, data };
}

/**
 * Test 1: Vérification de l'état de santé de l'API
 */
async function testHealthCheck() {
  console.log('🔍 Test: Health Check...');
  
  const { response, data } = await makeRequest('/health');
  
  if (response.status === 200 && data.status === 'healthy') {
    console.log('✅ Health Check: OK');
    return true;
  } else {
    console.error('❌ Health Check: FAILED', data);
    return false;
  }
}

/**
 * Test 2: Inscription d'un nouvel utilisateur
 */
async function testUserRegistration() {
  console.log('🔍 Test: User Registration...');
  
  const { response, data } = await makeRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(TEST_USER),
  });
  
  if (response.status === 201 && data.success) {
    console.log('✅ User Registration: OK');
    console.log(`   User ID: ${data.data.user.id}`);
    return true;
  } else {
    console.error('❌ User Registration: FAILED', data);
    return false;
  }
}

/**
 * Test 3: Connexion utilisateur
 */
async function testUserLogin() {
  console.log('🔍 Test: User Login...');
  
  const { response, data } = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: TEST_USER.email,
      mot_de_passe: TEST_USER.mot_de_passe,
    }),
  });
  
  if (response.status === 200 && data.success && data.data.access_token) {
    authToken = data.data.access_token;
    console.log('✅ User Login: OK');
    console.log(`   Token: ${authToken.substring(0, 20)}...`);
    return true;
  } else {
    console.error('❌ User Login: FAILED', data);
    return false;
  }
}

/**
 * Test 4: Récupération du profil utilisateur
 */
async function testGetProfile() {
  console.log('🔍 Test: Get User Profile...');
  
  const { response, data } = await makeRequest('/api/users/profile');
  
  if (response.status === 200 && data.success) {
    console.log('✅ Get Profile: OK');
    console.log(`   User: ${data.data.prenom} ${data.data.nom}`);
    return true;
  } else {
    console.error('❌ Get Profile: FAILED', data);
    return false;
  }
}

/**
 * Test 5: Création d'une liste de favoris
 */
async function testCreateList() {
  console.log('🔍 Test: Create Favorite List...');
  
  const listData = {
    nom: 'Ma Liste de Test',
    description: 'Liste créée pour les tests d\'intégration',
    est_publique: false,
  };
  
  const { response, data } = await makeRequest('/api/lists', {
    method: 'POST',
    body: JSON.stringify(listData),
  });
  
  if (response.status === 201 && data.success) {
    testListId = data.data.id;
    console.log('✅ Create List: OK');
    console.log(`   List ID: ${testListId}`);
    return true;
  } else {
    console.error('❌ Create List: FAILED', data);
    return false;
  }
}

/**
 * Test 6: Ajout de passes à la liste
 */
async function testAddMovesToList() {
  console.log('🔍 Test: Add Moves to List...');
  
  const moves = [
    { passe_id: 'move_001', nom: 'Passe Test 1' },
    { passe_id: 'move_002', nom: 'Passe Test 2' },
    { passe_id: 'move_003', nom: 'Passe Test 3' },
  ];
  
  const { response, data } = await makeRequest(`/api/lists/${testListId}/moves/batch`, {
    method: 'POST',
    body: JSON.stringify({ passe_ids: moves.map(m => m.passe_id) }),
  });
  
  if (response.status === 201 && data.success) {
    console.log('✅ Add Moves: OK');
    console.log(`   Added ${data.data.added_count} moves`);
    return true;
  } else {
    console.error('❌ Add Moves: FAILED', data);
    return false;
  }
}

/**
 * Test 7: Récupération des listes utilisateur
 */
async function testGetUserLists() {
  console.log('🔍 Test: Get User Lists...');
  
  const { response, data } = await makeRequest('/api/lists');
  
  if (response.status === 200 && data.success && Array.isArray(data.data)) {
    console.log('✅ Get Lists: OK');
    console.log(`   Found ${data.data.length} lists`);
    return true;
  } else {
    console.error('❌ Get Lists: FAILED', data);
    return false;
  }
}

/**
 * Test 8: Récupération des passes d'une liste
 */
async function testGetListMoves() {
  console.log('🔍 Test: Get List Moves...');
  
  const { response, data } = await makeRequest(`/api/lists/${testListId}/moves`);
  
  if (response.status === 200 && data.success && Array.isArray(data.data)) {
    console.log('✅ Get Moves: OK');
    console.log(`   Found ${data.data.length} moves in list`);
    return true;
  } else {
    console.error('❌ Get Moves: FAILED', data);
    return false;
  }
}

/**
 * Test 9: Suppression d'une passe de la liste
 */
async function testRemoveMoveFromList() {
  console.log('🔍 Test: Remove Move from List...');
  
  const { response, data } = await makeRequest(`/api/lists/${testListId}/moves/move_001`, {
    method: 'DELETE',
  });
  
  if (response.status === 200 && data.success) {
    console.log('✅ Remove Move: OK');
    return true;
  } else {
    console.error('❌ Remove Move: FAILED', data);
    return false;
  }
}

/**
 * Test 10: Nettoyage - Suppression de la liste de test
 */
async function testCleanup() {
  console.log('🔍 Test: Cleanup - Delete Test List...');
  
  const { response, data } = await makeRequest(`/api/lists/${testListId}`, {
    method: 'DELETE',
  });
  
  if (response.status === 200 && data.success) {
    console.log('✅ Cleanup: OK');
    return true;
  } else {
    console.error('❌ Cleanup: FAILED', data);
    return false;
  }
}

/**
 * Exécution de tous les tests
 */
async function runAllTests() {
  console.log('🚀 Démarrage des tests d\'intégration API Rock4you\n');
  
  const tests = [
    testHealthCheck,
    testUserRegistration,
    testUserLogin,
    testGetProfile,
    testCreateList,
    testAddMovesToList,
    testGetUserLists,
    testGetListMoves,
    testRemoveMoveFromList,
    testCleanup,
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`❌ Test failed with error:`, error.message);
      failed++;
    }
    console.log(''); // Ligne vide entre les tests
  }
  
  console.log('📊 Résultats des tests:');
  console.log(`   ✅ Réussis: ${passed}`);
  console.log(`   ❌ Échoués: ${failed}`);
  console.log(`   📈 Taux de réussite: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 Tous les tests sont passés ! L\'API est prête pour l\'intégration.');
  } else {
    console.log('\n⚠️  Certains tests ont échoué. Vérifiez la configuration et les logs.');
  }
}

// Exporter pour utilisation en module ou exécuter directement
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runAllTests,
    makeRequest,
    API_BASE_URL,
  };
} else {
  // Exécution directe dans le navigateur ou Node.js
  runAllTests().catch(console.error);
}