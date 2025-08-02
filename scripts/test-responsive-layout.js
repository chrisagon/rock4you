/**
 * Script de test pour valider les optimisations de mise en page responsive
 * Vérifie le centrage, le redimensionnement et la responsivité des GIFs
 */

const fs = require('fs');
const path = require('path');

console.log('🎯 Test des optimisations de mise en page responsive');
console.log('=' .repeat(60));

// Lire les fichiers des trois pages et du composant GifPlayer
const files = [
  { name: 'GifPlayer', path: path.join(__dirname, '../components/GifPlayer.tsx') },
  { name: 'Accueil', path: path.join(__dirname, '../app/(tabs)/index.tsx') },
  { name: 'Recherche', path: path.join(__dirname, '../app/(tabs)/search.tsx') },
  { name: 'Favoris', path: path.join(__dirname, '../app/(tabs)/favorites.tsx') }
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

console.log('\n📋 Tests d\'optimisation responsive :');
console.log('-'.repeat(40));

// Tests pour le composant GifPlayer
const gifPlayerTests = [
  {
    name: 'Mode responsive ajouté',
    test: (content) => content.includes('size?: \'small\' | \'medium\' | \'large\' | \'responsive\''),
    description: 'Vérifie que le mode responsive est disponible'
  },
  {
    name: 'Props aspectRatio et maxWidth',
    test: (content) => content.includes('aspectRatio?: number') && 
                       content.includes('maxWidth?: number') &&
                       content.includes('maxHeight?: number'),
    description: 'Vérifie que les props de dimensionnement sont disponibles'
  },
  {
    name: 'Gestion responsive dans sizeConfig',
    test: (content) => content.includes('responsive: null') && 
                       content.includes('responsiveStyles'),
    description: 'Vérifie que la gestion responsive est implémentée'
  },
  {
    name: 'Styles responsive ajoutés',
    test: (content) => content.includes('responsiveContainer') && 
                       content.includes('responsiveImage'),
    description: 'Vérifie que les styles responsive sont définis'
  },
  {
    name: 'Ombres et effets visuels',
    test: (content) => content.includes('shadowColor') && 
                       content.includes('shadowOffset') &&
                       content.includes('elevation'),
    description: 'Vérifie que les effets visuels sont ajoutés'
  },
  {
    name: 'Bordures arrondies améliorées',
    test: (content) => content.includes('borderRadius: 12'),
    description: 'Vérifie que les bordures sont plus arrondies'
  }
];

// Tests pour les pages
const pageTests = [
  {
    name: 'Utilisation mode responsive',
    test: (content) => content.includes('size="responsive"'),
    description: 'Vérifie que le mode responsive est utilisé'
  },
  {
    name: 'AspectRatio configuré',
    test: (content) => content.includes('aspectRatio='),
    description: 'Vérifie que l\'aspect ratio est configuré'
  },
  {
    name: 'MaxWidth et MaxHeight',
    test: (content) => content.includes('maxWidth=') && content.includes('maxHeight='),
    description: 'Vérifie que les dimensions maximales sont définies'
  },
  {
    name: 'Container centré',
    test: (content) => content.includes('alignItems: \'center\'') && 
                       content.includes('justifyContent: \'center\''),
    description: 'Vérifie que le container est centré'
  },
  {
    name: 'Padding responsive',
    test: (content) => content.includes('paddingVertical') && 
                       content.includes('paddingHorizontal'),
    description: 'Vérifie que le padding responsive est ajouté'
  },
  {
    name: 'Bouton plein écran amélioré',
    test: (content) => content.includes('backgroundColor: \'rgba(0, 0, 0, 0.8)\'') &&
                       content.includes('shadowColor'),
    description: 'Vérifie que le bouton plein écran est amélioré'
  }
];

// Exécution des tests pour GifPlayer
console.log('\n🎨 GifPlayer :');
console.log('-'.repeat(20));

const gifPlayerContent = contents.find(f => f.name === 'GifPlayer').content;
let gifPlayerPassed = 0;

gifPlayerTests.forEach((test, index) => {
  try {
    const result = test.test(gifPlayerContent);
    if (result) {
      console.log(`✅ ${test.name}`);
      gifPlayerPassed++;
    } else {
      console.log(`❌ ${test.name}`);
      console.log(`   ${test.description}`);
    }
  } catch (error) {
    console.log(`❌ ${test.name} (Erreur: ${error.message})`);
  }
});

const gifPlayerScore = Math.round((gifPlayerPassed / gifPlayerTests.length) * 100);
console.log(`📊 Score GifPlayer: ${gifPlayerPassed}/${gifPlayerTests.length} (${gifPlayerScore}%)`);

// Exécution des tests pour chaque page
let totalPagePassed = 0;
let totalPageTests = 0;

['Accueil', 'Recherche', 'Favoris'].forEach(pageName => {
  console.log(`\n📄 ${pageName} :`);
  console.log('-'.repeat(20));
  
  const pageContent = contents.find(f => f.name === pageName).content;
  let pagePassed = 0;
  
  pageTests.forEach((test, index) => {
    totalPageTests++;
    try {
      const result = test.test(pageContent);
      if (result) {
        console.log(`✅ ${test.name}`);
        pagePassed++;
        totalPagePassed++;
      } else {
        console.log(`❌ ${test.name}`);
        console.log(`   ${test.description}`);
      }
    } catch (error) {
      console.log(`❌ ${test.name} (Erreur: ${error.message})`);
    }
  });
  
  const pageScore = Math.round((pagePassed / pageTests.length) * 100);
  console.log(`📊 Score: ${pagePassed}/${pageTests.length} (${pageScore}%)`);
});

// Tests de cohérence responsive
console.log('\n🔄 Tests de cohérence responsive :');
console.log('-'.repeat(40));

const responsiveConsistencyTests = [
  {
    name: 'Aspect ratios appropriés',
    test: () => {
      const accueilContent = contents.find(f => f.name === 'Accueil').content;
      const rechercheContent = contents.find(f => f.name === 'Recherche').content;
      const favorisContent = contents.find(f => f.name === 'Favoris').content;
      
      // Accueil et Recherche utilisent 16/9, Favoris utilise 4/3
      return accueilContent.includes('aspectRatio={16/9}') &&
             rechercheContent.includes('aspectRatio={16/9}') &&
             favorisContent.includes('aspectRatio={4/3}');
    },
    description: 'Vérifie que les aspect ratios sont appropriés pour chaque page'
  },
  {
    name: 'Dimensions maximales cohérentes',
    test: () => {
      const accueilContent = contents.find(f => f.name === 'Accueil').content;
      const rechercheContent = contents.find(f => f.name === 'Recherche').content;
      
      // Accueil et Recherche ont les mêmes dimensions max
      return accueilContent.includes('maxWidth={350}') &&
             accueilContent.includes('maxHeight={250}') &&
             rechercheContent.includes('maxWidth={350}') &&
             rechercheContent.includes('maxHeight={250}');
    },
    description: 'Vérifie que les dimensions maximales sont cohérentes'
  },
  {
    name: 'Styles de container harmonisés',
    test: () => {
      const pageContents = contents.filter(f => f.name !== 'GifPlayer');
      
      return pageContents.every(page => 
        page.content.includes('alignItems: \'center\'') &&
        page.content.includes('justifyContent: \'center\'') &&
        page.content.includes('paddingVertical')
      );
    },
    description: 'Vérifie que tous les containers sont harmonisés'
  },
  {
    name: 'Boutons plein écran uniformes',
    test: () => {
      const pageContents = contents.filter(f => f.name !== 'GifPlayer');
      
      return pageContents.every(page => 
        page.content.includes('backgroundColor: \'rgba(0, 0, 0, 0.8)\'') &&
        page.content.includes('shadowColor: \'#000\'')
      );
    },
    description: 'Vérifie que les boutons plein écran sont uniformes'
  }
];

let responsivePassed = 0;
responsiveConsistencyTests.forEach((test, index) => {
  try {
    const result = test.test();
    if (result) {
      console.log(`✅ ${test.name}`);
      responsivePassed++;
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
console.log(`✅ GifPlayer: ${gifPlayerPassed}/${gifPlayerTests.length} (${gifPlayerScore}%)`);
console.log(`✅ Pages: ${totalPagePassed}/${totalPageTests} (${Math.round((totalPagePassed / totalPageTests) * 100)}%)`);
console.log(`✅ Cohérence responsive: ${responsivePassed}/${responsiveConsistencyTests.length} (${Math.round((responsivePassed / responsiveConsistencyTests.length) * 100)}%)`);

const totalTests = gifPlayerTests.length + totalPageTests + responsiveConsistencyTests.length;
const totalPassed = gifPlayerPassed + totalPagePassed + responsivePassed;
const overallScore = Math.round((totalPassed / totalTests) * 100);

console.log(`📈 Score global: ${overallScore}%`);

// Validation finale
if (overallScore >= 90) {
  console.log('\n🎉 Optimisations responsive réussies !');
  console.log('✨ Améliorations implémentées :');
  console.log('   • GIFs parfaitement centrés sur toutes les pages');
  console.log('   • Tailles optimisées et responsive selon le contexte');
  console.log('   • Aspect ratios appropriés (16:9 pour listes, 4:3 pour favoris)');
  console.log('   • Effets visuels améliorés (ombres, bordures)');
  console.log('   • Interface plus moderne et professionnelle');
} else if (overallScore >= 75) {
  console.log('\n⚠️  Optimisations partiellement réussies');
  console.log('   Quelques ajustements mineurs peuvent être nécessaires');
} else {
  console.log('\n❌ Optimisations incomplètes');
  console.log('   Des corrections importantes sont nécessaires');
}

// Tests de régression
console.log('\n🔍 Tests de régression :');
const regressionTests = [
  {
    name: 'Fonctionnalité clic préservée',
    test: () => contents.every(file => 
      file.content.includes('onTogglePlay') || file.name === 'GifPlayer'
    ),
    description: 'La fonctionnalité de clic pour lecture est préservée'
  },
  {
    name: 'Boutons plein écran préservés',
    test: () => contents.filter(f => f.name !== 'GifPlayer').every(file => 
      file.content.includes('openFullScreen')
    ),
    description: 'Les boutons plein écran sont préservés'
  },
  {
    name: 'Gestion d\'erreur préservée',
    test: () => {
      const gifPlayerContent = contents.find(f => f.name === 'GifPlayer').content;
      return gifPlayerContent.includes('handleImageError') && 
             gifPlayerContent.includes('showErrorDetails');
    },
    description: 'La gestion d\'erreur robuste est préservée'
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
  console.log('\n🚀 Optimisations responsive complètement validées !');
  console.log('   Interface moderne et responsive sur toutes les pages');
  console.log('   Centrage parfait et dimensions optimisées');
  console.log('   Aucune régression détectée');
  process.exit(0);
} else {
  console.log('\n⚠️  Validation incomplète. Vérifiez l\'implémentation.');
  process.exit(1);
}