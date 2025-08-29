import * as FileSystem from 'expo-file-system';

interface CacheConfig {
  maxSizeMB: number;
  expirationDays: number;
}

// Configuration par défaut pour le cache
const DEFAULT_CONFIG: CacheConfig = {
  maxSizeMB: 100,
  expirationDays: 7
};

// Dossier principal pour le cache des GIFs
const CACHE_DIR = `${FileSystem.cacheDirectory}gifs`;

/**
 * Met en cache un GIF et retourne l'URL locale du fichier mis en cache
 * 
 * @param gifUrl URL du GIF à mettre en cache
 * @returns Promise avec l'URL locale du fichier mis en cache
 */
export const cacheGif = async (gifUrl: string): Promise<string> => {
  try {
    // Créer un nom de fichier unique basé sur l'URL du GIF
    const filename = gifUrl.split('/').pop();
    const cacheFilePath = `${CACHE_DIR}/${filename}`;
    
    // Vérifier si le fichier existe déjà dans le cache
    const fileInfo = await FileSystem.getInfoAsync(cacheFilePath);
    
    if (fileInfo.exists) {
      console.log('GIF déjà en cache:', gifUrl);
      return cacheFilePath;
    }
    
    // Créer le répertoire de cache si nécessaire
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }
    
    // Télécharger le GIF dans le cache
    const downloadResult = await FileSystem.downloadAsync(
      gifUrl,
      cacheFilePath
    );
    
    console.log('GIF mis en cache avec succès:', gifUrl);
    return downloadResult.uri;
  } catch (error) {
    console.error('Erreur lors de la mise en cache du GIF:', error);
    return gifUrl; // En cas d'échec, retourner l'URL d'origine
  }
};

/**
 * Gère la taille du cache en supprimant les fichiers les plus anciens si nécessaire
 * 
 * @param maxSizeMB Taille maximale du cache en Mo
 */
export const manageCacheSize = async (maxSizeMB = DEFAULT_CONFIG.maxSizeMB) => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    
    if (!dirInfo.exists) return;
    
    // Obtenir tous les fichiers du cache
    const files = await FileSystem.readDirectoryAsync(CACHE_DIR);
    
    // Calculer la taille totale et les métadonnées
    let totalSize = 0;
    const fileMetadata = await Promise.all(
      files.map(async (filename) => {
        const filePath = `${CACHE_DIR}/${filename}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath, { size: true });
        totalSize += fileInfo.size || 0;
        return {
          path: filePath,
          size: fileInfo.size || 0,
          modificationTime: fileInfo.modificationTime || 0,
        };
      })
    );
    
    // Convertir en MB
    const totalSizeMB = totalSize / (1024 * 1024);
    
    // Si le cache dépasse la taille maximale, supprimer les fichiers les plus anciens
    if (totalSizeMB > maxSizeMB) {
      // Trier par date de modification (plus ancien en premier)
      fileMetadata.sort((a, b) => a.modificationTime - b.modificationTime);
      
      // Supprimer les fichiers jusqu'à atteindre la taille cible
      let currentSize = totalSize;
      const targetSize = maxSizeMB * 0.8 * 1024 * 1024; // 80% de la taille max
      
      for (const file of fileMetadata) {
        if (currentSize <= targetSize) break;
        
        await FileSystem.deleteAsync(file.path);
        currentSize -= file.size;
        console.log('Fichier supprimé du cache:', file.path);
      }
    }
  } catch (error) {
    console.error('Erreur lors de la gestion du cache:', error);
  }
};

/**
 * Nettoie les fichiers expirés du cache
 * 
 * @param expirationDays Nombre de jours après lesquels un fichier est considéré comme expiré
 */
export const cleanExpiredCache = async (expirationDays = DEFAULT_CONFIG.expirationDays) => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    
    if (!dirInfo.exists) return;
    
    // Obtenir tous les fichiers du cache
    const files = await FileSystem.readDirectoryAsync(CACHE_DIR);
    const now = new Date().getTime();
    const expirationMs = expirationDays * 24 * 60 * 60 * 1000;
    
    for (const filename of files) {
      const filePath = `${CACHE_DIR}/${filename}`;
      const fileInfo = await FileSystem.getInfoAsync(filePath, { size: true });
      
      if (fileInfo.modificationTime && (now - fileInfo.modificationTime > expirationMs)) {
        await FileSystem.deleteAsync(filePath);
        console.log('Fichier expiré supprimé:', filename);
      }
    }
  } catch (error) {
    console.error('Erreur lors du nettoyage du cache expiré:', error);
  }
};

/**
 * Initialise le système de cache
 */
export const initCacheSystem = async (config: CacheConfig = DEFAULT_CONFIG) => {
  try {
    // Créer le dossier de cache si nécessaire
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }
    
    // Nettoyer les fichiers expirés
    await cleanExpiredCache(config.expirationDays);
    
    // Gérer la taille du cache
    await manageCacheSize(config.maxSizeMB);
    
    console.log('Système de cache initialisé avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation du cache:', error);
  }
};

/**
 * Supprime un GIF spécifique du cache
 * 
 * @param gifUrl URL du GIF à supprimer du cache
 */
export const removeCachedGif = async (gifUrl: string): Promise<boolean> => {
  try {
    const filename = gifUrl.split('/').pop();
    const cacheFilePath = `${CACHE_DIR}/${filename}`;
    
    const fileInfo = await FileSystem.getInfoAsync(cacheFilePath);
    
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(cacheFilePath);
      console.log('GIF supprimé du cache:', gifUrl);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Erreur lors de la suppression du GIF du cache:', error);
    return false;
  }
};

/**
 * Efface tout le cache de GIFs
 */
export const clearAllCache = async (): Promise<boolean> => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(CACHE_DIR);
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
      console.log('Cache de GIFs entièrement effacé');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Erreur lors de l\'effacement du cache:', error);
    return false;
  }
};

/**
 * Obtient des informations sur le cache de GIFs
 */
export const getCacheInfo = async () => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    
    if (!dirInfo.exists) {
      return {
        exists: false,
        size: 0,
        fileCount: 0,
      };
    }
    
    const files = await FileSystem.readDirectoryAsync(CACHE_DIR);
    let totalSize = 0;
    
    for (const filename of files) {
      const filePath = `${CACHE_DIR}/${filename}`;
      const fileInfo = await FileSystem.getInfoAsync(filePath, { size: true });
      totalSize += fileInfo.size || 0;
    }
    
    return {
      exists: true,
      size: totalSize,
      sizeInMB: totalSize / (1024 * 1024),
      fileCount: files.length,
    };
  } catch (error) {
    console.error('Erreur lors de l\'obtention des informations du cache:', error);
    return {
      exists: false,
      size: 0,
      fileCount: 0,
      error: error.message,
    };
  }
};
