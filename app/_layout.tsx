import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/contexts/AuthContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { initCacheSystem } from '@/utils/gifCache';

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    // Initialiser le système de cache des GIFs au démarrage de l'application
    initCacheSystem()
      .then(() => console.log('✅ Système de cache GIF initialisé'))
      .catch(error => console.error('❌ Erreur lors de l\'initialisation du cache GIF:', error));
  }, []);

  return (
    <AuthProvider>
      <FavoritesProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </FavoritesProvider>
    </AuthProvider>
  );
}