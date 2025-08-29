import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Heart, Play, Pause, Maximize2, Plus } from 'lucide-react-native';
import { DanceMove } from '@/data/danceMoves';
import GifPlayer from './GifPlayer';

interface MoveCardProps {
  move: DanceMove;
  width: number;
  columns: number;
  isPlaying: boolean;
  isFavorite: boolean;
  onTogglePlay: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenFullScreen: (move: DanceMove) => void;
  onOpenPlaylist: (move: DanceMove) => void;
  getLevelColor: (level: string) => string;
}

const MoveCard = memo(({
  move,
  width,
  columns,
  isPlaying,
  isFavorite,
  onTogglePlay,
  onToggleFavorite,
  onOpenFullScreen,
  onOpenPlaylist,
  getLevelColor,
}: MoveCardProps) => {
  const handleTogglePlay = useCallback(() => {
    onTogglePlay(move.id);
  }, [move.id, onTogglePlay]);

  const handleToggleFavorite = useCallback(() => {
    onToggleFavorite(move.id);
  }, [move.id, onToggleFavorite]);

  const handleOpenFullScreen = useCallback(() => {
    onOpenFullScreen(move);
  }, [move, onOpenFullScreen]);

  const handleOpenPlaylist = useCallback(() => {
    onOpenPlaylist(move);
  }, [move, onOpenPlaylist]);

  return (
    <View style={[styles.moveCard, { width }]}>
      <View style={styles.gifContainer}>
        <GifPlayer
          move={move}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          size="responsive"
          aspectRatio={16/9}
          maxWidth={width - 30}
          maxHeight={200}
        />
        <TouchableOpacity
          style={styles.fullScreenButton}
          onPress={handleOpenFullScreen}
        >
          <Maximize2 size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.moveContent}>
        <View style={styles.moveHeader}>
          <Text 
            style={[styles.moveName, { fontSize: columns > 2 ? 16 : 18 }]} 
            numberOfLines={2}
          >
            {move.movementName}
          </Text>
          <View style={styles.difficultyBadge}>
            <Text style={styles.difficultyText}>Niv.{move.difficulty}</Text>
          </View>
          <TouchableOpacity onPress={handleToggleFavorite}>
            <Heart
              size={20}
              color={isFavorite ? '#FF6B35' : '#666'}
              fill={isFavorite ? '#FF6B35' : 'none'}
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
        
        {move.remarks && columns === 1 && (
          <Text style={styles.remarks} numberOfLines={2}>{move.remarks}</Text>
        )}
        
        {columns === 1 && (
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
            onPress={handleOpenPlaylist}
          >
            <Plus size={16} color="#FF6B35" />
            <Text style={styles.actionText}>Ajouter à ma liste</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  // Comparaison personnalisée pour éviter les re-renders inutiles
  return (
    prevProps.move.id === nextProps.move.id &&
    prevProps.width === nextProps.width &&
    prevProps.columns === nextProps.columns &&
    prevProps.isPlaying === nextProps.isPlaying &&
    prevProps.isFavorite === nextProps.isFavorite
  );
});

MoveCard.displayName = 'MoveCard';

const styles = StyleSheet.create({
  moveCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
    marginBottom: 15,
  },
  gifContainer: {
    position: 'relative',
    backgroundColor: '#0D0D0D',
  },
  fullScreenButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
    borderRadius: 20,
  },
  moveContent: {
    padding: 15,
  },
  moveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  moveName: {
    flex: 1,
    fontWeight: 'bold',
    color: '#FFF',
    marginRight: 10,
  },
  difficultyBadge: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6B35',
    marginRight: 10,
  },
  difficultyText: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '600',
  },
  moveInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 10,
  },
  levelText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '600',
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
    fontSize: 13,
    color: '#999',
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

export default MoveCard;
