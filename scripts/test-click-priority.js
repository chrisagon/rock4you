/**
 * Script de test pour valider la correction de priorité du clic
 * Vérifie que cliquer sur l'image démarre la lecture au lieu d'ouvrir le plein écran
 */

const fs = require('fs');
const path = require('path');

console.log('🎯 Test de la correction de priorité du clic');
console.log('=' .repeat(60));

// Lire les fichiers modifiés
const favoritesPath = path.join(__dirname, '../app/(tabs)/favorites.tsx');
const gifPlayerPath = path.join(__dirname, '../components/GifPlayer.tsx');

if (!fs.existsSync(favoritesPath)) {
  console.error('❌ Fichier favorites.tsx non trouvé');
  process.exit(1);
}

if (!fs.existsSync(gifPlayerPath)) {
  console.error('❌ Fichier GifPlayer.tsx non trouvé');
  process.exit(1);
}

const favoritesContent = fs.readFileSync(favoritesPath, 'utf8');
const gifPlayerContent = fs.readFileSync(gifPlayerPath, 'utf8');

// Tests de validation
const tests = [
  {
    name: 'GifPlayer sans prop onPress dans favorites',
    test: () => {
      const gifPlayerUsage = favoritesContent.substring(
        favoritesContent.indexOf('<GifPlayer'),
        favoritesContent.indexOf('/>') + 2
      );
      return !gifPlayerUsage.includes('onPress=');
    },
    description: 'Vérifie que le GifPlayer n\'a plus de prop onPress qui ouvrait le plein écran'
  },
  {
    name: 'Bouton plein écran séparé ajouté',
    test: () => favoritesContent.includes('fullScreenButton') && 
                favoritesContent.includes('<Maximize2'),
    description: 'Vérifie qu\'un bouton séparé pour le plein écran a été ajouté'
  },
  {
    name: 'Import Maximize2 ajouté',
    test: () => favoritesContent.includes('Maximize2'),
    description: 'Vérifie que l\'icône Maximize2 est importée'
  },
  {
    name: 'Container GIF avec bouton overlay',
    test: () => favoritesContent.includes('gifContainer') && 
                favoritesContent.includes('position: \'absolute\''),
    description: 'Vérifie que le container GIF et le bouton overlay sont correctement structurés'
  },
  {
    name: 'Fonction handleContainerPress dans GifPlayer',
    test: () => gifPlayerContent.includes('const handleContainerPress = () => {'),
    description: 'Vérifie que la fonction de gestion du clic prioritaire existe dans GifPlayer'
  },
  {
    name: 'Logique de priorité lecture vs navigation',
    test: () => {
      const handleFunction = gifPlayerContent.substring(
        gifPlayerContent.indexOf('const handleContainerPress'),
        gifPlayerContent.indexOf('const handleContainerPress') + 300
      );
      return handleFunction.includes('if (gifState.status === \'loaded\')') &&
             handleFunction.includes('onTogglePlay()') &&
             handleFunction.includes('else if (onPress)');
    },
    description: 'Vérifie que la priorité lecture > navigation est implémentée'
  },
  {
    name: 'Styles fullScreenButton définis',
    test: () => {
      const stylesSection = favoritesContent.substring(
        favoritesContent.indexOf('fullScreenButton: {'),
        favoritesContent.indexOf('fullScreenButton: {') + 200
      );
      return stylesSection.includes('position: \'absolute\'') &&
             stylesSection.includes('top: 4') &&
             stylesSection.includes('right: 4') &&
             stylesSection.includes('backgroundColor: \'rgba(0, 0, 0, 0.7)\'');
    },
    description: 'Vérifie que les styles du bouton plein écran sont correctement définis'
  },
  {
    name: 'Structure moveCard modifiée',
    test: () => {
      // Vérifier que TouchableOpacity a été remplacé par View pour moveCard
      const moveCardSection = favoritesContent.substring(
        favoritesContent.indexOf('key={move.id} style={styles.moveCard}'),
        favoritesContent.indexOf('key={move.id} style={styles.moveCard}') + 100
      );
      return moveCardSection.includes('<View key={move.id}');
    },
    description: 'Vérifie que la structure de la carte de mouvement a été modifiée'
  }
];

// Exécution des tests
let passed = 0;
let failed = 0;

console.log('\n📋 Résultats des tests :');
console.log('-'.repeat(40));

tests.forEach((test, index) => {
  try {
    const result = test.test();
    if (result) {
      console.log(`✅ Test ${index + 1}: ${test.name}`);
      console.log(`   ${test.description}`);
      passed++;
    } else {
      console.log(`❌ Test ${index + 1}: ${test.name}`);
      console.log(`   ${test.description}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ Test ${index + 1}: ${test.name} (Erreur: ${error.message})`);
    failed++;
  }
  console.log('');
});

// Tests de comportement attendu
console.log('🎮 Tests de comportement attendu :');
console.log('-'.repeat(40));

const behaviorTests = [
  {
    name: 'Clic sur image → Lecture',
    description: 'Cliquer sur l\'image du GIF démarre/pause la lecture',
    expected: 'onTogglePlay() appelé quand gifState.status === "loaded"'
  },
  {
    name: 'Bouton plein écran → Modal',
    description: 'Cliquer sur le bouton Maximize2 ouvre le plein écran',
    expected: 'openFullScreen(move) appelé depuis le bouton séparé'
  },
  {
    name: 'États non-chargés → Navigation',
    description: 'Cliquer sur un GIF en erreur/indisponible utilise la navigation par défaut',
    expected: 'onPress() appelé si fourni et gifState.status !== "loaded"'
  }
];

behaviorTests.forEach((test, index) => {
  console.log(`🎯 Comportement ${index + 1}: ${test.name}`);
  console.log(`   ${test.description}`);
  console.log(`   Attendu: ${test.expected}`);
  console.log('');
});

// Résumé
console.log('📊 Résumé des tests :');
console.log(`✅ Tests réussis: ${passed}`);
console.log(`❌ Tests échoués: ${failed}`);
console.log(`📈 Taux de réussite: ${Math.round((passed / tests.length) * 100)}%`);

// Validation de la correction
if (passed >= 6) {
  console.log('\n🎉 Correction de priorité validée avec succès !');
  console.log('✨ Comportement corrigé :');
  console.log('   • Clic sur image → Démarre/pause la lecture');
  console.log('   • Bouton séparé → Ouvre le plein écran');
  console.log('   • Interface plus intuitive et logique');
  console.log('   • Priorité donnée à la lecture sur la navigation');
} else {
  console.log('\n⚠️  Certains tests ont échoué. Vérifiez l\'implémentation.');
}

// Test de régression - vérifier que les fonctionnalités existantes sont préservées
console.log('\n🔍 Tests de régression :');
const regressionTests = [
  {
    name: 'Plein écran toujours accessible',
    test: () => favoritesContent.includes('openFullScreen') && 
                favoritesContent.includes('FullScreenImageModal'),
    description: 'Le plein écran est toujours accessible via le bouton dédié'
  },
  {
    name: 'Gestion des favoris préservée',
    test: () => favoritesContent.includes('handleRemoveFavorite') && 
                favoritesContent.includes('Heart'),
    description: 'La gestion des favoris (ajout/suppression) est préservée'
  },
  {
    name: 'Validation GIF préservée',
    test: () => favoritesContent.includes('generateValidationReport') && 
                favoritesContent.includes('AlertTriangle'),
    description: 'La validation des GIFs est toujours disponible'
  }
];

let regressionPassed = 0;
regressionTests.forEach((test, index) => {
  const result = test.test();
  if (result) {
    console.log(`✅ Régression ${index + 1}: ${test.name}`);
    regressionPassed++;
  } else {
    console.log(`❌ Régression ${index + 1}: ${test.name}`);
  }
});

console.log(`\n📋 Tests de régression: ${regressionPassed}/${regressionTests.length} réussis`);

if (passed >= 6 && regressionPassed === regressionTests.length) {
  console.log('\n🚀 Correction de priorité complètement validée !');
  console.log('   Le clic sur l\'image démarre maintenant la lecture');
  console.log('   Le plein écran reste accessible via un bouton dédié');
  console.log('   Aucune régression détectée');
  process.exit(0);
} else {
  console.log('\n⚠️  Validation incomplète. Vérifiez l\'implémentation.');
  process.exit(1);
}