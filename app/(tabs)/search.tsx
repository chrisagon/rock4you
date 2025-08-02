import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Image, Alert, FlatList, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, Heart, Play, Pause, Maximize2, Plus } from 'lucide-react-native';
import { danceMoves, DanceMove, categories, levels, getGifUrl, getAllFamilies, getAllCourses } from '@/data/danceMoves';
import FullScreenImageModal from '@/components/FullScreenImageModal';
import GifPlayer from '@/components/GifPlayer';
import PlaylistSelectionModal from '@/components/PlaylistSelectionModal';
import { useFavorites } from '@/contexts/FavoritesContext';
import { usePlaylist } from '@/contexts/PlaylistContext';

export default function SearchScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);
  const [playingGifs, setPlayingGifs] = useState<Set<string>>(new Set());
  const [fullScreenVisible, setFullScreenVisible] = useState(false);
  const [selectedMove, setSelectedMove] = useState<DanceMove | null>(null);
  const [playlistModalVisible, setPlaylistModalVisible] = useState(false);
  const [selectedMoveForPlaylist, setSelectedMoveForPlaylist] = useState<DanceMove | null>(null);
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const { addFavorite, removeFavorite, isFavorite, favorites } = useFavorites();
  const { playlists, addMoveToPlaylist } = usePlaylist();

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    return () => subscription?.remove();
  }, []);

  // Calcul du nombre de colonnes selon la largeur d'écran
  const getNumColumns = () => {
    const { width } = screenData;
    if (width < 600) return 1; // Mobile portrait
    if (width < 900) return 2; // Mobile paysage / Tablette portrait
    return 3; // Tablette paysage / Desktop
  };

  // Calcul de la largeur des vignettes
  const getItemWidth = () => {
    const { width } = screenData;
    const numColumns = getNumColumns();
    const padding = 20; // padding horizontal du container
    const spacing = 15; // espacement entre les items
    return (width - (padding * 2) - (spacing * (numColumns - 1))) / numColumns;
  };

  const filteredMoves = danceMoves.filter(move => {
    const matchesSearch = move.movementName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         move.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         move.family.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         move.remarks.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = !selectedLevel || move.level === selectedLevel;
    const matchesFamily = !selectedFamily || move.family === selectedFamily;
    const matchesCourse = !selectedCourse || move.courseName === selectedCourse;
    const matchesDifficulty = selectedDifficulty === null || move.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesLevel && matchesFamily && matchesCourse && matchesDifficulty;
  });

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

  const openPlaylistModal = (move: DanceMove) => {
    setSelectedMoveForPlaylist(move);
    setPlaylistModalVisible(true);
  };

  const closePlaylistModal = () => {
    setPlaylistModalVisible(false);
    setSelectedMoveForPlaylist(null);
  };

  const handleAddToPlaylist = (playlistId: string) => {
    if (selectedMoveForPlaylist) {
      addMoveToPlaylist(playlistId, selectedMoveForPlaylist);
    }
  };


  const toggleFavorite = async (id: string) => {
    console.log('🔄 Toggle favori pour:', id);
    
    // Trouver le favori existant pour cet item
    const existingFavorite = favorites.find(fav => fav.itemId === id);
    
    if (existingFavorite) {
      // Supprimer des favoris
      const success = await removeFavorite(existingFavorite.id);
      if (success) {
        Alert.alert('✅ Succès', 'Supprimé des favoris');
      } else {
        Alert.alert('❌ Erreur', 'Impossible de supprimer le favori');
      }
    } else {
      // Ajouter aux favoris
      const success = await addFavorite(id);
      if (success) {
        Alert.alert('✅ Succès', 'Ajouté aux favoris');
      } else {
        Alert.alert('❌ Erreur', 'Impossible d\'ajouter aux favoris');
      }
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recherche</Text>
        <Text style={styles.subtitle}>Trouvez la passe parfaite</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une passe..."
            placeholderTextColor="#666"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Niveau:</Text>
            <View style={styles.filterOptions}>
              {levels.map(level => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.filterButton,
                    selectedLevel === level && styles.filterButtonActive
                  ]}
                  onPress={() => setSelectedLevel(selectedLevel === level ? null : level)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    selectedLevel === level && styles.filterButtonTextActive
                  ]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Cours:</Text>
            <View style={styles.filterOptions}>
              {getAllCourses().map(course => (
                <TouchableOpacity
                  key={course}
                  style={[
                    styles.filterButton,
                    selectedCourse === course && styles.filterButtonActive
                  ]}
                  onPress={() => setSelectedCourse(selectedCourse === course ? null : course)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    selectedCourse === course && styles.filterButtonTextActive
                  ]}>
                    {course}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Difficulté:</Text>
            <View style={styles.filterOptions}>
              {[1, 2, 3, 4, 5].map(difficulty => (
                <TouchableOpacity
                  key={difficulty}
                  style={[
                    styles.filterButton,
                    selectedDifficulty === difficulty && styles.filterButtonActive
                  ]}
                  onPress={() => setSelectedDifficulty(selectedDifficulty === difficulty ? null : difficulty)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    selectedDifficulty === difficulty && styles.filterButtonTextActive
                  ]}>
                    Niv.{difficulty}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Famille:</Text>
            <View style={styles.filterOptions}>
              {getAllFamilies().map(family => (
                <TouchableOpacity
                  key={family}
                  style={[
                    styles.filterButton,
                    selectedFamily === family && styles.filterButtonActive
                  ]}
                  onPress={() => setSelectedFamily(selectedFamily === family ? null : family)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    selectedFamily === family && styles.filterButtonTextActive
                  ]}>
                    {family}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>

      <View style={styles.resultsContainer}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>Résultats</Text>
          <Text style={styles.resultsCount}>{filteredMoves.length} passes trouvées</Text>
        </View>

        {filteredMoves.length === 0 ? (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>Aucune passe trouvée</Text>
            <Text style={styles.noResultsSubtext}>
              Essayez de modifier vos filtres de recherche
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredMoves}
            key={getNumColumns()} // Force re-render when columns change
            numColumns={getNumColumns()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.flatListContent}
            columnWrapperStyle={getNumColumns() > 1 ? styles.row : undefined}
            renderItem={({ item: move }) => (
              <View style={[styles.moveCard, { width: getItemWidth() }]}>
                <View style={styles.gifContainer}>
                  <GifPlayer
                    move={move}
                    isPlaying={playingGifs.has(move.id)}
                    onTogglePlay={() => toggleGifPlayback(move.id)}
                    size="responsive"
                    aspectRatio={16/9}
                    maxWidth={getItemWidth() - 30}
                    maxHeight={200}
                  />
                  <TouchableOpacity
                    style={styles.fullScreenButton}
                    onPress={() => openFullScreen(move)}
                  >
                    <Maximize2 size={18} color="#FFF" />
                  </TouchableOpacity>
                </View>
                <View style={styles.moveContent}>
                  <View style={styles.moveHeader}>
                    <Text style={[styles.moveName, { fontSize: getNumColumns() > 2 ? 16 : 18 }]} numberOfLines={2}>
                      {move.movementName}
                    </Text>
                    <View style={styles.difficultyBadge}>
                      <Text style={styles.difficultyText}>Niv.{move.difficulty}</Text>
                    </View>
                    <TouchableOpacity onPress={() => toggleFavorite(move.id)}>
                      <Heart
                        size={20}
                        color={isFavorite(move.id) ? '#FF6B35' : '#666'}
                        fill={isFavorite(move.id) ? '#FF6B35' : 'none'}
                      />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.moveInfo}>
                    <View style={[styles.levelBadge, { backgroundColor: getLevelColor(move.level) }]}>
                      <Text style={styles.levelText}>{move.level}</Text>
                    </View>
                    <Text style={styles.duration}>{move.timeCount}</Text>
                  </View>
                  
                  <Text style={styles.courseName} numberOfLines={1}>{move.courseName}</Text>
                  <Text style={styles.family} numberOfLines={1}>Famille: {move.family}</Text>
                  
                  {move.remarks && getNumColumns() === 1 && (
                    <Text style={styles.remarks} numberOfLines={2}>{move.remarks}</Text>
                  )}
                  
                  {getNumColumns() === 1 && (
                    <View style={styles.technicalInfo}>
                      <Text style={styles.technicalText}>
                        {move.startPosition} → {move.endPosition}
                      </Text>
                      {move.displacement && (
                        <Text style={styles.displacement}>• {move.displacement}</Text>
                      )}
                    </View>
                  )}
                  
                  <View style={styles.moveActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => openPlaylistModal(move)}
                    >
                      <Plus size={16} color="#FF6B35" />
                      <Text style={styles.actionText}>Ajouter à ma liste</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
            keyExtractor={(item) => item.id}
          />
        )}
      </View>

      <FullScreenImageModal
        visible={fullScreenVisible}
        move={selectedMove}
        isPlaying={selectedMove ? playingGifs.has(selectedMove.id) : false}
        onClose={closeFullScreen}
      />

      <PlaylistSelectionModal
        visible={playlistModalVisible}
        onClose={closePlaylistModal}
        playlists={playlists}
        onSelectPlaylist={handleAddToPlaylist}
        moveId={selectedMoveForPlaylist?.id || ''}
        moveName={selectedMoveForPlaylist?.movementName || ''}
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
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 25,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    paddingVertical: 12,
    fontSize: 16,
  },
  filtersContainer: {
    maxHeight: 200,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterSection: {
    marginBottom: 15,
  },
  filterTitle: {
    fontSize: 14,
    color: '#CCC',
    marginBottom: 8,
    fontWeight: '600',
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
    marginRight: 8,
    marginBottom: 8,
  },
  filterButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#CCC',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#FFF',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  flatListContent: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
  },
  moveCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
    flex: 1,
  },
  gifContainer: {
    position: 'relative',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  fullScreenButton: {
    position: 'absolute',
    top: 15,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    padding: 6,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  moveContent: {
    padding: 15,
  },
  moveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  moveName: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  difficultyBadge: {
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 10,
  },
  difficultyText: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  moveInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  levelText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: 'bold',
  },
  family: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
    marginBottom: 8,
  },
  duration: {
    fontSize: 14,
    color: '#666',
  },
  courseName: {
    fontSize: 14,
    color: '#CCC',
    marginBottom: 8,
  },
  remarks: {
    fontSize: 13,
    color: '#CCC',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  technicalInfo: {
    marginBottom: 8,
  },
  technicalText: {
    fontSize: 12,
    color: '#999',
  },
  displacement: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  fileName: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 5,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999',
  },
  moveActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  actionText: {
    fontSize: 12,
    color: '#FF6B35',
    marginLeft: 5,
    fontWeight: '600',
  },
});