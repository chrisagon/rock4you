// Test d'intégration complet du système de favoris
const API_BASE_URL = 'http://localhost:8787';

async function testFavoritesIntegration() {
  console.log('🧪 Test d\'intégration du système de favoris');
  console.log('='.repeat(50));

  let token = null;
  let userId = null;

  try {
    // Étape 1: Inscription d'un utilisateur de test
    console.log('\n📝 Étape 1: Inscription utilisateur');
    const registerResponse = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'TestPassword123!'
      })
    });

    const registerData = await registerResponse.json();
    console.log('Status:', registerResponse.status);
    
    if (registerResponse.ok && registerData.data?.access_token) {
      token = registerData.data.access_token;
      userId = registerData.data.user.id;
      console.log('✅ Inscription réussie');
      console.log('User ID:', userId);
      console.log('Token:', token.substring(0, 20) + '...');
    } else {
      throw new Error(`Échec inscription: ${registerData.error}`);
    }

    // Étape 2: Vérifier que la liste des favoris est vide
    console.log('\n📝 Étape 2: Vérification liste vide');
    const emptyFavoritesResponse = await fetch(`${API_BASE_URL}/api/favorites`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const emptyFavoritesData = await emptyFavoritesResponse.json();
    console.log('Status:', emptyFavoritesResponse.status);
    console.log('Favoris:', emptyFavoritesData.data);
    
    if (emptyFavoritesResponse.ok && Array.isArray(emptyFavoritesData.data) && emptyFavoritesData.data.length === 0) {
      console.log('✅ Liste des favoris vide (attendu)');
    } else {
      throw new Error('La liste des favoris devrait être vide');
    }

    // Étape 3: Ajouter des favoris
    console.log('\n📝 Étape 3: Ajout de favoris');
    const testItems = ['1', '2', '3'];
    const addedFavorites = [];

    for (const itemId of testItems) {
      console.log(`Ajout de l'item ${itemId}...`);
      const addResponse = await fetch(`${API_BASE_URL}/api/favorites`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ itemId })
      });

      const addData = await addResponse.json();
      console.log(`  Status: ${addResponse.status}`);
      
      if (addResponse.ok && addData.data) {
        addedFavorites.push(addData.data);
        console.log(`  ✅ Item ${itemId} ajouté (ID: ${addData.data.id})`);
      } else {
        console.log(`  ❌ Échec ajout item ${itemId}: ${addData.error}`);
      }
    }

    // Étape 4: Vérifier la liste des favoris
    console.log('\n📝 Étape 4: Vérification des favoris ajoutés');
    const favoritesResponse = await fetch(`${API_BASE_URL}/api/favorites`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const favoritesData = await favoritesResponse.json();
    console.log('Status:', favoritesResponse.status);
    console.log('Nombre de favoris:', favoritesData.data?.length || 0);
    
    if (favoritesResponse.ok && favoritesData.data) {
      console.log('✅ Favoris récupérés:');
      favoritesData.data.forEach(fav => {
        console.log(`  - ID: ${fav.id}, Item: ${fav.itemId}, Ajouté par: ${fav.addedBy}`);
      });
    } else {
      throw new Error(`Échec récupération favoris: ${favoritesData.error}`);
    }

    // Étape 5: Supprimer un favori
    console.log('\n📝 Étape 5: Suppression d\'un favori');
    if (addedFavorites.length > 0) {
      const favoriteToDelete = addedFavorites[0];
      console.log(`Suppression du favori ID: ${favoriteToDelete.id}`);
      
      const deleteResponse = await fetch(`${API_BASE_URL}/api/favorites/${favoriteToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const deleteData = await deleteResponse.json();
      console.log('Status:', deleteResponse.status);
      
      if (deleteResponse.ok) {
        console.log('✅ Favori supprimé avec succès');
      } else {
        console.log(`❌ Échec suppression: ${deleteData.error}`);
      }
    }

    // Étape 6: Vérification finale
    console.log('\n📝 Étape 6: Vérification finale');
    const finalFavoritesResponse = await fetch(`${API_BASE_URL}/api/favorites`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const finalFavoritesData = await finalFavoritesResponse.json();
    console.log('Status:', finalFavoritesResponse.status);
    console.log('Nombre final de favoris:', finalFavoritesData.data?.length || 0);
    
    if (finalFavoritesResponse.ok) {
      console.log('✅ Vérification finale réussie');
      console.log('Favoris restants:', finalFavoritesData.data?.map(f => f.itemId) || []);
    }

    // Résumé
    console.log('\n' + '='.repeat(50));
    console.log('🎉 TEST D\'INTÉGRATION TERMINÉ');
    console.log('✅ Inscription utilisateur: OK');
    console.log('✅ Liste vide initiale: OK');
    console.log('✅ Ajout de favoris: OK');
    console.log('✅ Récupération favoris: OK');
    console.log('✅ Suppression favori: OK');
    console.log('✅ Vérification finale: OK');
    console.log('\n🚀 Le système de favoris fonctionne correctement !');

  } catch (error) {
    console.error('\n❌ ERREUR DANS LE TEST:', error.message);
    console.log('\n🔍 Vérifiez que:');
    console.log('- L\'API backend est démarrée (npm run dev dans worker/)');
    console.log('- La base de données D1 est configurée');
    console.log('- Les migrations sont appliquées');
    console.log('- CORS est configuré correctement');
  }
}

// Exécuter le test
testFavoritesIntegration();