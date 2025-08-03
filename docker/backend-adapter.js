// Adaptateur pour faire fonctionner le code Cloudflare Workers en Node.js
const { Hono } = require('hono');
const { serve } = require('@hono/node-server');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Simulation de l'environnement Cloudflare Workers
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

// Configuration de l'environnement
const env = {
  DB: new MockD1Database('/app/backend/data/database.sqlite'),
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-here',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*'
};

// Importer et adapter le code du worker
async function createApp() {
  // Ici, vous devrez adapter le code de worker/src/index.ts
  // Pour l'instant, créons une version simplifiée
  
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
  app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

  // TODO: Importer les vraies routes depuis worker/src/routes/
  // app.route('/api/auth', authRoutes);
  // app.route('/api/lists', listsRoutes);
  // app.route('/api/favorites', favoritesRoutes);

  return app;
}

// Démarrage du serveur
async function startServer() {
  const app = await createApp();
  const port = parseInt(process.env.PORT || '3000');
  
  console.log(`🚀 Backend API démarré sur le port ${port}`);
  serve({
    fetch: app.fetch,
    port
  });
}

if (require.main === module) {
  startServer().catch(console.error);
}

module.exports = { createApp, startServer };
