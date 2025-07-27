-- Migration initiale : Création des tables de base pour Rock4you
-- Date: 2025-01-27
-- Description: Tables pour la gestion des utilisateurs et des listes de favoris

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS Utilisateurs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'utilisateur' CHECK(role IN ('administrateur', 'professeur', 'utilisateur')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);

-- Index pour optimiser les recherches par email et username
CREATE INDEX IF NOT EXISTS idx_utilisateurs_email ON Utilisateurs(email);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_username ON Utilisateurs(username);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_role ON Utilisateurs(role);

-- Table des listes de favoris
CREATE TABLE IF NOT EXISTS ListesFavorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL,
    nom_liste TEXT NOT NULL,
    visibilite TEXT NOT NULL DEFAULT 'private' CHECK(visibilite IN ('private', 'shared', 'public')),
    share_token TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES Utilisateurs(id) ON DELETE CASCADE,
    UNIQUE(owner_id, nom_liste)
);

-- Index pour optimiser les recherches de listes
CREATE INDEX IF NOT EXISTS idx_listes_owner ON ListesFavorites(owner_id);
CREATE INDEX IF NOT EXISTS idx_listes_visibilite ON ListesFavorites(visibilite);
CREATE INDEX IF NOT EXISTS idx_listes_share_token ON ListesFavorites(share_token);
CREATE INDEX IF NOT EXISTS idx_listes_created_at ON ListesFavorites(created_at);

-- Table des membres de listes (pour le partage)
CREATE TABLE IF NOT EXISTS ListeMembres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    liste_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK(role IN ('editor', 'viewer')),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (liste_id) REFERENCES ListesFavorites(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Utilisateurs(id) ON DELETE CASCADE,
    UNIQUE(liste_id, user_id)
);

-- Index pour optimiser les recherches de membres
CREATE INDEX IF NOT EXISTS idx_membres_liste ON ListeMembres(liste_id);
CREATE INDEX IF NOT EXISTS idx_membres_user ON ListeMembres(user_id);
CREATE INDEX IF NOT EXISTS idx_membres_role ON ListeMembres(role);

-- Table des passes sauvegardées dans les listes
CREATE TABLE IF NOT EXISTS PassesSauvegardes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    liste_id INTEGER NOT NULL,
    passe_id TEXT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    added_by INTEGER,
    FOREIGN KEY (liste_id) REFERENCES ListesFavorites(id) ON DELETE CASCADE,
    FOREIGN KEY (added_by) REFERENCES Utilisateurs(id) ON DELETE SET NULL,
    UNIQUE(liste_id, passe_id)
);

-- Index pour optimiser les recherches de passes
CREATE INDEX IF NOT EXISTS idx_passes_liste ON PassesSauvegardes(liste_id);
CREATE INDEX IF NOT EXISTS idx_passes_passe_id ON PassesSauvegardes(passe_id);
CREATE INDEX IF NOT EXISTS idx_passes_added_at ON PassesSauvegardes(added_at);
CREATE INDEX IF NOT EXISTS idx_passes_added_by ON PassesSauvegardes(added_by);

-- Insertion d'un utilisateur administrateur par défaut
-- Mot de passe: Admin123! (à changer en production)
INSERT OR IGNORE INTO Utilisateurs (username, email, password_hash, role) 
VALUES (
    'admin', 
    'admin@rock4you.com', 
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qK', 
    'administrateur'
);

-- Insertion d'un utilisateur professeur de test
-- Mot de passe: Prof123! (à changer en production)
INSERT OR IGNORE INTO Utilisateurs (username, email, password_hash, role) 
VALUES (
    'professeur', 
    'prof@rock4you.com', 
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qK', 
    'professeur'
);