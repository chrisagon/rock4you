import { Context, Next } from 'hono';
import { verifyToken } from '../utils/auth';
import { selectFirst } from '../utils/database';
import { User, JWTPayload, ApiError, Env } from '../types';

/**
 * Middleware d'authentification principal
 * Vérifie le token JWT et charge l'utilisateur
 */
export async function authMiddleware(c: Context<{ Bindings: Env; Variables: { user: User; token_payload: JWTPayload } }>, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');
    const token = extractBearerToken(authHeader);

    if (!token) {
      return c.json({ 
        success: false, 
        error: 'Token d\'authentification requis',
        code: 'MISSING_TOKEN'
      }, 401);
    }

    // Vérifier le token JWT
    const payload = await verifyToken(token, c.env.JWT_SECRET);
    
    // Charger l'utilisateur depuis la base de données
    const user = await selectFirst<User>(
      c.env.DB,
      'SELECT id, nom, prenom, email, role, date_creation, derniere_connexion, est_actif FROM Utilisateurs WHERE id = ? AND est_actif = 1',
      [payload.user_id]
    );

    if (!user) {
      return c.json({ 
        success: false, 
        error: 'Utilisateur non trouvé ou inactif',
        code: 'USER_NOT_FOUND'
      }, 401);
    }

    // Stocker l'utilisateur et le payload dans le contexte
    c.set('user', user);
    c.set('token_payload', payload);

    await next();
  } catch (error) {
    console.error('Erreur middleware auth:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur d\'authentification',
      code: 'AUTH_ERROR'
    }, 401);
  }
}

/**
 * Middleware pour vérifier les rôles requis
 */
export function requireRole(requiredRole: 'admin' | 'professeur') {
  return async (c: Context<{ Bindings: Env; Variables: { user: User; token_payload: JWTPayload } }>, next: Next) => {
    try {
      const user = c.get('user') as User;
      
      if (!user) {
        return c.json({ 
          success: false, 
          error: 'Authentification requise',
          code: 'AUTH_REQUIRED'
        }, 401);
      }

      if (user.role !== requiredRole && user.role !== 'admin') {
        return c.json({ 
          success: false, 
          error: `Rôle ${requiredRole} ou admin requis`,
          code: 'INSUFFICIENT_ROLE'
        }, 403);
      }

      await next();
    } catch (error) {
      console.error('Erreur vérification rôle:', error);
      return c.json({ 
        success: false, 
        error: 'Erreur de vérification des permissions',
        code: 'ROLE_CHECK_ERROR'
      }, 500);
    }
  };
}

/**
 * Middleware pour vérifier la propriété d'une ressource ou un rôle élevé
 */
export function requireOwnershipOrRole(resourceOwnerField: string = 'proprietaire_id', allowedRoles: string[] = ['admin']) {
  return async (c: Context<{ Bindings: Env; Variables: { user: User; token_payload: JWTPayload } }>, next: Next) => {
    try {
      const user = c.get('user') as User;
      
      if (!user) {
        return c.json({ 
          success: false, 
          error: 'Authentification requise',
          code: 'AUTH_REQUIRED'
        }, 401);
      }

      // Les admins ont accès à tout
      if (user.role === 'admin') {
        await next();
        return;
      }

      // Vérifier si l'utilisateur a un rôle autorisé
      if (allowedRoles.includes(user.role)) {
        await next();
        return;
      }

      // Sinon, vérifier la propriété (sera fait dans les routes spécifiques)
      await next();
    } catch (error) {
      console.error('Erreur vérification propriété:', error);
      return c.json({ 
        success: false, 
        error: 'Erreur de vérification des permissions',
        code: 'PERMISSION_CHECK_ERROR' 
      }, 500);
    }
  };
}

/**
 * Middleware optionnel d'authentification
 * N'échoue pas si pas de token, mais charge l'utilisateur si présent
 */
export async function optionalAuth(c: Context<{ Bindings: Env; Variables: { user?: User; token_payload?: JWTPayload } }>, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');
    const token = extractBearerToken(authHeader);

    if (token) {
      try {
        const payload = await verifyToken(token, c.env.JWT_SECRET);
        const user = await selectFirst<User>(
          c.env.DB,
          'SELECT id, nom, prenom, email, role, date_creation, derniere_connexion, est_actif FROM Utilisateurs WHERE id = ?',
          [payload.user_id]
        );

        if (user) {
          c.set('user', user);
          c.set('token_payload', payload);
        }
      } catch (error) {
        // Ignorer les erreurs de token en mode optionnel
        console.warn('Token invalide en mode optionnel:', error);
      }
    }

    await next();
  } catch (error) {
    console.error('Erreur middleware auth optionnel:', error);
    await next(); // Continuer même en cas d'erreur
  }
}

/**
 * Utilitaire pour obtenir l'utilisateur actuel depuis le contexte
 */
export function getCurrentUser(c: Context): User | null {
  try {
    return c.get('user') || null;
  } catch {
    return null;
  }
}

/**
 * Utilitaire pour obtenir le payload JWT depuis le contexte
 */
export function getTokenPayload(c: Context): JWTPayload | null {
  try {
    return c.get('token_payload') || null;
  } catch {
    return null;
  }
}

/**
 * Middleware pour logger les requêtes authentifiées
 */
export async function authLogger(c: Context<{ Bindings: Env }>, next: Next) {
  const user = getCurrentUser(c);
  const method = c.req.method;
  const path = c.req.path;
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';

  console.log(`[${new Date().toISOString()}] ${method} ${path} - User: ${user ? `${user.prenom} ${user.nom} (${user.role})` : 'anonymous'} - IP: ${ip}`);

  await next();
}

/**
 * Extrait le token Bearer de l'en-tête Authorization
 */
function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}

/**
 * Middleware pour valider les permissions sur une ressource spécifique
 */
export function validateResourceAccess(
  getResourceId: (c: Context) => string,
  getResourceOwner: (c: Context, resourceId: string) => Promise<string | null>,
  allowedRoles: string[] = ['admin']
) {
  return async (c: Context<{ Bindings: Env; Variables: { user: User } }>, next: Next) => {
    try {
      const user = c.get('user') as User;
      const resourceId = getResourceId(c);
      
      // Les admins ont accès à tout
      if (allowedRoles.includes(user.role)) {
        await next();
        return;
      }

      // Vérifier la propriété de la ressource
      const ownerId = await getResourceOwner(c, resourceId);
      if (ownerId === user.id) {
        await next();
        return;
      }

      return c.json({
        success: false,
        error: 'Accès non autorisé à cette ressource',
        code: 'RESOURCE_ACCESS_DENIED'
      }, 403);
    } catch (error) {
      console.error('Erreur validation accès ressource:', error);
      return c.json({
        success: false,
        error: 'Erreur de validation des permissions',
        code: 'RESOURCE_VALIDATION_ERROR'
      }, 500);
    }
  };
}