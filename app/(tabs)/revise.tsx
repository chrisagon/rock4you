import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useReview } from '@/contexts/ReviewContext';

export default function ReviseScreen() {
  const { fileDuJour, carteIndex, termine, sues, estCharge } = useReview();

  const restantes = termine ? 0 : Math.max(0, fileDuJour.length - carteIndex);
  const fileVide = restantes === 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Réviser</Text>
      </View>

      {!estCharge ? (
        <View style={styles.chargement}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      ) : fileVide ? (
        <View style={styles.vide}>
          <Text style={styles.videTexte}>Rien à revoir aujourd'hui.</Text>
          <Text style={styles.suesTexte}>
            {sues === 1 ? '1 passe sue' : `${sues} passes sues`}
          </Text>
        </View>
      ) : (
        <View style={styles.fileContainer}>
          <Text style={styles.fileTexte}>
            {restantes === 1 ? '1 passe à revoir' : `${restantes} passes à revoir`}
          </Text>
          <Text style={styles.suesTexte}>
            {sues === 1 ? '1 passe sue' : `${sues} passes sues`}
          </Text>
          <TouchableOpacity
            style={styles.boutonCommencer}
            onPress={() => router.push('/session-revision')}
          >
            <Text style={styles.boutonCommencerTexte}>Commencer</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  chargement: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileContainer: {
    padding: 20,
  },
  fileTexte: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  suesTexte: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 16,
  },
  boutonCommencer: {
    backgroundColor: '#FF6B35',
    borderRadius: 9999,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  boutonCommencerTexte: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  vide: {
    padding: 20,
  },
  videTexte: {
    fontSize: 16,
    color: '#CCCCCC',
  },
});