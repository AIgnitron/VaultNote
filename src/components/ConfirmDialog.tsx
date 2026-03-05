import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  danger = false,
}: Props) {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
          <View style={styles.buttons}>
            <TouchableOpacity
              onPress={onConfirm}
              style={[
                styles.button,
                { backgroundColor: danger ? colors.danger : colors.accent },
              ]}
            >
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>{confirmLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onCancel}
              style={[styles.button, { borderColor: colors.border, borderWidth: 1 }]}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>{cancelLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  dialog: {
    width: '100%',
    borderRadius: 14,
    padding: 24,
    maxWidth: 340,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'column',
    gap: 12,
  },
  button: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
