// Exemple de structure avec quelques passes réelles
// Remplacez ces données d'exemple par vos vraies données extraites

export const sampleDanceMoves = [
  {
    id: 'move_1',
    courseName: 'Cours débutant 1',
    courseOrder: 1,
    movementName: 'Passe de base',
    hasGif: true,
    difficulty: 1,
    family: 'Bases',
    type1: 'Passe simple',
    type2: '',
    type3: '',
    type4: '',
    startPosition: 'Position fermée',
    endPosition: 'Position fermée',
    timeCount: '4 temps',
    displacement: 'Sur place',
    remarks: 'Mouvement fondamental à maîtriser',
    gifFileName: '1_passe_de_base.gif',
    driveLink: 'https://drive.google.com/file/d/VOTRE_ID_ICI/view',
    driveId: 'VOTRE_ID_ICI', // Remplacez par le vrai ID
    isFavorite: false,
    isCourseName: false,
    level: 'Débutant',
    category: 'Bases'
  },
  {
    id: 'move_2',
    courseName: 'Cours débutant 1',
    courseOrder: 1,
    movementName: 'Avant-Arrière MG-MD',
    hasGif: true,
    difficulty: 1,
    family: 'Bases',
    type1: 'Déplacement',
    type2: 'Alternance',
    type3: '',
    type4: '',
    startPosition: 'Main gauche - Main droite',
    endPosition: 'Main gauche - Main droite',
    timeCount: '4 temps',
    displacement: 'Avant-arrière',
    remarks: 'Bien marquer le changement de direction',
    gifFileName: '2_avant_arriere_mg_md.gif',
    driveLink: 'https://drive.google.com/file/d/VOTRE_ID_ICI/view',
    driveId: 'VOTRE_ID_ICI', // Remplacez par le vrai ID
    isFavorite: false,
    isCourseName: false,
    level: 'Débutant',
    category: 'Bases'
  }
  // Ajoutez toutes vos autres passes ici...
];

// Instructions pour obtenir les vrais IDs Google Drive :
/*
1. Ouvrez votre Google Sheets
2. Pour chaque ligne de passe (pas les cours) :
   - Copiez le lien de la colonne R
   - Extrayez l'ID entre /d/ et /view
   - Exemple: https://drive.google.com/file/d/1ABC123XYZ/view
   - L'ID est: 1ABC123XYZ

3. Remplacez 'VOTRE_ID_ICI' par les vrais IDs

4. Testez l'URL directe: https://drive.google.com/uc?export=view&id=VOTRE_ID
*/