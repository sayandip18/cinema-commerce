import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { orderApi, type OrderResponse, type OrderItemResponse } from "@/lib/order-api";

const STATUS_LABELS: Record<string, string> = {
  "pending-payment": "Pending Payment",
  placed: "Placed",
  cancelled: "Cancelled",
  "cancelled-due-to-timeout": "Timed Out",
  preparing: "Preparing",
  ready: "Ready",
  "seat-delivered": "Delivered",
};

const STATUS_COLORS: Record<string, string> = {
  "pending-payment": "#f39c12",
  placed: "#3c87f7",
  cancelled: "#e74c3c",
  "cancelled-due-to-timeout": "#e74c3c",
  preparing: "#f39c12",
  ready: "#27ae60",
  "seat-delivered": "#27ae60",
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function OrderItemRow({ item }: { item: OrderItemResponse }) {
  const theme = useTheme();
  const lineTotal = Number(item.priceAtPurchase) * item.quantity;

  return (
    <View
      style={[styles.orderItemRow, { borderBottomColor: theme.backgroundElement }]}
    >
      <View style={styles.orderItemInfo}>
        <ThemedText style={styles.orderItemName}>
          {item.menuItem?.name ?? "Unknown Item"}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {item.quantity} x Rs {Number(item.priceAtPurchase).toFixed(2)}
        </ThemedText>
      </View>
      <ThemedText style={styles.orderItemTotal}>
        Rs {lineTotal.toFixed(2)}
      </ThemedText>
    </View>
  );
}

function OrderCard({ order }: { order: OrderResponse }) {
  const theme = useTheme();
  const statusLabel = STATUS_LABELS[order.status] ?? order.status;
  const statusColor = STATUS_COLORS[order.status] ?? "#999999";

  return (
    <View
      style={[
        styles.orderCard,
        { backgroundColor: theme.backgroundElement },
      ]}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderHeaderLeft}>
          <ThemedText style={styles.orderDate}>
            {formatDate(order.createdAt)}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Screen {order.screenNumber} · Seat {order.seatNumber}
          </ThemedText>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <ThemedText style={styles.statusText}>{statusLabel}</ThemedText>
        </View>
      </View>

      {order.items?.length > 0 && (
        <View style={styles.orderItems}>
          {order.items.map((item) => (
            <OrderItemRow key={item.id} item={item} />
          ))}
        </View>
      )}

      <View
        style={[
          styles.orderFooter,
          { borderTopColor: theme.background },
        ]}
      >
        <View style={styles.footerRow}>
          <ThemedText type="small" themeColor="textSecondary">
            Subtotal
          </ThemedText>
          <ThemedText type="small">
            Rs {Number(order.foodCost).toFixed(2)}
          </ThemedText>
        </View>
        <View style={styles.footerRow}>
          <ThemedText type="small" themeColor="textSecondary">
            Tax
          </ThemedText>
          <ThemedText type="small">
            Rs {Number(order.taxes).toFixed(2)}
          </ThemedText>
        </View>
        <View style={styles.footerRow}>
          <ThemedText style={styles.totalLabel}>Total</ThemedText>
          <ThemedText style={styles.totalValue}>
            Rs {Number(order.total).toFixed(2)}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

export default function OrderScreen() {
  const {
    data: orders,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["myOrders"],
    queryFn: orderApi.getMyOrders,
  });

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" />
          </View>
        ) : !orders || orders.length === 0 ? (
          <View style={styles.centered}>
            <ThemedText themeColor="textSecondary">
              No orders yet
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(order) => order.id}
            renderItem={({ item }) => <OrderCard order={item} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
              />
            }
          />
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
    paddingBottom: BottomTabInset,
    paddingTop: Platform.OS === "web" ? 64 : 0,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  orderCard: {
    borderRadius: 12,
    overflow: "hidden",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: Spacing.three,
  },
  orderHeaderLeft: {
    flex: 1,
    gap: Spacing.half,
  },
  orderDate: {
    fontSize: 15,
    fontWeight: "700",
  },
  statusBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: 6,
    marginLeft: Spacing.two,
  },
  statusText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  orderItems: {
    paddingHorizontal: Spacing.three,
  },
  orderItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  orderItemInfo: {
    flex: 1,
    gap: 2,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: "600",
  },
  orderItemTotal: {
    fontSize: 14,
    fontWeight: "600",
  },
  orderFooter: {
    padding: Spacing.three,
    borderTopWidth: 1,
    gap: Spacing.one,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  totalValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#3c87f7",
  },
});
