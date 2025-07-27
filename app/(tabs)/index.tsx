import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Heart, Plus, Pause } from 'lucide-react-native';
import { danceMoves, DanceMove, getGifUrl, getAllFamilies, getAllCourses } from '@/data/danceMoves';
import FullScreenImageModal from '@/components/FullScreenImageModal';

export default function HomeScreen() {
  const [moves, setMoves] = useState<DanceMove[]>(danceMoves);
  const [searchTerm, setSearchTerm] = useState('');
  const [playingGifs, setPlayingGifs] = useState<Set<string>>(new Set());
  const [fullScreenVisible, setFullScreenVisible] = useState(false);
  const [selectedMove, setSelectedMove] = useState<DanceMove | null>(null);

  const toggleFavorite = (id: string) => {
    setMoves(moves.map(move => 
      move.id === id ? { ...move, isFavorite: !move.isFavorite } : move
    ));
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
    // Image statique par défaut (première frame ou placeholder)
    return require('@/assets/images/logoRock4you.png');
  };

  const filteredMoves = moves.filter(move => 
    move.movementName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    move.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    move.level.toLowerCase().includes(searchTerm.toLowerCase()) ||
    move.family.toLowerCase().includes(searchTerm.toLowerCase()) ||
    move.remarks.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <Text style={styles.title}>Rock4you.mobile</Text>
        <Text style={styles.subtitle}>Maîtrisez vos passes de danse</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une passe..."
          placeholderTextColor="#666"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      <ScrollView style={styles.movesContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Passes disponibles</Text>
          <Text style={styles.sectionCount}>{filteredMoves.length} passes</Text>
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
              
              <Text style={styles.courseName}>Cours: {move.courseName}</Text>
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
              
              <View style={styles.moveActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Plus size={16} color="#FF6B35" />
                  <Text style={styles.actionText}>Ajouter à ma liste</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {filteredMoves.length === 0 && (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>Aucune passe trouvée</Text>
            <Text style={styles.noResultsSubtext}>
              Essayez de modifier votre recherche
            </Text>
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
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: '#1A1A1A',
    color: '#FFF',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 25,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  movesContainer: {
    flex: 1,
    paddingHorizontal: 20,
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
  duration: {
    fontSize: 14,
    color: '#666',
  },
  courseName: {
    fontSize: 14,
    color: '#CCC',
    marginBottom: 8,
  },
  family: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
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
    marginBottom: 10,
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
  moveActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
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