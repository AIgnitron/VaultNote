import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from './src/theme';
import { AppNavigator } from './src/navigation';
import { getDatabase } from './src/database';
import WelcomeScreen from './src/screens/Welcome/WelcomeScreen';

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        await getDatabase();
      } catch (e) {
        console.error('Database init failed:', e);
      } finally {
        setDbReady(true);
      }
    })();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        {showWelcome || !dbReady ? (
          <WelcomeScreen
            onFinish={() => {
              if (dbReady) setShowWelcome(false);
              else {
                const interval = setInterval(() => {
                  setShowWelcome(false);
                  clearInterval(interval);
                }, 100);
              }
            }}
          />
        ) : (
          <AppNavigator />
        )}
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1F23',
  },
});
