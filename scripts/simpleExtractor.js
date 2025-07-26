// 🎯 VERSION SIMPLIFIÉE - Copiez-collez ce code dans la console de votre navigateur

console.log('🚀 Script d\'extraction Rock4you.mobile lancé !');

// ÉTAPE 1 : Copiez ce code dans la console de Google Sheets
// ÉTAPE 2 : Exportez votre fichier en CSV depuis Google Sheets
// ÉTAPE 3 : Utilisez la fonction ci-dessous avec votre contenu CSV

function convertirDonneesRock4you(contenuCSV) {
  console.log('📊 Traitement des données en cours...');
  
  const lignes = contenuCSV.split('\n');
  const passes = [];
  
  // Ignorer la première ligne (en-têtes)
  for (let i = 1; i < lignes.length; i++) {
    const ligne = lignes[i];
    if (!ligne.trim()) continue; // Ignorer les lignes vides
    
    const colonnes = ligne.split(',').map(col => col.trim().replace(/"/g, ''));
    
    // Colonne C - Vérifier si c'est un cours ou une passe
    const nomMouvement = colonnes[2];
    if (!nomMouvement || nomMouvement.startsWith('Cours')) {
      continue; // Ignorer les lignes de cours
    }
    
    // Extraire l'ID Google Drive de la colonne R
    const lienDrive = colonnes[17] || '';
    const extraireIdDrive = (lien) => {
      const patterns = [
        /\/file\/d\/([a-zA-Z0-9-_]+)/,
        /id=([a-zA-Z0-9-_]+)/
      ];
      for (const pattern of patterns) {
        const match = lien.match(pattern);
        if (match) return match[1];
      }
      return '';
    };
    
    const difficulte = parseInt(colonnes[4]) || 1;
    const niveauTexte = difficulte <= 2 ? 'Débutant' : difficulte <= 4 ? 'Intermédiaire' : 'Avancé';
    
    const passe = {
      id: `move_${i}`,
      courseName: colonnes[0] || '',
      courseOrder: parseInt(colonnes[1]) || 0,
      movementName: nomMouvement,
      hasGif: colonnes[3] === 'X' || colonnes[3] === 'XX',
      difficulty: difficulte,
      family: colonnes[5] || '',
      type1: colonnes[6] || '',
      type2: colonnes[7] || '',
      type3: colonnes[8] || '',
      type4: colonnes[9] || '',
      startPosition: colonnes[10] || '',
      endPosition: colonnes[11] || '',
      timeCount: colonnes[12] || '',
      displacement: colonnes[13] || '',
      remarks: colonnes[14] || '',
      gifFileName: colonnes[16] || '',
      driveLink: lienDrive,
      driveId: extraireIdDrive(lienDrive),
      isFavorite: false,
      isCourseName: false,
      level: niveauTexte,
      category: colonnes[5] || 'Autres'
    };
    
    passes.push(passe);
  }
  
  console.log(`✅ ${passes.length} passes extraites avec succès !`);
  console.log('📋 Données formatées :');
  console.log(passes);
  
  // Générer le code JavaScript prêt à copier
  const codeJS = `export const danceMoves: DanceMove[] = ${JSON.stringify(passes, null, 2)};`;
  console.log('🎯 Code prêt pour data/danceMoves.ts :');
  console.log(codeJS);
  
  return passes;
}

// INSTRUCTIONS D'UTILISATION :
console.log(`
🎯 COMMENT UTILISER CE SCRIPT :

1. Vous êtes sur votre Google Sheets ✅

2. Exportez en CSV :
   - Fichier > Télécharger > Valeurs séparées par des virgules (.csv)

3. Ouvrez le fichier CSV et copiez tout le contenu

4. Dans cette console, tapez :
   convertirDonneesRock4you(\`COLLEZ_VOTRE_CONTENU_CSV_ICI\`)

5. Le résultat s'affichera automatiquement !

📝 EXEMPLE :
convertirDonneesRock4you(\`Cours,Ordre,Nom,GIF,Difficulté...
Cours débutant 1,1,Passe de base,X,1,Bases...\`)
`);