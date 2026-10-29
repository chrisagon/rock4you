import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import GifPlayer from '@/components/GifPlayer';
import { danceMoves } from '@/data/danceMoves';
import { useReview } from '@/contexts/ReviewContext';

export default function SessionRevisionScreen() {
  const { fileDuJour, carteIndex, termine, estCharge, avancer } = useReview();
  const [revelePourId, setRevelePourId] = useState<string | null>(null);

  if (!estCharge) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.finContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      </SafeAreaView>
    );
  }

  const enFin = termine || carteIndex >= fileDuJour.length;
  const moveCourante = enFin ? null : danceMoves.find(m => m.id === fileDuJour[carteIndex]) ?? null;

  if (!moveCourante) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.finContainer}>
          <Text style={styles.finTexte}>C'est fini pour aujourd'hui.</Text>
          <TouchableOpacity style={styles.boutonFin} onPress={() => router.back()}>
            <Text style={styles.boutonFinTexte}>Retour à Réviser</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const famille = moveCourante.family || 'Non classée';

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

            {revelePourId === moveCourante.id ? (
              <GifPlayer
                move={moveCourante}
                isPlaying
                onTogglePlay={() => {}}
                size="responsive"
                aspectRatio={16 / 9}
                maxWidth={560}
                maxHeight={315}
              />
            ) : (
              <TouchableOpacity
                style={styles.cadreRevelation}
                onPress={() => setRevelePourId(moveCourante.id)}
                accessibilityLabel={`Révéler le geste de ${moveCourante.movementName}`}
              >
                <Text style={styles.cadreRevelationTexte}>Touche pour révéler</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.boutonSuivante}
              onPress={avancer}
              accessibilityLabel="Aller à la passe suivante"
            >
              <Text style={styles.boutonSuivanteTexte}>Suivante</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
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
  boutonSuivante: {
    marginTop: 16,
    backgroundColor: '#FF6B35',
    borderRadius: 9999,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  boutonSuivanteTexte: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
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