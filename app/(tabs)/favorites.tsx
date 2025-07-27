import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, Plus, CreditCard as Edit, Trash2, X, Play, Pause } from 'lucide-react-native';
import { DanceMove, danceMoves, getGifUrl } from '@/data/danceMoves';

interface PlayList {
  id: string;
  name: string;
  moves: DanceMove[];
  color: string;
}

// Sélectionner quelques passes comme favoris par défaut
const favoriteMoves: DanceMove[] = danceMoves.filter(move => 
  ['1', '2', '3'].includes(move.id)
).map(move => ({ ...move, isFavorite: true }));

const initialPlaylists: PlayList[] = [
  {
    id: '1',
    name: 'À réviser',
    moves: [favoriteMoves[0]],
    color: '#FF6B35'
  },
  {
    id: '2',
    name: 'Cours du lundi',
    moves: [favoriteMoves[1]],
    color: '#4CAF50'
  },
];

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<DanceMove[]>(favoriteMoves);
  const [playlists, setPlaylists] = useState<PlayList[]>(initialPlaylists);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#FF6B35');
  const [playingGifs, setPlayingGifs] = useState<Set<string>>(new Set());

  const colors = ['#FF6B35', '#4CAF50', '#2196F3', '#9C27B0', '#F44336', '#FF9800'];

  const createPlaylist = () => {
    if (newPlaylistName.trim()) {
      const newPlaylist: PlayList = {
        id: Date.now().toString(),
        name: newPlaylistName,
        moves: [],
        color: selectedColor
      };
      setPlaylists([...playlists, newPlaylist]);
      setNewPlaylistName('');
      setShowCreatePlaylist(false);
    }
  };

  const deletePlaylist = (playlistId: string) => {
    setPlaylists(playlists.filter(p => p.id !== playlistId));
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

  const getImageSource = (move: DanceMove) => {
    if (playingGifs.has(move.id) && move.hasGif) {
      return { uri: getGifUrl(move) };
    }
    // Image statique par défaut
    return require('@/assets/images/logoRock4you.png');
  };

  const toggleFavorite = (id: string) => {
    setFavorites(favorites.map(move => 
      move.id === id ? { ...move, isFavorite: !move.isFavorite } : move
    ).filter(move => move.isFavorite));
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
        <Text style={styles.title}>Mes Favoris</Text>
        <Text style={styles.subtitle}>Vos passes et listes personnalisées</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Mes listes personnalisées */}
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
            <TouchableOpacity key={playlist.id} style={styles.playlistCard}>
              <View style={[styles.playlistColor, { backgroundColor: playlist.color }]} />
              <View style={styles.playlistContent}>
                <Text style={styles.playlistName}>{playlist.name}</Text>
                <Text style={styles.playlistCount}>
                  {playlist.moves.length} {playlist.moves.length > 1 ? 'passes' : 'passe'}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => deletePlaylist(playlist.id)}
              >
                <Trash2 size={16} color="#666" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* Passes favorites */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Passes favorites</Text>
            <Text style={styles.sectionCount}>{favorites.length} passes</Text>
          </View>

          {favorites.map((move) => (
            <TouchableOpacity key={move.id} style={styles.moveCard}>
              <View style={styles.imageContainer}>
                <Image source={getImageSource(move)} style={styles.moveImage} />
                <TouchableOpacity 
                  style={styles.playButton}
                  onPress={() => toggleGifPlayback(move.id)}
                >
                  {playingGifs.has(move.id) ? (
                    <Pause size={16} color="#FFF" />
                  ) : (
                    <Play size={16} color="#FFF" />
                  )}
                </TouchableOpacity>
              </View>
              <View style={styles.moveContent}>
                <Text style={styles.courseName}>{move.courseName}</Text>
                <View style={styles.moveHeader}>
                  <Text style={styles.moveName}>{move.movementName}</Text>
                  <View style={styles.difficultyBadge}>
                    <Text style={styles.difficultyText}>Niv.{move.difficulty}</Text>
                  </View>
                  <TouchableOpacity onPress={() => toggleFavorite(move.id)}>
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
            </TouchableOpacity>
          ))}

          {favorites.length === 0 && (
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

      {/* Modal de création de playlist */}
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
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
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
  imageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  moveImage: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
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
});