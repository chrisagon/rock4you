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
}

const ETAT_INITIAL: ReviewState = {
  fileDuJour: [],
  carteIndex: 0,
  dernierLancement: null,
  termine: false,
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
  estCharge: boolean;
  avancer: () => void;
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
            etatCharge = {
              ...sauvegarde,
              carteIndex: Math.min(Math.max(indexValide, 0), sauvegarde.fileDuJour.length),
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

  // Avance jetable (retirée à la story 3, remplacée par les votes)
  const avancer = () => {
    setEtat(prev => {
      if (!prev || prev.termine || prev.fileDuJour.length === 0) return prev;
      const surDerniere = prev.carteIndex >= prev.fileDuJour.length - 1;
      return surDerniere ? { ...prev, termine: true } : { ...prev, carteIndex: prev.carteIndex + 1 };
    });
  };

  const value: ReviewContextType = {
    fileDuJour: etat?.fileDuJour ?? ETAT_INITIAL.fileDuJour,
    carteIndex: etat?.carteIndex ?? ETAT_INITIAL.carteIndex,
    dernierLancement: etat?.dernierLancement ?? null,
    termine: etat?.termine ?? false,
    estCharge: etat !== null,
    avancer,
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