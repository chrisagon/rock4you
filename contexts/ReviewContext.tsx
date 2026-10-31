import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { danceMoves } from '@/data/danceMoves';

// AD-1 : l'état de révision vit en local (AsyncStorage, web compris) ;
// jamais un appel réseau — opaque au serveur.
const CLEF_STOCKAGE_REVIEW = 'rock4me.review.v1';
const TAILLE_FILE_JOUR = 12;

export interface ReviewState {
  fileDuJour: string[];
  carteIndex: number;
  dernierLancement: number | null;
  termine: boolean;
  // Vote à trois états par passe (story 1.3) ; story 4 les consomme pour la file du lendemain
  votes: { [id: string]: 'arevoir' | 'hesite' | 'su' };
}

const ETAT_INITIAL: ReviewState = {
  fileDuJour: [],
  carteIndex: 0,
  dernierLancement: null,
  termine: false,
  votes: {},
};

// La file du jour exclut les passes sans geste, dans l'ordre du catalogue
function deriverFileDuJour(): string[] {
  return danceMoves
    .filter(mouvement => mouvement.hasGif && mouvement.driveLink)
    .slice(0, TAILLE_FILE_JOUR)
    .map(mouvement => mouvement.id);
}

interface ReviewContextType {
  fileDuJour: string[];
  carteIndex: number;
  dernierLancement: number | null;
  termine: boolean;
  sues: number;
  estCharge: boolean;
  avancer: () => void;
  voter: (vote: 'arevoir' | 'hesite' | 'su') => void;
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

interface ReviewProviderProps {
  children: ReactNode;
}

export function ReviewProvider({ children }: ReviewProviderProps) {
  const [etat, setEtat] = useState<ReviewState | null>(null);

  // Premier lancement : dérivation de la file. Rechargements : reprise de l'état existant.
  useEffect(() => {
    let annule = false;

    const charger = async () => {
      let etatCharge: ReviewState | null = null;
      try {
        const brut = await AsyncStorage.getItem(CLEF_STOCKAGE_REVIEW);
        if (brut) {
          const sauvegarde = JSON.parse(brut) as ReviewState;
          if (sauvegarde && Array.isArray(sauvegarde.fileDuJour) && sauvegarde.fileDuJour.length > 0) {
            // carteIndex est un index de confiance : clamp dans [0, fileDuJour.length]
            const indexBrut = Number(sauvegarde.carteIndex);
            const indexValide = Number.isFinite(indexBrut) ? Math.trunc(indexBrut) : 0;
            // votes : absent des états d'avant la story 1.3 -> {} (rétrocompatible)
            etatCharge = {
              ...sauvegarde,
              carteIndex: Math.min(Math.max(indexValide, 0), sauvegarde.fileDuJour.length),
              votes:
                sauvegarde.votes && typeof sauvegarde.votes === 'object' && !Array.isArray(sauvegarde.votes)
                  ? sauvegarde.votes
                  : {},
            };
          }
        }
      } catch (error) {
        console.warn('⚠️ État de révision local illisible, nouvelle file dérivée.', error);
      }

      if (!etatCharge) {
        etatCharge = {
          fileDuJour: deriverFileDuJour(),
          carteIndex: 0,
          dernierLancement: Date.now(),
          termine: false,
          votes: {},
        };
      }

      if (!annule) {
        setEtat(etatCharge);
      }
    };

    charger();

    return () => {
      annule = true;
    };
  }, []);

  // Chaque changement est persisté : la progression survit au rechargement
  useEffect(() => {
    if (!etat) return;
    AsyncStorage.setItem(CLEF_STOCKAGE_REVIEW, JSON.stringify(etat)).catch(error => {
      console.warn('Rock4me : écriture de l\'état de révision impossible (stockage refusé).', error);
    });
  }, [etat]);

  // Avance sans voter (« Passer ») : la passe reste dans la file du jour
  const avancer = () => {
    setEtat(prev => {
      if (!prev || prev.termine || prev.fileDuJour.length === 0) return prev;
      const surDerniere = prev.carteIndex >= prev.fileDuJour.length - 1;
      return surDerniere ? { ...prev, termine: true } : { ...prev, carteIndex: prev.carteIndex + 1 };
    });
  };

  // Vote à trois états : enregistre puis avance aussitôt, sans confirmation (EXPERIENCE.md:69)
  const voter = (vote: 'arevoir' | 'hesite' | 'su') => {
    setEtat(prev => {
      if (
        !prev ||
        prev.termine ||
        prev.fileDuJour.length === 0 ||
        prev.carteIndex >= prev.fileDuJour.length
      ) {
        return prev;
      }
      const passe = prev.fileDuJour[prev.carteIndex];
      const votes = { ...prev.votes, [passe]: vote };
      const surDerniere = prev.carteIndex >= prev.fileDuJour.length - 1;
      return surDerniere
        ? { ...prev, votes, termine: true }
        : { ...prev, votes, carteIndex: prev.carteIndex + 1 };
    });
  };

  // Passes sues : chaque vote « Su » compte, sans animation (EXPERIENCE.md:66)
  const sues = etat ? Object.values(etat.votes).filter(v => v === 'su').length : 0;

  const value: ReviewContextType = {
    fileDuJour: etat?.fileDuJour ?? ETAT_INITIAL.fileDuJour,
    carteIndex: etat?.carteIndex ?? ETAT_INITIAL.carteIndex,
    dernierLancement: etat?.dernierLancement ?? null,
    termine: etat?.termine ?? false,
    sues,
    estCharge: etat !== null,
    avancer,
    voter,
  };

  return (
    <ReviewContext.Provider value={value}>
      {children}
    </ReviewContext.Provider>
  );
}

export function useReview() {
  const context = useContext(ReviewContext);
  if (context === undefined) {
    throw new Error('useReview must be used within a ReviewProvider');
  }
  return context;
}