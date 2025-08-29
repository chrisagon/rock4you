import React, { useState } from 'react';
import { Image, ActivityIndicator, View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Play, Pause, AlertCircle, RefreshCw } from 'lucide-react-native';
import { useGifCache } from '@/hooks/useGifCache';

interface CachedGifProps {
  source: string;
  style?: any;
  onPress?: () => void;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  size?: 'small' | 'medium' | 'large' | 'responsive';
  aspectRatio?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export const CachedGif: React.FC<CachedGifProps> = ({
  source,
  style,
  onPress,
  isPlaying = false,
  onTogglePlay,
  size = 'medium',
  aspectRatio = 1,
  maxWidth,
  maxHeight
}) => {
  const { cachedUrl, isLoading, error, reloadFromSource } = useGifCache(source);
  const [loadError, setLoadError] = useState<boolean>(false);

  // Configuration des tailles
  const sizeConfig = {
    small: { width: 80, height: 80 },
    medium: { width: 100, height: 100 },
    large: { width: 150, height: 150 },
    responsive: null // Géré séparément
  };

  const dimensions = size === 'responsive' ? null : sizeConfig[size];
  
  // Styles responsive séparés
  const responsiveStyles = size === 'responsive' ? {
    width: '100%' as const,
    aspectRatio: aspectRatio,
    maxWidth: maxWidth || 300,
    maxHeight: maxHeight || 300
  } : {};

  // Gestion du clic sur toute la zone d'affichage
  const handleContainerPress = () => {
    // Si la lecture/pause est disponible, déclencher
    if (onTogglePlay && !isLoading && !error && !loadError) {
      onTogglePlay();
    }
    // Sinon, utiliser l'action par défaut si fournie
    else if (onPress) {
      onPress();
    }
  };

  // Gestion des erreurs d'image (détection réelle d'échec de chargement)
  const handleImageError = () => {
    setLoadError(true);
  };

  // Gestion du rechargement
  const handleRetry = () => {
    setLoadError(false);
    reloadFromSource();
  };

  // Source de l'image selon l'état
  const getImageSource = () => {
    if (isLoading) {
      return require('@/assets/images/logoRock4you.png');
    }
    
    if (error || loadError) {
      return require('@/assets/images/logoRock4you.png');
    }
    
    if (isPlaying && cachedUrl) {
      return { uri: cachedUrl };
    }
    
    return require('@/assets/images/logoRock4you.png');
  };

  // Rendu du bouton de contrôle
  const renderControlButton = () => {
    if (isLoading) {
      return (
        <View style={[styles.controlButton, styles.loadingButton]}>
          <RefreshCw size={16} color="#FFF" />
        </View>
      );
    }
    
    if (error || loadError) {
      return (
        <TouchableOpacity 
          style={[styles.controlButton, styles.errorButton]}
          onPress={handleRetry}
        >
          <AlertCircle size={16} color="#FFF" />
        </TouchableOpacity>
      );
    }
    
    if (onTogglePlay) {
      return (
        <View style={[styles.controlButton, styles.playButton]}>
          {isPlaying ? (
            <Pause size={16} color="#FFF" />
          ) : (
            <Play size={16} color="#FFF" />
          )}
        </View>
      );
    }
    
    return null;
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        dimensions,
        size === 'responsive' && [styles.responsiveContainer, responsiveStyles],
        style
      ]}
      onPress={handleContainerPress}
      disabled={isLoading}
      activeOpacity={0.8}
    >
      <Image
        source={getImageSource()}
        style={[
          styles.image,
          dimensions,
          size === 'responsive' && [styles.responsiveImage, responsiveStyles]
        ]}
        onError={handleImageError}
        resizeMode="contain"
      />
      
      {/* Overlay d'erreur */}
      {(error || loadError) && (
        <View style={styles.errorOverlay}>
          <AlertCircle size={20} color="#FF6B35" />
          <Text style={styles.errorText}>Gif indisponible</Text>
          <Text style={styles.errorSubtext}>Toucher pour réessayer</Text>
        </View>
      )}
      
      {/* Overlay de chargement */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#FF6B35" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      )}
      
      {/* Bouton de contrôle */}
      {renderControlButton()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    // Amélioration visuelle pour indiquer que la zone est cliquable
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
    // Ombre pour améliorer l'impact visuel
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  responsiveContainer: {
    alignSelf: 'center',
    marginVertical: 8,
  },
  image: {
    backgroundColor: '#000',
  },
  responsiveImage: {
    alignSelf: 'center',
  },
  controlButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    borderRadius: 12,
    padding: 4,
    minWidth: 24,
    minHeight: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    opacity: 0.8,
  },
  loadingButton: {
    backgroundColor: 'rgba(255, 107, 53, 0.8)',
  },
  errorButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.8)',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  errorText: {
    color: '#FF6B35',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 4,
  },
  errorSubtext: {
    color: '#CCC',
    fontSize: 8,
    textAlign: 'center',
    marginTop: 2,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFF',
    fontSize: 10,
    marginTop: 8,
  }
});

export default CachedGif;
