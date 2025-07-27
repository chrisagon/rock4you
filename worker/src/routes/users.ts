import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { selectFirst, updateAndGetCount, selectAll } from '../utils/database';
import { hashPassword, validatePasswordStrength, validateEmail } from '../utils/auth';
import { getCurrentUser, requireRole } from '../middleware/auth';
import { User } from '../types';
import { Env } from '../index';

const usersRoutes = new Hono<{ Bindings: Env }>();

// Schémas de validation
const updateProfileSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  email: z.string().email().optional(),
  current_password: z.string().optional(),
  new_password: z.string().min(8).optional()
});

const updateUserRoleSchema = z.object({
  role: z.enum(['administrateur', 'professeur', 'utilisateur'])
});

/**
 * GET /api/users/profile - Récupérer le profil de l'utilisateur actuel
 */
usersRoutes.get('/profile', async (c) => {
  try {
    const user = getCurrentUser(c) as User;

    // Récupérer les statistiques de l'utilisateur
    const stats = await selectFirst(
      c.env.DB,
      `SELECT 
        COUNT(DISTINCT lf.id) as total_lists,
        COUNT(DISTINCT ps.id) as total_moves,
        COUNT(DISTINCT CASE WHEN lf.visibilite = 'shared' THEN lf.id END) as shared_lists,
        COUNT(DISTINCT CASE WHEN lf.visibilite = 'public' THEN lf.id END) as public_lists,
        COUNT(DISTINCT lm.id) as member_of_lists
       FROM Utilisateurs u
       LEFT JOIN ListesFavorites lf ON u.id = lf.owner_id
       LEFT JOIN PassesSauvegardes ps ON lf.id = ps.liste_id
       LEFT JOIN ListeMembres lm ON u.id = lm.user_id
       WHERE u.id = ?`,
      [user.id]
    );

    return c.json({
      success: true,
      data: {
        user,
        stats: stats || {
          total_lists: 0,
          total_moves: 0,
          shared_lists: 0,
          public_lists: 0,
          member_of_lists: 0
        }
      }
    });

  } catch (error) {
    console.error('Erreur récupération profil:', error);
    return c.json({ error: 'Erreur lors de la récupération du profil' }, 500);
  }
});

/**
 * PUT /api/users/profile - Mettre à jour le profil de l'utilisateur
 */
usersRoutes.put('/profile', zValidator('json', updateProfileSchema), async (c) => {
  try {
    const user = getCurrentUser(c) as User;
    const updates = c.req.valid('json');

    // Vérifier si on veut changer le mot de passe
    if (updates.new_password) {
      if (!updates.current_password) {
        return c.json({
          error: 'Le mot de passe actuel est requis pour changer le mot de passe'
        }, 400);
      }

      // Valider le nouveau mot de passe
      const passwordValidation = validatePasswordStrength(updates.new_password);
      if (!passwordValidation.isValid) {
        return c.json({
          error: 'Nouveau mot de passe trop faible',
          details: passwordValidation.errors
        }, 400);
      }

      // Vérifier le mot de passe actuel
      const currentUser = await selectFirst<{ password_hash: string }>(
        c.env.DB,
        'SELECT password_hash FROM Utilisateurs WHERE id = ?',
        [user.id]
      );

      if (!currentUser) {
        return c.json({ error: 'Utilisateur non trouvé' }, 404);
      }

      const { verifyPassword } = await import('../utils/auth');
      const isValidPassword = await verifyPassword(updates.current_password, currentUser.password_hash);
      if (!isValidPassword) {
        return c.json({ error: 'Mot de passe actuel incorrect' }, 400);
      }
    }

    // Vérifier l'unicité de l'email et du username si modifiés
    if (updates.email || updates.username) {
      const conditions = [];
      const params = [];

      if (updates.email) {
        if (!validateEmail(updates.email)) {
          return c.json({ error: 'Format d\'email invalide' }, 400);
        }
        conditions.push('email = ?');
        params.push(updates.email);
      }

      if (updates.username) {
        conditions.push('username = ?');
        params.push(updates.username);
      }

      params.push(user.id);

      const existingUser = await selectFirst(
        c.env.DB,
        `SELECT id FROM Utilisateurs WHERE (${conditions.join(' OR ')}) AND id != ?`,
        params
      );

      if (existingUser) {
        return c.json({
          error: 'Un utilisateur avec cet email ou nom d\'utilisateur existe déjà'
        }, 409);
      }
    }

    // Construire la requête de mise à jour
    const updateFields = [];
    const updateParams = [];

    if (updates.username) {
      updateFields.push('username = ?');
      updateParams.push(updates.username);
    }

    if (updates.email) {
      updateFields.push('email = ?');
      updateParams.push(updates.email);
    }

    if (updates.new_password) {
      const passwordHash = await hashPassword(updates.new_password);
      updateFields.push('password_hash = ?');
      updateParams.push(passwordHash);
    }

    if (updateFields.length === 0) {
      return c.json({ error: 'Aucune modification fournie' }, 400);
    }

    updateParams.push(user.id);

    // Exécuter la mise à jour
    const updated = await updateAndGetCount(
      c.env.DB,
      `UPDATE Utilisateurs SET ${updateFields.join(', ')} WHERE id = ?`,
      updateParams
    );

    if (updated === 0) {
      return c.json({ error: 'Aucune modification effectuée' }, 400);
    }

    // Récupérer l'utilisateur mis à jour
    const updatedUser = await selectFirst<User>(
      c.env.DB,
      'SELECT id, username, email, role, created_at, last_login_at FROM Utilisateurs WHERE id = ?',
      [user.id]
    );

    return c.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: updatedUser
    });

  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    return c.json({ error: 'Erreur lors de la mise à jour du profil' }, 500);
  }
});

/**
 * GET /api/users - Lister tous les utilisateurs (admin seulement)
 */
usersRoutes.get('/', requireRole('admin'), async (c) => {
  try {
    const users = await selectAll<User>(
      c.env.DB,
      `SELECT 
        u.id, u.username, u.email, u.role, u.created_at, u.last_login_at,
        COUNT(DISTINCT lf.id) as total_lists,
        COUNT(DISTINCT ps.id) as total_moves
       FROM Utilisateurs u
       LEFT JOIN ListesFavorites lf ON u.id = lf.owner_id
       LEFT JOIN PassesSauvegardes ps ON lf.id = ps.liste_id
       GROUP BY u.id, u.username, u.email, u.role, u.created_at, u.last_login_at
       ORDER BY u.created_at DESC`
    );

    return c.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    return c.json({ error: 'Erreur lors de la récupération des utilisateurs' }, 500);
  }
});

/**
 * PUT /api/users/:id/role - Modifier le rôle d'un utilisateur (admin seulement)
 */
usersRoutes.put('/:id/role', requireRole('admin'), zValidator('json', updateUserRoleSchema), async (c) => {
  try {
    const targetUserId = c.req.param('id');
    const { role } = c.req.valid('json');
    const currentUser = getCurrentUser(c) as User;

    // Empêcher un admin de modifier son propre rôle
    if (targetUserId === currentUser.id.toString()) {
      return c.json({
        error: 'Vous ne pouvez pas modifier votre propre rôle'
      }, 400);
    }

    // Vérifier que l'utilisateur cible existe
    const targetUser = await selectFirst(
      c.env.DB,
      'SELECT id, username, role FROM Utilisateurs WHERE id = ?',
      [targetUserId]
    );

    if (!targetUser) {
      return c.json({ error: 'Utilisateur non trouvé' }, 404);
    }

    // Mettre à jour le rôle
    const updated = await updateAndGetCount(
      c.env.DB,
      'UPDATE Utilisateurs SET role = ? WHERE id = ?',
      [role, targetUserId]
    );

    if (updated === 0) {
      return c.json({ error: 'Aucune modification effectuée' }, 400);
    }

    return c.json({
      success: true,
      message: `Rôle de ${targetUser.username} mis à jour vers ${role}`
    });

  } catch (error) {
    console.error('Erreur mise à jour rôle:', error);
    return c.json({ error: 'Erreur lors de la mise à jour du rôle' }, 500);
  }
});

/**
 * GET /api/users/:id - Récupérer un utilisateur spécifique (admin ou professeur)
 */
usersRoutes.get('/:id', requireRole('admin'), async (c) => {
  try {
    const userId = c.req.param('id');

    const user = await selectFirst(
      c.env.DB,
      `SELECT 
        u.id, u.username, u.email, u.role, u.created_at, u.last_login_at,
        COUNT(DISTINCT lf.id) as total_lists,
        COUNT(DISTINCT ps.id) as total_moves,
        COUNT(DISTINCT CASE WHEN lf.visibilite = 'public' THEN lf.id END) as public_lists
       FROM Utilisateurs u
       LEFT JOIN ListesFavorites lf ON u.id = lf.owner_id
       LEFT JOIN PassesSauvegardes ps ON lf.id = ps.liste_id
       WHERE u.id = ?
       GROUP BY u.id, u.username, u.email, u.role, u.created_at, u.last_login_at`,
      [userId]
    );

    if (!user) {
      return c.json({ error: 'Utilisateur non trouvé' }, 404);
    }

    return c.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    return c.json({ error: 'Erreur lors de la récupération de l\'utilisateur' }, 500);
  }
});

export { usersRoutes };