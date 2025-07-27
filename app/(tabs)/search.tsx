import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, Heart, Play, Pause } from 'lucide-react-native';
import { danceMoves, DanceMove, categories, levels, getGifUrl, getAllFamilies, getAllCourses } from '@/data/danceMoves';
import FullScreenImageModal from '@/components/FullScreenImageModal';

export default function SearchScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);
  const [moves, setMoves] = useState<DanceMove[]>(danceMoves);
  const [playingGifs, setPlayingGifs] = useState<Set<string>>(new Set());
  const [fullScreenVisible, setFullScreenVisible] = useState(false);
  const [selectedMove, setSelectedMove] = useState<DanceMove | null>(null);

  const filteredMoves = moves.filter(move => {
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

  const getImageSource = (move: DanceMove) => {
    if (playingGifs.has(move.id) && move.hasGif) {
      return { uri: getGifUrl(move) };
    }
    // Image statique par défaut
    return require('@/assets/images/logoRock4you.png');
  };

  const toggleFavorite = (id: string) => {
    setMoves(moves.map(move => 
      move.id === id ? { ...move, isFavorite: !move.isFavorite } : move
    ));
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

      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>Résultats</Text>
          <Text style={styles.resultsCount}>{filteredMoves.length} passes trouvées</Text>
        </View>

        {filteredMoves.map((move) => (
          <TouchableOpacity key={move.id} style={styles.moveCard}>
            <TouchableOpacity
              style={styles.moveImageContainer}
              onPress={() => openFullScreen(move)}
            >
              <Image source={getImageSource(move)} style={styles.moveImage} />
              <TouchableOpacity 
                style={styles.playButton}
                onPress={() => toggleGifPlayback(move.id)}
              >
                {playingGifs.has(move.id) ? (
                  <Pause size={24} color="#FFF" />
                ) : (
                  <Play size={24} color="#FFF" />
                )}
              </TouchableOpacity>
              {!move.hasGif && (
                <View style={styles.noGifIndicator}>
                  <Text style={styles.noGifText}>Pas de GIF</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.moveContent}>
              <View style={styles.moveHeader}>
                <Text style={styles.moveName}>{move.movementName}</Text>
                <View style={styles.difficultyBadge}>
                  <Text style={styles.difficultyText}>Niv.{move.difficulty}</Text>
                </View>
                <TouchableOpacity onPress={() => toggleFavorite(move.id)}>
                  <Heart 
                    size={20} 
                    color={move.isFavorite ? '#FF6B35' : '#666'}
                    fill={move.isFavorite ? '#FF6B35' : 'none'}
                  />
                </TouchableOpacity>
              </View>
              
              <View style={styles.moveInfo}>
                <View style={[styles.levelBadge, { backgroundColor: getLevelColor(move.level) }]}>
                  <Text style={styles.levelText}>{move.level}</Text>
                </View>
                <Text style={styles.duration}>{move.timeCount}</Text>
              </View>
              
              <Text style={styles.courseName}>{move.courseName}</Text>
              <Text style={styles.family}>Famille: {move.family}</Text>
              
              {move.remarks && (
                <Text style={styles.remarks}>{move.remarks}</Text>
              )}
              
              <View style={styles.technicalInfo}>
                <Text style={styles.technicalText}>
                  {move.startPosition} → {move.endPosition}
                </Text>
                {move.displacement && (
                  <Text style={styles.displacement}>• {move.displacement}</Text>
                )}
              </View>
              
              {move.gifFileName && (
                <Text style={styles.fileName}>GIF: {move.gifFileName}</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}

        {filteredMoves.length === 0 && (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>Aucune passe trouvée</Text>
            <Text style={styles.noResultsSubtext}>Essayez de modifier vos critères de recherche</Text>
          </View>
        )}
      </ScrollView>

      <FullScreenImageModal
        visible={fullScreenVisible}
        move={selectedMove}
        isPlaying={selectedMove ? playingGifs.has(selectedMove.id) : false}
        onClose={closeFullScreen}
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
  },
  moveImageContainer: {
    position: 'relative',
    height: 200,
  },
  moveImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    backgroundColor: '#000',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    padding: 8,
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
  noGifIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(244, 67, 54, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  noGifText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: 'bold',
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
});