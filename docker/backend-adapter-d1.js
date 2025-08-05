// Adaptateur backend pour Cloudflare D1 en production
const { Hono } = require('hono');
const { serve } = require('@hono/node-server');
const { CloudflareD1Remote } = require('./d1-remote-adapter');

// Configuration de l'environnement
function createEnvironment() {
  if (process.env.USE_CLOUDFLARE_D1 === 'true') {
    // Production avec Cloudflare D1
    return {
      DB: new CloudflareD1Remote(
        process.env.CLOUDFLARE_ACCOUNT_ID,
        process.env.CLOUDFLARE_DATABASE_ID,
        process.env.CLOUDFLARE_API_TOKEN
      ),
      JWT_SECRET: process.env.JWT_SECRET,
      CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
      ENVIRONMENT: 'production'
    };
  } else {
    // Développement avec SQLite local
    const sqlite3 = require('sqlite3').verbose();
    
    class MockD1Database {
      constructor(dbPath) {
        this.db = new sqlite3.Database(dbPath);
      }

      prepare(query) {
        return {
          bind: (...params) => ({
            all: () => new Promise((resolve, reject) => {
              this.db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve({ results: rows });
              });
            }),
            first: () => new Promise((resolve, reject) => {
              this.db.get(query, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
              });
            }),
            run: () => new Promise((resolve, reject) => {
              this.db.run(query, params, function(err) {
                if (err) reject(err);
                else resolve({ 
                  success: true, 
                  meta: { 
                    changes: this.changes,
                    last_row_id: this.lastID 
                  }
                });
              });
            })
          })
        };
      }
    }

    return {
      DB: new MockD1Database('/app/backend/data/database.sqlite'),
      JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key',
      CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
      ENVIRONMENT: 'development'
    };
  }
}

// Importer les routes depuis le worker
async function importWorkerRoutes() {
  try {
    // Ici, vous devrez adapter les routes depuis worker/src/routes/
    // Pour l'instant, créons une version simplifiée
    
    const authRoutes = (env) => {
      const app = new Hono();
      
      app.post('/login', async (c) => {
        // TODO: Implémenter la logique de login
        return c.json({ message: 'Login endpoint', environment: env.ENVIRONMENT });
      });
      
      app.post('/register', async (c) => {
        // TODO: Implémenter la logique de register
        return c.json({ message: 'Register endpoint', environment: env.ENVIRONMENT });
      });
      
      return app;
    };

    const listsRoutes = (env) => {
      const app = new Hono();
      
      app.get('/', async (c) => {
        // TODO: Implémenter la récupération des listes
        return c.json({ message: 'Lists endpoint', environment: env.ENVIRONMENT });
      });
      
      app.post('/', async (c) => {
        // TODO: Implémenter la création de liste
        return c.json({ message: 'Create list endpoint', environment: env.ENVIRONMENT });
      });
      
      return app;
    };

    const favoritesRoutes = (env) => {
      const app = new Hono();
      
      app.get('/', async (c) => {
        // TODO: Implémenter la récupération des favoris
        return c.json({ message: 'Favorites endpoint', environment: env.ENVIRONMENT });
      });
      
      return app;
    };

    return { authRoutes, listsRoutes, favoritesRoutes };
  } catch (error) {
    console.error('Erreur lors de l\'import des routes:', error);
    return null;
  }
}

// Créer l'application
async function createApp() {
  const env = createEnvironment();
  const routes = await importWorkerRoutes();
  
  const app = new Hono();

  // CORS middleware
  app.use('*', async (c, next) => {
    c.header('Access-Control-Allow-Origin', env.CORS_ORIGIN);
    c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (c.req.method === 'OPTIONS') {
      return c.text('', 200);
    }
    
    await next();
  });

  // Routes de base
  app.get('/api/health', (c) => c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: env.ENVIRONMENT,
    database: process.env.USE_CLOUDFLARE_D1 === 'true' ? 'Cloudflare D1' : 'SQLite Local'
  }));

  // Routes de l'application
  if (routes) {
    app.route('/api/auth', routes.authRoutes(env));
    app.route('/api/lists', routes.listsRoutes(env));
    app.route('/api/favorites', routes.favoritesRoutes(env));
  }

  // Route de test de la base de données
  app.get('/api/test-db', async (c) => {
    try {
      // Test simple de connexion à la base
      const result = await env.DB.prepare('SELECT 1 as test').bind().first();
      return c.json({ 
        status: 'Database connection OK', 
        result,
        database_type: process.env.USE_CLOUDFLARE_D1 === 'true' ? 'Cloudflare D1' : 'SQLite Local'
      });
    } catch (error) {
      return c.json({ 
        status: 'Database connection failed', 
        error: error.message 
      }, 500);
    }
  });

  return app;
}

// Démarrage du serveur
async function startServer() {
  try {
    const app = await createApp();
    const port = parseInt(process.env.PORT || '3000');
    
    console.log(`🚀 Backend API démarré sur le port ${port}`);
    console.log(`📊 Base de données: ${process.env.USE_CLOUDFLARE_D1 === 'true' ? 'Cloudflare D1' : 'SQLite Local'}`);
    console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
    
    serve({
      fetch: app.fetch,
      port
    });
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer().catch(console.error);
}

module.exports = { createApp, startServer };
