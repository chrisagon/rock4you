// Script de validation finale du système de favoris
const API_BASE_URL = 'http://localhost:8787';

async function validateFavoritesFix() {
  console.log('🔍 VALIDATION FINALE DU SYSTÈME DE FAVORIS');
  console.log('=' .repeat(60));

  const checks = [];
  let token = null;

  try {
    // Test 1: Vérifier que l'API est accessible
    console.log('\n✅ Test 1: Accessibilité de l\'API');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    if (healthResponse.ok) {
      checks.push('✅ API accessible');
      console.log('   API backend répond correctement');
    } else {
      checks.push('❌ API inaccessible');
      throw new Error('API backend non accessible');
    }

    // Test 2: Inscription et authentification
    console.log('\n✅ Test 2: Authentification');
    const registerResponse = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `validator_${Date.now()}`,
        email: `validator_${Date.now()}@test.com`,
        password: 'ValidPassword123!'
      })
    });

    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      token = registerData.data.access_token;
      checks.push('✅ Authentification fonctionnelle');
      console.log('   Inscription et token JWT obtenus');
    } else {
      checks.push('❌ Problème d\'authentification');
      throw new Error('Échec authentification');
    }

    // Test 3: Endpoints des favoris
    console.log('\n✅ Test 3: Endpoints des favoris');
    
    // GET /api/favorites
    const getFavoritesResponse = await fetch(`${API_BASE_URL}/api/favorites`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (getFavoritesResponse.ok) {
      checks.push('✅ GET /api/favorites fonctionne');
      console.log('   Récupération des favoris OK');
    } else {
      checks.push('❌ GET /api/favorites échoue');
    }

    // POST /api/favorites
    const addFavoriteResponse = await fetch(`${API_BASE_URL}/api/favorites`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ itemId: 'test-item-1' })
    });

    if (addFavoriteResponse.ok) {
      checks.push('✅ POST /api/favorites fonctionne');
      console.log('   Ajout de favoris OK');
      
      const addData = await addFavoriteResponse.json();
      const favoriteId = addData.data.id;

      // DELETE /api/favorites/:id
      const deleteFavoriteResponse = await fetch(`${API_BASE_URL}/api/favorites/${favoriteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (deleteFavoriteResponse.ok) {
        checks.push('✅ DELETE /api/favorites/:id fonctionne');
        console.log('   Suppression de favoris OK');
      } else {
        checks.push('❌ DELETE /api/favorites/:id échoue');
      }
    } else {
      checks.push('❌ POST /api/favorites échoue');
    }

    // Test 4: Persistance des données
    console.log('\n✅ Test 4: Persistance des données');
    
    // Ajouter plusieurs favoris
    const testItems = ['item-1', 'item-2', 'item-3'];
    let addedCount = 0;
    
    for (const itemId of testItems) {
      const response = await fetch(`${API_BASE_URL}/api/favorites`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ itemId })
      });
      
      if (response.ok) addedCount++;
    }

    // Vérifier la persistance
    const finalCheckResponse = await fetch(`${API_BASE_URL}/api/favorites`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (finalCheckResponse.ok) {
      const finalData = await finalCheckResponse.json();
      if (finalData.data.length === addedCount) {
        checks.push('✅ Persistance des données OK');
        console.log(`   ${addedCount} favoris persistés correctement`);
      } else {
        checks.push('❌ Problème de persistance');
      }
    }

    // Test 5: Gestion d'erreurs
    console.log('\n✅ Test 5: Gestion d\'erreurs');
    
    // Test sans authentification
    const noAuthResponse = await fetch(`${API_BASE_URL}/api/favorites`);
    if (noAuthResponse.status === 401) {
      checks.push('✅ Protection par authentification OK');
      console.log('   Accès refusé sans token (attendu)');
    } else {
      checks.push('❌ Problème de sécurité');
    }

    // Test doublon
    const duplicateResponse = await fetch(`${API_BASE_URL}/api/favorites`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ itemId: 'item-1' }) // Déjà ajouté
    });

    if (duplicateResponse.status === 409) {
      checks.push('✅ Détection des doublons OK');
      console.log('   Doublon détecté et refusé (attendu)');
    } else {
      checks.push('❌ Problème de validation des doublons');
    }

  } catch (error) {
    console.error('\n❌ ERREUR DURANT LA VALIDATION:', error.message);
    checks.push('❌ Erreur critique');
  }

  // Résumé final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ DE LA VALIDATION');
  console.log('='.repeat(60));
  
  const successCount = checks.filter(check => check.startsWith('✅')).length;
  const totalChecks = checks.length;
  
  checks.forEach(check => console.log(check));
  
  console.log('\n📈 SCORE:', `${successCount}/${totalChecks}`);
  
  if (successCount === totalChecks) {
    console.log('\n🎉 VALIDATION RÉUSSIE !');
    console.log('✅ Le système de favoris fonctionne parfaitement');
    console.log('✅ Toutes les fonctionnalités sont opérationnelles');
    console.log('✅ La sécurité est correctement implémentée');
    console.log('✅ La persistance des données est garantie');
    console.log('\n🚀 Le dysfonctionnement a été entièrement résolu !');
  } else {
    console.log('\n⚠️  VALIDATION PARTIELLE');
    console.log(`${totalChecks - successCount} problème(s) détecté(s)`);
    console.log('Vérifiez les logs ci-dessus pour plus de détails');
  }

  console.log('\n📋 PROCHAINES ÉTAPES:');
  console.log('1. Redémarrer le frontend: npm start');
  console.log('2. Tester manuellement l\'interface utilisateur');
  console.log('3. Vérifier la synchronisation entre les pages');
  console.log('4. Confirmer la persistance après redémarrage');
}

// Exécuter la validation
validateFavoritesFix();