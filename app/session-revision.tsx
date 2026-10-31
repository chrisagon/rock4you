import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import GifPlayer from '@/components/GifPlayer';
import { danceMoves } from '@/data/danceMoves';
import { useReview } from '@/contexts/ReviewContext';

type Vote = 'arevoir' | 'hesite' | 'su';
const LIBELLES_VOTE: { [v in Vote]: string } = { arevoir: 'À revoir', hesite: 'Hésité', su: 'Su' };
// Libellés d'accessibilité du plancher (EXPERIENCE.md:120) : « Marquer {nom} comme su »…
const LIBELLES_VOTE_ACC: { [v in Vote]: string } = { arevoir: 'à revoir', hesite: 'hésité', su: 'su' };

export default function SessionRevisionScreen() {
  const { fileDuJour, carteIndex, termine, estCharge, avancer, voter, exclue, passesVues } = useReview();
  const [revelePourId, setRevelePourId] = useState<string | null>(null);
  const [annonce, setAnnonce] = useState('');
  // « Geste indisponible. » : la passe sort de la file (EXPERIENCE.md:88) — message visible quelques secondes
  const [noticeGeste, setNoticeGeste] = useState<string | null>(null);

  useEffect(() => {
    if (!noticeGeste) return;
    const tempo = setTimeout(() => setNoticeGeste(null), 6000);
    return () => clearTimeout(tempo);
  }, [noticeGeste]);

  const enFin = termine || carteIndex >= fileDuJour.length;
  const moveCourante = enFin ? null : danceMoves.find(m => m.id === fileDuJour[carteIndex]) ?? null;

  // Annonce lecteurs d'écran : aria-live sur le web, annonce native ailleurs (EXPERIENCE.md:121)
  const annoncer = (texte: string) => {
    setAnnonce(texte);
    if (Platform.OS !== 'web') AccessibilityInfo.announceForAccessibility(texte);
  };

  const annoncerVote = (vote: Vote) => {
    const moveSuivante = carteIndex + 1 < fileDuJour.length
      ? danceMoves.find(m => m.id === fileDuJour[carteIndex + 1]) ?? null
      : null;
    annoncer(
      `Vote ${LIBELLES_VOTE[vote]} enregistré. ${moveSuivante ? `Passe suivante : ${moveSuivante.movementName}.` : 'C\'est fini pour aujourd\'hui.'}`
    );
  };

  // Desktop : espace/Entrée révèle, 1/2/3 votent (EXPERIENCE.md:112)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const surCle = (e: KeyboardEvent) => {
      const moveActuelle = termine || carteIndex >= fileDuJour.length
        ? null
        : danceMoves.find(m => m.id === fileDuJour[carteIndex]) ?? null;
      if (!moveActuelle) return;
      if (e.key === ' ' || e.key === 'Enter') {
        if (revelePourId !== moveActuelle.id) {
          e.preventDefault();
          setRevelePourId(moveActuelle.id);
          annoncer(`Geste révélé : ${moveActuelle.movementName}. Votez À revoir, Hésité ou Su, ou Passez.`);
        }
        return;
      }
      const vote: Vote | null =
        e.key === '1' ? 'arevoir' : e.key === '2' ? 'hesite' : e.key === '3' ? 'su' : null;
      if (vote && revelePourId === moveActuelle.id) {
        e.preventDefault();
        annoncerVote(vote);
        voter(vote);
      }
    };
    window.addEventListener('keydown', surCle);
    return () => window.removeEventListener('keydown', surCle);
  });

  if (!estCharge) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.finContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      </SafeAreaView>
    );
  }

  if (!moveCourante) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.finContainer}>
          <Text style={styles.finTexte}>C'est fini pour aujourd'hui.</Text>
          {passesVues != null && (
            <Text style={styles.passesVuesTexte}>
              {passesVues === 1 ? '1 passe vue' : `${passesVues} passes vues`}
            </Text>
          )}
          <TouchableOpacity style={styles.boutonFin} onPress={() => router.back()}>
            <Text style={styles.boutonFinTexte}>Retour à Réviser</Text>
          </TouchableOpacity>
          <Text style={styles.regionAnnonce} accessibilityLiveRegion="polite">
            {annonce}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const famille = moveCourante.family || 'Non classée';
  const revele = revelePourId === moveCourante.id;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.entete}>
        <TouchableOpacity
          style={styles.boutonRetour}
          onPress={() => router.back()}
          accessibilityLabel="Quitter la session"
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.colonne}>
        <ScrollView
          contentContainerStyle={styles.contenuColonne}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.carte}>
            <Text style={styles.title}>{moveCourante.movementName}</Text>
            <Text style={styles.meta}>{famille} · {moveCourante.level}</Text>
            {noticeGeste && <Text style={styles.noticeGeste}>{noticeGeste}</Text>}

            {revele ? (
              <>
                <GifPlayer
                  move={moveCourante}
                  isPlaying
                  onTogglePlay={() => {}}
                  size="responsive"
                  aspectRatio={16 / 9}
                  maxWidth={560}
                  maxHeight={315}
                  onIndisponible={() => {
                    // EXPERIENCE.md:88 : « Geste indisponible. » — la passe sort de la file
                    setNoticeGeste('Geste indisponible.');
                    annoncer(
                      `Geste indisponible : ${moveCourante.movementName} sort de la file et ne sera plus proposée.`
                    );
                    exclue(moveCourante.id);
                  }}
                />

                <View style={styles.barreVote}>
                  {(['arevoir', 'hesite', 'su'] as Vote[]).map(vote => (
                    <TouchableOpacity
                      key={vote}
                      style={styles.boutonVote}
                      onPress={() => {
                        annoncerVote(vote);
                        voter(vote);
                      }}
                      accessibilityLabel={`Marquer ${moveCourante.movementName} comme ${LIBELLES_VOTE_ACC[vote]}`}
                    >
                      <Text style={styles.boutonVoteTexte}>{LIBELLES_VOTE[vote]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.boutonPasser}
                  onPress={() => {
                    const moveSuivante = carteIndex + 1 < fileDuJour.length
                      ? danceMoves.find(m => m.id === fileDuJour[carteIndex + 1]) ?? null
                      : null;
                    annoncer(
                      `Passe passée sans vote. ${moveSuivante ? `Passe suivante : ${moveSuivante.movementName}.` : 'C\'est fini pour aujourd\'hui.'}`
                    );
                    avancer();
                  }}
                  accessibilityLabel={`Passer ${moveCourante.movementName}`}
                >
                  <Text style={styles.boutonPasserTexte}>Passer</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.cadreRevelation}
                onPress={() => {
                  setRevelePourId(moveCourante.id);
                  setAnnonce(`Geste révélé : ${moveCourante.movementName}. Votez À revoir, Hésité ou Su, ou Passez.`);
                }}
                accessibilityLabel={`Révéler le geste de ${moveCourante.movementName}`}
              >
                <Text style={styles.cadreRevelationTexte}>Touche pour révéler</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>

      <Text style={styles.regionAnnonce} accessibilityLiveRegion="polite">
        {annonce}
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  entete: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  boutonRetour: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colonne: {
    flex: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: 20,
  },
  contenuColonne: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  carte: {
    backgroundColor: '#333333',
    borderRadius: 15,
    padding: 20,
    minHeight: '60%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  meta: {
    fontSize: 12,
    color: '#CCCCCC',
    marginTop: 4,
    marginBottom: 12,
  },
  noticeGeste: {
    fontSize: 12,
    color: '#FF6B35',
    marginBottom: 8,
  },
  cadreRevelation: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cadreRevelationTexte: {
    fontSize: 16,
    color: '#999999',
  },
  barreVote: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    width: '100%',
  },
  boutonVote: {
    flex: 1,
    minHeight: 44,
    borderRadius: 9999,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  boutonVoteTexte: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  boutonPasser: {
    marginTop: 12,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  boutonPasserTexte: {
    fontSize: 14,
    color: '#999999',
  },
  regionAnnonce: {
    position: 'absolute',
    height: 1,
    width: 1,
    opacity: 0.01,
    overflow: 'hidden',
  },
  finContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  finTexte: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  passesVuesTexte: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginTop: 8,
  },
  boutonFin: {
    marginTop: 24,
    backgroundColor: '#333333',
    borderRadius: 9999,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  boutonFinTexte: {
    fontSize: 16,
    color: '#FFFFFF',
  },
});