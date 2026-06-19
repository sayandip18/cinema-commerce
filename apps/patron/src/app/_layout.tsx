import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider, useSegments, useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { queryClient } from '@/lib/query-client';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const router = useRouter();
  const { step, isHydrated, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const inAuthGroup = (segments as string[])[0] === '(auth)';

    if (step === 'authenticated' && inAuthGroup) {
      router.replace('/(tabs)' as never);
    } else if (step !== 'authenticated' && !inAuthGroup) {
      router.replace('/(auth)/phone' as never);
    }
  }, [step, isHydrated, segments]);

  if (!isHydrated) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="cart" />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
