import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

interface Props {
  onStop: () => void;
  onCancel: () => void;
}

export default function RecordingIndicator({ onStop, onCancel }: Props) {
  const { theme } = useTheme();
  const { colors } = theme;
  const [elapsed, setElapsed] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  const formatTime = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.left}>
        <Animated.View style={{ opacity: pulseAnim }}>
          <Ionicons name="radio-button-on" size={18} color={colors.danger} />
        </Animated.View>
        <Text style={[styles.label, { color: colors.danger }]}>Recording</Text>
        <Text style={[styles.time, { color: colors.text }]}>{formatTime(elapsed)}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={onCancel} style={[styles.cancelBtn, { borderColor: colors.border }]}>
          <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onStop} style={[styles.stopBtn, { backgroundColor: colors.danger }]}>
          <Ionicons name="stop" size={16} color="#FFFFFF" />
          <Text style={styles.stopText}>Stop</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 0.5,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginVertical: 8,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  time: {
    fontSize: 14,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelBtn: {
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '500',
  },
  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 4,
  },
  stopText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
