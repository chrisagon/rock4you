import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { 
  selectAll, 
  selectFirst, 
  insertAndGetId, 
  updateAndGetCount, 
  deleteAndGetCount,
  executeTransaction,
  buildPaginationClause,
  buildSearchClause
} from '../utils/database';
import { generateShareToken } from '../utils/auth';
import { getCurrentUser } from '../middleware/auth';
import { Liste, ListeCreate, ListeUpdate, PasseAdd, User } from '../types';
import { Env } from '../index';

const listsRoutes = new Hono<{ Bindings: Env }>();

// Schémas de validation
const createListSchema = z.object({
  nom_liste: z.string().min(1).max(100),
  visibilite: z.enum(['private', 'shared', 'public']).optional()
});

const updateListSchema = z.object({
  nom_liste: z.string().min(1).max(100).optional(),
  visibilite: z.enum(['private', 'shared', 'public']).optional()
});

const addMoveSchema = z.object({
  passe_id: z.string().min(1)
});

const querySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  visibilite: z.enum(['private', 'shared', 'public']).optional()
});

/**
 * GET /api/lists - Récupérer les listes de l'utilisateur
 */
listsRoutes.get('/', zValidator('query', querySchema), async (c) => {
  try {
    const user = getCurrentUser(c) as User;
    const { page = '1', limit = '10', search, visibilite } = c.req.valid('query');
    
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 50); // Limite max de 50
    const { offset, clause: paginationClause } = buildPaginationClause(pageNum, limitNum);

    // Construire la requête avec filtres
    let whereConditions = ['(lf.owner_id = ? OR lm.user_id = ?)'];
    let params = [user.id, user.id];

    if (visibilite) {
      whereConditions.push('lf.visibilite = ?');
      params.push(visibilite);
    }

    if (search) {
      const { clause: searchClause, params: searchParams } = buildSearchClause(
        ['lf.nom_liste'], 
        search
      );
      whereConditions.push(searchClause);
      params.push(...searchParams);
    }

    const whereClause = whereConditions.join(' AND ');

    // Requête principale avec jointures
    const query = `
      SELECT DISTINCT
        lf.id,
        lf.owner_id,
        lf.nom_liste,
        lf.visibilite,
        lf.share_token,
        lf.created_at,
        u.username as owner_name,
        COUNT(DISTINCT ps.id) as move_count,
        COUNT(DISTINCT lm2.id) as member_count,
        CASE WHEN lf.owner_id = ? THEN 'owner' 
             WHEN lm.role IS NOT NULL THEN lm.role 
             ELSE NULL END as user_role
      FROM ListesFavorites lf
      LEFT JOIN Utilisateurs u ON lf.owner_id = u.id
      LEFT JOIN PassesSauvegardes ps ON lf.id = ps.liste_id
      LEFT JOIN ListeMembres lm ON lf.id = lm.liste_id AND lm.user_id = ?
      LEFT JOIN ListeMembres lm2 ON lf.id = lm2.liste_id
      WHERE ${whereClause}
      GROUP BY lf.id, lf.owner_id, lf.nom_liste, lf.visibilite, lf.share_token, lf.created_at, u.username, lm.role
      ORDER BY lf.created_at DESC
      ${paginationClause}
    `;

    const lists = await selectAll(c.env.DB, query, [user.id, user.id, ...params]);

    // Compter le total pour la pagination
    const countQuery = `
      SELECT COUNT(DISTINCT lf.id) as total
      FROM ListesFavorites lf
      LEFT JOIN ListeMembres lm ON lf.id = lm.liste_id AND lm.user_id = ?
      WHERE ${whereClause}
    `;
    const countResult = await selectFirst<{ total: number }>(c.env.DB, countQuery, [user.id, ...params]);
    const total = countResult?.total || 0;

    return c.json({
      success: true,
      data: lists,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Erreur récupération listes:', error);
    return c.json({ error: 'Erreur lors de la récupération des listes' }, 500);
  }
});

/**
 * POST /api/lists - Créer une nouvelle liste
 */
listsRoutes.post('/', zValidator('json', createListSchema), async (c) => {
  try {
    const user = getCurrentUser(c) as User;
    const { nom_liste, visibilite = 'private' } = c.req.valid('json');

    // Vérifier si une liste avec ce nom existe déjà pour cet utilisateur
    const existingList = await selectFirst(
      c.env.DB,
      'SELECT id FROM ListesFavorites WHERE owner_id = ? AND nom_liste = ?',
      [user.id, nom_liste]
    );

    if (existingList) {
      return c.json({
        error: 'Une liste avec ce nom existe déjà'
      }, 409);
    }

    // Générer un token de partage si la liste est partagée
    const shareToken = visibilite === 'shared' ? generateShareToken() : null;

    // Créer la liste
    const listId = await insertAndGetId(
      c.env.DB,
      'INSERT INTO ListesFavorites (owner_id, nom_liste, visibilite, share_token) VALUES (?, ?, ?, ?)',
      [user.id, nom_liste, visibilite, shareToken]
    );

    // Récupérer la liste créée avec les détails
    const newList = await selectFirst(
      c.env.DB,
      `SELECT 
        lf.id, lf.owner_id, lf.nom_liste, lf.visibilite, lf.share_token, lf.created_at,
        u.username as owner_name
       FROM ListesFavorites lf
       LEFT JOIN Utilisateurs u ON lf.owner_id = u.id
       WHERE lf.id = ?`,
      [listId]
    );

    return c.json({
      success: true,
      message: 'Liste créée avec succès',
      data: newList
    }, 201);

  } catch (error) {
    console.error('Erreur création liste:', error);
    return c.json({ error: 'Erreur lors de la création de la liste' }, 500);
  }
});

/**
 * GET /api/lists/:id - Récupérer une liste spécifique avec ses passes
 */
listsRoutes.get('/:id', async (c) => {
  try {
    const user = getCurrentUser(c) as User;
    const listId = c.req.param('id');

    // Récupérer la liste avec vérification des permissions
    const list = await selectFirst(
      c.env.DB,
      `SELECT 
        lf.id, lf.owner_id, lf.nom_liste, lf.visibilite, lf.share_token, lf.created_at,
        u.username as owner_name,
        CASE WHEN lf.owner_id = ? THEN 'owner'
             WHEN lm.role IS NOT NULL THEN lm.role
             WHEN lf.visibilite = 'public' THEN 'viewer'
             ELSE NULL END as user_role
       FROM ListesFavorites lf
       LEFT JOIN Utilisateurs u ON lf.owner_id = u.id
       LEFT JOIN ListeMembres lm ON lf.id = lm.liste_id AND lm.user_id = ?
       WHERE lf.id = ?`,
      [user.id, user.id, listId]
    );

    if (!list) {
      return c.json({ error: 'Liste non trouvée' }, 404);
    }

    // Vérifier les permissions d'accès
    if (!list.user_role && list.visibilite === 'private') {
      return c.json({ error: 'Accès non autorisé' }, 403);
    }

    // Récupérer les passes de la liste
    const moves = await selectAll(
      c.env.DB,
      `SELECT ps.id, ps.passe_id, ps.added_at, u.username as added_by_name
       FROM PassesSauvegardes ps
       LEFT JOIN Utilisateurs u ON ps.added_by = u.id
       WHERE ps.liste_id = ?
       ORDER BY ps.added_at DESC`,
      [listId]
    );

    // Récupérer les membres si l'utilisateur a les permissions
    let members = [];
    if (list.user_role === 'owner' || list.user_role === 'editor') {
      members = await selectAll(
        c.env.DB,
        `SELECT lm.id, lm.user_id, lm.role, u.username
         FROM ListeMembres lm
         LEFT JOIN Utilisateurs u ON lm.user_id = u.id
         WHERE lm.liste_id = ?`,
        [listId]
      );
    }

    return c.json({
      success: true,
      data: {
        ...list,
        moves,
        members
      }
    });

  } catch (error) {
    console.error('Erreur récupération liste:', error);
    return c.json({ error: 'Erreur lors de la récupération de la liste' }, 500);
  }
});

/**
 * PUT /api/lists/:id - Modifier une liste
 */
listsRoutes.put('/:id', zValidator('json', updateListSchema), async (c) => {
  try {
    const user = getCurrentUser(c) as User;
    const listId = c.req.param('id');
    const updates = c.req.valid('json');

    // Vérifier que la liste existe et que l'utilisateur a les permissions
    const list = await selectFirst(
      c.env.DB,
      `SELECT lf.*, 
              CASE WHEN lf.owner_id = ? THEN 'owner'
                   WHEN lm.role = 'editor' THEN 'editor'
                   ELSE NULL END as user_role
       FROM ListesFavorites lf
       LEFT JOIN ListeMembres lm ON lf.id = lm.liste_id AND lm.user_id = ?
       WHERE lf.id = ?`,
      [user.id, user.id, listId]
    );

    if (!list) {
      return c.json({ error: 'Liste non trouvée' }, 404);
    }

    if (!list.user_role) {
      return c.json({ error: 'Permissions insuffisantes' }, 403);
    }

    // Construire la requête de mise à jour
    const updateFields = [];
    const updateParams = [];

    if (updates.nom_liste) {
      updateFields.push('nom_liste = ?');
      updateParams.push(updates.nom_liste);
    }

    if (updates.visibilite) {
      updateFields.push('visibilite = ?');
      updateParams.push(updates.visibilite);

      // Générer ou supprimer le token de partage selon la visibilité
      if (updates.visibilite === 'shared' && !list.share_token) {
        updateFields.push('share_token = ?');
        updateParams.push(generateShareToken());
      } else if (updates.visibilite !== 'shared' && list.share_token) {
        updateFields.push('share_token = NULL');
      }
    }

    if (updateFields.length === 0) {
      return c.json({ error: 'Aucune modification fournie' }, 400);
    }

    updateParams.push(listId);

    // Exécuter la mise à jour
    const updated = await updateAndGetCount(
      c.env.DB,
      `UPDATE ListesFavorites SET ${updateFields.join(', ')} WHERE id = ?`,
      updateParams
    );

    if (updated === 0) {
      return c.json({ error: 'Aucune modification effectuée' }, 400);
    }

    // Récupérer la liste mise à jour
    const updatedList = await selectFirst(
      c.env.DB,
      `SELECT lf.*, u.username as owner_name
       FROM ListesFavorites lf
       LEFT JOIN Utilisateurs u ON lf.owner_id = u.id
       WHERE lf.id = ?`,
      [listId]
    );

    return c.json({
      success: true,
      message: 'Liste mise à jour avec succès',
      data: updatedList
    });

  } catch (error) {
    console.error('Erreur mise à jour liste:', error);
    return c.json({ error: 'Erreur lors de la mise à jour de la liste' }, 500);
  }
});

/**
 * DELETE /api/lists/:id - Supprimer une liste
 */
listsRoutes.delete('/:id', async (c) => {
  try {
    const user = getCurrentUser(c) as User;
    const listId = c.req.param('id');

    // Vérifier que la liste existe et que l'utilisateur est le propriétaire
    const list = await selectFirst(
      c.env.DB,
      'SELECT owner_id FROM ListesFavorites WHERE id = ?',
      [listId]
    );

    if (!list) {
      return c.json({ error: 'Liste non trouvée' }, 404);
    }

    if (list.proprietaire_id !== user.id && user.role !== 'admin') {
      return c.json({ error: 'Seul le propriétaire peut supprimer cette liste' }, 403);
    }

    // Supprimer la liste (les contraintes CASCADE supprimeront les passes et membres)
    const deleted = await deleteAndGetCount(
      c.env.DB,
      'DELETE FROM ListesFavorites WHERE id = ?',
      [listId]
    );

    if (deleted === 0) {
      return c.json({ error: 'Liste non trouvée' }, 404);
    }

    return c.json({
      success: true,
      message: 'Liste supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression liste:', error);
    return c.json({ error: 'Erreur lors de la suppression de la liste' }, 500);
  }
});

export { listsRoutes };