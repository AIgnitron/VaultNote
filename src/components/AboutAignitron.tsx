import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

export default function AboutAignitron() {
  const { theme } = useTheme();
  const { colors } = theme;
  const currentYear = new Date().getFullYear();

  return (
    <View style={styles.wrapper}>
      {/* Brand Header */}
      <View style={[styles.brandCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.logoCircle, { backgroundColor: colors.accent }]}>
          <Ionicons name="sparkles" size={28} color="#FFFFFF" />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>About Aignitron</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          Aignitron builds AI-generated mobile applications designed to simplify life, enhance
          productivity, and create calm digital experiences. Our mission is to harness practical AI
          to solve real-world problems in simple, human-centered ways.
        </Text>
      </View>

      {/* Copyright */}
      <View style={[styles.footerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.copyright, { color: colors.placeholder }]}>
          © {currentYear} Aignitron. All rights reserved.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 16,
  },
  brandCard: {
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 24,
    alignItems: 'center',
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  footerCard: {
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 20,
    alignItems: 'center',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  contactText: {
    fontSize: 15,
    fontWeight: '500',
  },
  divider: {
    width: '60%',
    height: 0.5,
    marginVertical: 14,
  },
  copyright: {
    fontSize: 12,
    textAlign: 'center',
  },
});
