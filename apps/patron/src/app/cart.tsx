import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import { useCartStore, type CartItem } from "@/stores/cart-store";
import { useSessionStore } from "@/stores/session-store";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { orderApi } from "@/lib/order-api";

function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

const TAX_RATE = 0.05;

function CartItemRow({ item }: { item: CartItem }) {
  const theme = useTheme();
  const { incrementItem, decrementItem } = useCartStore();
  const lineTotal = item.basePrice * item.quantity;

  return (
    <View
      style={[styles.itemRow, { borderBottomColor: theme.backgroundElement }]}
    >
      <View style={styles.itemInfo}>
        <ThemedText style={styles.itemName}>{item.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Rs {Number(item.basePrice).toFixed(2)} each
        </ThemedText>
      </View>
      <View style={styles.itemRight}>
        <View style={styles.quantityRow}>
          <Pressable
            onPress={() => decrementItem(item.menuItemId)}
            style={({ pressed }) => [
              styles.quantityButton,
              pressed && styles.pressed,
            ]}
          >
            <ThemedText style={styles.quantityButtonText}>-</ThemedText>
          </Pressable>
          <ThemedText style={styles.quantityText}>{item.quantity}</ThemedText>
          <Pressable
            onPress={() => incrementItem(item.menuItemId)}
            style={({ pressed }) => [
              styles.quantityButton,
              pressed && styles.pressed,
            ]}
          >
            <ThemedText style={styles.quantityButtonText}>+</ThemedText>
          </Pressable>
        </View>
        <ThemedText style={styles.lineTotal}>
          Rs {lineTotal.toFixed(2)}
        </ThemedText>
      </View>
    </View>
  );
}

export default function CartScreen() {
  const theme = useTheme();
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const totalPrice = useCartStore((s) => s.totalPrice());
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const selectedTheatre = useSessionStore((s) => s.selectedTheatre);
  const selectedShowtime = useSessionStore((s) => s.selectedShowtime);

  const tax = totalPrice * TAX_RATE;
  const grandTotal = totalPrice + tax;

  // TODO: poll using react query?
  const pollOrderStatus = async (orderId: string): Promise<string> => {
    const maxAttempts = 15;
    const intervalMs = 1000;

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
      const order = await orderApi.getOrder(orderId);
      if (order.status !== "pending-payment") {
        return order.status;
      }
    }

    return "pending-payment";
  };

  const handleCheckout = async () => {
    if (!selectedTheatre || !selectedShowtime || items.length === 0) return;

    setIsCheckingOut(true);
    try {
      const order = await orderApi.placeOrder({
        theatreId: selectedTheatre.id,
        showtimeId: selectedShowtime.showtimeId,
        screenNumber: selectedShowtime.screen,
        seatNumber: "A1",
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
        })),
        idempotencyKey: generateIdempotencyKey(),
      });

      await orderApi.pay(order.id);

      const finalStatus = await pollOrderStatus(order.id);

      if (finalStatus === "placed") {
        clearCart();
        Alert.alert("Order Placed", "Your order has been confirmed!");
        router.replace("/(tabs)");
      } else if (finalStatus === "cancelled") {
        Alert.alert(
          "Payment Failed",
          "Your payment was declined. Please try again.",
        );
      } else if (finalStatus === "pending-payment") {
        Alert.alert(
          "Processing",
          "Payment is still being processed. Check your orders for updates.",
        );
      } else {
        Alert.alert("Order Issue", `Order status: ${finalStatus}`);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      Alert.alert("Checkout Failed", message);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View
          style={[
            styles.header,
            { borderBottomColor: theme.backgroundElement },
          ]}
        >
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <ThemedText style={styles.backText}>Back</ThemedText>
          </Pressable>
          <ThemedText style={styles.headerTitle}>Your Cart</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText themeColor="textSecondary">
              Your cart is empty
            </ThemedText>
          </View>
        ) : (
          <>
            <FlatList
              data={items}
              keyExtractor={(item) => item.menuItemId}
              renderItem={({ item }) => <CartItemRow item={item} />}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              style={styles.list}
            />

            <View
              style={[
                styles.summarySection,
                { borderTopColor: theme.backgroundElement },
              ]}
            >
              <View style={styles.summaryRow}>
                <ThemedText themeColor="textSecondary">Subtotal</ThemedText>
                <ThemedText>Rs {totalPrice.toFixed(2)}</ThemedText>
              </View>
              <View style={styles.summaryRow}>
                <ThemedText themeColor="textSecondary">Tax (5%)</ThemedText>
                <ThemedText>Rs {tax.toFixed(2)}</ThemedText>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <ThemedText style={styles.totalLabel}>Total</ThemedText>
                <ThemedText style={styles.totalValue}>
                  Rs {grandTotal.toFixed(2)}
                </ThemedText>
              </View>

              <Pressable
                onPress={handleCheckout}
                disabled={isCheckingOut || !selectedTheatre || !selectedShowtime}
                style={({ pressed }) => [
                  styles.checkoutButton,
                  pressed && styles.pressed,
                  isCheckingOut && styles.checkoutDisabled,
                ]}
              >
                {isCheckingOut ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <ThemedText style={styles.checkoutText}>Checkout</ThemedText>
                )}
              </Pressable>
            </View>
          </>
        )}
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
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  backButton: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  backText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3c87f7",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  headerSpacer: {
    width: 50,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: Spacing.two,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  itemInfo: {
    flex: 1,
    gap: Spacing.half,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
  },
  itemRight: {
    alignItems: "flex-end",
    gap: Spacing.two,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  quantityButton: {
    backgroundColor: "#3c87f7",
    borderRadius: Spacing.two,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  quantityText: {
    fontSize: 15,
    fontWeight: "700",
    minWidth: 20,
    textAlign: "center",
  },
  lineTotal: {
    fontSize: 15,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.8,
  },
  summarySection: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderTopWidth: 1,
    gap: Spacing.two,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalRow: {
    paddingTop: Spacing.two,
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: "700",
  },
  totalValue: {
    fontSize: 17,
    fontWeight: "700",
    color: "#3c87f7",
  },
  checkoutButton: {
    backgroundColor: "#3c87f7",
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: "center",
    marginTop: Spacing.two,
  },
  checkoutDisabled: {
    opacity: 0.6,
  },
  checkoutText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
