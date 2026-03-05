import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

interface Props {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  rightText?: string;
  danger?: boolean;
  showChevron?: boolean;
}

export default function SettingsRow({ label, icon, onPress, rightText, danger = false, showChevron = true }: Props) {
  const { theme } = useTheme();
  const { colors } = theme;
  const textColor = danger ? colors.danger : colors.text;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      style={[styles.row, { borderBottomColor: colors.border }]}
    >
      <View style={styles.left}>
        {icon && (
          <Ionicons name={icon} size={20} color={danger ? colors.danger : colors.accent} style={styles.icon} />
        )}
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      </View>
      <View style={styles.right}>
        {rightText && <Text style={[styles.rightText, { color: colors.textSecondary }]}>{rightText}</Text>}
        {showChevron && <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
  label: {
    fontSize: 16,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rightText: {
    fontSize: 14,
  },
});
