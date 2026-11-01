import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { danceMoves } from '@/data/danceMoves';

// AD-1 : l'état de révision vit en local (AsyncStorage, web compris) ;
// jamais un appel réseau — opaque au serveur.
const CLEF_STOCKAGE_REVIEW = 'rock4me.review.v1';
const TAILLE_FILE_JOUR = 12;
// Story 7 : le créneau suivant ouvre 4 h après la fin de la dernière session
const DELAI_CRENEAU_MS = 4 * 60 * 60 * 1000;

export interface ReviewState {
  fileDuJour: string[];
  carteIndex: number;
  dernierLancement: number | null;
  termine: boolean;
  // Vote à trois états par passe (story 1.3) ; la composition J+1 reprend les ratées/hésitées
  votes: { [id: string]: 'arevoir' | 'hesite' | 'su' };
  // Geste indisponible : passe bannie à vie (story 1.4, EXPERIENCE.md:88)
  exclusions: string[];
  // Ensemble cumulé des passes déjà présentées : entrée de composition « jamais vues », jamais affiché
  vues: string[];
  // Nombre de passes vues du jour, figé à la fin de session (story 1.4, EXPERIENCE.md:86)
  passesVues?: number;
  // Fin de la dernière session : le créneau suivant se recompose 4 h plus tard (story 7)
  finDerniereSession?: number;
}

const ETAT_INITIAL: ReviewState = {
  fileDuJour: [],
  carteIndex: 0,
  dernierLancement: null,
  termine: false,
  votes: {},
  exclusions: [],
  vues: [],
};

// Composition [HYPOTHÈSE] (spine EXPERIENCE.md:84) : ratées/hésitées de la veille d'abord
// (ordre catalogue), complétées à 12 par des passes jamais vues ; sans geste jamais, et
// gestes indisponibles bannis à vie. Les « Su » (présentées donc en vues) ne reviennent pas.
function composerFile(
  fileVeille: string[],
  votes: { [id: string]: 'arevoir' | 'hesite' | 'su' },
  exclusions: string[],
  vues: string[]
): string[] {
  const exclues = new Set(exclusions);
  const dejaVues = new Set(vues);
  const jouables = danceMoves
    .filter(mouvement => mouvement.hasGif && mouvement.driveLink)
    .filter(mouvement => !exclues.has(mouvement.id));
  const ratees = jouables
    .filter(mouvement => fileVeille.includes(mouvement.id))
    .filter(mouvement => votes[mouvement.id] === 'arevoir' || votes[mouvement.id] === 'hesite')
    .map(mouvement => mouvement.id);
  // Une passe votée (même « Passée ») a été présentée : elle ne compte plus comme jamais vue,
  // ce qui rend ratees et jamaisVues disjointes aussi pour les états d'avant le cumul « vues »
  const jamaisVues = jouables
    .filter(mouvement => !dejaVues.has(mouvement.id) && votes[mouvement.id] === undefined)
    .map(mouvement => mouvement.id);
  return [...ratees, ...jamaisVues].slice(0, TAILLE_FILE_JOUR);
}

interface ReviewContextType {
  fileDuJour: string[];
  carteIndex: number;
  dernierLancement: number | null;
  termine: boolean;
  sues: number;
  passesVues?: number;
  prochaineRevision: number | null;
  estCharge: boolean;
  avancer: () => void;
  voter: (vote: 'arevoir' | 'hesite' | 'su') => void;
  exclue: (id: string) => void;
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
          // Une file vide est légitime (tous gestes exclus) : on la garde —
          // les exclusions et votes qu'elle porte vivent à vie
          if (sauvegarde && Array.isArray(sauvegarde.fileDuJour)) {
            // carteIndex est un index de confiance : clamp dans [0, fileDuJour.length]
            const indexBrut = Number(sauvegarde.carteIndex);
            const indexValide = Number.isFinite(indexBrut) ? Math.trunc(indexBrut) : 0;
            // votes : absent des états d'avant la story 1.3 -> {} (rétrocompatible)
            const votes =
              sauvegarde.votes && typeof sauvegarde.votes === 'object' && !Array.isArray(sauvegarde.votes)
                ? sauvegarde.votes
                : {};
            // exclusions et vues : absents d'avant la story 1.4 -> [] (rétrocompatible)
            const exclusions = Array.isArray(sauvegarde.exclusions) ? sauvegarde.exclusions : [];
            const vues = Array.isArray(sauvegarde.vues) ? sauvegarde.vues : [];
            // Story 7 : la recomposition suit le créneau — 4 h depuis la fin de session,
            // ou 4 h depuis le lancement d'une session encore ouverte (abandonnée, re-vivable) ;
            // un état terminé sans horodatage est dû immédiatement
            const creneauEcoule =
              (sauvegarde.termine &&
                (!sauvegarde.finDerniereSession ||
                  Date.now() - sauvegarde.finDerniereSession >= DELAI_CRENEAU_MS)) ||
              (!sauvegarde.termine &&
                sauvegarde.dernierLancement != null &&
                Date.now() - sauvegarde.dernierLancement >= DELAI_CRENEAU_MS);

            if (!creneauEcoule) {
              etatCharge = {
                ...sauvegarde,
                carteIndex: Math.min(Math.max(indexValide, 0), sauvegarde.fileDuJour.length),
                votes,
                exclusions,
                vues,
              };
            } else {
              // Créneau suivant : ratées/hésitées du créneau écoulé puis jamais vues ;
              // « vues » ne s'étend PAS à la composition : une passe devient vue quand elle sort de l'écran,
              // les passes non atteintes en cours de route restent proposables au créneau suivant
              const nouvelleFile = composerFile(sauvegarde.fileDuJour, votes, exclusions, vues);
              etatCharge = {
                fileDuJour: nouvelleFile,
                carteIndex: 0,
                dernierLancement: Date.now(),
                termine: false,
                finDerniereSession: undefined,
                votes,
                exclusions,
                vues,
                passesVues: 0,
              };
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ État de révision local illisible, nouvelle file dérivée.', error);
      }

      if (!etatCharge) {
        // Premier lancement : 12 premières jouables jamais vues, ordre catalogue ;
        // « vues » se remplit au fil des sorties d'écran, pas à la composition
        const nouvelleFile = composerFile([], {}, [], []);
        etatCharge = {
          fileDuJour: nouvelleFile,
          carteIndex: 0,
          dernierLancement: Date.now(),
          termine: false,
          votes: {},
          exclusions: [],
          vues: [],
          passesVues: 0,
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

  // Le créneau se rattrape quand l'app revit au premier plan sans remontage du provider
  // (onglet web re-visité, native revenue du fond) — sinon Réviser reste verrouillée avec une heure passée
  const rattraperCreneau = useCallback(() => {
    setEtat(prev => {
      if (!prev || !prev.termine) return prev;
      if (prev.finDerniereSession && Date.now() - prev.finDerniereSession < DELAI_CRENEAU_MS) {
        return prev;
      }
      const nouvelleFile = composerFile(prev.fileDuJour, prev.votes, prev.exclusions, prev.vues);
      return {
        fileDuJour: nouvelleFile,
        carteIndex: 0,
        dernierLancement: Date.now(),
        termine: false,
        finDerniereSession: undefined,
        votes: prev.votes,
        exclusions: prev.exclusions,
        vues: prev.vues,
        passesVues: 0,
      };
    });
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const surVisible = () => {
        if (document.visibilityState === 'visible') rattraperCreneau();
      };
      document.addEventListener('visibilitychange', surVisible);
      return () => document.removeEventListener('visibilitychange', surVisible);
    }
    const souscription = AppState.addEventListener('change', etatApp => {
      if (etatApp === 'active') rattraperCreneau();
    });
    return () => souscription.remove();
  }, [rattraperCreneau]);

  // Onglet laissé ouvert à travers l'échéance : rattrapage à intervalle régulier
  useEffect(() => {
    const tempo = setInterval(rattraperCreneau, 30_000);
    return () => clearInterval(tempo);
  }, [rattraperCreneau]);

  // Chaque changement est persisté : la progression survit au rechargement
  useEffect(() => {
    if (!etat) return;
    AsyncStorage.setItem(CLEF_STOCKAGE_REVIEW, JSON.stringify(etat)).catch(error => {
      console.warn('Rock4me : écriture de l\'état de révision impossible (stockage refusé).', error);
    });
  }, [etat]);

  // Avance sans voter (« Passer ») : la passe reste dans la file du jour.
  // passesVues : chaque passe qui quitte l'écran compte comme vue (EXPERIENCE.md:86) ;
  // « vue » = présentée : la passe entre dans le cumul vues en quittant l'écran, pas à la composition,
  // pour que les passes non atteintes en cours de route redeviennent proposables
  const avancer = () => {
    setEtat(prev => {
      if (!prev || prev.termine || prev.fileDuJour.length === 0) return prev;
      const passeSortante = prev.fileDuJour[prev.carteIndex];
      const vues = [...(prev.vues ?? []), passeSortante];
      const surDerniere = prev.carteIndex >= prev.fileDuJour.length - 1;
      return surDerniere
        ? { ...prev, vues, termine: true, passesVues: (prev.passesVues ?? 0) + 1, finDerniereSession: Date.now() }
        : { ...prev, vues, carteIndex: prev.carteIndex + 1, passesVues: (prev.passesVues ?? 0) + 1 };
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
      const vues = [...(prev.vues ?? []), passe];
      const surDerniere = prev.carteIndex >= prev.fileDuJour.length - 1;
      return surDerniere
        ? { ...prev, votes, vues, termine: true, passesVues: (prev.passesVues ?? 0) + 1, finDerniereSession: Date.now() }
        : { ...prev, votes, vues, carteIndex: prev.carteIndex + 1, passesVues: (prev.passesVues ?? 0) + 1 };
    });
  };

  // Geste indisponible (EXPERIENCE.md:88) : la passe sort de la file et n'est plus proposée.
  // Dernière passe retirée -> fin de session ; une passe exclue compte comme vue.
  const exclue = (id: string) => {
    setEtat(prev => {
      if (!prev) return prev;
      const fileRestante = prev.fileDuJour.filter(passeId => passeId !== id);
      return {
        ...prev,
        fileDuJour: fileRestante,
        exclusions: [...new Set([...prev.exclusions, id])],
        vues: [...(prev.vues ?? []), id],
        termine: fileRestante.length === 0 ? true : prev.termine,
        finDerniereSession: fileRestante.length === 0 ? Date.now() : prev.finDerniereSession,
        passesVues: (prev.passesVues ?? 0) + 1,
      };
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
    passesVues: etat?.passesVues,
    prochaineRevision:
      etat?.termine && etat?.finDerniereSession ? etat.finDerniereSession + DELAI_CRENEAU_MS : null,
    estCharge: etat !== null,
    avancer,
    voter,
    exclue,
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