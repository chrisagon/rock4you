import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { 
  hashPassword, 
  verifyPassword, 
  generateAccessToken, 
  generateRefreshToken,
  validatePasswordStrength,
  validateEmail,
  validateUsername,
  verifyToken
} from '../utils/auth';
import { selectFirst, insertAndGetId, updateAndGetCount } from '../utils/database';
import { User, UserCreate, UserLogin, AuthTokens, ApiError } from '../types';
import { Env } from '../index';

const authRoutes = new Hono<{ Bindings: Env }>();

// Schémas de validation Zod
const registerSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['administrateur', 'professeur', 'utilisateur']).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const refreshSchema = z.object({
  refresh_token: z.string()
});

/**
 * POST /auth/register - Inscription d'un nouvel utilisateur
 */
authRoutes.post('/register', zValidator('json', registerSchema), async (c) => {
  try {
    const { username, email, password, role = 'utilisateur' } = c.req.valid('json');

    // Validation du nom d'utilisateur
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      return c.json({
        error: 'Nom d\'utilisateur invalide',
        details: usernameValidation.errors
      }, 400);
    }

    // Validation de l'email
    if (!validateEmail(email)) {
      return c.json({
        error: 'Format d\'email invalide'
      }, 400);
    }

    // Validation du mot de passe
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return c.json({
        error: 'Mot de passe trop faible',
        details: passwordValidation.errors
      }, 400);
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await selectFirst(
      c.env.DB,
      'SELECT id FROM Utilisateurs WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUser) {
      return c.json({
        error: 'Un utilisateur avec cet email ou nom d\'utilisateur existe déjà'
      }, 409);
    }

    // Hacher le mot de passe
    const passwordHash = await hashPassword(password);

    // Créer l'utilisateur
    const userId = await insertAndGetId(
      c.env.DB,
      'INSERT INTO Utilisateurs (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [username, email, passwordHash, role]
    );

    // Récupérer l'utilisateur créé
    const newUser = await selectFirst<User>(
      c.env.DB,
      'SELECT id, username, email, role, created_at FROM Utilisateurs WHERE id = ?',
      [userId]
    );

    if (!newUser) {
      throw new Error('Erreur lors de la création de l\'utilisateur');
    }

    // Générer les tokens
    const accessToken = await generateAccessToken(newUser, c.env.JWT_SECRET);
    const refreshToken = await generateRefreshToken(newUser, c.env.JWT_SECRET);

    // Définir le cookie d'authentification
    const isProduction = c.env.CORS_ORIGIN !== '*';
    const cookieOptions = [
      'HttpOnly',
      'Path=/',
      'Max-Age=3600', // 1 heure
      'SameSite=Strict'
    ];
    
    if (isProduction) {
      cookieOptions.push('Secure');
    }

    c.header('Set-Cookie', `auth_token=${accessToken}; ${cookieOptions.join('; ')}`);

    const response: AuthTokens = {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 3600, // 1 heure
      user: newUser
    };

    return c.json({
      success: true,
      message: 'Inscription réussie',
      data: response
    }, 201);

  } catch (error) {
    console.error('Erreur inscription détaillée:', {
      message: (error as Error).message,
      stack: (error as Error).stack,
      name: (error as Error).name
    });
    return c.json({
      error: 'Erreur lors de l\'inscription',
      debug: (error as Error).message
    }, 500);
  }
});

/**
 * POST /auth/login - Connexion utilisateur
 */
authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  try {
    const { email, password } = c.req.valid('json');

    // Récupérer l'utilisateur
    const user = await selectFirst<User & { password_hash: string }>(
      c.env.DB,
      'SELECT id, username, email, password_hash, role, created_at, last_login_at FROM Utilisateurs WHERE email = ?',
      [email]
    );

    if (!user) {
      return c.json({
        error: 'Email ou mot de passe incorrect'
      }, 401);
    }

    // Vérifier le mot de passe
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return c.json({
        error: 'Email ou mot de passe incorrect'
      }, 401);
    }

    // Mettre à jour la dernière connexion
    await updateAndGetCount(
      c.env.DB,
      'UPDATE Utilisateurs SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    // Préparer les données utilisateur (sans le hash du mot de passe)
    const userWithoutPassword: User = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      last_login_at: new Date().toISOString()
    };

    // Générer les tokens
    const accessToken = await generateAccessToken(userWithoutPassword, c.env.JWT_SECRET);
    const refreshToken = await generateRefreshToken(userWithoutPassword, c.env.JWT_SECRET);

    // Définir le cookie d'authentification
    const isProduction = c.env.CORS_ORIGIN !== '*';
    const cookieOptions = [
      'HttpOnly',
      'Path=/',
      'Max-Age=3600', // 1 heure
      'SameSite=Strict'
    ];
    
    if (isProduction) {
      cookieOptions.push('Secure');
    }

    c.header('Set-Cookie', `auth_token=${accessToken}; ${cookieOptions.join('; ')}`);

    const response: AuthTokens = {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 3600, // 1 heure
      user: userWithoutPassword
    };

    return c.json({
      success: true,
      message: 'Connexion réussie',
      data: response
    });

  } catch (error) {
    console.error('Erreur connexion:', error);
    return c.json({
      error: 'Erreur lors de la connexion'
    }, 500);
  }
});

/**
 * POST /auth/refresh - Rafraîchir le token d'accès
 */
authRoutes.post('/refresh', zValidator('json', refreshSchema), async (c) => {
  try {
    const { refresh_token } = c.req.valid('json');

    // Vérifier le refresh token
    let payload;
    try {
      payload = await verifyToken(refresh_token, c.env.JWT_SECRET);
    } catch (error) {
      return c.json({
        error: 'Refresh token invalide ou expiré'
      }, 401);
    }

    // Vérifier que c'est bien un refresh token
    if (!payload.user_id) {
      return c.json({
        error: 'Token invalide'
      }, 401);
    }

    // Récupérer l'utilisateur
    const user = await selectFirst<User>(
      c.env.DB,
      'SELECT id, username, email, role, created_at, last_login_at FROM Utilisateurs WHERE id = ?',
      [payload.user_id]
    );

    if (!user) {
      return c.json({
        error: 'Utilisateur non trouvé'
      }, 401);
    }

    // Générer un nouveau token d'accès
    const accessToken = await generateAccessToken(user, c.env.JWT_SECRET);

    return c.json({
      success: true,
      data: {
        access_token: accessToken,
        expires_in: 3600,
        user: user
      }
    });

  } catch (error) {
    console.error('Erreur refresh token:', error);
    return c.json({
      error: 'Erreur lors du rafraîchissement du token'
    }, 500);
  }
});

/**
 * POST /auth/logout - Déconnexion (optionnel - côté client principalement)
 */
authRoutes.post('/logout', async (c) => {
  // Effacer le cookie d'authentification
  c.header('Set-Cookie', 'auth_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict');
  
  return c.json({
    success: true,
    message: 'Déconnexion réussie'
  });
});

/**
 * GET /auth/me - Informations sur l'utilisateur actuel (nécessite authentification)
 */
authRoutes.get('/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({
        error: 'Token d\'authentification requis'
      }, 401);
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token, c.env.JWT_SECRET);

    const user = await selectFirst<User>(
      c.env.DB,
      'SELECT id, username, email, role, created_at, last_login_at FROM Utilisateurs WHERE id = ?',
      [payload.user_id]
    );

    if (!user) {
      return c.json({
        error: 'Utilisateur non trouvé'
      }, 401);
    }

    return c.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    return c.json({
      error: 'Token invalide'
    }, 401);
  }
});

export { authRoutes };