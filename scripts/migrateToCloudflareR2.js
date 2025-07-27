// Script pour migrer les URLs Google Drive vers Cloudflare R2
const fs = require('fs');
const path = require('path');

// Fonction pour parser un fichier CSV
function parseCSV(content) {
  const lines = content.split('\n');
  const result = [];
  
  for (let i = 1; i < lines.length; i++) { // Skip header
    const line = lines[i].trim();
    if (line) {
      // Parse CSV en tenant compte des guillemets
      const row = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          row.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      row.push(current.trim()); // Add last field
      
      result.push(row);
    }
  }
  
  return result;
}

// Fonction pour convertir une ligne du CSV Cloudflare R2 en objet DanceMove
function convertCloudflareRowToDanceMove(row, index) {
  // Structure du CSV Cloudflare R2 :
  // 0: Cours, 1: Ordre cours, 2: Nom du mouvement, 3: GIF, 4: Difficulté, 
  // 5: Famille, 6: Type 1, 7: Type 2, 8: Type 3, 9: Type 4,
  // 10: Position départ, 11: Position arrivée, 12: Nombre de temps, 
  // 13: Déplacement, 14: Remarques, 15: Timmy, 16: fichier GIF, 
  // 17: Url CloudFlare R2 gifs, 18: URL clouflare R2
  
  const movementName = row[2];
  
  // Ignorer les lignes vides et les cours
  if (!movementName || movementName.startsWith('Cours') || movementName.trim() === '') {
    return null;
  }
  
  const difficulty = parseInt(row[4]) || 1;
  const hasGif = (row[3] === 'x' || row[3] === 'X' || row[3] === 'xx' || row[3] === 'XX');
  
  // Fonction pour déterminer le niveau basé sur la difficulté
  const getDifficultyLevel = (diff) => {
    if (diff <= 2) return 'Débutant';
    if (diff <= 4) return 'Intermédiaire';
    return 'Avancé';
  };

  // Utiliser l'URL Cloudflare R2 (colonne 18, index 17)
  const cloudflareUrl = row[18] || row[17] || '';
  
  return {
    id: `move_${index + 1}`,
    courseName: row[0] || '',
    courseOrder: parseInt(row[1]) || 0,
    movementName: movementName.trim(),
    hasGif: hasGif,
    difficulty: difficulty,
    family: row[5] || '',
    type1: row[6] || '',
    type2: row[7] || '',
    type3: row[8] || '',
    type4: row[9] || '',
    startPosition: row[10] || '',
    endPosition: row[11] || '',
    timeCount: row[12] || '',
    displacement: row[13] || '',
    remarks: row[14] || '',
    gifFileName: row[16] || '',
    driveLink: cloudflareUrl, // Maintenant c'est l'URL Cloudflare R2
    isFavorite: false,
    level: getDifficultyLevel(difficulty)
  };
}

// Fonction principale
function migrateToCloudflareR2() {
  try {
    // Lire le fichier CSV Cloudflare R2
    const csvPath = path.join(__dirname, '..', 'data', 'Database gifs - index cours.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    // Parser le CSV
    const rows = parseCSV(csvContent);
    console.log(`Trouvé ${rows.length} lignes dans le CSV`);
    
    // Convertir en objets DanceMove
    const danceMoves = [];
    let validMoves = 0;
    
    for (let i = 0; i < rows.length; i++) {
      const move = convertCloudflareRowToDanceMove(rows[i], validMoves);
      if (move) {
        danceMoves.push(move);
        validMoves++;
      }
    }
    
    console.log(`Converti ${validMoves} mouvements valides`);
    
    // Générer le contenu du fichier TypeScript
    const tsContent = `export interface DanceMove {
  id: string;
  courseName: string;
  courseOrder: number;
  movementName: string;
  hasGif: boolean;
  difficulty: number;
  family: string;
  type1: string;
  type2: string;
  type3: string;
  type4: string;
  startPosition: string;
  endPosition: string;
  timeCount: string;
  displacement: string;
  remarks: string;
  gifFileName: string;
  driveLink: string; // Maintenant contient les URLs Cloudflare R2
  level: string;
  isFavorite?: boolean;
}

export const danceMoves: DanceMove[] = ${JSON.stringify(danceMoves, null, 2)};

export const categories = ['Tous', ...Array.from(new Set(danceMoves.map(move => move.family).filter(f => f)))];
export const levels = ['Débutant', 'Intermédiaire', 'Avancé'];

export function getGifUrl(move: DanceMove): string {
  // Maintenant on utilise directement l'URL Cloudflare R2
  if (!move.driveLink || !move.hasGif) return '';
  return move.driveLink;
}

export function getAllFamilies(): string[] {
  const families = new Set(danceMoves.map(move => move.family).filter(f => f));
  return Array.from(families).sort();
}

export function getAllCourses(): string[] {
  const courses = new Set(danceMoves.map(move => move.courseName).filter(c => c));
  return Array.from(courses).sort();
}
`;

    // Écrire le nouveau fichier
    const outputPath = path.join(__dirname, '..', 'data', 'danceMoves.ts');
    fs.writeFileSync(outputPath, tsContent, 'utf-8');
    
    console.log(`✅ Migration terminée ! ${validMoves} mouvements migrés vers Cloudflare R2`);
    console.log(`📁 Fichier mis à jour : ${outputPath}`);
    
    // Afficher quelques exemples d'URLs
    console.log('\n📋 Exemples d\'URLs Cloudflare R2 :');
    danceMoves.slice(0, 5).forEach(move => {
      if (move.hasGif && move.driveLink) {
        console.log(`- ${move.movementName}: ${move.driveLink}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration :', error);
  }
}

// Exécuter la migration
if (require.main === module) {
  migrateToCloudflareR2();
}

module.exports = { migrateToCloudflareR2, convertCloudflareRowToDanceMove };