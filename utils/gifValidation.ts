import { DanceMove } from '@/data/danceMoves';

export interface GifValidationResult {
  isValid: boolean;
  correctedUrl?: string;
  error?: string;
  suggestions?: string[];
}

export class GifValidator {
  private static readonly CLOUDFLARE_R2_BASE = 'https://pub-e9db5024dff64a89897b25c9ea2a0d59.r2.dev/';
  private static readonly VALID_URL_PATTERN = /^https:\/\/pub-[a-f0-9]+\.r2\.dev\/.+\.gif$/i;
  
  /**
   * Valide et corrige une URL de GIF
   */
  static validateAndCorrect(url: string, moveId: string): GifValidationResult {
    if (!url) {
      return {
        isValid: false,
        error: 'URL vide ou manquante',
        suggestions: ['Vérifier la configuration du mouvement']
      };
    }

    // Vérifier si l'URL est déjà valide
    if (this.VALID_URL_PATTERN.test(url)) {
      return { isValid: true, correctedUrl: url };
    }

    // Tentative de correction automatique
    const correctionResult = this.attemptCorrection(url, moveId);
    if (correctionResult.correctedUrl) {
      return {
        isValid: false,
        correctedUrl: correctionResult.correctedUrl,
        error: 'URL corrigée automatiquement',
        suggestions: correctionResult.suggestions
      };
    }

    return {
      isValid: false,
      error: correctionResult.error || 'URL invalide et non corrigeable',
      suggestions: correctionResult.suggestions || [
        'Vérifier l\'URL dans les données source',
        'Contacter l\'administrateur pour mise à jour'
      ]
    };
  }

  /**
   * Tente de corriger automatiquement une URL malformée
   */
  private static attemptCorrection(url: string, moveId: string): Partial<GifValidationResult> {
    const suggestions: string[] = [];

    // Cas 1: Nom de fichier simple (ex: "spaghetti.gif")
    if (url.endsWith('.gif') && !url.includes('/')) {
      const correctedUrl = this.CLOUDFLARE_R2_BASE + encodeURIComponent(url);
      suggestions.push('URL construite à partir du nom de fichier');
      return { correctedUrl, suggestions };
    }

    // Cas 2: Nom de fichier avec numéro (ex: "18 Balade panier ligne garçon.gif")
    const fileNamePattern = /^(\d+\s+.+\.gif)$/i;
    const fileNameMatch = url.match(fileNamePattern);
    if (fileNameMatch) {
      const correctedUrl = this.CLOUDFLARE_R2_BASE + encodeURIComponent(fileNameMatch[1]);
      suggestions.push('URL construite à partir du nom de fichier numéroté');
      return { correctedUrl, suggestions };
    }

    // Cas 3: URL partielle commençant par le domaine
    if (url.startsWith('pub-e9db5024dff64a89897b25c9ea2a0d59.r2.dev/')) {
      const correctedUrl = 'https://' + url;
      suggestions.push('Protocole HTTPS ajouté');
      return { correctedUrl, suggestions };
    }

    // Cas 4: URL avec mauvais domaine mais structure correcte
    const domainPattern = /^https?:\/\/[^\/]+\/(.+\.gif)$/i;
    const domainMatch = url.match(domainPattern);
    if (domainMatch) {
      const correctedUrl = this.CLOUDFLARE_R2_BASE + encodeURIComponent(domainMatch[1]);
      suggestions.push('Domaine corrigé vers Cloudflare R2');
      return { correctedUrl, suggestions };
    }

    // Cas 5: Tentative basée sur l'ID du mouvement
    if (moveId) {
      const moveNumber = moveId.replace('move_', '');
      const possibleFilenames = [
        `${moveNumber}.gif`,
        `${moveNumber} ${moveId}.gif`,
        `move_${moveNumber}.gif`
      ];
      
      suggestions.push(
        'Tentatives basées sur l\'ID du mouvement',
        ...possibleFilenames.map(name => `Essayer: ${this.CLOUDFLARE_R2_BASE}${name}`)
      );
    }

    return {
      error: 'Impossible de corriger automatiquement l\'URL',
      suggestions
    };
  }

  /**
   * Valide une liste de mouvements et retourne un rapport
   */
  static validateMovesList(moves: DanceMove[]): {
    valid: number;
    invalid: number;
    correctable: number;
    details: Array<{
      moveId: string;
      moveName: string;
      originalUrl: string;
      result: GifValidationResult;
    }>;
  } {
    const details: Array<{
      moveId: string;
      moveName: string;
      originalUrl: string;
      result: GifValidationResult;
    }> = [];

    let valid = 0;
    let invalid = 0;
    let correctable = 0;

    moves.forEach(move => {
      if (move.hasGif && move.driveLink) {
        const result = this.validateAndCorrect(move.driveLink, move.id);
        
        details.push({
          moveId: move.id,
          moveName: move.movementName,
          originalUrl: move.driveLink,
          result
        });

        if (result.isValid) {
          valid++;
        } else {
          invalid++;
          if (result.correctedUrl) {
            correctable++;
          }
        }
      }
    });

    return { valid, invalid, correctable, details };
  }

  /**
   * Test de connectivité pour une URL (évite les problèmes CORS)
   */
  static async testConnectivity(url: string, timeout = 10000): Promise<{
    accessible: boolean;
    responseTime?: number;
    error?: string;
    statusCode?: number;
    corsIssue?: boolean;
  }> {
    const startTime = Date.now();
    
    // Vérifier d'abord le cache pour éviter les requêtes répétées
    const cacheKey = `connectivity_${url}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return { ...cached, responseTime: 0 };
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Utiliser une requête GET au lieu de HEAD pour éviter certains problèmes CORS
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache',
        mode: 'no-cors' // Évite les erreurs CORS mais limite les informations
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      const result = {
        accessible: response.type === 'opaque' || response.ok,
        responseTime,
        statusCode: response.status || (response.type === 'opaque' ? 200 : undefined),
        corsIssue: response.type === 'opaque'
      };

      // Mettre en cache le résultat
      this.setInCache(cacheKey, result);
      return result;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      
      // Détecter les erreurs CORS spécifiquement
      const isCorsError = errorMessage.includes('CORS') ||
                         errorMessage.includes('Access-Control-Allow-Origin');
      
      const result = {
        accessible: false,
        responseTime,
        error: errorMessage,
        corsIssue: isCorsError
      };

      // Ne pas mettre en cache les erreurs CORS car elles peuvent être temporaires
      if (!isCorsError) {
        this.setInCache(cacheKey, result);
      }

      return result;
    }
  }

  /**
   * Méthodes de cache simplifiées
   */
  private static getFromCache(key: string): any {
    try {
      const cached = sessionStorage?.getItem(key);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Cache valide pendant 5 minutes
        if ((Date.now() - timestamp) < 300000) {
          return data;
        }
        sessionStorage?.removeItem(key);
      }
    } catch (error) {
      // Ignore les erreurs de sessionStorage
    }
    return null;
  }

  private static setInCache(key: string, data: any): void {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      sessionStorage?.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      // Ignore les erreurs de sessionStorage
    }
  }

  /**
   * Cache des résultats de validation pour éviter les tests répétés
   */
  private static validationCache = new Map<string, {
    result: GifValidationResult;
    timestamp: number;
    connectivityTest?: boolean;
  }>();

  /**
   * Valide avec cache (expire après 5 minutes)
   */
  static validateWithCache(url: string, moveId: string): GifValidationResult {
    const cacheKey = `validation_${url}_${moveId}`;
    
    // Utiliser sessionStorage au lieu de Map pour persister entre les rechargements
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const result = this.validateAndCorrect(url, moveId);
    this.setInCache(cacheKey, result);

    return result;
  }

  /**
   * Nettoie le cache expiré
   */
  static cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of this.validationCache.entries()) {
      if ((now - value.timestamp) > 300000) {
        this.validationCache.delete(key);
      }
    }
  }
}

/**
 * Hook pour la validation en temps réel
 */
export const useGifValidation = (url: string, moveId: string) => {
  const [validationResult, setValidationResult] = React.useState<GifValidationResult | null>(null);
  const [isValidating, setIsValidating] = React.useState(false);

  React.useEffect(() => {
    if (!url) return;

    setIsValidating(true);
    
    // Validation immédiate
    const result = GifValidator.validateWithCache(url, moveId);
    setValidationResult(result);
    
    // Test de connectivité si l'URL semble valide
    if (result.isValid || result.correctedUrl) {
      const testUrl = result.correctedUrl || url;
      GifValidator.testConnectivity(testUrl)
        .then(connectivityResult => {
          setValidationResult(prev => prev ? {
            ...prev,
            error: connectivityResult.accessible ? undefined : 
              `Inaccessible: ${connectivityResult.error || 'HTTP ' + connectivityResult.statusCode}`
          } : null);
        })
        .finally(() => setIsValidating(false));
    } else {
      setIsValidating(false);
    }
  }, [url, moveId]);

  return { validationResult, isValidating };
};

// Import React pour le hook
import React from 'react';