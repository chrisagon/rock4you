import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService, Favorite } from '@/services/api';
import { useAuth } from './AuthContext';

interface FavoritesContextType {
  favorites: Favorite[];
  isLoading: boolean;
  addFavorite: (itemId: string) => Promise<boolean>;
  removeFavorite: (favoriteId: number) => Promise<boolean>;
  isFavorite: (itemId: string) => boolean;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

interface FavoritesProviderProps {
  children: ReactNode;
}

export function FavoritesProvider({ children }: FavoritesProviderProps) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Charger les favoris depuis l'API
  const refreshFavorites = async () => {
    if (!user) {
      setFavorites([]);
      return;
    }

    try {
      setIsLoading(true);
      console.log('🔄 Chargement des favoris...');
      const response = await apiService.getFavorites();
      
      if (response.success && response.data) {
        setFavorites(response.data);
        console.log('✅ Favoris chargés:', response.data.length);
      } else {
        console.error('❌ Erreur réponse favoris:', response.error);
        setFavorites([]);
      }
    } catch (error) {
      console.error('❌ Erreur chargement favoris:', error);
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Ajouter un favori
  const addFavorite = async (itemId: string): Promise<boolean> => {
    if (!user) {
      console.warn('⚠️ Utilisateur non connecté');
      return false;
    }

    try {
      console.log('🔄 Ajout favori:', itemId);
      const response = await apiService.addFavorite(itemId);
      
      if (response.success && response.data) {
        setFavorites(prev => [...prev, response.data!]);
        console.log('✅ Favori ajouté:', response.data);
        return true;
      } else {
        console.error('❌ Erreur ajout favori:', response.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur ajout favori:', error);
      return false;
    }
  };

  // Supprimer un favori
  const removeFavorite = async (favoriteId: number): Promise<boolean> => {
    if (!user) {
      console.warn('⚠️ Utilisateur non connecté');
      return false;
    }

    try {
      console.log('🔄 Suppression favori:', favoriteId);
      const response = await apiService.removeFavorite(favoriteId);
      
      if (response.success) {
        setFavorites(prev => prev.filter(fav => fav.id !== favoriteId));
        console.log('✅ Favori supprimé:', favoriteId);
        return true;
      } else {
        console.error('❌ Erreur suppression favori:', response.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur suppression favori:', error);
      return false;
    }
  };

  // Vérifier si un item est en favori
  const isFavorite = (itemId: string): boolean => {
    return favorites.some(fav => fav.itemId === itemId);
  };

  // Charger les favoris au montage et quand l'utilisateur change
  useEffect(() => {
    refreshFavorites();
  }, [user]);

  const value: FavoritesContextType = {
    favorites,
    isLoading,
    addFavorite,
    removeFavorite,
    isFavorite,
    refreshFavorites
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}