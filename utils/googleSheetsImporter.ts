// Utilitaire pour importer automatiquement les données depuis Google Sheets
// Ce fichier vous aidera à automatiser l'import des données

export interface RawSheetData {
  [key: string]: any;
}

/**
 * Instructions pour extraire les données du Google Sheets :
 * 
 * 1. Ouvrez le fichier : https://docs.google.com/spreadsheets/d/1gJ9qirGXrNsB0afyVkD80_l9obiNKFzJbXtHyk22sWo/edit?usp=sharing
 * 
 * 2. Exportez en CSV ou copiez les données
 * 
 * 3. Pour chaque ligne qui n'est PAS un cours (colonne C ne commence pas par "Cours") :
 *    - Copiez les valeurs des colonnes A à R (sauf P)
 *    - Utilisez la fonction ci-dessous pour convertir en format DanceMove
 */

/**
 * Convertit une ligne du Google Sheets en objet DanceMove
 * @param row Tableau des valeurs de la ligne (colonnes A à R)
 * @param index Index de la ligne pour générer un ID unique
 */
export const convertSheetRowToDanceMove = (row: any[], index: number) => {
  // Vérifier si c'est une ligne de cours (à ignorer)
  const movementName = row[2]; // Colonne C
  if (!movementName || movementName.startsWith('Cours')) {
    return null;
  }

  const difficulty = parseInt(row[4]) || 1; // Colonne E
  const hasGif = row[3] === 'X' || row[3] === 'XX'; // Colonne D
  
  // Fonction pour déterminer le niveau basé sur la difficulté
  const getDifficultyLevel = (diff: number): 'Débutant' | 'Intermédiaire' | 'Avancé' => {
    if (diff <= 2) return 'Débutant';
    if (diff <= 4) return 'Intermédiaire';
    return 'Avancé';
  };

  return {
    id: `move_${index + 1}`,
    courseName: row[0] || '', // Colonne A
    courseOrder: parseInt(row[1]) || 0, // Colonne B
    movementName: movementName, // Colonne C
    hasGif: hasGif, // Colonne D
    difficulty: difficulty, // Colonne E
    family: row[5] || '', // Colonne F
    type1: row[6] || '', // Colonne G
    type2: row[7] || '', // Colonne H
    type3: row[8] || '', // Colonne I
    type4: row[9] || '', // Colonne J
    startPosition: row[10] || '', // Colonne K
    endPosition: row[11] || '', // Colonne L
    timeCount: row[12] || '', // Colonne M
    displacement: row[13] || '', // Colonne N
    remarks: row[14] || '', // Colonne O
    // Colonne P (15) - Timmy - IGNORÉE
    gifFileName: row[16] || '', // Colonne Q
    driveLink: row[17] || '', // Colonne R
    isFavorite: false,
    isCourseName: false,
    level: getDifficultyLevel(difficulty),
    category: row[5] || 'Autres'
  };
};

/**
 * ÉTAPES POUR METTRE À JOUR VOS DONNÉES :
 * 
 * 1. Ouvrez votre Google Sheets
 * 2. Sélectionnez toutes les données (A1:R[dernière_ligne])
 * 3. Copiez et collez dans un fichier CSV
 * 4. Utilisez un script pour convertir le CSV en format JavaScript
 * 5. Remplacez le contenu de danceMoves dans data/danceMoves.ts
 */

// Exemple de script pour traiter un fichier CSV :
export const processCsvData = (csvContent: string) => {
  const lines = csvContent.split('\n');
  const moves = [];
  
  // Ignorer la première ligne (en-têtes)
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',');
    const move = convertSheetRowToDanceMove(row, i - 1);
    if (move) {
      moves.push(move);
    }
  }
  
  return moves;
};

/**
 * INSTRUCTIONS POUR EXTRAIRE LES IDs GOOGLE DRIVE :
 * 
 * Les liens Google Drive dans la colonne R peuvent avoir différents formats :
 * - https://drive.google.com/file/d/ID_DU_FICHIER/view
 * - https://drive.google.com/open?id=ID_DU_FICHIER
 * - https://drive.google.com/file/d/ID_DU_FICHIER/edit
 * 
 * L'ID est la partie entre /d/ et /view (ou après id=)
 * 
 * Pour rendre les GIFs publiquement accessibles :
 * 1. Clic droit sur chaque fichier GIF dans Google Drive
 * 2. "Partager" > "Modifier l'accès" > "Tous les utilisateurs avec le lien"
 * 3. Copiez le lien de partage
 */

// Fonction pour extraire l'ID d'un lien Google Drive
export const extractGoogleDriveId = (driveLink: string): string => {
  if (!driveLink) return '';
  
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9-_]+)/,
    /id=([a-zA-Z0-9-_]+)/,
    /\/d\/([a-zA-Z0-9-_]+)/
  ];
  
  for (const pattern of patterns) {
    const match = driveLink.match(pattern);
    if (match) return match[1];
  }
  
  return '';
};

// Fonction pour générer l'URL directe d'affichage
export const generateDirectViewUrl = (driveLink: string): string => {
  const fileId = extractGoogleDriveId(driveLink);
  if (!fileId) return '';
  
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
};