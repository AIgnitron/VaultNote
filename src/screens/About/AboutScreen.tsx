import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { APP_NAME, APP_VERSION } from '../../constants';

export default function AboutScreen() {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* ── VaultNote ─────────────────────────────────── */}
      <Image
        source={require('../../../assets/icon.png')}
        style={styles.appIcon}
      />

      <Text style={[styles.appName, { color: colors.text }]}>{APP_NAME}</Text>
      <Text style={[styles.version, { color: colors.textSecondary }]}>Version {APP_VERSION}</Text>
      <Text style={[styles.tagline, { color: colors.accent }]}>Private. Offline. Yours.</Text>

      {/* Features */}
      <View style={[styles.featureBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <FeatureItem icon="airplane" label="100% Offline" colors={colors} />
        <FeatureItem icon="shield-checkmark" label="No Data Collection" colors={colors} />
        <FeatureItem icon="eye-off" label="No Tracking" colors={colors} />
        <FeatureItem icon="cloud-offline" label="No Cloud Sync" colors={colors} />
        <FeatureItem icon="analytics" label="No Analytics" colors={colors} />
        <FeatureItem icon="megaphone-outline" label="No Ads" colors={colors} />
      </View>

      {/* Core Principles */}
      <View style={[styles.principlesBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Core Principles</Text>
        <Text style={[styles.principleItem, { color: colors.textSecondary }]}>
          • All notes stored locally using SQLite{'\n'}
          • Images saved to device storage{'\n'}
          • No network requests — ever{'\n'}
          • No third-party tracking SDKs{'\n'}
          • Fully functional in airplane mode{'\n'}
          • Export/import your data anytime
        </Text>
      </View>

      <Text style={[styles.footer, { color: colors.placeholder }]}>
        Built with privacy in mind.{'\n'}
        Your notes belong to you.
      </Text>
    </ScrollView>
  );
}

function FeatureItem({ icon, label, colors }: { icon: string; label: string; colors: any }) {
  return (
    <View style={styles.featureItem}>
      <Ionicons name={icon as any} size={20} color={colors.accent} />
      <Text style={[styles.featureLabel, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  appIcon: {
    width: 88,
    height: 88,
    borderRadius: 22,
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  version: {
    fontSize: 14,
    marginTop: 4,
  },
  tagline: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 8,
    fontStyle: 'italic',
  },
  featureBox: {
    marginTop: 28,
    width: '100%',
    borderRadius: 12,
    borderWidth: 0.5,
    padding: 16,
    gap: 14,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  principlesBox: {
    marginTop: 20,
    width: '100%',
    borderRadius: 12,
    borderWidth: 0.5,
    padding: 16,
  },
  principleItem: {
    fontSize: 14,
    lineHeight: 24,
  },
  footer: {
    marginTop: 32,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});
