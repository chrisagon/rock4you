import React, { ReactNode, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// QuickActions.tsx
// Rangée/groupe d'actions rapides avec boutons accessibles

export type QuickAction = {
  id: string;
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  disabled?: boolean;
};

export type QuickActionsProps = {
  actions: QuickAction[];
  wrap?: boolean;
};

function QuickActionsBase({ actions, wrap = true }: QuickActionsProps): React.ReactElement {
  return (
    <View style={[styles.container, wrap && styles.wrap]}>
      {actions.map((a) => (
        <TouchableOpacity
          key={a.id}
          style={[styles.action, a.disabled && styles.actionDisabled]}
          accessibilityRole="button"
          accessibilityLabel={a.label}
          onPress={a.onPress}
          disabled={a.disabled}
        >
          {a.icon ? <View style={styles.icon}>{a.icon}</View> : null}
          <Text style={styles.label}>{a.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export const QuickActions = memo(QuickActionsBase);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  wrap: {
    flexWrap: 'wrap',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionDisabled: {
    opacity: 0.5,
  },
  icon: {
    marginRight: 8,
  },
  label: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default QuickActions;
