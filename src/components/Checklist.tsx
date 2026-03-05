import React, { useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import type { ChecklistItem as ChecklistItemType } from '../utils/checklist';

// ─── Single Checklist Row ────────────────────────────────────
interface ChecklistItemProps {
  item: ChecklistItemType;
  onToggle: () => void;
  onChangeText: (text: string) => void;
  onDelete: () => void;
  onSubmitEditing: () => void;
  autoFocus?: boolean;
}

export function ChecklistItemRow({
  item,
  onToggle,
  onChangeText,
  onDelete,
  onSubmitEditing,
  autoFocus = false,
}: ChecklistItemProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [autoFocus]);

  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={onToggle} style={styles.checkboxHit} activeOpacity={0.6}>
        <Ionicons
          name={item.checked ? 'checkbox' : 'square-outline'}
          size={22}
          color={item.checked ? colors.accent : colors.placeholder}
        />
      </TouchableOpacity>
      <TextInput
        ref={inputRef}
        style={[
          styles.itemInput,
          { color: colors.text },
          item.checked && { textDecorationLine: 'line-through', color: colors.placeholder },
        ]}
        value={item.text}
        onChangeText={onChangeText}
        placeholder="List item"
        placeholderTextColor={colors.placeholder}
        returnKeyType="next"
        onSubmitEditing={onSubmitEditing}
        blurOnSubmit={false}
      />
      <TouchableOpacity
        onPress={onDelete}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.deleteHit}
      >
        <Ionicons name="close-circle" size={18} color={colors.placeholder} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Checklist Preview (for NotesList cards) ─────────────────
interface ChecklistPreviewProps {
  total: number;
  checked: number;
}

export function ChecklistPreview({ total, checked }: ChecklistPreviewProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  const allDone = total > 0 && checked === total;

  return (
    <View style={styles.previewRow}>
      <Ionicons
        name={allDone ? 'checkbox' : 'square-outline'}
        size={14}
        color={allDone ? colors.accent : colors.placeholder}
      />
      <Text style={[styles.previewText, { color: colors.textSecondary }]}>
        {checked}/{total} completed
      </Text>
      {/* Mini progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: colors.accent,
              width: total > 0 ? `${(checked / total) * 100}%` : '0%',
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Checklist item row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  checkboxHit: {
    padding: 2,
  },
  itemInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    paddingVertical: 2,
  },
  deleteHit: {
    padding: 2,
  },

  // Preview
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  previewText: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    maxWidth: 80,
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
});
