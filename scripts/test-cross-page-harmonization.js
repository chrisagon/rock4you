/**
 * Script de test pour valider l'harmonisation du comportement GIF
 * sur les pages Accueil, Recherche et Favoris
 */

const fs = require('fs');
const path = require('path');

console.log('🎯 Test d\'harmonisation cross-page');
console.log('=' .repeat(60));

// Lire les fichiers des trois pages
const indexPath = path.join(__dirname, '../app/(tabs)/index.tsx');
const searchPath = path.join(__dirname, '../app/(tabs)/search.tsx');
const favoritesPath = path.join(__dirname, '../app/(tabs)/favorites.tsx');

const files = [
  { name: 'Accueil (index.tsx)', path: indexPath },
  { name: 'Recherche (search.tsx)', path: searchPath },
  { name: 'Favoris (favorites.tsx)', path: favoritesPath }
];

// Vérifier que tous les fichiers existent
for (const file of files) {
  if (!fs.existsSync(file.path)) {
    console.error(`❌ Fichier ${file.name} non trouvé`);
    process.exit(1);
  }
}

// Lire le contenu des fichiers
const contents = files.map(file => ({
  name: file.name,
  content: fs.readFileSync(file.path, 'utf8')
}));

console.log('\n📋 Tests d\'harmonisation :');
console.log('-'.repeat(40));

// Tests d'harmonisation
const harmonizationTests = [
  {
    name: 'Import GifPlayer',
    test: (content) => content.includes('import GifPlayer from \'@/components/GifPlayer\''),
    description: 'Vérifie que GifPlayer est importé'
  },
  {
    name: 'Import Maximize2',
    test: (content) => content.includes('Maximize2'),
    description: 'Vérifie que l\'icône Maximize2 est importée'
  },
  {
    name: 'Utilisation GifPlayer',
    test: (content) => content.includes('<GifPlayer') && 
                       content.includes('move={move}') &&
                       content.includes('isPlaying={playingGifs.has(move.id)}') &&
                       content.includes('onTogglePlay={() => toggleGifPlayback(move.id)}'),
    description: 'Vérifie que GifPlayer est utilisé avec les bonnes props'
  },
  {
    name: 'Container GIF',
    test: (content) => content.includes('gifContainer'),
    description: 'Vérifie que le container GIF est présent'
  },
  {
    name: 'Bouton plein écran',
    test: (content) => content.includes('fullScreenButton') && 
                       content.includes('onPress={() => openFullScreen(move)}'),
    description: 'Vérifie que le bouton plein écran est présent'
  },
  {
    name: 'Styles harmonisés',
    test: (content) => content.includes('gifContainer: {') && 
                       content.includes('fullScreenButton: {') &&
                       content.includes('position: \'absolute\''),
    description: 'Vérifie que les styles harmonisés sont définis'
  },
  {
    name: 'Suppression anciens styles',
    test: (content) => !content.includes('moveImageContainer') && 
                       !content.includes('playButton: {') &&
                       !content.includes('noGifIndicator'),
    description: 'Vérifie que les anciens styles ont été supprimés'
  },
  {
    name: 'Suppression getImageSource',
    test: (content) => !content.includes('const getImageSource'),
    description: 'Vérifie que la fonction getImageSource obsolète a été supprimée'
  },
  {
    name: 'Structure View au lieu de TouchableOpacity',
    test: (content) => content.includes('<View key={move.id} style={styles.moveCard}>'),
    description: 'Vérifie que la structure utilise View au lieu de TouchableOpacity'
  }
];

// Exécution des tests pour chaque page
let totalPassed = 0;
let totalTests = 0;

contents.forEach((file, fileIndex) => {
  console.log(`\n📄 ${file.name} :`);
  console.log('-'.repeat(30));
  
  let pagePassed = 0;
  
  harmonizationTests.forEach((test, testIndex) => {
    totalTests++;
    try {
      const result = test.test(file.content);
      if (result) {
        console.log(`✅ ${test.name}`);
        pagePassed++;
        totalPassed++;
      } else {
        console.log(`❌ ${test.name}`);
        console.log(`   ${test.description}`);
      }
    } catch (error) {
      console.log(`❌ ${test.name} (Erreur: ${error.message})`);
    }
  });
  
  const pageScore = Math.round((pagePassed / harmonizationTests.length) * 100);
  console.log(`📊 Score: ${pagePassed}/${harmonizationTests.length} (${pageScore}%)`);
});

// Tests de cohérence entre pages
console.log('\n🔄 Tests de cohérence inter-pages :');
console.log('-'.repeat(40));

const consistencyTests = [
  {
    name: 'Même structure GifPlayer',
    test: () => {
      const gifPlayerUsages = contents.map(file => {
        const match = file.content.match(/<GifPlayer[\s\S]*?\/>/);
        return match ? match[0] : null;
      });
      
      // Vérifier que toutes les pages utilisent GifPlayer de manière similaire
      return gifPlayerUsages.every(usage => 
        usage && 
        usage.includes('move={move}') && 
        usage.includes('isPlaying=') && 
        usage.includes('onTogglePlay=')
      );
    },
    description: 'Toutes les pages utilisent GifPlayer de manière cohérente'
  },
  {
    name: 'Même structure bouton plein écran',
    test: () => {
      return contents.every(file => 
        file.content.includes('fullScreenButton') &&
        file.content.includes('<Maximize2 size={16} color="#FFF" />')
      );
    },
    description: 'Toutes les pages ont le même bouton plein écran'
  },
  {
    name: 'Même structure de styles',
    test: () => {
      const stylePatterns = [
        'gifContainer: {',
        'position: \'relative\'',
        'fullScreenButton: {',
        'position: \'absolute\'',
        'top: 4',
        'right: 4'
      ];
      
      return contents.every(file => 
        stylePatterns.every(pattern => file.content.includes(pattern))
      );
    },
    description: 'Toutes les pages ont les mêmes styles harmonisés'
  },
  {
    name: 'Suppression cohérente ancien code',
    test: () => {
      const obsoletePatterns = [
        'getImageSource',
        'moveImageContainer',
        'playButton: {',
        'noGifIndicator'
      ];
      
      return contents.every(file => 
        obsoletePatterns.every(pattern => !file.content.includes(pattern))
      );
    },
    description: 'L\'ancien code a été supprimé de manière cohérente'
  }
];

let consistencyPassed = 0;
consistencyTests.forEach((test, index) => {
  try {
    const result = test.test();
    if (result) {
      console.log(`✅ ${test.name}`);
      consistencyPassed++;
    } else {
      console.log(`❌ ${test.name}`);
      console.log(`   ${test.description}`);
    }
  } catch (error) {
    console.log(`❌ ${test.name} (Erreur: ${error.message})`);
  }
});

// Résumé global
console.log('\n📊 Résumé global :');
console.log('-'.repeat(40));
console.log(`✅ Tests d'harmonisation: ${totalPassed}/${totalTests} (${Math.round((totalPassed / totalTests) * 100)}%)`);
console.log(`✅ Tests de cohérence: ${consistencyPassed}/${consistencyTests.length} (${Math.round((consistencyPassed / consistencyTests.length) * 100)}%)`);

const overallScore = Math.round(((totalPassed + consistencyPassed) / (totalTests + consistencyTests.length)) * 100);
console.log(`📈 Score global: ${overallScore}%`);

// Validation finale
if (overallScore >= 90) {
  console.log('\n🎉 Harmonisation réussie !');
  console.log('✨ Comportement uniforme sur les trois pages :');
  console.log('   • Clic sur image → Démarre/pause la lecture');
  console.log('   • Bouton Maximize2 → Ouvre le plein écran');
  console.log('   • Gestion d\'erreur et cache automatiques');
  console.log('   • Interface cohérente et professionnelle');
} else if (overallScore >= 75) {
  console.log('\n⚠️  Harmonisation partiellement réussie');
  console.log('   Quelques ajustements mineurs peuvent être nécessaires');
} else {
  console.log('\n❌ Harmonisation incomplète');
  console.log('   Des corrections importantes sont nécessaires');
}

// Tests de régression
console.log('\n🔍 Tests de régression :');
const regressionTests = [
  {
    name: 'Fonctionnalités favoris préservées',
    test: () => contents.every(file => 
      file.content.includes('toggleFavorite') && 
      file.content.includes('Heart')
    ),
    description: 'La gestion des favoris est préservée sur toutes les pages'
  },
  {
    name: 'Modal plein écran préservée',
    test: () => contents.every(file => 
      file.content.includes('FullScreenImageModal') && 
      file.content.includes('openFullScreen')
    ),
    description: 'La modal plein écran est préservée sur toutes les pages'
  },
  {
    name: 'Gestion état lecture préservée',
    test: () => contents.every(file => 
      file.content.includes('playingGifs') && 
      file.content.includes('toggleGifPlayback')
    ),
    description: 'La gestion de l\'état de lecture est préservée'
  }
];

let regressionPassed = 0;
regressionTests.forEach((test, index) => {
  const result = test.test();
  if (result) {
    console.log(`✅ ${test.name}`);
    regressionPassed++;
  } else {
    console.log(`❌ ${test.name}`);
  }
});

console.log(`\n📋 Tests de régression: ${regressionPassed}/${regressionTests.length} réussis`);

if (overallScore >= 90 && regressionPassed === regressionTests.length) {
  console.log('\n🚀 Harmonisation complètement validée !');
  console.log('   Comportement uniforme sur toutes les pages');
  console.log('   Aucune régression détectée');
  console.log('   Interface cohérente et professionnelle');
  process.exit(0);
} else {
  console.log('\n⚠️  Validation incomplète. Vérifiez l\'implémentation.');
  process.exit(1);
}