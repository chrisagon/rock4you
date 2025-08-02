const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787';

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
  last_login_at?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user: User;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface Favorite {
  id: number;
  itemId: string;
  createdAt: string;
  addedBy: string;
}

export interface Playlist {
  id: string;
  owner_id: string;
  nom_liste: string;
  description?: string;
  visibilite: string;
  share_token?: string;
  date_creation?: string;
  date_modification?: string;
  passes?: PlaylistMove[];
  nombre_passes?: number;
}

export interface PlaylistMove {
  id: string;
  liste_id: string;
  passe_id: string;
  date_ajout: string;
  ordre?: number;
}

class ApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    console.log('🌐 API Request:', {
      url,
      method: options.method || 'GET',
      headers: options.headers,
      body: options.body
    });
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important pour envoyer les cookies
      ...options,
    };

    try {
      console.log('📡 Envoi de la requête vers:', url);
      const response = await fetch(url, defaultOptions);
      console.log('📨 Réponse reçue:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      const data = await response.json();
      console.log('📄 Données de la réponse:', data);

      if (!response.ok) {
        console.error('❌ Erreur HTTP:', {
          status: response.status,
          error: data.error,
          details: data.details,
          data
        });
        
        // Créer un message d'erreur détaillé
        let errorMessage = data.error || `HTTP error! status: ${response.status}`;
        if (data.details && Array.isArray(data.details) && data.details.length > 0) {
          errorMessage += '\n• ' + data.details.join('\n• ');
        }
        
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error('❌ API Error:', error);
      throw error;
    }
  }

  // Authentification
  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse['data']>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    return response as AuthResponse;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse['data']>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return response as AuthResponse;
  }

  async logout(): Promise<ApiResponse> {
    return this.makeRequest('/api/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.makeRequest<User>('/api/auth/me');
  }

  // Favoris
  async getFavorites(): Promise<ApiResponse<Favorite[]>> {
    return this.makeRequest<Favorite[]>('/api/favorites');
  }

  async addFavorite(itemId: string): Promise<ApiResponse<Favorite>> {
    return this.makeRequest<Favorite>('/api/favorites', {
      method: 'POST',
      body: JSON.stringify({ itemId }),
    });
  }

  async removeFavorite(favoriteId: number): Promise<ApiResponse> {
    return this.makeRequest(`/api/favorites/${favoriteId}`, {
      method: 'DELETE',
    });
  }

  // Playlists/Listes
  async getPlaylists(): Promise<ApiResponse<Playlist[]>> {
    return this.makeRequest<Playlist[]>('/api/lists');
  }

  async getPlaylistById(playlistId: string): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/api/lists/${playlistId}`);
  }

  async createPlaylist(name: string, description?: string): Promise<ApiResponse<Playlist>> {
    return this.makeRequest<Playlist>('/api/lists', {
      method: 'POST',
      body: JSON.stringify({ 
        nom_liste: name,
        description,
        visibilite: 'private'
      }),
    });
  }

  async updatePlaylist(playlistId: string, updates: { name?: string; description?: string }): Promise<ApiResponse<Playlist>> {
    return this.makeRequest<Playlist>(`/api/lists/${playlistId}`, {
      method: 'PUT',
      body: JSON.stringify({
        nom_liste: updates.name,
        description: updates.description
      }),
    });
  }

  async deletePlaylist(playlistId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/lists/${playlistId}`, {
      method: 'DELETE',
    });
  }

  async addMoveToPlaylist(playlistId: string, moveId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/lists/${playlistId}/passes`, {
      method: 'POST',
      body: JSON.stringify({ passe_id: moveId }),
    });
  }

  async removeMoveFromPlaylist(playlistId: string, moveId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/lists/${playlistId}/passes/${moveId}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();