import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  menuItemId: string;
  name: string;
  basePrice: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (menuItemId: string, name: string, basePrice: number) => void;
  removeItem: (menuItemId: string) => void;
  incrementItem: (menuItemId: string) => void;
  decrementItem: (menuItemId: string) => void;
  clearCart: () => void;
  getItemQuantity: (menuItemId: string) => number;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (menuItemId, name, basePrice) => {
        set((state) => {
          const existing = state.items.find((i) => i.menuItemId === menuItemId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.menuItemId === menuItemId
                  ? { ...i, quantity: i.quantity + 1 }
                  : i,
              ),
            };
          }
          return {
            items: [...state.items, { menuItemId, name, basePrice, quantity: 1 }],
          };
        });
      },

      removeItem: (menuItemId) => {
        set((state) => ({
          items: state.items.filter((i) => i.menuItemId !== menuItemId),
        }));
      },

      incrementItem: (menuItemId) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.menuItemId === menuItemId
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          ),
        }));
      },

      decrementItem: (menuItemId) => {
        set((state) => {
          const item = state.items.find((i) => i.menuItemId === menuItemId);
          if (!item) return state;
          if (item.quantity <= 1) {
            return { items: state.items.filter((i) => i.menuItemId !== menuItemId) };
          }
          return {
            items: state.items.map((i) =>
              i.menuItemId === menuItemId
                ? { ...i, quantity: i.quantity - 1 }
                : i,
            ),
          };
        });
      },

      clearCart: () => set({ items: [] }),

      getItemQuantity: (menuItemId) => {
        const item = get().items.find((i) => i.menuItemId === menuItemId);
        return item?.quantity ?? 0;
      },

      totalItems: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.basePrice * i.quantity, 0),
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
