import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Dimensions,
  Animated,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Filter, Heart, Play, Pause, Maximize2, Plus, X, ChevronDown, Menu } from 'lucide-react-native';
import { danceMoves, DanceMove, levels, getAllCourses, getAllFamilies } from '@/data/danceMoves';
import PlaylistSelectionModal from '@/components/PlaylistSelectionModal';
import ResponsiveGrid, { calcItemWidth, getNumColumns } from '@/components/ResponsiveGrid';
import GifPlayer from '@/components/GifPlayer';
import FullScreenImageModal from '@/components/FullScreenImageModal';
import MoveCard from '@/components/MoveCard';
import { useFavorites } from '@/contexts/FavoritesContext';
import { usePlaylist } from '@/contexts/PlaylistContext';
import Section from '@/components/Section';
import FilterChips, { type ChipItem } from '@/components/FilterChips';

export default function SearchScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState<'relevance' | 'popularity' | 'date'>('relevance');
  const [playingGifs, setPlayingGifs] = useState<Set<string>>(new Set());
  const [fullScreenVisible, setFullScreenVisible] = useState(false);
  const [selectedMove, setSelectedMove] = useState<DanceMove | null>(null);
  const [playlistModalVisible, setPlaylistModalVisible] = useState(false);
  const [selectedMoveForPlaylist, setSelectedMoveForPlaylist] = useState<DanceMove | null>(null);
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const slideAnim = useState(new Animated.Value(-300))[0];
  const { addFavorite, removeFavorite, favorites } = useFavorites();
  const { playlists, addMoveToPlaylist } = usePlaylist();

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    return () => subscription?.remove();
  }, []);

  // Déterminer si on est sur web/tablette (largeur > 768px)
  const isDesktopLayout = screenData.width >= 768;
  
  // Pour le layout desktop, toujours 2 colonnes pour les vidéos
  // Pour mobile, utiliser la logique responsive existante
  const columns = isDesktopLayout ? 2 : getNumColumns(screenData.width);
  const itemWidth = isDesktopLayout 
    ? calcItemWidth(screenData.width * 0.75, 2, 20, 15) // 75% de la largeur pour les vidéos
    : calcItemWidth(screenData.width, columns, 20, 15);

  const uniqueLevels = useMemo(() => levels, []);
  const uniqueCourses = useMemo(() => getAllCourses(), []);
  const uniqueDifficulties = useMemo(() => [1, 2, 3, 4, 5], []);
  const uniqueFamilies = useMemo(() => getAllFamilies().filter((f) => f !== ''), []);

  // Chips data builders
  const levelChips: ChipItem[] = uniqueLevels.map((lvl) => ({ id: lvl, label: lvl, selected: selectedLevel === lvl }));
  const courseChips: ChipItem[] = uniqueCourses.map((c) => ({ id: c, label: c, selected: selectedCourse === c }));
  const difficultyChips: ChipItem[] = uniqueDifficulties.map((d) => ({ id: String(d), label: `Niv.${d}`, selected: selectedDifficulty === d }));
  const familyChips: ChipItem[] = uniqueFamilies.map((f) => ({ id: f, label: f, selected: selectedFamily === f }));

  // Toggle handlers
  const onToggleLevel = (id: string) => setSelectedLevel((prev) => prev === id ? null : id);
  const onToggleCourse = (id: string) => setSelectedCourse((prev) => prev === id ? null : id);
  const onToggleDifficulty = (id: string) => {
    const n = parseInt(id, 10);
    setSelectedDifficulty((prev) => prev === n ? null : n);
  };
  const onToggleFamily = (id: string) => setSelectedFamily((prev) => prev === id ? null : id);

  const resetFilters = () => {
    setSelectedLevel(null);
    setSelectedFamily(null);
    setSelectedCourse(null);
    setSelectedDifficulty(null);
  };

  const filteredMoves = danceMoves.filter(move => {
    const matchesSearch = move.movementName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         move.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         move.family.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         move.remarks.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = !selectedLevel || move.level === selectedLevel;
    const matchesFamily = !selectedFamily || move.family === selectedFamily;
    const matchesCourse = !selectedCourse || move.courseName === selectedCourse;
    const matchesDifficulty = selectedDifficulty === null || move.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesLevel && matchesFamily && matchesCourse && matchesDifficulty;
  });

  const toggleGifPlayback = useCallback((moveId: string) => {
    setPlayingGifs(prev => {
      const next = new Set(prev);
      if (next.has(moveId)) {
        next.delete(moveId);
      } else {
        next.add(moveId);
      }
      return next;
    });
  }, []);

  const openPlaylistModal = useCallback((move: DanceMove) => {
    setSelectedMove(move);
    setPlaylistModalVisible(true);
  }, []);

  const openFullScreen = useCallback((move: DanceMove) => {
    setSelectedMove(move);
    setFullScreenVisible(true);
  }, []);

  const closeFullScreen = useCallback(() => {
    setFullScreenVisible(false);
    setSelectedMove(null);
  }, []);

  const closePlaylistModal = useCallback(() => {
    setPlaylistModalVisible(false);
    setSelectedMoveForPlaylist(null);
  }, []);

  const handleAddToPlaylist = useCallback((playlistId: string) => {
    if (selectedMoveForPlaylist) {
      addMoveToPlaylist(playlistId, selectedMoveForPlaylist);
    }
  }, [selectedMoveForPlaylist]);

  const isFavoriteMove = useCallback((moveId: string) => {
    return favorites.some(fav => fav.itemId === moveId);
  }, [favorites]);

  const toggleFavorite = useCallback(async (moveId: string) => {
    console.log('🔄 Toggle favori pour:', moveId);
    
    // Trouver le favori existant pour cet item
    const existingFavorite = favorites.find(fav => fav.itemId === moveId);
    
    if (existingFavorite) {
      // Supprimer des favoris
      const success = await removeFavorite(existingFavorite.id);
      if (success) {
        Alert.alert('✅ Succès', 'Supprimé des favoris');
      } else {
        Alert.alert('❌ Erreur', 'Impossible de supprimer le favori');
      }
    } else {
      // Ajouter aux favoris
      const success = await addFavorite(moveId);
      if (success) {
        Alert.alert('✅ Succès', 'Ajouté aux favoris');
      } else {
        Alert.alert('❌ Erreur', 'Impossible d\'ajouter aux favoris');
      }
    }
  }, [favorites, addFavorite, removeFavorite]);

  const getLevelColor = useCallback((level: string) => {
    switch (level) {
      case 'Débutant': return '#4CAF50';
      case 'Intermédiaire': return '#2196F3';
      case 'Avancé': return '#FF9800';
      default: return '#666';
    }
  }, []);

  // Fonctions pour gérer le menu latéral mobile
  const openSidebar = () => {
    setSidebarVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeSidebar = () => {
    Animated.timing(slideAnim, {
      toValue: -300,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSidebarVisible(false);
    });
  };

  // Rendu pour layout desktop (web/tablette)
  if (isDesktopLayout) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Recherche</Text>
          <Text style={styles.subtitle}>Trouvez la passe parfaite</Text>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher une passe..."
              placeholderTextColor="#666"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
        </View>

        <View style={styles.desktopLayoutContainer}>
          {/* Colonne de gauche : Filtres */}
          <View style={styles.desktopSidebar}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>Filtres</Text>
              <TouchableOpacity onPress={resetFilters}>
                <Text style={styles.resetFiltersText}>Réinitialiser</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} style={styles.sidebarScroll}>
              <View style={styles.filterSectionDesktop}>
                <Text style={styles.filterTitleDesktop}>Niveau</Text>
                <View style={styles.filterChipsVertical}>
                  {levelChips.map((chip) => (
                    <TouchableOpacity
                      key={chip.id}
                      style={[
                        styles.filterButtonDesktop,
                        chip.selected && styles.filterButtonDesktopActive
                      ]}
                      onPress={() => onToggleLevel(chip.id)}
                    >
                      <Text style={[
                        styles.filterButtonTextDesktop,
                        chip.selected && styles.filterButtonTextDesktopActive
                      ]}>
                        {chip.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSectionDesktop}>
                <Text style={styles.filterTitleDesktop}>Cours</Text>
                <View style={styles.filterChipsVertical}>
                  {courseChips.map((chip) => (
                    <TouchableOpacity
                      key={chip.id}
                      style={[
                        styles.filterButtonDesktop,
                        chip.selected && styles.filterButtonDesktopActive
                      ]}
                      onPress={() => onToggleCourse(chip.id)}
                    >
                      <Text style={[
                        styles.filterButtonTextDesktop,
                        chip.selected && styles.filterButtonTextDesktopActive
                      ]}>
                        {chip.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSectionDesktop}>
                <Text style={styles.filterTitleDesktop}>Difficulté</Text>
                <View style={styles.filterChipsVertical}>
                  {difficultyChips.map((chip) => (
                    <TouchableOpacity
                      key={chip.id}
                      style={[
                        styles.filterButtonDesktop,
                        chip.selected && styles.filterButtonDesktopActive
                      ]}
                      onPress={() => onToggleDifficulty(chip.id)}
                    >
                      <Text style={[
                        styles.filterButtonTextDesktop,
                        chip.selected && styles.filterButtonTextDesktopActive
                      ]}>
                        {chip.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSectionDesktop}>
                <Text style={styles.filterTitleDesktop}>Famille</Text>
                <View style={styles.filterChipsVertical}>
                  {familyChips.map((chip) => (
                    <TouchableOpacity
                      key={chip.id}
                      style={[
                        styles.filterButtonDesktop,
                        chip.selected && styles.filterButtonDesktopActive
                      ]}
                      onPress={() => onToggleFamily(chip.id)}
                    >
                      <Text style={[
                        styles.filterButtonTextDesktop,
                        chip.selected && styles.filterButtonTextDesktopActive
                      ]}>
                        {chip.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSectionDesktop}>
                <Text style={styles.filterTitleDesktop}>Trier par</Text>
                <View style={styles.filterChipsVertical}>
                  <TouchableOpacity
                    style={[
                      styles.filterButtonDesktop,
                      selectedSort === 'relevance' && styles.filterButtonDesktopActive
                    ]}
                    onPress={() => setSelectedSort('relevance')}
                  >
                    <Text style={[
                      styles.filterButtonTextDesktop,
                      selectedSort === 'relevance' && styles.filterButtonTextDesktopActive
                    ]}>
                      Pertinence
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterButtonDesktop,
                      selectedSort === 'popularity' && styles.filterButtonDesktopActive
                    ]}
                    onPress={() => setSelectedSort('popularity')}
                  >
                    <Text style={[
                      styles.filterButtonTextDesktop,
                      selectedSort === 'popularity' && styles.filterButtonTextDesktopActive
                    ]}>
                      Alphabétique
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterButtonDesktop,
                      selectedSort === 'date' && styles.filterButtonDesktopActive
                    ]}
                    onPress={() => setSelectedSort('date')}
                  >
                    <Text style={[
                      styles.filterButtonTextDesktop,
                      selectedSort === 'date' && styles.filterButtonTextDesktopActive
                    ]}>
                      Difficulté
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>

          {/* Colonne de droite : Résultats */}
          <View style={styles.desktopMainContent}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>Résultats</Text>
              <Text style={styles.resultsCount}>{filteredMoves.length} passes trouvées</Text>
            </View>

            {filteredMoves.length === 0 ? (
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>Aucune passe trouvée</Text>
                <Text style={styles.noResultsSubtext}>
                  Essayez de modifier vos filtres de recherche
                </Text>
              </View>
            ) : (
              <ResponsiveGrid<DanceMove>
                data={filteredMoves}
                keyExtractor={(item) => item.id}
                renderItem={({ item: move }) => (
                  <MoveCard
                    move={move}
                    width={itemWidth}
                    columns={columns}
                    isPlaying={playingGifs.has(move.id)}
                    isFavorite={isFavoriteMove(move.id)}
                    onTogglePlay={toggleGifPlayback}
                    onToggleFavorite={toggleFavorite}
                    onOpenFullScreen={openFullScreen}
                    onOpenPlaylist={openPlaylistModal}
                    getLevelColor={getLevelColor}
                  />
                )}
              />
            )}
          </View>
        </View>

        <Modal
        visible={moreFiltersOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setMoreFiltersOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Plus de filtres</Text>

            <Text style={styles.modalSectionTitle}>Trier par</Text>
            <View style={{ gap: 10 }}>
              <TouchableOpacity
                style={[styles.sortButton, selectedSort === 'relevance' && styles.sortButtonActive]}
                onPress={() => setSelectedSort('relevance')}
                accessibilityRole="button"
                accessibilityLabel="Trier par pertinence"
              >
                <Text style={[styles.sortButtonText, selectedSort === 'relevance' && styles.sortButtonTextActive]}>Pertinence</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, selectedSort === 'popularity' && styles.sortButtonActive]}
                onPress={() => setSelectedSort('popularity')}
                accessibilityRole="button"
                accessibilityLabel="Trier alphabétiquement"
              >
                <Text style={[styles.sortButtonText, selectedSort === 'popularity' && styles.sortButtonTextActive]}>Alphabétique</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, selectedSort === 'date' && styles.sortButtonActive]}
                onPress={() => setSelectedSort('date')}
                accessibilityRole="button"
                accessibilityLabel="Trier par difficulté"
              >
                <Text style={[styles.sortButtonText, selectedSort === 'date' && styles.sortButtonTextActive]}>Difficulté</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
                <Text style={styles.resetButtonText}>Réinitialiser</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={() => setMoreFiltersOpen(false)}>
                <Text style={styles.closeButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </Modal>

        {fullScreenVisible && selectedMove && (
        <FullScreenImageModal
          visible={fullScreenVisible}
          move={selectedMove}
          isPlaying={playingGifs.has(selectedMove.id)}
          onClose={closeFullScreen}
        />
      )}
      <PlaylistSelectionModal
        visible={playlistModalVisible}
        onClose={closePlaylistModal}
        playlists={playlists}
        onSelectPlaylist={handleAddToPlaylist}
        moveId={selectedMoveForPlaylist?.id || ''}
        moveName={selectedMoveForPlaylist?.movementName || ''}
      />
      </SafeAreaView>
    );
  }

  // Rendu pour layout mobile (par défaut)
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recherche</Text>
        <Text style={styles.subtitle}>Trouvez la passe parfaite</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainerMobile}>
          <TouchableOpacity 
            style={styles.hamburgerButton} 
            onPress={openSidebar}
          >
            <Menu size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.searchInputWrapper}>
            <Search size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher une passe..."
              placeholderTextColor="#666"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
        </View>
      </View>

      {/* Menu latéral pour mobile */}
      <Modal
        visible={sidebarVisible}
        transparent
        animationType="none"
        onRequestClose={closeSidebar}
      >
        <View style={styles.sidebarModalContainer}>
          <TouchableOpacity 
            style={styles.sidebarOverlay} 
            activeOpacity={1}
            onPress={closeSidebar}
          />
          <Animated.View 
            style={[
              styles.mobileSidebar,
              { transform: [{ translateX: slideAnim }] }
            ]}
          >
            <View style={styles.mobileSidebarHeader}>
              <Text style={styles.mobileSidebarTitle}>Filtres</Text>
              <TouchableOpacity onPress={closeSidebar}>
                <X size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} style={styles.mobileSidebarContent}>
              <View style={styles.filterSectionMobile}>
                <Text style={styles.filterTitleMobile}>Niveau</Text>
                <View style={styles.filterChipsVertical}>
                  {levelChips.map((chip) => (
                    <TouchableOpacity
                      key={chip.id}
                      style={[
                        styles.filterButtonMobile,
                        chip.selected && styles.filterButtonMobileActive
                      ]}
                      onPress={() => onToggleLevel(chip.id)}
                    >
                      <Text style={[
                        styles.filterButtonTextMobile,
                        chip.selected && styles.filterButtonTextMobileActive
                      ]}>
                        {chip.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSectionMobile}>
                <Text style={styles.filterTitleMobile}>Cours</Text>
                <View style={styles.filterChipsVertical}>
                  {courseChips.map((chip) => (
                    <TouchableOpacity
                      key={chip.id}
                      style={[
                        styles.filterButtonMobile,
                        chip.selected && styles.filterButtonMobileActive
                      ]}
                      onPress={() => onToggleCourse(chip.id)}
                    >
                      <Text style={[
                        styles.filterButtonTextMobile,
                        chip.selected && styles.filterButtonTextMobileActive
                      ]}>
                        {chip.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSectionMobile}>
                <Text style={styles.filterTitleMobile}>Difficulté</Text>
                <View style={styles.filterChipsVertical}>
                  {difficultyChips.map((chip) => (
                    <TouchableOpacity
                      key={chip.id}
                      style={[
                        styles.filterButtonMobile,
                        chip.selected && styles.filterButtonMobileActive
                      ]}
                      onPress={() => onToggleDifficulty(chip.id)}
                    >
                      <Text style={[
                        styles.filterButtonTextMobile,
                        chip.selected && styles.filterButtonTextMobileActive
                      ]}>
                        {chip.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSectionMobile}>
                <Text style={styles.filterTitleMobile}>Famille</Text>
                <View style={styles.filterChipsVertical}>
                  {familyChips.map((chip) => (
                    <TouchableOpacity
                      key={chip.id}
                      style={[
                        styles.filterButtonMobile,
                        chip.selected && styles.filterButtonMobileActive
                      ]}
                      onPress={() => onToggleFamily(chip.id)}
                    >
                      <Text style={[
                        styles.filterButtonTextMobile,
                        chip.selected && styles.filterButtonTextMobileActive
                      ]}>
                        {chip.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSectionMobile}>
                <Text style={styles.filterTitleMobile}>Trier par</Text>
                <View style={styles.filterChipsVertical}>
                  <TouchableOpacity
                    style={[
                      styles.filterButtonMobile,
                      selectedSort === 'relevance' && styles.filterButtonMobileActive
                    ]}
                    onPress={() => setSelectedSort('relevance')}
                  >
                    <Text style={[
                      styles.filterButtonTextMobile,
                      selectedSort === 'relevance' && styles.filterButtonTextMobileActive
                    ]}>
                      Pertinence
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterButtonMobile,
                      selectedSort === 'popularity' && styles.filterButtonMobileActive
                    ]}
                    onPress={() => setSelectedSort('popularity')}
                  >
                    <Text style={[
                      styles.filterButtonTextMobile,
                      selectedSort === 'popularity' && styles.filterButtonTextMobileActive
                    ]}>
                      Alphabétique
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterButtonMobile,
                      selectedSort === 'date' && styles.filterButtonMobileActive
                    ]}
                    onPress={() => setSelectedSort('date')}
                  >
                    <Text style={[
                      styles.filterButtonTextMobile,
                      selectedSort === 'date' && styles.filterButtonTextMobileActive
                    ]}>
                      Difficulté
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <View style={styles.mobileSidebarFooter}>
              <TouchableOpacity 
                style={styles.resetButtonMobile} 
                onPress={() => {
                  resetFilters();
                  closeSidebar();
                }}
              >
                <Text style={styles.resetButtonTextMobile}>Réinitialiser les filtres</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      <View style={styles.resultsContainer}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>Résultats</Text>
          <Text style={styles.resultsCount}>{filteredMoves.length} passes trouvées</Text>
        </View>

        {filteredMoves.length === 0 ? (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>Aucune passe trouvée</Text>
            <Text style={styles.noResultsSubtext}>
              Essayez de modifier vos filtres de recherche
            </Text>
          </View>
        ) : (
          <ResponsiveGrid<DanceMove>
            data={filteredMoves}
            keyExtractor={(item) => item.id}
            renderItem={({ item: move }) => (
              <View style={[styles.moveCard, { width: itemWidth }]}> 
                <View style={styles.gifContainer}>
                  <GifPlayer
                    move={move}
                    isPlaying={playingGifs.has(move.id)}
                    onTogglePlay={() => toggleGifPlayback(move.id)}
                    size="responsive"
                    aspectRatio={16/9}
                    maxWidth={itemWidth - 30}
                    maxHeight={200}
                  />
                  <TouchableOpacity
                    style={styles.fullScreenButton}
                    onPress={() => openFullScreen(move)}
                  >
                    <Maximize2 size={18} color="#FFF" />
                  </TouchableOpacity>
                </View>
                <View style={styles.moveContent}>
                  <View style={styles.moveHeader}>
                    <Text style={[styles.moveName, { fontSize: columns > 2 ? 16 : 18 }]} numberOfLines={2}>
                      {move.movementName}
                    </Text>
                    <View style={styles.difficultyBadge}>
                      <Text style={styles.difficultyText}>Niv.{move.difficulty}</Text>
                    </View>
                    <TouchableOpacity onPress={() => toggleFavorite(move.id)}>
                      <Heart
                        size={20}
                        color={isFavoriteMove(move.id) ? '#FF6B35' : '#666'}
                        fill={isFavoriteMove(move.id) ? '#FF6B35' : 'none'}
                      />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.moveInfo}>
                    <View style={[styles.levelBadge, { backgroundColor: getLevelColor(move.level) }]}>
                      <Text style={styles.levelText}>{move.level}</Text>
                    </View>
                    <Text style={styles.duration}>{move.timeCount}</Text>
                  </View>
                  
                  <Text style={styles.courseName} numberOfLines={1}>{move.courseName}</Text>
                  <Text style={styles.family} numberOfLines={1}>Famille: {move.family}</Text>
                  
                  {move.remarks && columns === 1 && (
                    <Text style={styles.remarks} numberOfLines={2}>{move.remarks}</Text>
                  )}
                  
                  {columns === 1 && (
                    <View style={styles.technicalInfo}>
                      <Text style={styles.technicalText}>
                        {move.startPosition} → {move.endPosition}
                      </Text>
                      {move.displacement && (
                        <Text style={styles.displacement}>• {move.displacement}</Text>
                      )}
                    </View>
                  )}
                  
                  <View style={styles.moveActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => openPlaylistModal(move)}
                    >
                      <Plus size={16} color="#FF6B35" />
                      <Text style={styles.actionText}>Ajouter à ma liste</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          />
        )}
      </View>



      <FullScreenImageModal
        visible={fullScreenVisible}
        move={selectedMove}
        isPlaying={selectedMove ? playingGifs.has(selectedMove.id) : false}
        onClose={closeFullScreen}
      />

      <PlaylistSelectionModal
        visible={playlistModalVisible}
        onClose={closePlaylistModal}
        playlists={playlists}
        onSelectPlaylist={handleAddToPlaylist}
        moveId={selectedMoveForPlaylist?.id || ''}
        moveName={selectedMoveForPlaylist?.movementName || ''}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#CCC',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 25,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    paddingVertical: 12,
    fontSize: 16,
  },
  filtersContainer: {
    maxHeight: 200,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterSection: {
    marginBottom: 15,
  },
  filterTitle: {
    fontSize: 14,
    color: '#CCC',
    marginBottom: 8,
    fontWeight: '600',
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
    marginRight: 8,
    marginBottom: 8,
  },
  filterButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#CCC',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#FFF',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  flatListContent: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#0D0D0D',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#222',
  },
  modalTitle: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalSectionTitle: {
    fontSize: 14,
    color: '#CCC',
    fontWeight: '600',
    marginBottom: 8,
  },
  sortButton: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  sortButtonActive: {
    backgroundColor: 'rgba(255,107,53,0.12)',
    borderColor: '#FF6B35',
  },
  sortButtonText: {
    color: '#DDD',
    fontWeight: '600',
    textAlign: 'center',
  },
  sortButtonTextActive: {
    color: '#FF6B35',
  },
  modalActions: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#444',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#FFF',
    fontWeight: '700',
  },
  closeButton: {
    flex: 1,
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#000',
    fontWeight: '700',
  },
  moveCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
    flex: 1,
  },
  gifContainer: {
    position: 'relative',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  fullScreenButton: {
    position: 'absolute',
    top: 15,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    padding: 6,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  moveContent: {
    padding: 15,
  },
  moveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  moveName: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  difficultyBadge: {
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 10,
  },
  difficultyText: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  moveInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  levelText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: 'bold',
  },
  family: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
    marginBottom: 8,
  },
  duration: {
    fontSize: 14,
    color: '#666',
  },
  courseName: {
    fontSize: 14,
    color: '#CCC',
    marginBottom: 8,
  },
  remarks: {
    fontSize: 13,
    color: '#CCC',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  technicalInfo: {
    marginBottom: 8,
  },
  technicalText: {
    fontSize: 12,
    color: '#999',
  },
  displacement: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  fileName: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 5,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999',
  },
  moveActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  actionText: {
    fontSize: 12,
    color: '#FF6B35',
    marginLeft: 5,
    fontWeight: '600',
  },
  desktopLayoutContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  desktopSidebar: {
    width: '25%',
    minWidth: 200,
    maxWidth: 280,
    backgroundColor: '#1A1A1A',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#333',
    marginRight: 20,
    padding: 20,
    height: '100%',
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  resetFiltersText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
  sidebarScroll: {
    flex: 1,
  },
  filterSectionDesktop: {
    marginBottom: 25,
  },
  filterTitleDesktop: {
    fontSize: 16,
    fontWeight: '600',
    color: '#CCC',
    marginBottom: 12,
  },
  filterChipsVertical: {
    gap: 8,
  },
  filterButtonDesktop: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: '#0D0D0D',
    borderWidth: 1,
    borderColor: '#333',
    width: '100%',
  },
  filterButtonDesktopActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  filterButtonTextDesktop: {
    fontSize: 14,
    color: '#CCC',
    fontWeight: '500',
  },
  filterButtonTextDesktopActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  desktopMainContent: {
    flex: 1,
    paddingRight: 0,
  },
  // Styles pour le menu hamburger mobile
  searchInputContainerMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#333',
    gap: 10,
  },
  hamburgerButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sidebarModalContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  mobileSidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    backgroundColor: '#0D0D0D',
    borderRightWidth: 1,
    borderRightColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  mobileSidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  mobileSidebarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  mobileSidebarContent: {
    flex: 1,
    padding: 20,
  },
  filterSectionMobile: {
    marginBottom: 25,
  },
  filterTitleMobile: {
    fontSize: 16,
    fontWeight: '600',
    color: '#CCC',
    marginBottom: 12,
  },
  filterButtonMobile: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
    width: '100%',
    marginBottom: 8,
  },
  filterButtonMobileActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  filterButtonTextMobile: {
    fontSize: 14,
    color: '#CCC',
    fontWeight: '500',
  },
  filterButtonTextMobileActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  mobileSidebarFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  resetButtonMobile: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    alignItems: 'center',
  },
  resetButtonTextMobile: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});