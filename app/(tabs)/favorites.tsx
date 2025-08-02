import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, Plus, CreditCard as Edit, Trash2, X, LogOut, AlertTriangle, Maximize2 } from 'lucide-react-native';
import { DanceMove, danceMoves } from '@/data/danceMoves';
import FullScreenImageModal from '@/components/FullScreenImageModal';
import PlaylistContentModal from '@/components/PlaylistContentModal';
import GifPlayer from '@/components/GifPlayer';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { usePlaylist, PlayList } from '@/contexts/PlaylistContext';
import { GifValidator } from '@/utils/gifValidation';
import { router } from 'expo-router';

export default function FavoritesScreen() {
  const { user, logout } = useAuth();
  const { favorites, isLoading, removeFavorite } = useFavorites();
  const { playlists, addPlaylist, deletePlaylist, removeMoveFromPlaylist } = usePlaylist();
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#FF6B35');
  const [playingGifs, setPlayingGifs] = useState<Set<string>>(new Set());
  const [fullScreenVisible, setFullScreenVisible] = useState(false);
  const [selectedMove, setSelectedMove] = useState<DanceMove | null>(null);
  const [showValidationReport, setShowValidationReport] = useState(false);
  const [validationReport, setValidationReport] = useState<any>(null);
  const [playlistContentVisible, setPlaylistContentVisible] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlayList | null>(null);

  const colors = ['#FF6B35', '#4CAF50', '#2196F3', '#9C27B0', '#F44336', '#FF9800'];

  // Convertir les favoris API en DanceMove pour l'affichage (avec useMemo pour la réactivité)
  const favoriteMoves = useMemo((): DanceMove[] => {
    console.log('🔄 Recalcul de favoriteMoves, nombre de favoris:', favorites.length);
    return favorites.map(favorite => {
      const move = danceMoves.find(m => m.id === favorite.itemId);
      return move ? { ...move, isFavorite: true } : null;
    }).filter(Boolean) as DanceMove[];
  }, [favorites]);

  // Gérer la suppression d'un favori
  const handleRemoveFavorite = async (moveId: string) => {
    console.log('🔄 handleRemoveFavorite appelée avec moveId:', moveId);
    console.log('📋 Favoris actuels:', favorites.length);
    
    try {
      // Trouver le favori correspondant à ce mouvement
      const favorite = favorites.find(fav => fav.itemId === moveId);
      console.log('🔍 Favori trouvé:', favorite);
      
      if (!favorite) {
        console.warn('⚠️ Favori non trouvé pour le mouvement:', moveId);
        console.log('📋 Liste des favoris disponibles:', favorites.map(f => ({ id: f.id, itemId: f.itemId })));
        return;
      }

      console.log('🗑️ Tentative de suppression du favori ID:', favorite.id);
      
      // Supprimer le favori en utilisant son ID
      const success = await removeFavorite(favorite.id);
      console.log('📤 Résultat de la suppression:', success);
      
      if (success) {
        console.log('✅ Favori supprimé avec succès - L\'élément devrait disparaître');
        console.log('📋 Favoris restants:', favorites.length);
      } else {
        console.error('❌ Échec de la suppression');
        Alert.alert('Erreur', 'Impossible de supprimer le favori');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du favori:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression');
    }
  };

  // Gérer la déconnexion
  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('../(auth)/login');
            } catch (error) {
              console.error('Erreur lors de la déconnexion:', error);
            }
          }
        }
      ]
    );
  };


  const createPlaylist = async () => {
    if (newPlaylistName.trim()) {
      try {
        await addPlaylist(newPlaylistName, selectedColor);
        setNewPlaylistName('');
        setShowCreatePlaylist(false);
      } catch (error) {
        console.error('Erreur lors de la création de la playlist:', error);
        Alert.alert('Erreur', 'Impossible de créer la liste');
      }
    }
  };

  const handleDeletePlaylist = (playlistId: string) => {
    Alert.alert(
      'Supprimer la liste',
      'Êtes-vous sûr de vouloir supprimer cette liste ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePlaylist(playlistId);
            } catch (error) {
              console.error('Erreur lors de la suppression de la playlist:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la liste');
            }
          }
        }
      ]
    );
  };

  const openPlaylistContent = (playlist: PlayList) => {
    setSelectedPlaylist(playlist);
    setPlaylistContentVisible(true);
  };

  const closePlaylistContent = () => {
    setPlaylistContentVisible(false);
    setSelectedPlaylist(null);
  };

  const handleRemoveMoveFromPlaylist = async (playlistId: string, moveId: string) => {
    try {
      console.log('🗑️ Suppression de la passe', moveId, 'de la playlist', playlistId);
      await removeMoveFromPlaylist(playlistId, moveId);
      console.log('✅ Passe supprimée avec succès');
    } catch (error) {
      console.error('❌ Erreur suppression passe:', error);
      Alert.alert('Erreur', 'Impossible de supprimer la passe de la liste');
    }
  };

  const toggleGifPlayback = (id: string) => {
    setPlayingGifs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Générer un rapport de validation des GIFs
  const generateValidationReport = () => {
    const report = GifValidator.validateMovesList(favoriteMoves);
    setValidationReport(report);
    setShowValidationReport(true);
  };

  const openFullScreen = (move: DanceMove) => {
    setSelectedMove(move);
    setFullScreenVisible(true);
  };

  const closeFullScreen = () => {
    setFullScreenVisible(false);
    setSelectedMove(null);
  };




  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Débutant': return '#4CAF50';
      case 'Intermédiaire': return '#FF9800';
      case 'Avancé': return '#F44336';
      default: return '#666';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Mes Favoris</Text>
            <Text style={styles.subtitle}>
              Bienvenue {user?.username} ! Vos passes et listes personnalisées
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.validationButton}
              onPress={generateValidationReport}
            >
              <AlertTriangle size={16} color="#FF9800" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <LogOut size={20} color="#FF6B35" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mes listes</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowCreatePlaylist(true)}
            >
              <Plus size={16} color="#FFF" />
              <Text style={styles.addButtonText}>Créer</Text>
            </TouchableOpacity>
          </View>

          {playlists.map((playlist) => (
            <View key={playlist.id} style={styles.playlistCard}>
              <TouchableOpacity
                style={styles.playlistMainContent}
                onPress={() => openPlaylistContent(playlist)}
              >
                <View style={[styles.playlistColor, { backgroundColor: playlist.color }]} />
                <View style={styles.playlistContent}>
                  <Text style={styles.playlistName}>{playlist.name}</Text>
                  <Text style={styles.playlistCount}>
                    {playlist.moves.length} {playlist.moves.length > 1 ? 'passes' : 'passe'}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeletePlaylist(playlist.id)}
              >
                <Trash2 size={16} color="#666" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Passes favorites</Text>
            <Text style={styles.sectionCount}>{favoriteMoves.length} passes</Text>
          </View>

          {isLoading && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Chargement des favoris...</Text>
            </View>
          )}

          {favoriteMoves.map((move) => (
            <View key={move.id} style={styles.moveCard}>
              <View style={styles.gifContainer}>
                <GifPlayer
                  move={move}
                  isPlaying={playingGifs.has(move.id)}
                  onTogglePlay={() => toggleGifPlayback(move.id)}
                  size="responsive"
                  aspectRatio={4/3}
                  maxWidth={200}
                  maxHeight={150}
                />
                <TouchableOpacity
                  style={styles.fullScreenButton}
                  onPress={() => openFullScreen(move)}
                >
                  <Maximize2 size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
              <View style={styles.moveContent}>
                <Text style={styles.courseName}>{move.courseName}</Text>
                <View style={styles.moveHeader}>
                  <Text style={styles.moveName}>{move.movementName}</Text>
                  <View style={styles.difficultyBadge}>
                    <Text style={styles.difficultyText}>Niv.{move.difficulty}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveFavorite(move.id)}>
                    <Heart
                      size={20}
                      color="#FF6B35"
                      fill="#FF6B35"
                    />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.moveInfo}>
                  <View style={[styles.levelBadge, { backgroundColor: getLevelColor(move.level) }]}>
                    <Text style={styles.levelText}>{move.level}</Text>
                  </View>
                  <Text style={styles.duration}>{move.timeCount}</Text>
                </View>
                <Text style={styles.family}>{move.family}</Text>
                {move.remarks && (
                  <Text style={styles.remarks}>{move.remarks}</Text>
                )}
              </View>
            </View>
          ))}

          {favoriteMoves.length === 0 && !isLoading && (
            <View style={styles.emptyState}>
              <Heart size={48} color="#333" />
              <Text style={styles.emptyStateText}>Aucune passe favorite</Text>
              <Text style={styles.emptyStateSubtext}>
                Ajoutez des passes à vos favoris depuis l'accueil
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showCreatePlaylist}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreatePlaylist(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Créer une nouvelle liste</Text>
              <TouchableOpacity onPress={() => setShowCreatePlaylist(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.playlistInput}
              placeholder="Nom de la liste"
              placeholderTextColor="#666"
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
            />

            <Text style={styles.colorLabel}>Couleur de la liste</Text>
            <View style={styles.colorPicker}>
              {colors.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorOptionSelected
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>

            <TouchableOpacity style={styles.createButton} onPress={createPlaylist}>
              <Text style={styles.createButtonText}>Créer la liste</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de rapport de validation */}
      <Modal
        visible={showValidationReport}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowValidationReport(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.validationModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rapport de validation des GIFs</Text>
              <TouchableOpacity onPress={() => setShowValidationReport(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {validationReport && (
              <ScrollView style={styles.reportContent}>
                <View style={styles.reportSummary}>
                  <Text style={styles.reportTitle}>Résumé</Text>
                  <Text style={styles.reportStat}>✅ Valides: {validationReport.valid}</Text>
                  <Text style={styles.reportStat}>❌ Invalides: {validationReport.invalid}</Text>
                  <Text style={styles.reportStat}>🔧 Corrigeables: {validationReport.correctable}</Text>
                </View>

                <Text style={styles.reportTitle}>Détails</Text>
                {validationReport.details.map((detail: any, index: number) => (
                  <View key={index} style={styles.reportItem}>
                    <Text style={styles.reportMoveName}>{detail.moveName}</Text>
                    <Text style={styles.reportUrl}>URL: {detail.originalUrl}</Text>
                    <Text style={[
                      styles.reportStatus,
                      { color: detail.result.isValid ? '#4CAF50' : '#F44336' }
                    ]}>
                      {detail.result.isValid ? '✅ Valide' : '❌ ' + detail.result.error}
                    </Text>
                    {detail.result.correctedUrl && (
                      <Text style={styles.reportCorrected}>
                        Corrigé: {detail.result.correctedUrl}
                      </Text>
                    )}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <FullScreenImageModal
        visible={fullScreenVisible}
        move={selectedMove}
        isPlaying={selectedMove ? playingGifs.has(selectedMove.id) : false}
        onClose={closeFullScreen}
      />

      <PlaylistContentModal
        visible={playlistContentVisible}
        onClose={closePlaylistContent}
        playlist={selectedPlaylist}
        onRemoveMove={handleRemoveMoveFromPlaylist}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#CCC',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  sectionCount: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  playlistCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
  },
  playlistMainContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  playlistColor: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 15,
  },
  playlistContent: {
    flex: 1,
  },
  playlistName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  playlistCount: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    padding: 5,
  },
  moveCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
    flexDirection: 'row',
  },
  gifContainer: {
    position: 'relative',
    width: 120,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 5,
  },
  fullScreenButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 6,
    padding: 4,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  moveImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    backgroundColor: '#000',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 4,
  },
  moveContent: {
    flex: 1,
    padding: 15,
  },
  moveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  moveName: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  difficultyBadge: {
    backgroundColor: '#333',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 8,
  },
  difficultyText: {
    fontSize: 10,
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  moveInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  levelText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: 'bold',
  },
  duration: {
    fontSize: 12,
    color: '#666',
  },
  courseName: {
    fontSize: 12,
    color: '#CCC',
    marginBottom: 4,
  },
  family: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '600',
    marginBottom: 4,
  },
  remarks: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginTop: 15,
    marginBottom: 5,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  playlistInput: {
    backgroundColor: '#333',
    color: '#FFF',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  colorLabel: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: 10,
    fontWeight: '600',
  },
  colorPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#FFF',
  },
  createButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FF6B35',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  logoutButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  validationButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  validationModalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 20,
    width: '95%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  reportContent: {
    maxHeight: 400,
  },
  reportSummary: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  reportStat: {
    fontSize: 14,
    color: '#CCC',
    marginBottom: 5,
  },
  reportItem: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B35',
  },
  reportMoveName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  reportUrl: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  reportStatus: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  reportCorrected: {
    fontSize: 12,
    color: '#4CAF50',
    fontFamily: 'monospace',
  },
});