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
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { showtimeApi } from "@/lib/showtime-api";
import { menuApi, type MenuItem } from "@/lib/menu-api";

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
              Rs{Number(item.basePrice).toFixed(2)}
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
            Rs{Number(item.basePrice).toFixed(2)}
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
          Rs{totalPrice.toFixed(2)}
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

  const {
    data: showtime,
    isLoading: showtimeLoading,
    error: showtimeError,
  } = useQuery({
    queryKey: ["currentShowtime"],
    queryFn: showtimeApi.getCurrent,
  });

  const {
    data: menuItems,
    isLoading: menuLoading,
    error: menuError,
  } = useQuery({
    queryKey: ["menu", showtime?.theatreId],
    queryFn: () => menuApi.getAvailableItems(showtime!.theatreId),
    enabled: !!showtime?.theatreId,
  });

  const isLoading = showtimeLoading || menuLoading;
  const error = showtimeError || menuError;

  const contextLabel = showtime
    ? `${showtime.theatreName} | Screen ${showtime.screen} | ${showtime.movieTitle} | Seat ${showtime.seatNumber}`
    : "";

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

        {showtime && (
          <View
            style={[
              styles.contextBar,
              { backgroundColor: theme.backgroundElement },
            ]}
          >
            <ThemedText
              type="small"
              numberOfLines={1}
              style={styles.contextText}
            >
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
            style={styles.menuList}
          />
        )}

        <CartSummary />
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
  contextBar: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
    marginHorizontal: Spacing.three,
    marginTop: Spacing.two,
    borderRadius: Spacing.two,
  },
  contextText: {
    textAlign: "center",
    fontWeight: "600",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  menuList: {
    flex: 1,
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
