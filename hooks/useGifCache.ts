import { useState, useEffect } from 'react';
import { cacheGif, removeCachedGif } from '@/utils/gifCache';

/**
 * Hook personnalisé pour gérer le cache des GIFs
 * @param gifUrl URL du GIF à mettre en cache
 * @returns État de chargement, URL en cache et fonctions utilitaires
 */
export const useGifCache = (gifUrl: string | undefined) => {
  const [cachedUrl, setCachedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Force le rechargement du GIF depuis la source
   */
  const reloadFromSource = async () => {
    if (!gifUrl) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Supprimer d'abord du cache si présent
      await removeCachedGif(gifUrl);
      
      // Puis recharger
      const newCachedUrl = await cacheGif(gifUrl);
      setCachedUrl(newCachedUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de rechargement');
      setCachedUrl(gifUrl); // En cas d'échec, utiliser l'URL originale
    } finally {
      setIsLoading(false);
    }
  };
  
  // Chargement initial du GIF en cache
  useEffect(() => {
    const loadCachedGif = async () => {
      if (!gifUrl) {
        setIsLoading(false);
        setCachedUrl(null);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const url = await cacheGif(gifUrl);
        setCachedUrl(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de mise en cache');
        setCachedUrl(gifUrl); // En cas d'échec, utiliser l'URL originale
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCachedGif();
  }, [gifUrl]);
  
  return {
    cachedUrl,
    isLoading,
    error,
    reloadFromSource
  };
};
