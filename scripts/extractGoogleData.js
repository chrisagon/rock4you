// Script pour extraire les données du Google Sheets
// INSTRUCTIONS D'UTILISATION :
// 1. Ouvrez votre Google Sheets dans le navigateur
// 2. Appuyez sur F12 pour ouvrir les outils de développement
// 3. Allez dans l'onglet "Console"
// 4. Copiez-collez ce script complet et appuyez sur Entrée
// 5. Suivez les instructions qui s'affichent

function extractDanceMoves() {
  console.log('🎯 Extraction des données des passes de danse...');
  
  // Sélectionnez toutes les cellules avec données
  const rows = [];
  const table = document.querySelector('div[role="grid"]');
  
  if (!table) {
    console.error('❌ Impossible de trouver le tableau Google Sheets');
    return;
  }
  
  // Instructions pour l'utilisateur
  console.log(`
📋 INSTRUCTIONS POUR EXTRAIRE VOS DONNÉES :

1. ✅ Vous êtes déjà sur votre Google Sheets !

2. MÉTHODE RECOMMANDÉE - Export CSV :
   - Fichier > Télécharger > Valeurs séparées par des virgules (.csv)
   - Ouvrez le fichier CSV dans un éditeur de texte
   - Utilisez la fonction processCsvData() ci-dessous

3. MÉTHODE ALTERNATIVE - Copie manuelle :
   - Sélectionnez toutes les données (A1:R[dernière ligne])
   - Copiez (Ctrl+C) et collez dans un fichier texte
   - Traitez ligne par ligne avec convertCsvLineToDanceMove()

4. 🎯 EXEMPLE D'UTILISATION :
   Tapez dans cette console : processCsvData(votreContenuCSV)
  `);
  
  return true;
}

// Fonction pour convertir une ligne CSV en objet DanceMove
function convertCsvLineToDanceMove(csvLine, index) {
  const columns = csvLine.split(',').map(col => col.trim().replace(/"/g, ''));
  
  // Vérifier si c'est une ligne de cours (à ignorer)
  const movementName = columns[2]; // Colonne C
  if (!movementName || movementName.startsWith('Cours')) {
    return null;
  }
  
  const difficulty = parseInt(columns[4]) || 1; // Colonne E
  const hasGif = columns[3] === 'X' || columns[3] === 'XX'; // Colonne D
  const driveLink = columns[17] || ''; // Colonne R
  
  // Extraire l'ID Google Drive
  const extractDriveId = (link) => {
    if (!link) return '';
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9-_]+)/,
      /id=([a-zA-Z0-9-_]+)/,
      /\/d\/([a-zA-Z0-9-_]+)/
    ];
    for (const pattern of patterns) {
      const match = link.match(pattern);
      if (match) return match[1];
    }
    return '';
  };
  
  const getDifficultyLevel = (diff) => {
    if (diff <= 2) return 'Débutant';
    if (diff <= 4) return 'Intermédiaire';
    return 'Avancé';
  };
  
  return {
    id: `move_${index + 1}`,
    courseName: columns[0] || '',
    courseOrder: parseInt(columns[1]) || 0,
    movementName: movementName,
    hasGif: hasGif,
    difficulty: difficulty,
    family: columns[5] || '',
    type1: columns[6] || '',
    type2: columns[7] || '',
    type3: columns[8] || '',
    type4: columns[9] || '',
    startPosition: columns[10] || '',
    endPosition: columns[11] || '',
    timeCount: columns[12] || '',
    displacement: columns[13] || '',
    remarks: columns[14] || '',
    gifFileName: columns[16] || '',
    driveLink: driveLink,
    driveId: extractDriveId(driveLink),
    isFavorite: false,
    isCourseName: false,
    level: getDifficultyLevel(difficulty),
    category: columns[5] || 'Autres'
  };
}

// Fonction pour traiter un fichier CSV complet
function processCsvData(csvContent) {
  const lines = csvContent.split('\n');
  const moves = [];
  
  // Ignorer la première ligne (en-têtes)
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const move = convertCsvLineToDanceMove(lines[i], i - 1);
      if (move) {
        moves.push(move);
      }
    }
  }
  
  console.log(`✅ ${moves.length} passes extraites avec succès !`);
  return moves;
}

// Lancer l'extraction