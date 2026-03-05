import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { formatDuration } from '../services/voiceService';
import type { VoiceRecording } from '../types';

interface Props {
  recording: VoiceRecording;
  onDelete: (recording: VoiceRecording) => void;
}

export default function VoiceRecordingRow({ recording, onDelete }: Props) {
  const { theme } = useTheme();
  const { colors } = theme;
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    return () => {
      // Cleanup sound on unmount
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, []);

  const handlePlayPause = async () => {
    if (isPlaying && soundRef.current) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
      return;
    }

    if (soundRef.current) {
      await soundRef.current.playAsync();
      setIsPlaying(true);
      return;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const { sound } = await Audio.Sound.createAsync({ uri: recording.uri });
      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        setPosition(status.positionMillis);
        const progress = recording.duration_ms > 0
          ? status.positionMillis / recording.duration_ms
          : 0;
        progressAnim.setValue(progress);

        if (status.didJustFinish) {
          setIsPlaying(false);
          setPosition(0);
          progressAnim.setValue(0);
          sound.setPositionAsync(0).catch(() => {});
        }
      });

      await sound.playAsync();
      setIsPlaying(true);
    } catch (e) {
      console.error('Playback error:', e);
      setIsPlaying(false);
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
      <TouchableOpacity onPress={handlePlayPause} style={styles.playBtn} activeOpacity={0.6}>
        <Ionicons
          name={isPlaying ? 'pause-circle' : 'play-circle'}
          size={36}
          color={colors.accent}
        />
      </TouchableOpacity>

      <View style={styles.middle}>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <Animated.View
            style={[styles.progressFill, { width: progressWidth, backgroundColor: colors.accent }]}
          />
        </View>
        <Text style={[styles.duration, { color: colors.textSecondary }]}>
          {isPlaying ? formatDuration(position) : formatDuration(recording.duration_ms)}
        </Text>
      </View>

      <TouchableOpacity onPress={() => onDelete(recording)} style={styles.deleteBtn} activeOpacity={0.6}>
        <Ionicons name="trash-outline" size={18} color={colors.danger} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 0.5,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginVertical: 4,
  },
  playBtn: {
    marginRight: 10,
  },
  middle: {
    flex: 1,
    justifyContent: 'center',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  duration: {
    fontSize: 11,
    marginTop: 4,
  },
  deleteBtn: {
    marginLeft: 10,
    padding: 4,
  },
});
