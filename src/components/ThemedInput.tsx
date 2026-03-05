import React from 'react';
import { TextInput, TextInputProps, StyleSheet, View, Text } from 'react-native';
import { useTheme } from '../theme';

interface Props extends TextInputProps {
  label?: string;
}

export default function ThemedInput({ label, style, ...props }: Props) {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <View>
      {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBackground,
            color: colors.text,
            borderColor: colors.border,
          },
          style,
        ]}
        placeholderTextColor={colors.placeholder}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    fontSize: 16,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
