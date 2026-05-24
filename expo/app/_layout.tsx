import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { AppErrorBoundary } from '@/components/app-error-boundary';
import { AudioPlayer } from '@/components/audio-player';
import { NotesProvider } from '@/providers/notes-provider';
import { ThemeProvider } from '@/providers/theme-provider';

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 1000 * 60 * 60 * 24 * 7, gcTime: 1000 * 60 * 60 * 24 * 30 } } });
const persister = createAsyncStoragePersister({ storage: AsyncStorage, key: 'quran-journal-query-cache' });

function RootLayoutNav() { return <Stack screenOptions={{ headerBackTitle: 'Back' }}><Stack.Screen name="(tabs)" options={{ headerShown: false }} /><Stack.Screen name="surah/[id]" options={{ headerShown: false, presentation: 'card' }} /></Stack>; }

export default function RootLayout() {
  useEffect(() => { void SplashScreen.hideAsync(); }, []);
  return <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}><GestureHandlerRootView style={{ flex: 1 }}><SafeAreaProvider><SafeAreaView style={{ flex: 1 }} edges={[ 'top' ]}><ThemeProvider><NotesProvider><AppErrorBoundary><RootLayoutNav /><AudioPlayer /></AppErrorBoundary></NotesProvider></ThemeProvider></SafeAreaView></SafeAreaProvider></GestureHandlerRootView></PersistQueryClientProvider>;
}
