import React, { memo, useEffect, useState } from 'react';
import { FlatList, Dimensions, StyleSheet, ViewStyle, LayoutChangeEvent, View } from 'react-native';

// ResponsiveGrid.tsx
// Grille responsive basée sur FlatList — AUTORITÉ de taille de la grille :
// - Mesure sa propre largeur réelle (onLayout sur un View : FlatList n'a pas la prop)
// - Déduit colonnes (plancher de carte 320 px) et la largeur d'item, et les PASSE au renderItem
// - La fenêtre ne sert que d'estimation avant le premier layout

export type ResponsiveGridProps<T> = {
  data: T[];
  renderItem: (info: { item: T; index: number; separators: { highlight: () => void; unhighlight: () => void }; largeur: number; colonnes: number }) => React.ReactElement;
  keyExtractor: (item: T, index: number) => string;
  containerPadding?: number; // padding horizontal du container (par défaut 20)
  itemSpacing?: number; // espacement horizontal entre items (par défaut 15)
  maxItemHeight?: number; // si utilisé avec composants internes (ex. GifPlayer)
  contentContainerStyle?: ViewStyle;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
};

function useScreen() {
  const [screen, setScreen] = useState(Dimensions.get('window'));
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setScreen(window));
    return () => sub?.remove();
  }, []);
  return screen;
}

export function getNumColumns(width: number): number {
  if (width < 600) return 1; // Mobile portrait
  if (width < 900) return 2; // Mobile paysage / Tablette portrait
  return 3; // Tablette paysage / Desktop
}

export function calcItemWidth(
  width: number,
  columns: number,
  padding: number,
  spacing: number
): number {
  return (width - padding * 2 - spacing * (columns - 1)) / columns;
}

function ResponsiveGridBase<T>({
  data,
  renderItem,
  keyExtractor,
  containerPadding = 20,
  itemSpacing = 15,
  contentContainerStyle,
  onEndReached,
  onEndReachedThreshold = 0.4,
}: ResponsiveGridProps<T>): React.ReactElement {
  const screen = useScreen();
  const [gridWidth, setGridWidth] = useState<number | null>(null);
  const surLayout = (e: LayoutChangeEvent) => setGridWidth(e.nativeEvent.layout.width);
  // La grille se mesure elle-même (onLayout sur un View, car FlatList n'avent pas la prop) ;
  // à défaut de mesure, la fenêtre sert d'estimation initiale au premier jet
  const largeurCible = gridWidth ?? screen.width;
  // Plancher de lisibilité : les gestes 16/9 sous ~320 px ne se lisent plus — le nombre de
  // colonnes ne dépasse pas ce que la largeur réelle du conteneur peut porter
  const LARGEUR_CARTE_MIN = 320;
  const colonnesMaximum = Math.max(1, Math.floor((largeurCible - containerPadding * 2 + itemSpacing) / (LARGEUR_CARTE_MIN + itemSpacing)));
  const columns = Math.min(getNumColumns(largeurCible), colonnesMaximum);
  const itemWidth = calcItemWidth(largeurCible, columns, containerPadding, itemSpacing);

  return (
    <View style={styles.grilleConteneur} onLayout={surLayout}>
      <FlatList
        data={data}
        key={columns} // force rerender quand le nombre de colonnes change
        numColumns={columns}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingHorizontal: containerPadding }, contentContainerStyle]}
        columnWrapperStyle={columns > 1 ? [styles.row, { gap: itemSpacing }] : undefined}
        renderItem={(info) => renderItem({ item: info.item, index: info.index, separators: info.separators, largeur: itemWidth, colonnes: columns })}
        keyExtractor={keyExtractor}
        onEndReached={onEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
      />
    </View>
  );
}

export const ResponsiveGrid = memo(ResponsiveGridBase) as typeof ResponsiveGridBase;

const styles = StyleSheet.create({
  grilleConteneur: {
    flex: 1,
  },
  content: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
});

export default ResponsiveGrid;
