import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService, User, AuthResponse } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = user !== null;

  // Vérifier le statut d'authentification au démarrage
  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Vérification du statut d\'authentification...');
      
      const response = await apiService.getCurrentUser();
      if (response.success && response.data) {
        console.log('✅ Utilisateur authentifié:', response.data);
        setUser(response.data);
      } else {
        console.log('ℹ️  Utilisateur non authentifié (réponse API)');
        setUser(null);
      }
    } catch (error) {
      console.log('ℹ️  Utilisateur non authentifié (erreur réseau ou API non disponible)');
      console.log('Détails:', error instanceof Error ? error.message : error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Connexion
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await apiService.login(email, password);
      if (response.success && response.data) {
        setUser(response.data.user);
      } else {
        throw new Error(response.message || 'Erreur de connexion');
      }
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Inscription
  const register = async (username: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('🔄 AuthContext: Appel API register...', { username, email });
      
      const response = await apiService.register(username, email, password);
      console.log('📡 AuthContext: Réponse API reçue:', response);
      
      if (response.success && response.data) {
        console.log('✅ AuthContext: Inscription réussie, utilisateur:', response.data.user);
        setUser(response.data.user);
      } else {
        console.error('❌ AuthContext: Réponse API sans succès:', response);
        throw new Error(response.message || 'Erreur d\'inscription');
      }
    } catch (error) {
      console.error('❌ AuthContext: Erreur lors de l\'inscription:', error);
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Déconnexion
  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      setUser(null);
    }
  };

  // Vérifier l'authentification au montage du composant
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personnalisé pour utiliser le contexte d'authentification
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;