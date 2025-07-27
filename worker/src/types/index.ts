// Types pour l'application Rock4you Backend
import { Context } from 'hono';

// Types Cloudflare Workers
declare global {
  interface D1Database {
    prepare(query: string): D1PreparedStatement;
    dump(): Promise<ArrayBuffer>;
    batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
    exec(query: string): Promise<D1ExecResult>;
  }

  interface D1PreparedStatement {
    bind(...values: any[]): D1PreparedStatement;
    first<T = unknown>(colName?: string): Promise<T | null>;
    run(): Promise<D1Result>;
    all<T = unknown>(): Promise<D1Result<T>>;
    raw<T = unknown>(): Promise<T[]>;
  }

  interface D1Result<T = unknown> {
    results?: T[];
    success: boolean;
    error?: string;
    meta: {
      duration: number;
      size_after: number;
      rows_read: number;
      rows_written: number;
      last_row_id?: number;
      changed_db: boolean;
      changes: number;
    };
  }

  interface D1ExecResult {
    count: number;
    duration: number;
  }
}

// Interface pour l'environnement Cloudflare Workers
export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  CORS_ORIGIN: string;
}

// Type pour le contexte Hono avec notre environnement
export type AppContext = Context<{ 
  Bindings: Env; 
  Variables: { 
    user: User; 
    token_payload: JWTPayload;
  } 
}>;

export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  mot_de_passe?: string; // Optionnel car ne doit pas être retourné dans les réponses
  role: 'admin' | 'professeur' | 'utilisateur';
  date_creation: string;
  derniere_connexion?: string;
  est_actif: boolean;
}

export interface UserCreate {
  nom: string;
  prenom: string;
  email: string;
  mot_de_passe: string;
  role?: 'admin' | 'professeur' | 'utilisateur';
}

export interface UserLogin {
  email: string;
  mot_de_passe: string;
}

export interface UserUpdate {
  nom?: string;
  prenom?: string;
  email?: string;
  mot_de_passe?: string;
}

export interface Liste {
  id: string;
  proprietaire_id: string;
  nom: string;
  description?: string;
  est_publique: boolean;
  token_partage?: string;
  date_creation: string;
  date_modification: string;
  proprietaire?: Pick<User, 'id' | 'nom' | 'prenom'>;
  passes?: PasseSauvegarde[];
  membres?: ListeMembre[];
  nombre_passes?: number;
  nombre_membres?: number;
}

export interface ListeCreate {
  nom: string;
  description?: string;
  est_publique?: boolean;
}

export interface ListeUpdate {
  nom?: string;
  description?: string;
  est_publique?: boolean;
}

export interface ListeMembre {
  id: string;
  liste_id: string;
  utilisateur_id: string;
  role: 'editeur' | 'lecteur';
  date_ajout: string;
  utilisateur?: Pick<User, 'id' | 'nom' | 'prenom'>;
}

export interface ListeMembreAdd {
  utilisateur_id: string;
  role: 'editeur' | 'lecteur';
}

export interface PasseSauvegarde {
  id: string;
  liste_id: string;
  passe_id: string;
  date_ajout: string;
  ordre?: number;
}

export interface PasseAdd {
  passe_id: string;
}

export interface PassesBatch {
  passe_ids: string[];
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: Omit<User, 'mot_de_passe'>;
}

export interface JWTPayload {
  user_id: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  user_id: string;
  token_id: string;
  iat: number;
  exp: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface ShareTokenData {
  liste_id: string;
  token: string;
  expires_at?: string;
}

// Types pour les erreurs d'API
export class ApiError extends Error {
  constructor(
    public message: string,
    public status: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Types pour la validation
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// Types pour les requêtes avec pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// Types pour les filtres de recherche
export interface ListeFilters extends PaginationParams {
  search?: string;
  est_publique?: boolean;
  proprietaire_id?: string;
}

export interface UserFilters extends PaginationParams {
  search?: string;
  role?: 'admin' | 'professeur' | 'utilisateur';
  est_actif?: boolean;
}

// Types pour les statistiques
export interface UserStats {
  total_listes: number;
  total_passes: number;
  listes_partagees: number;
  listes_publiques: number;
  derniere_activite?: string;
}

export interface ListeStats {
  total_passes: number;
  total_membres: number;
  date_creation: string;
  derniere_modification: string;
  activite_recente?: number;
}

export interface SystemStats {
  total_utilisateurs: number;
  total_listes: number;
  total_passes: number;
  utilisateurs_actifs: number;
  listes_publiques: number;
  uptime: string;
}

// Types pour les logs et audit
export interface AuditLog {
  id: string;
  utilisateur_id: string;
  action: string;
  ressource_type: string;
  ressource_id: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}

// Types pour les sessions
export interface Session {
  id: string;
  utilisateur_id: string;
  refresh_token_hash: string;
  ip_address?: string;
  user_agent?: string;
  expires_at: string;
  created_at: string;
  last_used_at: string;
}

// Types pour les requêtes de partage
export interface ShareRequest {
  liste_id: string;
  expires_in?: number; // en heures
}

export interface ShareResponse {
  token: string;
  url: string;
  expires_at?: string;
}

// Types pour les opérations en lot
export interface BatchOperation<T> {
  items: T[];
  options?: {
    ignore_errors?: boolean;
    return_details?: boolean;
  };
}

export interface BatchResult<T> {
  success_count: number;
  error_count: number;
  total_count: number;
  results?: T[];
  errors?: Array<{
    item: any;
    error: string;
  }>;
}

// Types pour les métriques de santé
export interface HealthMetrics {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  database: {
    status: 'connected' | 'disconnected' | 'error';
    response_time?: number;
  };
  memory?: {
    used: number;
    limit: number;
  };
  requests?: {
    total: number;
    errors: number;
    avg_response_time: number;
  };
}

// Types pour la configuration
export interface AppConfig {
  jwt: {
    access_token_expiry: string;
    refresh_token_expiry: string;
  };
  pagination: {
    default_limit: number;
    max_limit: number;
  };
  security: {
    bcrypt_rounds: number;
    max_login_attempts: number;
    lockout_duration: number;
  };
  features: {
    registration_enabled: boolean;
    public_lists_enabled: boolean;
    sharing_enabled: boolean;
  };
}