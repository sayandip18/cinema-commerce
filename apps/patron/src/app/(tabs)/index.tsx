import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import { useAuthStore } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";
import { useSessionStore } from "@/stores/session-store";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { menuApi, type MenuItem } from "@/lib/menu-api";
import {
  theatreApi,
  type Theatre,
  type TheatreShowtime,
} from "@/lib/theatre-api";

function TheatreList() {
  const theme = useTheme();
  const selectTheatre = useSessionStore((s) => s.selectTheatre);

  const { data: theatres, isLoading, error } = useQuery({
    queryKey: ["theatres"],
    queryFn: theatreApi.getAll,
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.textSecondary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <ThemedText themeColor="textSecondary">
          Failed to load theatres. Please try again.
        </ThemedText>
      </View>
    );
  }

  return (
    <FlatList
      data={theatres}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TheatreCard theatre={item} onSelect={selectTheatre} />
      )}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      style={styles.list}
    />
  );
}

function TheatreCard({
  theatre,
  onSelect,
}: {
  theatre: Theatre;
  onSelect: (t: Theatre) => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={() => onSelect(theatre)}
      style={({ pressed }) => [
        styles.theatreCard,
        { backgroundColor: theme.backgroundElement },
        pressed && styles.pressed,
      ]}
    >
      <ThemedText style={styles.theatreName}>{theatre.name}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {theatre.location}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.screens}>
        {theatre.totalScreens} screens
      </ThemedText>
    </Pressable>
  );
}

function ShowtimeList() {
  const theme = useTheme();
  const selectedTheatre = useSessionStore((s) => s.selectedTheatre);
  const selectShowtime = useSessionStore((s) => s.selectShowtime);
  const goBackToTheatres = useSessionStore((s) => s.goBackToTheatres);

  const { data: showtimes, isLoading, error } = useQuery({
    queryKey: ["showtimes", selectedTheatre!.id],
    queryFn: () => theatreApi.getShowtimes(selectedTheatre!.id),
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.textSecondary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <ThemedText themeColor="textSecondary">
          Failed to load showtimes. Please try again.
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      <View style={styles.stepHeader}>
        <Pressable
          onPress={goBackToTheatres}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <ThemedText style={styles.backText}>&#x2190; Theatres</ThemedText>
        </Pressable>
        <ThemedText style={styles.stepTitle}>{selectedTheatre!.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {selectedTheatre!.location}
        </ThemedText>
      </View>

      {showtimes && showtimes.length === 0 && (
        <View style={styles.centered}>
          <ThemedText themeColor="textSecondary">
            No showtimes available for this theatre.
          </ThemedText>
        </View>
      )}

      <FlatList
        data={showtimes}
        keyExtractor={(item) => item.showtimeId}
        renderItem={({ item }) => (
          <ShowtimeCard showtime={item} onSelect={selectShowtime} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function ShowtimeCard({
  showtime,
  onSelect,
}: {
  showtime: TheatreShowtime;
  onSelect: (s: TheatreShowtime) => void;
}) {
  const theme = useTheme();
  const startDate = new Date(showtime.startTime);
  const timeStr = startDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateStr = startDate.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <Pressable
      onPress={() => onSelect(showtime)}
      style={({ pressed }) => [
        styles.showtimeCard,
        { backgroundColor: theme.backgroundElement },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.showtimeMain}>
        <ThemedText style={styles.movieTitle}>{showtime.movieTitle}</ThemedText>
        <View style={styles.movieMeta}>
          <ThemedText type="small" themeColor="textSecondary">
            {showtime.movieGenre}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {showtime.movieDurationMinutes} min
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {showtime.movieRating}
          </ThemedText>
        </View>
      </View>
      <View style={styles.showtimeDetails}>
        <ThemedText style={styles.showtimeTime}>{timeStr}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {dateStr}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Screen {showtime.screen}
        </ThemedText>
        <ThemedText style={styles.showtimePrice}>
          Rs {Number(showtime.price).toFixed(2)}
        </ThemedText>
      </View>
    </Pressable>
  );
}

function MenuView() {
  const theme = useTheme();
  const selectedTheatre = useSessionStore((s) => s.selectedTheatre);
  const selectedShowtime = useSessionStore((s) => s.selectedShowtime);
  const goBackToShowtimes = useSessionStore((s) => s.goBackToShowtimes);

  const { data: menuItems, isLoading, error } = useQuery({
    queryKey: ["menu", selectedTheatre!.id],
    queryFn: () => menuApi.getAvailableItems(selectedTheatre!.id),
    enabled: !!selectedTheatre,
  });

  const contextLabel = `${selectedTheatre!.name} | Screen ${selectedShowtime!.screen} | ${selectedShowtime!.movieTitle}`;

  return (
    <View style={styles.list}>
      <View style={styles.stepHeader}>
        <Pressable
          onPress={goBackToShowtimes}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <ThemedText style={styles.backText}>&#x2190; Showtimes</ThemedText>
        </Pressable>
      </View>

      <View
        style={[styles.contextBar, { backgroundColor: theme.backgroundElement }]}
      >
        <ThemedText type="small" numberOfLines={1} style={styles.contextText}>
          {contextLabel}
        </ThemedText>
      </View>

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

      <CartSummary />
    </View>
  );
}

function MenuItemCard({ item }: { item: MenuItem }) {
  const theme = useTheme();
  const { addItem, incrementItem, decrementItem } = useCartStore();
  const quantity = useCartStore(
    (s) => s.items.find((i) => i.menuItemId === item.id)?.quantity ?? 0,
  );

  if (quantity > 0) {
    return (
      <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
        <View style={styles.cardContent}>
          <ThemedText style={styles.itemName}>{item.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
            {item.description}
          </ThemedText>
          <View style={styles.cardFooter}>
            <ThemedText style={styles.price}>
              Rs {Number(item.basePrice).toFixed(2)}
            </ThemedText>
            {item.lowStock && (
              <ThemedText style={styles.lowStock}>Low stock</ThemedText>
            )}
          </View>
        </View>
        <View style={styles.quantityRow}>
          <Pressable
            onPress={() => decrementItem(item.id)}
            style={({ pressed }) => [
              styles.quantityButton,
              pressed && styles.addButtonPressed,
            ]}
          >
            <ThemedText style={styles.quantityButtonText}>-</ThemedText>
          </Pressable>
          <ThemedText style={styles.quantityText}>{quantity}</ThemedText>
          <Pressable
            onPress={() => incrementItem(item.id)}
            style={({ pressed }) => [
              styles.quantityButton,
              pressed && styles.addButtonPressed,
            ]}
          >
            <ThemedText style={styles.quantityButtonText}>+</ThemedText>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.cardContent}>
        <ThemedText style={styles.itemName}>{item.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
          {item.description}
        </ThemedText>
        <View style={styles.cardFooter}>
          <ThemedText style={styles.price}>
            Rs {Number(item.basePrice).toFixed(2)}
          </ThemedText>
          {item.lowStock && (
            <ThemedText style={styles.lowStock}>Low stock</ThemedText>
          )}
        </View>
      </View>
      <Pressable
        onPress={() => addItem(item.id, item.name, Number(item.basePrice))}
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

function CartSummary() {
  const theme = useTheme();
  const items = useCartStore((s) => s.items);
  const totalItems = useCartStore((s) => s.totalItems());
  const totalPrice = useCartStore((s) => s.totalPrice());
  const clearCart = useCartStore((s) => s.clearCart);

  if (items.length === 0) return null;

  return (
    <View
      style={[
        styles.cartBar,
        {
          backgroundColor: theme.backgroundElement,
          borderTopColor: theme.backgroundSelected,
        },
      ]}
    >
      <View style={styles.cartInfo}>
        <ThemedText style={styles.cartItemCount}>
          {totalItems} {totalItems === 1 ? "item" : "items"}
        </ThemedText>
        <ThemedText style={styles.cartTotal}>
          Rs {totalPrice.toFixed(2)}
        </ThemedText>
      </View>
      <Pressable
        onPress={clearCart}
        style={({ pressed }) => [
          styles.clearButton,
          pressed && { opacity: 0.8 },
        ]}
      >
        <ThemedText style={styles.clearButtonText}>Clear</ThemedText>
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const theme = useTheme();
  const { user, step, logout } = useAuthStore();
  const selectedTheatre = useSessionStore((s) => s.selectedTheatre);
  const selectedShowtime = useSessionStore((s) => s.selectedShowtime);

  let content: React.ReactNode;
  if (!selectedTheatre) {
    content = <TheatreList />;
  } else if (!selectedShowtime) {
    content = <ShowtimeList />;
  } else {
    content = <MenuView />;
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {step === "authenticated" && (
          <View
            style={[
              styles.userHeader,
              { borderBottomColor: theme.backgroundElement },
            ]}
          >
            {user ? (
              <View style={styles.userInfo}>
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: theme.backgroundElement },
                  ]}
                >
                  <ThemedText style={styles.avatarText}>
                    {user.name.charAt(0).toUpperCase()}
                  </ThemedText>
                </View>
                <View>
                  <ThemedText style={styles.userName}>{user.name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {user.phone}
                  </ThemedText>
                </View>
              </View>
            ) : (
              <View />
            )}
            <Pressable
              onPress={logout}
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && styles.logoutPressed,
              ]}
            >
              <ThemedText style={styles.logoutText}>Log out</ThemedText>
            </Pressable>
          </View>
        )}

        {!selectedTheatre && (
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Select a Theatre</ThemedText>
          </View>
        )}

        {content}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    paddingBottom: BottomTabInset,
    paddingTop: Platform.OS === "web" ? 64 : 0,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
    borderBottomWidth: 1,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 15,
    fontWeight: "700",
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
  },
  logoutButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: Spacing.two,
    backgroundColor: "#e74c3c",
  },
  logoutPressed: {
    opacity: 0.8,
  },
  logoutText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  sectionHeader: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.four,
    gap: Spacing.two + 4,
  },
  pressed: {
    opacity: 0.7,
  },

  // Theatre cards
  theatreCard: {
    borderRadius: Spacing.two + 4,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  theatreName: {
    fontSize: 16,
    fontWeight: "700",
  },
  screens: {
    marginTop: Spacing.one,
  },

  // Step header (back button + context)
  stepHeader: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    gap: Spacing.one,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: Spacing.one,
  },
  backText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3c87f7",
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "700",
  },

  // Showtime cards
  showtimeCard: {
    borderRadius: Spacing.two + 4,
    padding: Spacing.three,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  showtimeMain: {
    flex: 1,
    gap: Spacing.one,
    marginRight: Spacing.three,
  },
  movieTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  movieMeta: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  showtimeDetails: {
    alignItems: "flex-end",
    gap: 2,
  },
  showtimeTime: {
    fontSize: 16,
    fontWeight: "700",
  },
  showtimePrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#3c87f7",
    marginTop: Spacing.one,
  },

  // Context bar
  contextBar: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
    marginHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    marginBottom: Spacing.two,
  },
  contextText: {
    textAlign: "center",
    fontWeight: "600",
  },

  // Menu grid
  grid: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
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
    justifyContent: "space-between",
  },
  cardContent: {
    gap: Spacing.one,
    marginBottom: Spacing.three,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "700",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
  },
  lowStock: {
    fontSize: 11,
    fontWeight: "600",
    color: "#e67e22",
  },
  addButton: {
    backgroundColor: "#3c87f7",
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    alignItems: "center",
  },
  addButtonPressed: {
    opacity: 0.8,
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quantityButton: {
    backgroundColor: "#3c87f7",
    borderRadius: Spacing.two,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "700",
  },
  cartBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderTopWidth: 1,
  },
  cartInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  cartItemCount: {
    fontSize: 15,
    fontWeight: "700",
  },
  cartTotal: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3c87f7",
  },
  clearButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    backgroundColor: "#e74c3c",
  },
  clearButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
});
