import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { authRoutes } from './routes/auth';
import { listsRoutes } from './routes/lists';
import { usersRoutes } from './routes/users';
import { healthRoutes } from './routes/health';
import { movesRoutes } from './routes/moves';
import { favoritesRoutes } from './routes/favorites';
import { authMiddleware, authLogger } from './middleware/auth';

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  CORS_ORIGIN: string;
  DEFAULT_FAVORITES_LIST_NAME?: string;
}

const app = new Hono<{ Bindings: Env }>();

// Middleware global
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors({
  origin: (origin, c) => {
    const allowedOrigin = c.env.CORS_ORIGIN;
    if (allowedOrigin === '*' || origin === allowedOrigin) {
      return origin;
    }
    return null;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Middleware de logging pour les requêtes authentifiées
app.use('/api/*', authLogger);

// Routes publiques
app.route('/health', healthRoutes);
app.route('/api/auth', authRoutes);

// Routes protégées (nécessitent une authentification)
app.use('/api/users/*', authMiddleware);
app.use('/api/lists/*', authMiddleware);
app.use('/api/favorites/*', authMiddleware);

app.route('/api/users', usersRoutes);
app.route('/api/lists', listsRoutes);
app.route('/api/lists', movesRoutes); // Routes pour les passes dans les listes
app.route('/api/favorites', favoritesRoutes);

// Route par défaut avec documentation de l'API
app.get('/', (c) => {
  return c.json({
    message: 'Rock4you API - Backend pour la gestion des listes de favoris',
    version: '1.0.0',
    documentation: {
      description: 'API RESTful pour la gestion des comptes utilisateur et des listes de passes de danse favorites',
      authentication: 'JWT Bearer Token',
      base_url: c.req.url.replace(c.req.path, ''),
    },
    endpoints: {
      health: {
        status: 'GET /health',
        ready: 'GET /health/ready',
        live: 'GET /health/live',
        metrics: 'GET /health/metrics'
      },
      auth: {
        register: 'POST /auth/register',
        login: 'POST /auth/login',
        refresh: 'POST /auth/refresh',
        logout: 'POST /auth/logout',
        me: 'GET /auth/me'
      },
      users: {
        profile: 'GET /api/users/profile',
        updateProfile: 'PUT /api/users/profile',
        listUsers: 'GET /api/users (admin only)',
        getUser: 'GET /api/users/:id (admin/teacher)',
        updateRole: 'PUT /api/users/:id/role (admin only)'
      },
      lists: {
        getAll: 'GET /api/lists',
        create: 'POST /api/lists',
        getById: 'GET /api/lists/:id',
        update: 'PUT /api/lists/:id',
        delete: 'DELETE /api/lists/:id',
        getMoves: 'GET /api/lists/:id/moves',
        addMove: 'POST /api/lists/:id/moves',
        addMovesBatch: 'POST /api/lists/:id/moves/batch',
        removeMove: 'DELETE /api/lists/:id/moves/:moveId',
        share: 'POST /api/lists/:id/share',
        getShared: 'GET /api/lists/shared/:token'
      }
    },
    features: {
      authentication: 'JWT avec access et refresh tokens',
      authorization: 'Système de rôles (admin, professeur, utilisateur)',
      lists_management: 'CRUD complet pour les listes de favoris',
      sharing: 'Partage sécurisé avec tokens uniques',
      moves_management: 'Ajout/suppression de passes dans les listes',
      batch_operations: 'Opérations en lot pour optimiser les performances',
      pagination: 'Support de la pagination pour les grandes listes',
      search: 'Recherche dans les noms de listes',
      statistics: 'Statistiques utilisateur et système'
    },
    security: {
      password_hashing: 'bcrypt avec 12 rounds',
      jwt_signing: 'Tokens signés avec secret fort',
      sql_injection: 'Protection via requêtes préparées',
      cors: 'Configuration CORS stricte',
      input_validation: 'Validation Zod sur tous les inputs'
    },
    database: {
      type: 'Cloudflare D1 (SQLite)',
      tables: ['Utilisateurs', 'ListesFavorites', 'ListeMembres', 'PassesSauvegardes'],
      features: ['Contraintes FK', 'Index optimisés', 'Triggers', 'Vues']
    }
  });
});

// Gestion des erreurs 404
app.notFound((c) => {
  return c.json({ 
    error: 'Endpoint non trouvé',
    message: 'Vérifiez l\'URL et la méthode HTTP',
    available_endpoints: [
      'GET /',
      'GET /health',
      'POST /auth/register',
      'POST /auth/login',
      'GET /api/users/profile',
      'GET /api/lists'
    ]
  }, 404);
});

// Gestion des erreurs globales
app.onError((err, c) => {
  console.error('Erreur serveur:', {
    message: err.message,
    stack: err.stack,
    url: c.req.url,
    method: c.req.method,
    headers: Object.fromEntries(c.req.raw.headers.entries()),
    timestamp: new Date().toISOString()
  });

  // Ne pas exposer les détails d'erreur en production
  const isProduction = c.env.CORS_ORIGIN !== '*';
  
  return c.json({ 
    error: 'Erreur interne du serveur',
    message: isProduction ? 'Une erreur inattendue s\'est produite' : err.message,
    timestamp: new Date().toISOString(),
    request_id: c.req.header('CF-Ray') || 'unknown'
  }, 500);
});

export default app;