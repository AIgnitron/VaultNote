import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import type { RootStackParamList } from '../types';

// Screens
import NotesListScreen from '../screens/NotesList/NotesListScreen';
import NoteEditorScreen from '../screens/NoteEditor/NoteEditorScreen';
import ImageViewerModal from '../screens/ImageViewer/ImageViewerModal';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import AboutScreen from '../screens/About/AboutScreen';
import LegalScreen from '../screens/Legal/LegalScreen';
import ArchiveScreen from '../screens/Archive/ArchiveScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { theme } = useTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.icon,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, 8) : insets.bottom,
          height: Platform.OS === 'android' ? 56 + Math.max(insets.bottom, 8) : undefined,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Notes"
        component={NotesListScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { theme, isDark } = useTheme();
  const { colors } = theme;

  const navigationTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          primary: colors.accent,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          primary: colors.accent,
        },
      };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="NoteEditor"
          component={NoteEditorScreen}
          options={{ title: '' }}
        />
        <Stack.Screen
          name="ImageViewer"
          component={ImageViewerModal}
          options={{
            presentation: 'fullScreenModal',
            headerShown: false,
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="About"
          component={AboutScreen}
          options={{
            title: 'About VaultNote',
            headerTitleAlign: 'center',
          }}
        />
        <Stack.Screen
          name="Legal"
          component={LegalScreen}
          options={{
            title: 'Legal & About',
            headerTitleAlign: 'center',
          }}
        />
        <Stack.Screen
          name="Archive"
          component={ArchiveScreen}
          options={{
            title: 'Archived Notes',
            headerTitleAlign: 'center',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
