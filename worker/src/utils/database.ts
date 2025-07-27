import { ApiError } from '../types';

/**
 * Exécute une requête SQL avec gestion d'erreurs
 */
export async function executeQuery<T = any>(
  db: D1Database,
  query: string,
  params: any[] = []
): Promise<D1Result<T>> {
  try {
    const stmt = db.prepare(query);
    const result = await stmt.bind(...params).run();
    return result as D1Result<T>;
  } catch (error) {
    console.error('Erreur SQL:', error);
    throw new ApiError('Erreur de base de données', 500, 'DATABASE_ERROR');
  }
}

/**
 * Exécute une requête SELECT et retourne tous les résultats
 */
export async function selectAll<T = any>(
  db: D1Database,
  query: string,
  params: any[] = []
): Promise<T[]> {
  try {
    const stmt = db.prepare(query);
    const result = await stmt.bind(...params).all();
    return result.results as T[];
  } catch (error) {
    console.error('Erreur SQL SELECT:', error);
    throw new ApiError('Erreur de lecture en base de données', 500, 'DATABASE_SELECT_ERROR');
  }
}

/**
 * Exécute une requête SELECT et retourne le premier résultat
 */
export async function selectFirst<T = any>(
  db: D1Database,
  query: string,
  params: any[] = []
): Promise<T | null> {
  try {
    const stmt = db.prepare(query);
    const result = await stmt.bind(...params).first();
    return result as T | null;
  } catch (error) {
    console.error('Erreur SQL SELECT FIRST:', error);
    throw new ApiError('Erreur de lecture en base de données', 500, 'DATABASE_SELECT_ERROR');
  }
}

/**
 * Exécute une requête INSERT et retourne l'ID inséré
 */
export async function insertAndGetId(
  db: D1Database,
  query: string,
  params: any[] = []
): Promise<number> {
  try {
    const stmt = db.prepare(query);
    const result = await stmt.bind(...params).run();
    
    if (!result.success) {
      throw new Error('Échec de l\'insertion');
    }
    
    if (result.meta.last_row_id === undefined) {
      throw new Error('ID de ligne non retourné');
    }
    
    return result.meta.last_row_id as number;
  } catch (error) {
    console.error('Erreur SQL INSERT:', error);
    throw new ApiError('Erreur d\'insertion en base de données', 500, 'DATABASE_INSERT_ERROR');
  }
}

/**
 * Exécute une requête UPDATE et retourne le nombre de lignes affectées
 */
export async function updateAndGetCount(
  db: D1Database,
  query: string,
  params: any[] = []
): Promise<number> {
  try {
    const stmt = db.prepare(query);
    const result = await stmt.bind(...params).run();
    
    if (!result.success) {
      throw new Error('Échec de la mise à jour');
    }
    
    return result.meta.changes || 0;
  } catch (error) {
    console.error('Erreur SQL UPDATE:', error);
    throw new ApiError('Erreur de mise à jour en base de données', 500, 'DATABASE_UPDATE_ERROR');
  }
}

/**
 * Exécute une requête DELETE et retourne le nombre de lignes supprimées
 */
export async function deleteAndGetCount(
  db: D1Database,
  query: string,
  params: any[] = []
): Promise<number> {
  try {
    const stmt = db.prepare(query);
    const result = await stmt.bind(...params).run();
    
    if (!result.success) {
      throw new Error('Échec de la suppression');
    }
    
    return result.meta.changes || 0;
  } catch (error) {
    console.error('Erreur SQL DELETE:', error);
    throw new ApiError('Erreur de suppression en base de données', 500, 'DATABASE_DELETE_ERROR');
  }
}

/**
 * Exécute plusieurs requêtes dans une transaction
 */
export async function executeTransaction(
  db: D1Database,
  queries: Array<{ query: string; params?: any[] }>
): Promise<D1Result[]> {
  try {
    const statements = queries.map(({ query, params = [] }) => 
      db.prepare(query).bind(...params)
    );
    
    const results = await db.batch(statements);
    
    // Vérifier que toutes les requêtes ont réussi
    for (const result of results) {
      if (!result.success) {
        throw new Error('Une des requêtes de la transaction a échoué');
      }
    }
    
    return results;
  } catch (error) {
    console.error('Erreur de transaction SQL:', error);
    throw new ApiError('Erreur de transaction en base de données', 500, 'DATABASE_TRANSACTION_ERROR');
  }
}

/**
 * Vérifie si un enregistrement existe
 */
export async function recordExists(
  db: D1Database,
  table: string,
  whereClause: string,
  params: any[] = []
): Promise<boolean> {
  const query = `SELECT 1 FROM ${table} WHERE ${whereClause} LIMIT 1`;
  const result = await selectFirst(db, query, params);
  return result !== null;
}

/**
 * Compte le nombre d'enregistrements
 */
export async function countRecords(
  db: D1Database,
  table: string,
  whereClause: string = '1=1',
  params: any[] = []
): Promise<number> {
  const query = `SELECT COUNT(*) as count FROM ${table} WHERE ${whereClause}`;
  const result = await selectFirst<{ count: number }>(db, query, params);
  return result?.count || 0;
}

/**
 * Génère une clause WHERE pour la pagination
 */
export function buildPaginationClause(page: number = 1, limit: number = 10): {
  offset: number;
  limit: number;
  clause: string;
} {
  const offset = (page - 1) * limit;
  return {
    offset,
    limit,
    clause: `LIMIT ${limit} OFFSET ${offset}`
  };
}

/**
 * Échappe les caractères spéciaux pour LIKE
 */
export function escapeLikeString(str: string): string {
  return str.replace(/[%_\\]/g, '\\$&');
}

/**
 * Construit une clause de recherche LIKE sécurisée
 */
export function buildSearchClause(
  columns: string[],
  searchTerm: string
): { clause: string; params: string[] } {
  if (!searchTerm.trim()) {
    return { clause: '1=1', params: [] };
  }

  const escapedTerm = `%${escapeLikeString(searchTerm.trim())}%`;
  const conditions = columns.map(col => `${col} LIKE ?`);
  const clause = `(${conditions.join(' OR ')})`;
  const params = new Array(columns.length).fill(escapedTerm);

  return { clause, params };
}