import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';

// FilterChips.tsx
// Groupe de chips sélectionnables (mono ou multi) pour filtres rapides

export type ChipItem = {
  id: string;
  label: string;
  selected?: boolean;
};

export type FilterChipsProps = {
  items: ChipItem[];
  multi?: boolean;
  onToggle: (id: string) => void; // laisse au parent la gestion d'état
  containerStyle?: ViewStyle;
};

function FilterChipsBase({ items, multi = true, onToggle, containerStyle }: FilterChipsProps): React.ReactElement {
  return (
    <View style={[styles.container, containerStyle]} accessibilityRole="tablist">
      {items.map((chip) => (
        <TouchableOpacity
          key={chip.id}
          style={[styles.chip, chip.selected && styles.chipSelected]}
          onPress={() => onToggle(chip.id)}
          accessibilityRole="button"
          accessibilityState={{ selected: !!chip.selected }}
          accessibilityLabel={chip.label}
        >
          <Text style={[styles.chipText, chip.selected && styles.chipTextSelected]}>
            {chip.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export const FilterChips = memo(FilterChipsBase);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  chip: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  chipSelected: {
    backgroundColor: '#2A2A2A',
    borderColor: '#FF6B35',
  },
  chipText: {
    color: '#DDD',
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#FF6B35',
  },
});

export default FilterChips;
