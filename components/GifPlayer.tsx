import React, { useState, useEffect, useCallback } from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { Play, Pause, AlertCircle, RefreshCw } from 'lucide-react-native';
import { DanceMove, getGifUrl } from '@/data/danceMoves';

interface GifPlayerProps {
  move: DanceMove;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
}

interface GifState {
  status: 'loading' | 'loaded' | 'error' | 'unavailable';
  retryCount: number;
  lastError?: string;
}

const GifPlayer: React.FC<GifPlayerProps> = ({
  move,
  isPlaying,
  onTogglePlay,
  onPress,
  size = 'medium'
}) => {
  const [gifState, setGifState] = useState<GifState>({
    status: 'loading',
    retryCount: 0
  });

  const sizeConfig = {
    small: { width: 80, height: 80 },
    medium: { width: 100, height: 100 },
    large: { width: 120, height: 120 }
  };

  const dimensions = sizeConfig[size];

  // Validation de l'URL du GIF
  const validateGifUrl = useCallback((url: string): boolean => {
    if (!url) return false;
    
    // Vérifier que c'est une URL complète Cloudflare R2
    const cloudflareR2Pattern = /^https:\/\/pub-[a-f0-9]+\.r2\.dev\/.+\.gif$/i;
    return cloudflareR2Pattern.test(url);
  }, []);

  // Tentative de chargement du GIF avec retry (sans requête CORS)
  const loadGif = useCallback(async (retryCount = 0) => {
    if (!move.hasGif) {
      setGifState({ status: 'unavailable', retryCount: 0 });
      return;
    }

    const gifUrl = getGifUrl(move);
    
    if (!validateGifUrl(gifUrl)) {
      setGifState({
        status: 'error',
        retryCount: 0,
        lastError: 'URL invalide ou malformée'
      });
      return;
    }

    setGifState(prev => ({ ...prev, status: 'loading' }));

    // Validation optimiste : on assume que l'URL est valide si elle passe la validation
    // Cela évite les problèmes CORS avec les requêtes HEAD répétées
    try {
      // Délai simulé pour le chargement
      await new Promise(resolve => setTimeout(resolve, 300));
      setGifState({ status: 'loaded', retryCount });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      
      if (retryCount < 2) {
        // Retry avec délai exponentiel
        setTimeout(() => loadGif(retryCount + 1), Math.pow(2, retryCount) * 1000);
        setGifState(prev => ({
          ...prev,
          retryCount: retryCount + 1,
          lastError: errorMessage
        }));
      } else {
        setGifState({
          status: 'error',
          retryCount,
          lastError: errorMessage
        });
      }
    }
  }, [move, validateGifUrl]);

  // Chargement initial et gestion du cache
  useEffect(() => {
    // Vérifier si on a déjà validé cette URL récemment
    const cacheKey = `gif_${move.id}_${getGifUrl(move)}`;
    const cached = sessionStorage?.getItem(cacheKey);
    
    if (cached) {
      const { timestamp, status } = JSON.parse(cached);
      const now = Date.now();
      
      // Cache valide pendant 10 minutes
      if ((now - timestamp) < 600000) {
        setGifState({ status, retryCount: 0 });
        return;
      }
    }
    
    loadGif();
  }, [loadGif, move.id]);

  // Sauvegarder l'état dans le cache
  useEffect(() => {
    if (gifState.status === 'loaded' || gifState.status === 'error') {
      const cacheKey = `gif_${move.id}_${getGifUrl(move)}`;
      const cacheData = {
        timestamp: Date.now(),
        status: gifState.status
      };
      
      try {
        sessionStorage?.setItem(cacheKey, JSON.stringify(cacheData));
      } catch (error) {
        // Ignore les erreurs de sessionStorage (mode privé, etc.)
      }
    }
  }, [gifState.status, move.id]);

  // Gestion du retry manuel
  const handleRetry = () => {
    loadGif(0);
  };

  // Gestion des erreurs d'image (détection réelle d'échec de chargement)
  const handleImageError = () => {
    setGifState(prev => ({
      ...prev,
      status: 'error',
      lastError: 'Échec du chargement de l\'image'
    }));
    
    // Invalider le cache en cas d'erreur réelle
    const cacheKey = `gif_${move.id}_${getGifUrl(move)}`;
    try {
      sessionStorage?.removeItem(cacheKey);
    } catch (error) {
      // Ignore les erreurs de sessionStorage
    }
  };

  // Affichage des détails d'erreur
  const showErrorDetails = () => {
    Alert.alert(
      'Détails de l\'erreur',
      `Mouvement: ${move.movementName}\n` +
      `URL: ${getGifUrl(move)}\n` +
      `Erreur: ${gifState.lastError || 'Inconnue'}\n` +
      `Tentatives: ${gifState.retryCount + 1}/3\n\n` +
      `Note: Les erreurs CORS sont normales lors des tests de connectivité.`,
      [
        { text: 'Fermer', style: 'cancel' },
        { text: 'Réessayer', onPress: handleRetry },
        { text: 'Vider cache', onPress: clearCache }
      ]
    );
  };

  // Vider le cache pour ce GIF
  const clearCache = () => {
    const cacheKey = `gif_${move.id}_${getGifUrl(move)}`;
    try {
      sessionStorage?.removeItem(cacheKey);
      loadGif(0); // Recharger
    } catch (error) {
      // Ignore les erreurs de sessionStorage
    }
  };

  // Source de l'image selon l'état
  const getImageSource = () => {
    switch (gifState.status) {
      case 'loaded':
        if (isPlaying) {
          // Ajouter un timestamp pour éviter le cache du navigateur lors des revisionnages
          const gifUrl = getGifUrl(move);
          const separator = gifUrl.includes('?') ? '&' : '?';
          return { uri: `${gifUrl}${separator}t=${Date.now()}` };
        }
        return require('@/assets/images/logoRock4you.png');
      case 'loading':
        return require('@/assets/images/logoRock4you.png');
      case 'error':
      case 'unavailable':
      default:
        return require('@/assets/images/logoRock4you.png');
    }
  };

  // Rendu du bouton de contrôle
  const renderControlButton = () => {
    switch (gifState.status) {
      case 'loading':
        return (
          <View style={[styles.controlButton, styles.loadingButton]}>
            <RefreshCw size={16} color="#FFF" />
          </View>
        );
      
      case 'error':
        return (
          <TouchableOpacity 
            style={[styles.controlButton, styles.errorButton]}
            onPress={showErrorDetails}
          >
            <AlertCircle size={16} color="#FFF" />
          </TouchableOpacity>
        );
      
      case 'unavailable':
        return (
          <View style={[styles.controlButton, styles.unavailableButton]}>
            <Text style={styles.unavailableText}>N/A</Text>
          </View>
        );
      
      case 'loaded':
      default:
        return (
          <TouchableOpacity 
            style={[styles.controlButton, styles.playButton]}
            onPress={onTogglePlay}
          >
            {isPlaying ? (
              <Pause size={16} color="#FFF" />
            ) : (
              <Play size={16} color="#FFF" />
            )}
          </TouchableOpacity>
        );
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.container, dimensions]}
      onPress={onPress}
      disabled={gifState.status === 'loading'}
    >
      <Image
        source={getImageSource()}
        style={[styles.image, dimensions]}
        onError={handleImageError}
        resizeMode="contain"
      />
      
      {/* Overlay d'erreur */}
      {gifState.status === 'error' && (
        <View style={styles.errorOverlay}>
          <AlertCircle size={20} color="#FF6B35" />
          <Text style={styles.errorText}>Gif indisponible</Text>
          <Text style={styles.errorSubtext}>Toucher pour détails</Text>
        </View>
      )}
      
      {/* Overlay de chargement */}
      {gifState.status === 'loading' && gifState.retryCount > 0 && (
        <View style={styles.loadingOverlay}>
          <RefreshCw size={16} color="#FF6B35" />
          <Text style={styles.loadingText}>Tentative {gifState.retryCount + 1}/3</Text>
        </View>
      )}
      
      {/* Overlay indisponible */}
      {gifState.status === 'unavailable' && (
        <View style={styles.unavailableOverlay}>
          <Text style={styles.unavailableOverlayText}>Pas de GIF</Text>
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
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    backgroundColor: '#000',
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
  },
  loadingButton: {
    backgroundColor: 'rgba(255, 107, 53, 0.8)',
  },
  errorButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.8)',
  },
  unavailableButton: {
    backgroundColor: 'rgba(102, 102, 102, 0.8)',
  },
  unavailableText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: 'bold',
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
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 4,
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FF6B35',
    fontSize: 8,
    marginLeft: 4,
  },
  unavailableOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(102, 102, 102, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unavailableOverlayText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default GifPlayer;