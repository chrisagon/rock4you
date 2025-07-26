import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { danceMoves } from '@/data/danceMoves';

export default function AppDocumentation() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Rock4you.mobile - Documentation</Text>
        <Text style={styles.subtitle}>Application mobile d'apprentissage de danse rock</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vue d'ensemble</Text>
        <Text style={styles.text}>
          Rock4you.mobile est une application mobile dédiée à l'apprentissage et à la révision 
          des passes de danse rock. Elle permet aux utilisateurs d'accéder à une bibliothèque 
          de mouvements de danse avec GIFs animés stockés sur Google Drive, de créer des listes personnalisées 
          et de suivre leur progression.
        </Text>
        <Text style={styles.text}>
          Les données sont synchronisées avec le fichier Google Sheets contenant {danceMoves.length} passes de danse :
          https://docs.google.com/spreadsheets/d/1gJ9qirGXrNsB0afyVkD80_l9obiNKFzJbXtHyk22sWo/edit?usp=sharing
        </Text>
        <Text style={styles.text}>
          Chaque passe dispose d'un lien direct vers son GIF animé stocké sur Google Drive avec accès public configuré.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Architecture</Text>
        <Text style={styles.text}>
          L'application utilise React Native avec Expo et une architecture basée sur des onglets (tabs).
          Elle comprend 4 écrans principaux :
        </Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Accueil : Affichage des passes disponibles</Text>
          <Text style={styles.listItem}>• Recherche : Recherche et filtrage des passes</Text>
          <Text style={styles.listItem}>• Favoris : Gestion des listes personnalisées</Text>
          <Text style={styles.listItem}>• Profil : Gestion du compte utilisateur</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fonctionnalités principales</Text>
        <View style={styles.feature}>
          <Text style={styles.featureTitle}>1. Affichage des passes</Text>
          <Text style={styles.featureText}>
            Visualisation de {danceMoves.length} passes de danse avec GIFs animés, niveaux de difficulté, 
            descriptions détaillées, positions de départ/arrivée et durées.
          </Text>
        </View>
        <View style={styles.feature}>
          <Text style={styles.featureTitle}>2. Système de recherche</Text>
          <Text style={styles.featureText}>
            Recherche par nom, niveau, famille, cours ou remarques avec filtres avancés 
            par difficulté numérique (1-5).
          </Text>
        </View>
        <View style={styles.feature}>
          <Text style={styles.featureTitle}>3. Gestion des favoris</Text>
          <Text style={styles.featureText}>
            Ajout/suppression de passes favorites et création de listes personnalisées.
            avec codes couleur pour organiser l'apprentissage.
        </View>
        <View style={styles.feature}>
          <Text style={styles.featureTitle}>4. Profil utilisateur</Text>
          <Text style={styles.featureText}>
            Authentification complète, gestion du profil et statistiques d'utilisation 
            avec suivi de progression.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Design System</Text>
        <Text style={styles.text}>
          Palette de couleurs :
        </Text>
        <View style={styles.colorPalette}>
          <View style={styles.colorItem}>
            <View style={[styles.colorSwatch, { backgroundColor: '#000' }]} />
            <Text style={styles.colorText}>Noir principal (#000)</Text>
          </View>
          <View style={styles.colorItem}>
            <View style={[styles.colorSwatch, { backgroundColor: '#FF6B35' }]} />
            <Text style={styles.colorText}>Orange accent (#FF6B35)</Text>
          </View>
          <View style={styles.colorItem}>
            <View style={[styles.colorSwatch, { backgroundColor: '#FFF' }]} />
            <Text style={styles.colorText}>Blanc texte (#FFF)</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Structure des données</Text>
        <Text style={styles.text}>
          Les données des passes sont organisées selon la nouvelle structure du fichier Google Sheets 
          avec les colonnes A à R (en excluant la colonne P - Timmy) :
        </Text>
        <View style={styles.codeBlock}>
          <Text style={styles.codeText}>
            {`interface DanceMove {
  courseName: string; // Colonne A - Nom du cours
  courseOrder: number; // Colonne B - Ordre du cours
  movementName: string; // Colonne C - Nom du mouvement
  hasGif: boolean; // Colonne D - Présence de GIF
  difficulty: number; // Colonne E - Niveau de difficulté
  family: string; // Colonne F - Famille de mouvement
  type1-4: string; // Colonnes G-J - Types de passe
  startPosition: string; // Colonne K - Position départ
  endPosition: string; // Colonne L - Position arrivée
  timeCount: string; // Colonne M - Nombre de temps
  displacement: string; // Colonne N - Déplacement
  remarks: string; // Colonne O - Remarques
  gifFileName: string; // Colonne Q - Nom fichier GIF
  driveLink: string; // Colonne R - Lien Google Drive
}`}
          </Text>
        </View>
        <Text style={styles.text}>
          Fonctionnalités de traitement des données :
        </Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Filtrage automatique des lignes de cours</Text>
          <Text style={styles.listItem}>• Conversion des niveaux de difficulté numériques en texte</Text>
          <Text style={styles.listItem}>• Extraction automatique des IDs Google Drive</Text>
          <Text style={styles.listItem}>• Génération d'URLs directes pour les GIFs</Text>
          <Text style={styles.listItem}>• Gestion des passes sans GIF avec images de fallback</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Évolutions futures</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Synchronisation automatique avec Google Sheets</Text>
          <Text style={styles.listItem}>• Import automatique des nouvelles passes</Text>
          <Text style={styles.listItem}>• Filtrage avancé par types de passes</Text>
          <Text style={styles.listItem}>• Système de notation et commentaires</Text>
          <Text style={styles.listItem}>• Mode hors ligne</Text>
          <Text style={styles.listItem}>• Partage de listes entre utilisateurs</Text>
          <Text style={styles.listItem}>• Notifications de rappel</Text>
          <Text style={styles.listItem}>• Lecteur vidéo intégré pour les GIFs</Text>
          <Text style={styles.listItem}>• Statistiques de progression par cours</Text>
          <Text style={styles.listItem}>• Recherche par position de départ/arrivée</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
    }
  )
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#CCC',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  text: {
    fontSize: 14,
    color: '#CCC',
    lineHeight: 20,
    marginBottom: 10,
  },
  list: {
    marginLeft: 10,
  },
  listItem: {
    fontSize: 14,
    color: '#CCC',
    marginBottom: 5,
  },
  feature: {
    marginBottom: 15,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 5,
  },
  featureText: {
    fontSize: 14,
    color: '#CCC',
    marginLeft: 10,
  },
  colorPalette: {
    marginTop: 10,
  },
  colorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  colorSwatch: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  colorText: {
    fontSize: 14,
    color: '#CCC',
  },
  codeBlock: {
    backgroundColor: '#1A1A1A',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  codeText: {
    fontSize: 12,
    color: '#4CAF50',
    fontFamily: 'monospace',
  },
});