-- Migration avancée : Fonctionnalités étendues pour Rock4you
-- Date: 2025-01-27
-- Description: Tables pour les statistiques, logs et fonctionnalités avancées

-- Table pour les sessions utilisateur (optionnel - pour tracking des connexions)
CREATE TABLE IF NOT EXISTS UserSessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES Utilisateurs(id) ON DELETE CASCADE
);

-- Index pour les sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user ON UserSessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON UserSessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON UserSessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON UserSessions(is_active);

-- Table pour les logs d'activité (optionnel - pour audit)
CREATE TABLE IF NOT EXISTS ActivityLogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id INTEGER,
    details TEXT, -- JSON pour stocker des détails supplémentaires
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Utilisateurs(id) ON DELETE SET NULL
);

-- Index pour les logs
CREATE INDEX IF NOT EXISTS idx_logs_user ON ActivityLogs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_action ON ActivityLogs(action);
CREATE INDEX IF NOT EXISTS idx_logs_resource ON ActivityLogs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON ActivityLogs(created_at);

-- Table pour les statistiques utilisateur (optionnel)
CREATE TABLE IF NOT EXISTS UserStats (
    user_id INTEGER PRIMARY KEY,
    total_lists INTEGER DEFAULT 0,
    total_moves INTEGER DEFAULT 0,
    shared_lists INTEGER DEFAULT 0,
    public_lists INTEGER DEFAULT 0,
    last_activity TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Utilisateurs(id) ON DELETE CASCADE
);

-- Table pour les invitations de partage (optionnel - pour V2)
CREATE TABLE IF NOT EXISTS ShareInvitations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    liste_id INTEGER NOT NULL,
    invited_by INTEGER NOT NULL,
    invited_email TEXT NOT NULL,
    invitation_token TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK(role IN ('editor', 'viewer')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'declined', 'expired')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,
    FOREIGN KEY (liste_id) REFERENCES ListesFavorites(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by) REFERENCES Utilisateurs(id) ON DELETE CASCADE
);

-- Index pour les invitations
CREATE INDEX IF NOT EXISTS idx_invitations_liste ON ShareInvitations(liste_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON ShareInvitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON ShareInvitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON ShareInvitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_expires ON ShareInvitations(expires_at);

-- Table pour les favoris personnels (en plus des listes)
CREATE TABLE IF NOT EXISTS UserFavorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    passe_id TEXT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Utilisateurs(id) ON DELETE CASCADE,
    UNIQUE(user_id, passe_id)
);

-- Index pour les favoris personnels
CREATE INDEX IF NOT EXISTS idx_favorites_user ON UserFavorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_passe ON UserFavorites(passe_id);
CREATE INDEX IF NOT EXISTS idx_favorites_added_at ON UserFavorites(added_at);

-- Vue pour les statistiques des listes
CREATE VIEW IF NOT EXISTS ListeStatsView AS
SELECT 
    lf.id,
    lf.nom_liste,
    lf.owner_id,
    u.username as owner_name,
    lf.visibilite,
    lf.created_at,
    COUNT(DISTINCT ps.id) as total_moves,
    COUNT(DISTINCT lm.id) as total_members,
    MAX(ps.added_at) as last_move_added
FROM ListesFavorites lf
LEFT JOIN Utilisateurs u ON lf.owner_id = u.id
LEFT JOIN PassesSauvegardes ps ON lf.id = ps.liste_id
LEFT JOIN ListeMembres lm ON lf.id = lm.liste_id
GROUP BY lf.id, lf.nom_liste, lf.owner_id, u.username, lf.visibilite, lf.created_at;

-- Vue pour les statistiques utilisateur
CREATE VIEW IF NOT EXISTS UserStatsView AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.role,
    u.created_at,
    u.last_login_at,
    COUNT(DISTINCT lf.id) as total_lists,
    COUNT(DISTINCT ps.id) as total_moves_in_lists,
    COUNT(DISTINCT uf.id) as total_personal_favorites,
    COUNT(DISTINCT CASE WHEN lf.visibilite = 'shared' THEN lf.id END) as shared_lists,
    COUNT(DISTINCT CASE WHEN lf.visibilite = 'public' THEN lf.id END) as public_lists,
    COUNT(DISTINCT lm.id) as member_of_lists
FROM Utilisateurs u
LEFT JOIN ListesFavorites lf ON u.id = lf.owner_id
LEFT JOIN PassesSauvegardes ps ON lf.id = ps.liste_id
LEFT JOIN UserFavorites uf ON u.id = uf.user_id
LEFT JOIN ListeMembres lm ON u.id = lm.user_id
GROUP BY u.id, u.username, u.email, u.role, u.created_at, u.last_login_at;

-- Trigger pour mettre à jour les statistiques utilisateur
CREATE TRIGGER IF NOT EXISTS update_user_stats_on_list_change
AFTER INSERT ON ListesFavorites
BEGIN
    INSERT OR REPLACE INTO UserStats (user_id, total_lists, updated_at)
    SELECT 
        NEW.owner_id,
        COUNT(*),
        CURRENT_TIMESTAMP
    FROM ListesFavorites 
    WHERE owner_id = NEW.owner_id;
END;

-- Trigger pour nettoyer les sessions expirées (sera appelé périodiquement)
CREATE TRIGGER IF NOT EXISTS cleanup_expired_sessions
AFTER INSERT ON UserSessions
BEGIN
    DELETE FROM UserSessions 
    WHERE expires_at < CURRENT_TIMESTAMP;
END;