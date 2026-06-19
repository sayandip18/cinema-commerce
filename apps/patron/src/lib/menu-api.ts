import { apiClient } from './api-client';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  lowStock: boolean;
}

export const menuApi = {
  getAvailableItems: async (theatreId: string): Promise<MenuItem[]> => {
    const { data } = await apiClient.get(`/theatres/${theatreId}/menu`);
    return data.data;
  },
};
