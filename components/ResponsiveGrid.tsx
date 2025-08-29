import React, { memo, useEffect, useState } from 'react';
import { FlatList, Dimensions, StyleSheet, ViewStyle, ListRenderItem } from 'react-native';

// ResponsiveGrid.tsx
// Grille responsive basée sur FlatList
// - Calcule dynamiquement le nombre de colonnes selon la largeur
// - Laisse la responsabilité au parent de fournir renderItem

export type ResponsiveGridProps<T> = {
  data: T[];
  renderItem: ListRenderItem<T>;
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
  const columns = getNumColumns(screen.width);
  const itemWidth = calcItemWidth(screen.width, columns, containerPadding, itemSpacing);

  return (
    <FlatList
      data={data}
      key={columns} // force rerender quand le nombre de colonnes change
      numColumns={columns}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.content, { paddingHorizontal: containerPadding }, contentContainerStyle]}
      columnWrapperStyle={columns > 1 ? [styles.row, { gap: itemSpacing }] : undefined}
      renderItem={(info) => renderItem({ ...info, item: info.item })}
      keyExtractor={keyExtractor}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
    />
  );
}

export const ResponsiveGrid = memo(ResponsiveGridBase) as typeof ResponsiveGridBase;

const styles = StyleSheet.create({
  content: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
});

export default ResponsiveGrid;
