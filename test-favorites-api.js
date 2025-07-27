// Test rapide de l'API des favoris
const API_BASE_URL = 'http://localhost:8787';

async function testFavoritesAPI() {
  console.log('🧪 Test de l\'API des favoris');
  
  try {
    // Test 1: Essayer d'accéder aux favoris sans authentification
    console.log('\n📝 Test 1: Accès sans authentification');
    const response1 = await fetch(`${API_BASE_URL}/api/favorites`);
    const data1 = await response1.json();
    console.log('Status:', response1.status);
    console.log('Response:', data1);
    
    if (response1.status === 401) {
      console.log('✅ Authentification requise (comportement attendu)');
    } else {
      console.log('❌ Problème: l\'authentification devrait être requise');
    }
    
    // Test 2: Tester l'inscription pour obtenir un token
    console.log('\n📝 Test 2: Inscription pour obtenir un token');
    const registerResponse = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'testuser_' + Date.now(),
        email: `test_${Date.now()}@example.com`,
        password: 'TestPassword123!'
      })
    });
    
    const registerData = await registerResponse.json();
    console.log('Register Status:', registerResponse.status);
    console.log('Register Response:', registerData);
    
    if (registerResponse.ok && registerData.data?.access_token) {
      const token = registerData.data.access_token;
      console.log('✅ Token obtenu:', token.substring(0, 20) + '...');
      
      // Test 3: Accéder aux favoris avec authentification
      console.log('\n📝 Test 3: Accès aux favoris avec authentification');
      const favoritesResponse = await fetch(`${API_BASE_URL}/api/favorites`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const favoritesData = await favoritesResponse.json();
      console.log('Favorites Status:', favoritesResponse.status);
      console.log('Favorites Response:', favoritesData);
      
      if (favoritesResponse.ok) {
        console.log('✅ API des favoris fonctionne !');
        console.log('Nombre de favoris:', favoritesData.data?.length || 0);
      } else {
        console.log('❌ Erreur API favoris:', favoritesData.error);
      }
    } else {
      console.log('❌ Échec de l\'inscription:', registerData.error);
    }
    
  } catch (error) {
    console.error('❌ Erreur de test:', error.message);
  }
}

// Exécuter le test
testFavoritesAPI();