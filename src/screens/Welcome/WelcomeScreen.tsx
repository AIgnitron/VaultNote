import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated, StatusBar } from 'react-native';
import { useTheme } from '../../theme';
import { APP_NAME } from '../../constants';

interface Props {
  onFinish: () => void;
}

export default function WelcomeScreen({ onFinish }: Props) {
  const { theme } = useTheme();
  const { colors } = theme;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const titleFade = useRef(new Animated.Value(0)).current;
  const subtitleFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Icon fade-in + scale
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Title fade-in
      Animated.timing(titleFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        // Subtitle fade-in
        Animated.timing(subtitleFade, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }).start(() => {
          // Hold, then fade everything out
          setTimeout(() => {
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }).start(() => {
              onFinish();
            });
          }, 900);
        });
      });
    });
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} />
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={[styles.iconContainer, { shadowColor: colors.accent }]}>
          <Image
            source={require('../../../assets/icon.png')}
            style={styles.icon}
            resizeMode="contain"
          />
        </View>

        <Animated.Text style={[styles.appName, { color: colors.text, opacity: titleFade }]}>
          {APP_NAME}
        </Animated.Text>

        <Animated.Text style={[styles.tagline, { color: colors.textSecondary, opacity: subtitleFade }]}>
          Private. Offline. Yours.
        </Animated.Text>
      </Animated.View>

      <Animated.Text style={[styles.footer, { color: colors.placeholder, opacity: subtitleFade }]}>
        🔒 100% Offline &amp; Private
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 24,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  icon: {
    width: 120,
    height: 120,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    fontSize: 13,
    letterSpacing: 0.3,
  },
});
