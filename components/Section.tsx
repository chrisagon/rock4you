import React, { ReactNode, memo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

// Section.tsx
// Composant conteneur de section avec titre et action à droite
// - Axé accessibilité, réutilisable sur Accueil / Recherche / Listes
// - Conserve le thème sombre existant

export type SectionProps = {
  title: string;
  children: ReactNode;
  rightAction?: ReactNode;
  containerStyle?: ViewStyle;
  contentStyle?: ViewStyle;
  testID?: string;
};

function SectionBase({
  title,
  children,
  rightAction,
  containerStyle,
  contentStyle,
  testID,
}: SectionProps): React.ReactElement {
  return (
    <View style={[styles.container, containerStyle]} accessibilityRole="summary" testID={testID}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header" accessibilityLevel={2}>
          {title}
        </Text>
        {rightAction ? <View style={styles.right}>{rightAction}</View> : null}
      </View>
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

export const Section = memo(SectionBase);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  right: {
    marginLeft: 12,
  },
  content: {
    // Laisse le contenu définir sa propre mise en page
  },
});

export default Section;
