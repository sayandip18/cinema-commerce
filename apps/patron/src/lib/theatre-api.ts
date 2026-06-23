import { apiClient } from './api-client';

export interface Theatre {
  id: string;
  name: string;
  location: string;
  totalScreens: number;
}

export interface TheatreShowtime {
  showtimeId: string;
  screen: string;
  movieTitle: string;
  movieGenre: string;
  movieDurationMinutes: number;
  movieRating: string;
  startTime: string;
  price: number;
}

export const theatreApi = {
  getAll: async (): Promise<Theatre[]> => {
    const { data } = await apiClient.get('/theatres');
    return data.data;
  },

  getShowtimes: async (theatreId: string): Promise<TheatreShowtime[]> => {
    const { data } = await apiClient.get(`/theatres/${theatreId}/showtimes`);
    return data.data;
  },
};
