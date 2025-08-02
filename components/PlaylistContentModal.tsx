import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { X, Heart, Trash2, Maximize2 } from 'lucide-react-native';
import { DanceMove } from '@/data/danceMoves';
import { PlayList } from '@/contexts/PlaylistContext';
import GifPlayer from '@/components/GifPlayer';
import FullScreenImageModal from '@/components/FullScreenImageModal';

interface PlaylistContentModalProps {
  visible: boolean;
  onClose: () => void;
  playlist: PlayList | null;
  onRemoveMove: (playlistId: string, moveId: string) => Promise<void>;
}

export default function PlaylistContentModal({
  visible,
  onClose,
  playlist,
  onRemoveMove
}: PlaylistContentModalProps) {
  const [playingGifs, setPlayingGifs] = useState<Set<string>>(new Set());
  const [fullScreenVisible, setFullScreenVisible] = useState(false);
  const [selectedMove, setSelectedMove] = useState<DanceMove | null>(null);

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

  const openFullScreen = (move: DanceMove) => {
    setSelectedMove(move);
    setFullScreenVisible(true);
  };

  const closeFullScreen = () => {
    setFullScreenVisible(false);
    setSelectedMove(null);
  };

  const handleRemoveMove = async (moveId: string) => {
    if (!playlist) {
      console.log('❌ Pas de playlist sélectionnée');
      return;
    }
    
    const move = playlist.moves.find(m => m.id === moveId);
    if (!move) {
      console.log('❌ Mouvement non trouvé dans la playlist');
      return;
    }

    console.log('🔄 Suppression directe de', move.movementName, 'de la playlist', playlist.name);
    try {
      await onRemoveMove(playlist.id, moveId);
      console.log('✅ Suppression terminée avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Débutant': return '#4CAF50';
      case 'Intermédiaire': return '#FF9800';
      case 'Avancé': return '#F44336';
      default: return '#666';
    }
  };

  if (!playlist) return null;

  return (
    <>
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.headerLeft}>
                <View style={[styles.playlistColorIndicator, { backgroundColor: playlist.color }]} />
                <View>
                  <Text style={styles.modalTitle}>{playlist.name}</Text>
                  <Text style={styles.modalSubtitle}>
                    {playlist.moves.length} {playlist.moves.length > 1 ? 'passes' : 'passe'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {playlist.moves.length === 0 ? (
              <View style={styles.emptyState}>
                <Heart size={48} color="#333" />
                <Text style={styles.emptyStateText}>Liste vide</Text>
                <Text style={styles.emptyStateSubtext}>
                  Ajoutez des passes à cette liste depuis les pages Accueil ou Recherche
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.movesContainer} showsVerticalScrollIndicator={false}>
                {playlist.moves.map((move) => (
                  <View key={move.id} style={styles.moveCard}>
                    <View style={styles.gifContainer}>
                      <GifPlayer
                        move={move}
                        isPlaying={playingGifs.has(move.id)}
                        onTogglePlay={() => toggleGifPlayback(move.id)}
                        size="responsive"
                        aspectRatio={4/3}
                        maxWidth={120}
                        maxHeight={90}
                      />
                      <TouchableOpacity
                        style={styles.fullScreenButton}
                        onPress={() => openFullScreen(move)}
                      >
                        <Maximize2 size={14} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.moveContent}>
                      <View style={styles.moveHeader}>
                        <Text style={styles.moveName}>{move.movementName}</Text>
                        <TouchableOpacity 
                          style={styles.removeButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            console.log('🖱️ Clic sur bouton suppression détecté pour move:', move.id);
                            handleRemoveMove(move.id);
                          }}
                          activeOpacity={0.7}
                        >
                          <Trash2 size={16} color="#666" style={{ pointerEvents: 'none' }} />
                        </TouchableOpacity>
                      </View>
                      
                      <View style={styles.moveInfo}>
                        <View style={[styles.levelBadge, { backgroundColor: getLevelColor(move.level) }]}>
                          <Text style={styles.levelText}>{move.level}</Text>
                        </View>
                        <View style={styles.difficultyBadge}>
                          <Text style={styles.difficultyText}>Niv.{move.difficulty}</Text>
                        </View>
                        <Text style={styles.duration}>{move.timeCount}</Text>
                      </View>
                      
                      <Text style={styles.courseName}>{move.courseName}</Text>
                      <Text style={styles.family}>{move.family}</Text>
                      
                      {move.remarks && (
                        <Text style={styles.remarks}>{move.remarks}</Text>
                      )}
                    </View>
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
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    width: '95%',
    maxWidth: 500,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playlistColorIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  closeButton: {
    padding: 5,
  },
  movesContainer: {
    flex: 1,
    padding: 20,
  },
  moveCard: {
    backgroundColor: '#333',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#444',
  },
  gifContainer: {
    position: 'relative',
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  fullScreenButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 4,
    padding: 3,
    zIndex: 10,
  },
  moveContent: {
    flex: 1,
    padding: 12,
  },
  moveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  moveName: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginRight: 10,
  },
  removeButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  moveInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  levelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 4,
  },
  levelText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: 'bold',
  },
  difficultyBadge: {
    backgroundColor: '#555',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 4,
  },
  difficultyText: {
    fontSize: 10,
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  duration: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
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
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginTop: 15,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});