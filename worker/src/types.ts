/**
 * Types TypeScript pour l'API Rock4you
 */

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
  last_login_at?: string;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
  role?: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

export interface JWTPayload {
  user_id: number;
  username: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface ApiError {
  error: string;
  details?: string[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface Favorite {
  id: number;
  itemId: string;
  createdAt: string;
  addedBy: string;
}

export interface FavoriteCreate {
  titre: string;
  artiste: string;
  url?: string;
}

export class ApiError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}