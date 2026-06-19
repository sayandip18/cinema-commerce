import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuthStore } from '@/stores/auth-store';
import { useTheme } from '@/hooks/use-theme';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

export default function AccountScreen() {
  const theme = useTheme();
  const { user, logout } = useAuthStore();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <ThemedText type="subtitle">Account</ThemedText>

          {user && (
            <View style={[styles.infoCard, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText style={styles.name}>{user.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {user.phone}
              </ThemedText>
              {user.email && (
                <ThemedText type="small" themeColor="textSecondary">
                  {user.email}
                </ThemedText>
              )}
            </View>
          )}

          <Pressable
            onPress={logout}
            style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}>
            <ThemedText style={styles.logoutText}>Log out</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    paddingBottom: BottomTabInset,
  },
  content: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.four,
  },
  infoCard: {
    padding: Spacing.three,
    borderRadius: Spacing.two + 4,
    gap: Spacing.one,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
