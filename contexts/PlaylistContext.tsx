import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './AuthContext';
import { apiService, Playlist } from '@/services/api';
import { DanceMove, danceMoves } from '@/data/danceMoves';

export interface PlayList {
  id: string;
  name: string;
  moves: DanceMove[];
  color: string;
}

interface PlaylistContextType {
  playlists: PlayList[];
  isLoading: boolean;
  addPlaylist: (name: string, color: string) => Promise<void>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  addMoveToPlaylist: (playlistId: string, move: DanceMove) => Promise<boolean>;
  removeMoveFromPlaylist: (playlistId: string, moveId: string) => Promise<void>;
  isMoveInPlaylist: (playlistId: string, moveId: string) => boolean;
  refreshPlaylists: () => Promise<void>;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

const initialPlaylists: PlayList[] = [
  {
    id: '1',
    name: 'À réviser',
    moves: [],
    color: '#FF6B35'
  },
  {
    id: '2',
    name: 'Cours du lundi',
    moves: [],
    color: '#4CAF50'
  },
];

export function PlaylistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<PlayList[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Charger les playlists depuis l'API
  const loadPlaylists = async () => {
    if (!user) {
      setPlaylists([]);
      return;
    }

    try {
      setIsLoading(true);
      console.log('🔄 Chargement des playlists...');
      const response = await apiService.getPlaylists();
      
      if (response.success && response.data) {
        console.log('🔍 Données brutes de l\'API:', response.data);
        
        // Convertir les playlists API en format local et charger leurs passes
        const convertedPlaylists: PlayList[] = await Promise.all(
          response.data.map(async (playlist) => {
            console.log('🔍 Playlist individuelle:', playlist);
            console.log('🔍 Nom de la playlist:', playlist.nom_liste);
            
            // Charger les passes de cette playlist
            let moves: DanceMove[] = [];
            try {
              const playlistResponse = await apiService.getPlaylistById(playlist.id);
              if (playlistResponse.success && playlistResponse.data?.moves) {
                // Convertir les IDs de passes en objets DanceMove
                moves = playlistResponse.data.moves
                  .map((moveData: any) => {
                    // Trouver la passe correspondante dans danceMoves
                    const move = danceMoves.find(dm => dm.id === moveData.passe_id);
                    return move;
                  })
                  .filter(Boolean) as DanceMove[];
              }
            } catch (error) {
              console.warn('⚠️ Erreur chargement passes pour playlist', playlist.id, error);
            }
            
            return {
              id: playlist.id,
              name: playlist.nom_liste || 'Liste sans nom',
              moves,
              color: '#FF6B35'
            };
          })
        );
        
        console.log('🔍 Playlists converties:', convertedPlaylists);
        setPlaylists(convertedPlaylists);
        console.log('✅ Playlists chargées:', convertedPlaylists.length);
      } else {
        console.error('❌ Erreur réponse playlists:', response.error);
        setPlaylists([]);
      }
    } catch (error) {
      console.error('❌ Erreur chargement playlists:', error);
      setPlaylists([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les playlists au montage et quand l'utilisateur change
  useEffect(() => {
    loadPlaylists();
  }, [user]);

  const addPlaylist = async (name: string, color: string) => {
    if (!user) {
      console.warn('⚠️ Utilisateur non connecté');
      return;
    }

    try {
      console.log('🔄 Création playlist:', name);
      const response = await apiService.createPlaylist(name.trim());
      
      if (response.success && response.data) {
        const newPlaylist: PlayList = {
          id: response.data.id,
          name: response.data.nom_liste,
          moves: [],
          color
        };
        setPlaylists(prev => [...prev, newPlaylist]);
        console.log('✅ Playlist créée:', newPlaylist);
      } else {
        console.error('❌ Erreur création playlist:', response.error);
        Alert.alert('Erreur', 'Impossible de créer la playlist');
      }
    } catch (error) {
      console.error('❌ Erreur création playlist:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la création');
    }
  };

  const deletePlaylist = async (playlistId: string) => {
    if (!user) {
      console.warn('⚠️ Utilisateur non connecté');
      return;
    }

    try {
      console.log('🔄 Suppression playlist:', playlistId);
      const response = await apiService.deletePlaylist(playlistId);
      
      if (response.success) {
        setPlaylists(prev => prev.filter(p => p.id !== playlistId));
        console.log('✅ Playlist supprimée:', playlistId);
      } else {
        console.error('❌ Erreur suppression playlist:', response.error);
        Alert.alert('Erreur', 'Impossible de supprimer la playlist');
      }
    } catch (error) {
      console.error('❌ Erreur suppression playlist:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression');
    }
  };

  const addMoveToPlaylist = async (playlistId: string, move: DanceMove): Promise<boolean> => {
    if (!user) {
      console.warn('⚠️ Utilisateur non connecté');
      return false;
    }

    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) {
      console.error('Playlist non trouvée:', playlistId);
      return false;
    }

    // Vérifier si la passe est déjà dans la liste
    const moveExists = playlist.moves.some(m => m.id === move.id);
    if (moveExists) {
      Alert.alert(
        'Déjà présent',
        `La passe "${move.movementName}" est déjà dans la liste "${playlist.name}".`
      );
      return false;
    }

    try {
      console.log('🔄 Ajout passe à playlist:', { playlistId, moveId: move.id });
      const response = await apiService.addMoveToPlaylist(playlistId, move.id);
      
      if (response.success) {
        // Mettre à jour l'état local
        setPlaylists(prev => prev.map(p => 
          p.id === playlistId 
            ? { ...p, moves: [...p.moves, move] }
            : p
        ));

        Alert.alert(
          '✅ Ajouté avec succès',
          `La passe "${move.movementName}" a été ajoutée à la liste "${playlist.name}".`
        );
        console.log('✅ Passe ajoutée à la playlist');
        return true;
      } else {
        console.error('❌ Erreur ajout passe:', response.error);
        Alert.alert('Erreur', 'Impossible d\'ajouter la passe à la liste');
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur ajout passe:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'ajout');
      return false;
    }
  };

  const removeMoveFromPlaylist = async (playlistId: string, moveId: string) => {
    if (!user) {
      console.warn('⚠️ Utilisateur non connecté');
      return;
    }

    try {
      console.log('🔄 Suppression passe de playlist:', { playlistId, moveId });
      const response = await apiService.removeMoveFromPlaylist(playlistId, moveId);
      
      if (response.success) {
        // Mettre à jour l'état local
        setPlaylists(prev => prev.map(p => 
          p.id === playlistId 
            ? { ...p, moves: p.moves.filter(m => m.id !== moveId) }
            : p
        ));
        console.log('✅ Passe supprimée de la playlist');
      } else {
        console.error('❌ Erreur suppression passe:', response.error);
        Alert.alert('Erreur', 'Impossible de supprimer la passe de la liste');
      }
    } catch (error) {
      console.error('❌ Erreur suppression passe:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression');
    }
  };

  const isMoveInPlaylist = (playlistId: string, moveId: string): boolean => {
    const playlist = playlists.find(p => p.id === playlistId);
    return playlist ? playlist.moves.some(m => m.id === moveId) : false;
  };

  return (
    <PlaylistContext.Provider value={{
      playlists,
      isLoading,
      addPlaylist,
      deletePlaylist,
      addMoveToPlaylist,
      removeMoveFromPlaylist,
      isMoveInPlaylist,
      refreshPlaylists: loadPlaylists
    }}>
      {children}
    </PlaylistContext.Provider>
  );
}

export function usePlaylist() {
  const context = useContext(PlaylistContext);
  if (context === undefined) {
    throw new Error('usePlaylist must be used within a PlaylistProvider');
  }
  return context;
}