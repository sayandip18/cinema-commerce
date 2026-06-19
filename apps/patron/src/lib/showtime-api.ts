import { apiClient } from './api-client';

export interface CurrentShowtime {
  showtimeId: string;
  theatreId: string;
  theatreName: string;
  screen: string;
  movieTitle: string;
  startTime: string;
  price: number;
  seatNumber: string;
}

export const showtimeApi = {
  getCurrent: async (): Promise<CurrentShowtime> => {
    const { data } = await apiClient.get('/showtimes/current');
    return data.data;
  },
};
