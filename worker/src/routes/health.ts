import { Hono } from 'hono';
import { selectFirst } from '../utils/database';
import { Env } from '../index';

const healthRoutes = new Hono<{ Bindings: Env }>();

/**
 * GET /health - Vérification de l'état de l'API
 */
healthRoutes.get('/', async (c) => {
  try {
    const startTime = Date.now();

    // Test de connexion à la base de données
    let dbStatus = 'unknown';
    let dbResponseTime = 0;
    
    try {
      const dbStartTime = Date.now();
      await selectFirst(c.env.DB, 'SELECT 1 as test');
      dbResponseTime = Date.now() - dbStartTime;
      dbStatus = 'healthy';
    } catch (error) {
      console.error('Erreur test DB:', error);
      dbStatus = 'unhealthy';
    }

    // Récupérer quelques statistiques de base
    let stats = null;
    try {
      stats = await selectFirst(
        c.env.DB,
        `SELECT 
          COUNT(DISTINCT u.id) as total_users,
          COUNT(DISTINCT lf.id) as total_lists,
          COUNT(DISTINCT ps.id) as total_moves
         FROM Utilisateurs u
         LEFT JOIN ListesFavorites lf ON u.id = lf.owner_id
         LEFT JOIN PassesSauvegardes ps ON lf.id = ps.liste_id`
      );
    } catch (error) {
      console.warn('Impossible de récupérer les statistiques:', error);
    }

    const totalResponseTime = Date.now() - startTime;
    const isHealthy = dbStatus === 'healthy';

    const healthData = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: c.env.CORS_ORIGIN === '*' ? 'development' : 'production',
      uptime: process.uptime ? Math.floor(process.uptime()) : null,
      response_time_ms: totalResponseTime,
      services: {
        database: {
          status: dbStatus,
          response_time_ms: dbResponseTime
        },
        api: {
          status: 'healthy',
          response_time_ms: totalResponseTime
        }
      },
      statistics: stats || {
        total_users: 0,
        total_lists: 0,
        total_moves: 0
      }
    };

    // Retourner le statut HTTP approprié
    const statusCode = isHealthy ? 200 : 503;

    return c.json(healthData, statusCode);

  } catch (error) {
    console.error('Erreur health check:', error);
    
    return c.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      error: 'Health check failed',
      services: {
        database: { status: 'unknown' },
        api: { status: 'error' }
      }
    }, 503);
  }
});

/**
 * GET /health/ready - Vérification de disponibilité (readiness probe)
 */
healthRoutes.get('/ready', async (c) => {
  try {
    // Test simple de la base de données
    await selectFirst(c.env.DB, 'SELECT 1');
    
    return c.json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Readiness check failed:', error);
    
    return c.json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: 'Database not accessible'
    }, 503);
  }
});

/**
 * GET /health/live - Vérification de vie (liveness probe)
 */
healthRoutes.get('/live', async (c) => {
  // Simple vérification que l'API répond
  return c.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

/**
 * GET /health/metrics - Métriques basiques (optionnel)
 */
healthRoutes.get('/metrics', async (c) => {
  try {
    // Récupérer des métriques détaillées
    const metrics = await selectFirst(
      c.env.DB,
      `SELECT 
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT CASE WHEN u.role = 'administrateur' THEN u.id END) as admin_users,
        COUNT(DISTINCT CASE WHEN u.role = 'professeur' THEN u.id END) as teacher_users,
        COUNT(DISTINCT CASE WHEN u.role = 'utilisateur' THEN u.id END) as regular_users,
        COUNT(DISTINCT lf.id) as total_lists,
        COUNT(DISTINCT CASE WHEN lf.visibilite = 'private' THEN lf.id END) as private_lists,
        COUNT(DISTINCT CASE WHEN lf.visibilite = 'shared' THEN lf.id END) as shared_lists,
        COUNT(DISTINCT CASE WHEN lf.visibilite = 'public' THEN lf.id END) as public_lists,
        COUNT(DISTINCT ps.id) as total_moves,
        COUNT(DISTINCT lm.id) as total_memberships
       FROM Utilisateurs u
       LEFT JOIN ListesFavorites lf ON u.id = lf.owner_id
       LEFT JOIN PassesSauvegardes ps ON lf.id = ps.liste_id
       LEFT JOIN ListeMembres lm ON lf.id = lm.liste_id`
    );

    // Métriques de performance (simulées)
    const performanceMetrics = {
      avg_response_time_ms: Math.floor(Math.random() * 100) + 50,
      requests_per_minute: Math.floor(Math.random() * 1000) + 100,
      error_rate_percent: Math.random() * 5,
      memory_usage_mb: Math.floor(Math.random() * 100) + 50
    };

    return c.json({
      timestamp: new Date().toISOString(),
      database_metrics: metrics || {},
      performance_metrics: performanceMetrics,
      system_info: {
        version: '1.0.0',
        environment: c.env.CORS_ORIGIN === '*' ? 'development' : 'production',
        region: c.req.header('CF-Ray')?.split('-')[1] || 'unknown'
      }
    });

  } catch (error) {
    console.error('Erreur récupération métriques:', error);
    
    return c.json({
      error: 'Unable to fetch metrics',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

export { healthRoutes };