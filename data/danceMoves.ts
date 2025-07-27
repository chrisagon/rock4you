export interface DanceMove {
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
  driveLink: string;
  level: string;
  isFavorite?: boolean;
}

export const danceMoves: DanceMove[] = [
  {
    id: '1',
    courseName: 'Rock Débutant',
    courseOrder: 1,
    movementName: 'Passe de base',
    hasGif: true,
    difficulty: 1,
    family: 'Passes de base',
    type1: 'Ouverture',
    type2: '',
    type3: '',
    type4: '',
    startPosition: 'Fermée',
    endPosition: 'Fermée',
    timeCount: '8 temps',
    displacement: 'Sur place',
    remarks: 'Mouvement fondamental du rock',
    gifFileName: 'passe_base.gif',
    driveLink: 'https://drive.google.com/file/d/1abc123/view',
    level: 'Débutant',
    isFavorite: false
  },
  {
    id: '2',
    courseName: 'Rock Débutant',
    courseOrder: 2,
    movementName: 'Tour à droite',
    hasGif: true,
    difficulty: 2,
    family: 'Tours',
    type1: 'Tour',
    type2: 'Droite',
    type3: '',
    type4: '',
    startPosition: 'Fermée',
    endPosition: 'Fermée',
    timeCount: '8 temps',
    displacement: 'Rotation',
    remarks: 'Tour simple vers la droite',
    gifFileName: 'tour_droite.gif',
    driveLink: 'https://drive.google.com/file/d/2def456/view',
    level: 'Débutant',
    isFavorite: false
  },
  {
    id: '3',
    courseName: 'Rock Intermédiaire',
    courseOrder: 1,
    movementName: 'Promenade',
    hasGif: true,
    difficulty: 3,
    family: 'Promenades',
    type1: 'Promenade',
    type2: '',
    type3: '',
    type4: '',
    startPosition: 'Fermée',
    endPosition: 'Promenade',
    timeCount: '8 temps',
    displacement: 'Latéral',
    remarks: 'Ouverture en promenade',
    gifFileName: 'promenade.gif',
    driveLink: 'https://drive.google.com/file/d/3ghi789/view',
    level: 'Intermédiaire',
    isFavorite: false
  },
  {
    id: '4',
    courseName: 'Rock Intermédiaire',
    courseOrder: 2,
    movementName: 'Double tour',
    hasGif: false,
    difficulty: 4,
    family: 'Tours',
    type1: 'Tour',
    type2: 'Double',
    type3: '',
    type4: '',
    startPosition: 'Fermée',
    endPosition: 'Fermée',
    timeCount: '8 temps',
    displacement: 'Rotation',
    remarks: 'Deux tours consécutifs',
    gifFileName: '',
    driveLink: '',
    level: 'Intermédiaire',
    isFavorite: false
  },
  {
    id: '5',
    courseName: 'Rock Avancé',
    courseOrder: 1,
    movementName: 'Flip flap',
    hasGif: true,
    difficulty: 5,
    family: 'Acrobaties',
    type1: 'Acrobatie',
    type2: 'Flip',
    type3: '',
    type4: '',
    startPosition: 'Ouverte',
    endPosition: 'Fermée',
    timeCount: '8 temps',
    displacement: 'Vertical',
    remarks: 'Mouvement acrobatique avancé',
    gifFileName: 'flip_flap.gif',
    driveLink: 'https://drive.google.com/file/d/4jkl012/view',
    level: 'Avancé',
    isFavorite: false
  }
];

export const categories = ['Tous', 'Passes de base', 'Tours', 'Promenades', 'Acrobaties'];
export const levels = ['Débutant', 'Intermédiaire', 'Avancé'];

export function getGifUrl(move: DanceMove): string {
  if (!move.driveLink || !move.hasGif) return '';
  
  // Extraire l'ID du fichier Google Drive
  const match = move.driveLink.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
  if (match) {
    const fileId = match[1];
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }
  
  return '';
}

export function getAllFamilies(): string[] {
  const families = new Set(danceMoves.map(move => move.family));
  return Array.from(families).sort();
}

export function getAllCourses(): string[] {
  const courses = new Set(danceMoves.map(move => move.courseName));
  return Array.from(courses).sort();
}