import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { 
  selectFirst, 
  insertAndGetId, 
  deleteAndGetCount,
  selectAll
} from '../utils/database';
import { getCurrentUser } from '../middleware/auth';
import { User } from '../types';
import { Env } from '../index';

const movesRoutes = new Hono<{ Bindings: Env }>();

// Schémas de validation
const addMoveSchema = z.object({
  passe_id: z.string().min(1)
});

/**
 * POST /api/lists/:id/moves - Ajouter une passe à une liste
 */
movesRoutes.post('/:id/moves', zValidator('json', addMoveSchema), async (c) => {
  try {
    const user = getCurrentUser(c) as User;
    const listId = c.req.param('id');
    const { passe_id } = c.req.valid('json');

    // Vérifier que la liste existe et que l'utilisateur a les permissions
    const list = await selectFirst(
      c.env.DB,
      `SELECT lf.*, 
              CASE WHEN lf.owner_id = ? THEN 'owner'
                   WHEN lm.role IN ('editor', 'viewer') THEN lm.role
                   ELSE NULL END as user_role
       FROM ListesFavorites lf
       LEFT JOIN ListeMembres lm ON lf.id = lm.liste_id AND lm.user_id = ?
       WHERE lf.id = ?`,
      [user.id, user.id, listId]
    );

    if (!list) {
      return c.json({ error: 'Liste non trouvée' }, 404);
    }

    // Vérifier les permissions (owner ou editor)
    if (list.user_role !== 'owner' && list.user_role !== 'editor') {
      return c.json({ 
        error: 'Permissions insuffisantes pour ajouter des passes à cette liste' 
      }, 403);
    }

    // Vérifier si la passe existe déjà dans la liste
    const existingMove = await selectFirst(
      c.env.DB,
      'SELECT id FROM PassesSauvegardes WHERE liste_id = ? AND passe_id = ?',
      [listId, passe_id]
    );

    if (existingMove) {
      return c.json({
        error: 'Cette passe est déjà dans la liste'
      }, 409);
    }

    // Ajouter la passe à la liste
    const moveId = await insertAndGetId(
      c.env.DB,
      'INSERT INTO PassesSauvegardes (liste_id, passe_id, added_by) VALUES (?, ?, ?)',
      [listId, passe_id, user.id]
    );

    // Récupérer la passe ajoutée avec les détails
    const addedMove = await selectFirst(
      c.env.DB,
      `SELECT ps.id, ps.passe_id, ps.added_at, u.username as added_by_name
       FROM PassesSauvegardes ps
       LEFT JOIN Utilisateurs u ON ps.added_by = u.id
       WHERE ps.id = ?`,
      [moveId]
    );

    return c.json({
      success: true,
      message: 'Passe ajoutée à la liste avec succès',
      data: addedMove
    }, 201);

  } catch (error) {
    console.error('Erreur ajout passe:', error);
    return c.json({ error: 'Erreur lors de l\'ajout de la passe' }, 500);
  }
});

/**
 * DELETE /api/lists/:id/moves/:moveId - Retirer une passe d'une liste
 */
movesRoutes.delete('/:id/moves/:moveId', async (c) => {
  try {
    const user = getCurrentUser(c) as User;
    const listId = c.req.param('id');
    const moveId = c.req.param('moveId');

    // Vérifier que la liste existe et que l'utilisateur a les permissions
    const list = await selectFirst(
      c.env.DB,
      `SELECT lf.*, 
              CASE WHEN lf.owner_id = ? THEN 'owner'
                   WHEN lm.role IN ('editor', 'viewer') THEN lm.role
                   ELSE NULL END as user_role
       FROM ListesFavorites lf
       LEFT JOIN ListeMembres lm ON lf.id = lm.liste_id AND lm.user_id = ?
       WHERE lf.id = ?`,
      [user.id, user.id, listId]
    );

    if (!list) {
      return c.json({ error: 'Liste non trouvée' }, 404);
    }

    // Vérifier les permissions (owner ou editor)
    if (list.user_role !== 'owner' && list.user_role !== 'editor') {
      return c.json({ 
        error: 'Permissions insuffisantes pour retirer des passes de cette liste' 
      }, 403);
    }

    // Vérifier que la passe existe dans la liste
    const move = await selectFirst(
      c.env.DB,
      'SELECT passe_id FROM PassesSauvegardes WHERE id = ? AND liste_id = ?',
      [moveId, listId]
    );

    if (!move) {
      return c.json({ error: 'Passe non trouvée dans cette liste' }, 404);
    }

    // Supprimer la passe de la liste
    const deleted = await deleteAndGetCount(
      c.env.DB,
      'DELETE FROM PassesSauvegardes WHERE id = ? AND liste_id = ?',
      [moveId, listId]
    );

    if (deleted === 0) {
      return c.json({ error: 'Passe non trouvée' }, 404);
    }

    return c.json({
      success: true,
      message: 'Passe retirée de la liste avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression passe:', error);
    return c.json({ error: 'Erreur lors de la suppression de la passe' }, 500);
  }
});

/**
 * GET /api/lists/:id/moves - Récupérer toutes les passes d'une liste
 */
movesRoutes.get('/:id/moves', async (c) => {
  try {
    const user = getCurrentUser(c) as User;
    const listId = c.req.param('id');

    // Vérifier que la liste existe et que l'utilisateur a accès
    const list = await selectFirst(
      c.env.DB,
      `SELECT lf.*, 
              CASE WHEN lf.owner_id = ? THEN 'owner'
                   WHEN lm.role IS NOT NULL THEN lm.role
                   WHEN lf.visibilite = 'public' THEN 'viewer'
                   ELSE NULL END as user_role
       FROM ListesFavorites lf
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
      `SELECT 
        ps.id,
        ps.passe_id,
        ps.added_at,
        u.username as added_by_name,
        ps.added_by
       FROM PassesSauvegardes ps
       LEFT JOIN Utilisateurs u ON ps.added_by = u.id
       WHERE ps.liste_id = ?
       ORDER BY ps.added_at DESC`,
      [listId]
    );

    return c.json({
      success: true,
      data: {
        list_info: {
          id: list.id,
          nom_liste: list.nom_liste,
          visibilite: list.visibilite,
          user_role: list.user_role
        },
        moves
      }
    });

  } catch (error) {
    console.error('Erreur récupération passes:', error);
    return c.json({ error: 'Erreur lors de la récupération des passes' }, 500);
  }
});

/**
 * POST /api/lists/:id/moves/batch - Ajouter plusieurs passes à une liste
 */
movesRoutes.post('/:id/moves/batch', zValidator('json', z.object({
  passe_ids: z.array(z.string()).min(1).max(50) // Limite à 50 passes par batch
})), async (c) => {
  try {
    const user = getCurrentUser(c) as User;
    const listId = c.req.param('id');
    const { passe_ids } = c.req.valid('json');

    // Vérifier que la liste existe et que l'utilisateur a les permissions
    const list = await selectFirst(
      c.env.DB,
      `SELECT lf.*, 
              CASE WHEN lf.owner_id = ? THEN 'owner'
                   WHEN lm.role IN ('editor', 'viewer') THEN lm.role
                   ELSE NULL END as user_role
       FROM ListesFavorites lf
       LEFT JOIN ListeMembres lm ON lf.id = lm.liste_id AND lm.user_id = ?
       WHERE lf.id = ?`,
      [user.id, user.id, listId]
    );

    if (!list) {
      return c.json({ error: 'Liste non trouvée' }, 404);
    }

    if (list.user_role !== 'owner' && list.user_role !== 'editor') {
      return c.json({ 
        error: 'Permissions insuffisantes pour ajouter des passes à cette liste' 
      }, 403);
    }

    // Vérifier quelles passes existent déjà
    const existingMoves = await selectAll(
      c.env.DB,
      `SELECT passe_id FROM PassesSauvegardes 
       WHERE liste_id = ? AND passe_id IN (${passe_ids.map(() => '?').join(',')})`,
      [listId, ...passe_ids]
    );

    const existingPasseIds = existingMoves.map(m => m.passe_id);
    const newPasseIds = passe_ids.filter(id => !existingPasseIds.includes(id));

    if (newPasseIds.length === 0) {
      return c.json({
        error: 'Toutes les passes sont déjà dans la liste',
        existing_count: existingPasseIds.length
      }, 409);
    }

    // Préparer les requêtes d'insertion
    const insertQueries = newPasseIds.map(passeId => ({
      query: 'INSERT INTO PassesSauvegardes (liste_id, passe_id, added_by) VALUES (?, ?, ?)',
      params: [listId, passeId, user.id]
    }));

    // Exécuter les insertions en batch
    const { executeTransaction } = await import('../utils/database');
    await executeTransaction(c.env.DB, insertQueries);

    return c.json({
      success: true,
      message: `${newPasseIds.length} passes ajoutées avec succès`,
      data: {
        added_count: newPasseIds.length,
        skipped_count: existingPasseIds.length,
        total_requested: passe_ids.length
      }
    }, 201);

  } catch (error) {
    console.error('Erreur ajout batch passes:', error);
    return c.json({ error: 'Erreur lors de l\'ajout des passes' }, 500);
  }
});

export { movesRoutes };