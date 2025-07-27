import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { 
  selectFirst, 
  selectAll,
  insertAndGetId, 
  deleteAndGetCount
} from '../utils/database';
import { getCurrentUser } from '../middleware/auth';
import { User } from '../types';
import { Env } from '../index';

const favoritesRoutes = new Hono<{ Bindings: Env }>();

// Schémas de validation
const addFavoriteSchema = z.object({
  itemId: z.string().min(1)
});

/**
 * Récupère ou crée la liste de favoris par défaut pour un utilisateur
 */
async function getOrCreateDefaultList(c: any, user: User): Promise<number> {
  const defaultListName = c.env.DEFAULT_FAVORITES_LIST_NAME || 'Mes Favoris';
  
  // Chercher la liste existante
  const existingList = await selectFirst<{ id: number }>(
    c.env.DB,
    'SELECT id FROM ListesFavorites WHERE owner_id = ? AND nom_liste = ?',
    [user.id, defaultListName]
  );

  if (existingList) {
    return existingList.id;
  }

  // Créer la liste si elle n'existe pas
  const listId = await insertAndGetId(
    c.env.DB,
    'INSERT INTO ListesFavorites (owner_id, nom_liste, visibilite) VALUES (?, ?, ?)',
    [user.id, defaultListName, 'private']
  );

  return listId;
}

/**
 * GET /api/favorites - Récupérer les favoris de l'utilisateur
 */
favoritesRoutes.get('/', async (c) => {
  try {
    const user = getCurrentUser(c) as User;
    const listId = await getOrCreateDefaultList(c, user);

    // Récupérer les favoris de la liste
    const favorites = await selectAll(
      c.env.DB,
      `SELECT 
        ps.id,
        ps.passe_id as itemId,
        ps.added_at as createdAt,
        u.username as addedBy
       FROM PassesSauvegardes ps
       LEFT JOIN Utilisateurs u ON ps.added_by = u.id
       WHERE ps.liste_id = ?
       ORDER BY ps.added_at DESC`,
      [listId]
    );

    return c.json({
      success: true,
      data: favorites
    });

  } catch (error) {
    console.error('Erreur récupération favoris:', error);
    return c.json({ 
      error: 'Erreur lors de la récupération des favoris' 
    }, 500);
  }
});

/**
 * POST /api/favorites - Ajouter un favori
 */
favoritesRoutes.post('/', zValidator('json', addFavoriteSchema), async (c) => {
  try {
    const user = getCurrentUser(c) as User;
    const { itemId } = c.req.valid('json');
    const listId = await getOrCreateDefaultList(c, user);

    // Vérifier si l'item existe déjà dans les favoris
    const existingFavorite = await selectFirst(
      c.env.DB,
      'SELECT id FROM PassesSauvegardes WHERE liste_id = ? AND passe_id = ?',
      [listId, itemId]
    );

    if (existingFavorite) {
      return c.json({
        error: 'Cet item est déjà dans vos favoris'
      }, 409);
    }

    // Ajouter l'item aux favoris
    const favoriteId = await insertAndGetId(
      c.env.DB,
      'INSERT INTO PassesSauvegardes (liste_id, passe_id, added_by) VALUES (?, ?, ?)',
      [listId, itemId, user.id]
    );

    // Récupérer le favori ajouté avec les détails
    const addedFavorite = await selectFirst(
      c.env.DB,
      `SELECT 
        ps.id,
        ps.passe_id as itemId,
        ps.added_at as createdAt,
        u.username as addedBy
       FROM PassesSauvegardes ps
       LEFT JOIN Utilisateurs u ON ps.added_by = u.id
       WHERE ps.id = ?`,
      [favoriteId]
    );

    return c.json({
      success: true,
      message: 'Favori ajouté avec succès',
      data: addedFavorite
    }, 201);

  } catch (error) {
    console.error('Erreur ajout favori:', error);
    return c.json({ 
      error: 'Erreur lors de l\'ajout du favori' 
    }, 500);
  }
});

/**
 * DELETE /api/favorites/:id - Supprimer un favori
 */
favoritesRoutes.delete('/:id', async (c) => {
  try {
    const user = getCurrentUser(c) as User;
    const favoriteId = c.req.param('id');

    // Vérifier que le favori existe et appartient à l'utilisateur
    const favorite = await selectFirst(
      c.env.DB,
      `SELECT ps.id, ps.passe_id 
       FROM PassesSauvegardes ps
       JOIN ListesFavorites lf ON ps.liste_id = lf.id
       WHERE ps.id = ? AND lf.owner_id = ?`,
      [favoriteId, user.id]
    );

    if (!favorite) {
      return c.json({ 
        error: 'Favori non trouvé ou vous n\'avez pas les permissions' 
      }, 404);
    }

    // Supprimer le favori
    const deleted = await deleteAndGetCount(
      c.env.DB,
      'DELETE FROM PassesSauvegardes WHERE id = ?',
      [favoriteId]
    );

    if (deleted === 0) {
      return c.json({ error: 'Favori non trouvé' }, 404);
    }

    return c.json({
      success: true,
      message: 'Favori supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression favori:', error);
    return c.json({ 
      error: 'Erreur lors de la suppression du favori' 
    }, 500);
  }
});

export { favoritesRoutes };