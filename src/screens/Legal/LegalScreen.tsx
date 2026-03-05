import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '../../theme';
import { SettingsRow, AboutAignitron } from '../../components';

const TERMS_URL = 'https://www.aignitron.com/MobileAIApps/Terms';
const PRIVACY_URL = 'https://www.aignitron.com/MobileAIApps/Privacy';

export default function LegalScreen() {
  const { theme } = useTheme();
  const { colors } = theme;
  const [loading, setLoading] = useState<string | null>(null);

  const openLink = useCallback(async (url: string, label: string) => {
    setLoading(label);
    try {
      const result = await WebBrowser.openBrowserAsync(url, {
        toolbarColor: colors.surface,
        controlsColor: colors.accent,
        dismissButtonStyle: 'close',
      });
      // Fallback if dismissed or unavailable
      if (result.type === 'cancel') {
        // Normal dismiss — do nothing
      }
    } catch {
      // Fallback to external browser
      try {
        await Linking.openURL(url);
      } catch {
        Alert.alert('Error', `Unable to open ${label}. Please visit ${url} in your browser.`);
      }
    } finally {
      setLoading(null);
    }
  }, [colors]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* About Aignitron */}
      <View style={styles.aboutSection}>
        <AboutAignitron />
      </View>

      {/* Disclaimer Card */}
      <View style={[styles.disclaimerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="shield-checkmark" size={24} color={colors.accent} />
        <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
          Aignitron does not collect or store any user information.
        </Text>
      </View>

      {/* Legal Links */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>LEGAL DOCUMENTS</Text>
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <SettingsRow
          label="Terms of Service"
          icon="document-text-outline"
          onPress={() => openLink(TERMS_URL, 'Terms of Service')}
          showChevron={loading !== 'Terms of Service'}
        />
        {loading === 'Terms of Service' && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={colors.accent} />
          </View>
        )}
        <SettingsRow
          label="Privacy Policy"
          icon="lock-closed-outline"
          onPress={() => openLink(PRIVACY_URL, 'Privacy Policy')}
          showChevron={loading !== 'Privacy Policy'}
        />
        {loading === 'Privacy Policy' && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={colors.accent} />
          </View>
        )}
      </View>

      {/* Contact */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>CONTACT</Text>
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <SettingsRow
          label="Contact Support"
          icon="mail-outline"
          onPress={() => Linking.openURL('mailto:support@aignitron.com')}
        />
      </View>

      {/* Footer */}
      <Text style={[styles.footer, { color: colors.placeholder }]}>
        Legal documents are hosted online and may be updated periodically.{'\n'}
        Visit aignitron.com for the latest versions.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 60,
  },
  aboutSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  disclaimerCard: {
    margin: 16,
    marginBottom: 8,
    padding: 20,
    borderRadius: 14,
    borderWidth: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  section: {
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  loadingOverlay: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  footer: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 28,
    paddingHorizontal: 32,
  },
});
