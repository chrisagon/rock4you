/**
 * Configuration Cloudflare R2 pour Rock4you.mobile
 * 
 * Ce fichier centralise la configuration pour l'accès aux GIFs stockés sur Cloudflare R2
 */

export interface CloudflareR2Config {
  bucketName: string;
  accountId: string;
  customDomain?: string;
  baseUrl: string;
}

/**
 * Récupère la configuration Cloudflare R2 depuis les variables d'environnement
 */
export const getCloudflareR2Config = (): CloudflareR2Config => {
  const bucketName = process.env.EXPO_PUBLIC_CLOUDFLARE_R2_BUCKET_NAME;
  const accountId = process.env.EXPO_PUBLIC_CLOUDFLARE_R2_ACCOUNT_ID;
  const customDomain = process.env.EXPO_PUBLIC_CLOUDFLARE_R2_CUSTOM_DOMAIN;

  if (!bucketName || !accountId) {
    throw new Error(
      'Configuration Cloudflare R2 manquante. Vérifiez vos variables d\'environnement EXPO_PUBLIC_CLOUDFLARE_R2_BUCKET_NAME et EXPO_PUBLIC_CLOUDFLARE_R2_ACCOUNT_ID'
    );
  }

  const baseUrl = customDomain 
    ? `https://${customDomain}`
    : `https://${accountId}.r2.cloudflarestorage.com/${bucketName}`;

  return {
    bucketName,
    accountId,
    customDomain,
    baseUrl
  };
};

/**
 * Génère l'URL complète pour un fichier GIF
 * @param fileName Nom du fichier GIF (ex: "passe_base.gif")
 * @returns URL complète vers le GIF sur Cloudflare R2
 */
export const generateGifUrl = (fileName: string): string => {
  if (!fileName) {
    console.warn('Nom de fichier GIF manquant');
    return '';
  }
  
  try {
  const config = getCloudflareR2Config();
  return `${config.baseUrl}/${fileName}`;
  } catch (error) {
    console.error('Erreur lors de la génération de l\'URL GIF:', error);
    return '';
  }
};

/**
 * Valide qu'un nom de fichier GIF est valide
 */
export const isValidGifFileName = (fileName: string): boolean => {
  return fileName && fileName.toLowerCase().endsWith('.gif');
};

/**
 * Teste si une URL GIF est accessible
 * @param url URL à tester
 * @returns Promise<boolean> true si accessible
 */
export const testGifUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('Erreur lors du test de l\'URL GIF:', error);
    return false;
  }
};

/**
 * Génère une URL de fallback pour les GIFs manquants
 */
export const getFallbackGifUrl = (): string => {
  return 'https://via.placeholder.com/300x200/1A1A1A/FF6B35?text=GIF+Non+Disponible';
};