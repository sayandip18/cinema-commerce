import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, useColorScheme, View } from 'react-native';

import { ThemedText } from './themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useCartStore } from '@/stores/cart-store';

function CartButton() {
  const router = useRouter();
  const totalItems = useCartStore((s) => s.totalItems());

  return (
    <Pressable
      onPress={() => router.push('/cart')}
      style={({ pressed }) => [styles.topBarButton, pressed && { opacity: 0.7 }]}
    >
      <ThemedText style={styles.topBarIcon}>&#x1F6D2;</ThemedText>
      {totalItems > 0 && (
        <View style={styles.badge}>
          <ThemedText style={styles.badgeText}>{totalItems}</ThemedText>
        </View>
      )}
    </Pressable>
  );
}

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'light' || scheme === 'dark' ? scheme : 'light'];

  return (
    <View style={styles.wrapper}>
      <View style={[styles.topBar, { backgroundColor: colors.background }]}>
        <CartButton />
      </View>
      <NativeTabs
        backgroundColor={colors.background}
        indicatorColor={colors.backgroundElement}
        labelStyle={{ selected: { color: colors.text } }}>
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            src={require('@/assets/images/tabIcons/home.png')}
            renderingMode="template"
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="order">
          <NativeTabs.Trigger.Label>Orders</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            src={require('@/assets/images/tabIcons/home.png')}
            renderingMode="template"
          />
        </NativeTabs.Trigger>
      </NativeTabs>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
  },
  topBarButton: {
    position: 'relative',
    padding: Spacing.two,
  },
  topBarIcon: {
    fontSize: 22,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
});
