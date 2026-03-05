import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
  Share,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '../../theme';
import { SettingsRow, ConfirmDialog } from '../../components';
import { clearAllData } from '../../database';
import { clearAllImageFiles, exportFullBackup, importBackup, clearAllVoiceFiles } from '../../services';
import { APP_VERSION, DEFAULT_ACCENT_COLOR, ACCENT_COLOR_OPTIONS } from '../../constants';
import type { ThemeMode, RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { theme, themeMode, accentColor, setThemeMode, setAccentColor } = useTheme();
  const { colors } = theme;

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showAccentPicker, setShowAccentPicker] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const themeLabels: Record<ThemeMode, string> = {
    light: 'Light',
    dark: 'Dark',
    system: 'System',
  };

  const handleClearAll = async () => {
    try {
      await clearAllImageFiles();
      await clearAllVoiceFiles();
      await clearAllData();
      Alert.alert('Success', 'All notes, images, and voice recordings have been deleted.');
    } catch {
      Alert.alert('Error', 'Failed to clear data.');
    }
    setShowClearConfirm(false);
  };

  const handleDeleteAllData = async () => {
    try {
      await clearAllImageFiles();
      await clearAllVoiceFiles();
      await clearAllData();
      Alert.alert('Success', 'App data reset successfully.');
    } catch {
      Alert.alert('Error', 'Failed to delete app data.');
    }
    setShowDeleteAllConfirm(false);
  };

  const openLegalLink = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url, {
        toolbarColor: colors.surface,
        controlsColor: colors.accent,
        dismissButtonStyle: 'close',
      });
    } catch {
      try {
        await Linking.openURL(url);
      } catch {
        Alert.alert('Error', 'Unable to open link.');
      }
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportFullBackup();
    } catch (e: any) {
      Alert.alert('Export Error', e.message || 'Failed to export data.');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const result = await importBackup();
      if (result.notesImported > 0 || result.imagesImported > 0 || result.voiceImported > 0) {
        const parts = [];
        if (result.notesImported > 0) parts.push(`${result.notesImported} notes`);
        if (result.imagesImported > 0) parts.push(`${result.imagesImported} images`);
        if (result.voiceImported > 0) parts.push(`${result.voiceImported} voice recordings`);
        Alert.alert('Import Complete', `Imported ${parts.join(', ')}.`);
      }
    } catch (e: any) {
      Alert.alert('Import Error', e.message || 'Failed to import data.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Appearance Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>APPEARANCE</Text>
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingsRow
            label="Theme"
            icon="moon-outline"
            onPress={() => setShowThemePicker(!showThemePicker)}
            rightText={themeLabels[themeMode]}
          />
          {showThemePicker && (
            <View style={[styles.pickerContainer, { borderTopColor: colors.border }]}>
              {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  onPress={() => {
                    setThemeMode(mode);
                    setShowThemePicker(false);
                  }}
                  style={[
                    styles.pickerOption,
                    themeMode === mode && { backgroundColor: colors.pinnedBackground },
                  ]}
                >
                  <Text style={[styles.pickerText, { color: themeMode === mode ? colors.accent : colors.text }]}>
                    {themeLabels[mode]}
                  </Text>
                  {themeMode === mode && <Ionicons name="checkmark" size={18} color={colors.accent} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
          <SettingsRow
            label="Accent Color"
            icon="color-palette-outline"
            onPress={() => setShowAccentPicker(!showAccentPicker)}
            showChevron={true}
          />
          {showAccentPicker && (
            <View style={[styles.colorPickerContainer, { borderTopColor: colors.border }]}>
              <View style={styles.colorGrid}>
                {ACCENT_COLOR_OPTIONS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => {
                      setAccentColor(color);
                    }}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: color },
                      accentColor === color && styles.colorSwatchSelected,
                    ]}
                  >
                    {accentColor === color && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Data Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DATA</Text>
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingsRow
            label="Export Data"
            icon="download-outline"
            onPress={handleExport}
            showChevron={false}
          />
          <SettingsRow
            label="Import Data"
            icon="push-outline"
            onPress={handleImport}
            showChevron={false}
          />
        </View>

        {/* About & Legal Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ABOUT & LEGAL</Text>
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingsRow
            label="About VaultNote"
            icon="information-circle-outline"
            onPress={() => navigation.navigate('About')}
          />
          <SettingsRow
            label="About Aignitron"
            icon="sparkles-outline"
            onPress={() => navigation.navigate('Legal')}
          />
          <SettingsRow
            label="Share App"
            icon="share-social-outline"
            onPress={async () => {
              try {
                await Share.share({
                  message: 'Check out VaultNote — a secure, offline note-taking app! https://play.google.com/store/apps/details?id=com.aignitron.vaultnote',
                });
              } catch {
                // User cancelled or error
              }
            }}
            showChevron={false}
          />
        </View>

        {/* Danger Zone */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DANGER ZONE</Text>
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingsRow
            label="Delete All App Data"
            icon="nuclear-outline"
            onPress={() => setShowDeleteAllConfirm(true)}
            danger
            showChevron={false}
          />
        </View>

        {/* Privacy Disclaimer */}
        <View style={[styles.privacyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="shield-checkmark" size={20} color={colors.accent} style={{ marginBottom: 8 }} />
          <Text style={[styles.privacyText, { color: colors.textSecondary }]}>
            Aignitron does not collect or store any user information.
          </Text>
        </View>
      </ScrollView>

      {/* Dialogs */}
      <ConfirmDialog
        visible={showDeleteAllConfirm}
        title="Delete All App Data"
        message="Are you sure you want to permanently delete all app data? This includes all notes, images, voice recordings, and settings. This action cannot be undone."
        confirmLabel="Delete All Data"
        onConfirm={handleDeleteAllData}
        onCancel={() => setShowDeleteAllConfirm(false)}
        danger
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingBottom: 40,
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
  pickerContainer: {
    borderTopWidth: 0.5,
    paddingVertical: 4,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  pickerText: {
    fontSize: 15,
    fontWeight: '500',
  },
  colorPickerContainer: {
    borderTopWidth: 0.5,
    padding: 16,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  privacyBox: {
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 0.5,
    alignItems: 'center',
  },
  privacyText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
});
