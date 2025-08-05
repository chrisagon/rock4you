// Adaptateur pour utiliser Cloudflare D1 via API REST depuis un container Docker
class CloudflareD1Remote {
  constructor(accountId, databaseId, apiToken) {
    this.accountId = accountId;
    this.databaseId = databaseId;
    this.apiToken = apiToken;
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}`;
    
    if (!accountId || !databaseId || !apiToken) {
      throw new Error('CloudflareD1Remote: accountId, databaseId et apiToken sont requis');
    }
  }

  async query(sql, params = []) {
    try {
      console.log(`🔍 D1 Query: ${sql}`, params.length > 0 ? `avec ${params.length} paramètres` : '');
      
      const response = await fetch(`${this.baseUrl}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sql,
          params
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ D1 API Error: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`D1 API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        console.error('❌ D1 Query failed:', result.errors);
        throw new Error(`D1 Query failed: ${JSON.stringify(result.errors)}`);
      }

      console.log(`✅ D1 Query success:`, result.result[0]?.meta || 'no meta');
      return result;
    } catch (error) {
      console.error('❌ CloudflareD1Remote query error:', error);
      throw error;
    }
  }

  prepare(sql) {
    return {
      bind: (...params) => ({
        all: async () => {
          try {
            const result = await this.query(sql, params);
            return { 
              results: result.result[0]?.results || [],
              meta: result.result[0]?.meta || {}
            };
          } catch (error) {
            console.error('❌ D1 all() error:', error);
            throw error;
          }
        },
        
        first: async () => {
          try {
            const result = await this.query(sql, params);
            const results = result.result[0]?.results || [];
            return results.length > 0 ? results[0] : null;
          } catch (error) {
            console.error('❌ D1 first() error:', error);
            throw error;
          }
        },
        
        run: async () => {
          try {
            const result = await this.query(sql, params);
            return {
              success: result.success,
              meta: result.result[0]?.meta || {
                changes: 0,
                last_row_id: null,
                duration: 0
              }
            };
          } catch (error) {
            console.error('❌ D1 run() error:', error);
            throw error;
          }
        }
      })
    };
  }

  // Méthodes utilitaires pour les tests et le debugging
  async testConnection() {
    try {
      console.log('🔍 Test de connexion D1...');
      const result = await this.query('SELECT 1 as test');
      console.log('✅ Connexion D1 réussie');
      return true;
    } catch (error) {
      console.error('❌ Test de connexion D1 échoué:', error);
      return false;
    }
  }

  async getTableInfo(tableName) {
    try {
      const result = await this.query(`PRAGMA table_info(${tableName})`);
      return result.result[0]?.results || [];
    } catch (error) {
      console.error(`❌ Erreur lors de la récupération des infos de table ${tableName}:`, error);
      throw error;
    }
  }

  async listTables() {
    try {
      const result = await this.query("SELECT name FROM sqlite_master WHERE type='table'");
      return result.result[0]?.results?.map(row => row.name) || [];
    } catch (error) {
      console.error('❌ Erreur lors de la liste des tables:', error);
      throw error;
    }
  }
}

// Fonction utilitaire pour créer une instance D1 Remote
function createD1Remote() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_DATABASE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !databaseId || !apiToken) {
    throw new Error(`
Variables d'environnement manquantes pour Cloudflare D1:
- CLOUDFLARE_ACCOUNT_ID: ${accountId ? '✅' : '❌'}
- CLOUDFLARE_DATABASE_ID: ${databaseId ? '✅' : '❌'}
- CLOUDFLARE_API_TOKEN: ${apiToken ? '✅' : '❌'}

Consultez PRODUCTION_CLOUDFLARE.md pour les instructions de configuration.
    `);
  }

  return new CloudflareD1Remote(accountId, databaseId, apiToken);
}

module.exports = { CloudflareD1Remote, createD1Remote };
