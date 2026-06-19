import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { showtimeApi } from '@/lib/showtime-api';
import { menuApi, type MenuItem } from '@/lib/menu-api';

function MenuItemCard({ item }: { item: MenuItem }) {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.cardContent}>
        <ThemedText style={styles.itemName}>{item.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
          {item.description}
        </ThemedText>
        <View style={styles.cardFooter}>
          <ThemedText style={styles.price}>${Number(item.basePrice).toFixed(2)}</ThemedText>
          {item.lowStock && (
            <ThemedText style={styles.lowStock}>Low stock</ThemedText>
          )}
        </View>
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.addButton,
          pressed && styles.addButtonPressed,
        ]}
      >
        <ThemedText style={styles.addButtonText}>Add</ThemedText>
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const theme = useTheme();

  const {
    data: showtime,
    isLoading: showtimeLoading,
    error: showtimeError,
  } = useQuery({
    queryKey: ['currentShowtime'],
    queryFn: showtimeApi.getCurrent,
  });

  const {
    data: menuItems,
    isLoading: menuLoading,
    error: menuError,
  } = useQuery({
    queryKey: ['menu', showtime?.theatreId],
    queryFn: () => menuApi.getAvailableItems(showtime!.theatreId),
    enabled: !!showtime?.theatreId,
  });

  const isLoading = showtimeLoading || menuLoading;
  const error = showtimeError || menuError;

  const contextLabel = showtime
    ? `${showtime.theatreName} | Screen ${showtime.screen} | ${showtime.movieTitle} | Seat ${showtime.seatNumber}`
    : '';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {showtime && (
          <View style={[styles.contextBar, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="small" numberOfLines={1} style={styles.contextText}>
              {contextLabel}
            </ThemedText>
          </View>
        )}

        {isLoading && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.textSecondary} />
          </View>
        )}

        {error && (
          <View style={styles.centered}>
            <ThemedText themeColor="textSecondary">
              Failed to load menu. Please try again.
            </ThemedText>
          </View>
        )}

        {menuItems && (
          <FlatList
            data={menuItems}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <MenuItemCard item={item} />}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
          />
        )}
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
  contextBar: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
    marginHorizontal: Spacing.three,
    marginTop: Spacing.two,
    borderRadius: Spacing.two,
  },
  contextText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
  },
  row: {
    gap: Spacing.two + 4,
    marginBottom: Spacing.two + 4,
  },
  card: {
    flex: 1,
    borderRadius: Spacing.two + 4,
    padding: Spacing.three,
    justifyContent: 'space-between',
  },
  cardContent: {
    gap: Spacing.one,
    marginBottom: Spacing.three,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
  },
  lowStock: {
    fontSize: 11,
    fontWeight: '600',
    color: '#e67e22',
  },
  addButton: {
    backgroundColor: '#3c87f7',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  addButtonPressed: {
    opacity: 0.8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
