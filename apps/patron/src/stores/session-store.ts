import { create } from 'zustand';
import type { Theatre, TheatreShowtime } from '@/lib/theatre-api';
import { useCartStore } from './cart-store';

interface SessionState {
  selectedTheatre: Theatre | null;
  selectedShowtime: TheatreShowtime | null;

  selectTheatre: (theatre: Theatre) => void;
  selectShowtime: (showtime: TheatreShowtime) => void;
  goBackToTheatres: () => void;
  goBackToShowtimes: () => void;
}

export const useSessionStore = create<SessionState>()((set) => ({
  selectedTheatre: null,
  selectedShowtime: null,

  selectTheatre: (theatre) => {
    useCartStore.getState().clearCart();
    set({ selectedTheatre: theatre, selectedShowtime: null });
  },

  selectShowtime: (showtime) =>
    set({ selectedShowtime: showtime }),

  goBackToTheatres: () => {
    useCartStore.getState().clearCart();
    set({ selectedTheatre: null, selectedShowtime: null });
  },

  goBackToShowtimes: () =>
    set({ selectedShowtime: null }),
}));
