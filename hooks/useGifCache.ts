import { useState, useEffect } from 'react';
import { cacheGif, removeCachedGif } from '@/utils/gifCache';

/**
 * Hook personnalisé pour gérer le cache des GIFs
 * @param gifUrl URL du GIF à mettre en cache
 * @param warmWhen réchauffe le cache quand cette condition devient vraie (une lecture, jamais en navigation)
 * @returns État de chargement, URL en cache et fonctions utilitaires
 */
export const useGifCache = (gifUrl: string | undefined, warmWhen: boolean = true) => {
  const [cachedUrl, setCachedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
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
  
  // Réchauffage à la demande : jamais au montage (AD-4 : rien en navigation avant la révélation)
  useEffect(() => {
    if (!warmWhen) return;
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
  }, [gifUrl, warmWhen]);
  
  return {
    cachedUrl,
    isLoading,
    error,
    reloadFromSource
  };
};
