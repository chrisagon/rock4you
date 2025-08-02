import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { X, Plus, List } from 'lucide-react-native';

interface PlayList {
  id: string;
  name: string;
  moves: any[];
  color: string;
}

interface PlaylistSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  playlists: PlayList[];
  onSelectPlaylist: (playlistId: string) => void;
  moveId: string;
  moveName: string;
}

export default function PlaylistSelectionModal({
  visible,
  onClose,
  playlists,
  onSelectPlaylist,
  moveId,
  moveName
}: PlaylistSelectionModalProps) {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  const handleConfirmSelection = () => {
    if (selectedPlaylistId) {
      onSelectPlaylist(selectedPlaylistId);
      setSelectedPlaylistId(null);
      onClose();
    } else {
      Alert.alert('Sélection requise', 'Veuillez sélectionner une liste avant de confirmer.');
    }
  };

  const handleClose = () => {
    setSelectedPlaylistId(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <List size={20} color="#FF6B35" />
              <Text style={styles.modalTitle}>Ajouter à une liste</Text>
            </View>
            <TouchableOpacity onPress={handleClose}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.moveInfo}>
            <Text style={styles.moveInfoLabel}>Passe sélectionnée :</Text>
            <Text style={styles.moveInfoName}>{moveName}</Text>
          </View>

          <Text style={styles.sectionTitle}>Choisir une liste :</Text>

          {playlists.length === 0 ? (
            <View style={styles.emptyState}>
              <Plus size={32} color="#666" />
              <Text style={styles.emptyStateText}>Aucune liste disponible</Text>
              <Text style={styles.emptyStateSubtext}>
                Créez d'abord une liste dans la section Favoris
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.playlistsList} showsVerticalScrollIndicator={false}>
              {playlists.map((playlist) => (
                <TouchableOpacity
                  key={playlist.id}
                  style={[
                    styles.playlistOption,
                    selectedPlaylistId === playlist.id && styles.playlistOptionSelected
                  ]}
                  onPress={() => setSelectedPlaylistId(playlist.id)}
                >
                  <View style={[styles.playlistColor, { backgroundColor: playlist.color }]} />
                  <View style={styles.playlistContent}>
                    <Text style={[
                      styles.playlistName,
                      selectedPlaylistId === playlist.id && styles.playlistNameSelected
                    ]}>
                      {playlist.name}
                    </Text>
                    <Text style={styles.playlistCount}>
                      {playlist.moves.length} {playlist.moves.length > 1 ? 'passes' : 'passe'}
                    </Text>
                  </View>
                  <View style={[
                    styles.selectionIndicator,
                    selectedPlaylistId === playlist.id && styles.selectionIndicatorSelected
                  ]} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.confirmButton,
                !selectedPlaylistId && styles.confirmButtonDisabled
              ]} 
              onPress={handleConfirmSelection}
              disabled={!selectedPlaylistId}
            >
              <Text style={[
                styles.confirmButtonText,
                !selectedPlaylistId && styles.confirmButtonTextDisabled
              ]}>
                Ajouter
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 8,
  },
  moveInfo: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B35',
  },
  moveInfoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  moveInfoName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 15,
  },
  playlistsList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  playlistOption: {
    backgroundColor: '#333',
    borderRadius: 12,
    marginBottom: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  playlistOptionSelected: {
    borderColor: '#FF6B35',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  playlistColor: {
    width: 4,
    height: 30,
    borderRadius: 2,
    marginRight: 12,
  },
  playlistContent: {
    flex: 1,
  },
  playlistName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 2,
  },
  playlistNameSelected: {
    color: '#FF6B35',
  },
  playlistCount: {
    fontSize: 12,
    color: '#666',
  },
  selectionIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#666',
  },
  selectionIndicatorSelected: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    marginBottom: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    marginBottom: 5,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#333',
  },
  cancelButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#FF6B35',
  },
  confirmButtonDisabled: {
    backgroundColor: '#666',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButtonTextDisabled: {
    color: '#999',
  },
});