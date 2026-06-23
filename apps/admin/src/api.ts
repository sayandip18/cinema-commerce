import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

export interface Theatre {
  id: string;
  name: string;
  location: string;
  totalScreens: number;
}

export interface InventoryOverviewItem {
  menuItemId: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  quantity: number;
}

export async function fetchTheatres(): Promise<Theatre[]> {
  const response = await api.get<{ data: Theatre[] }>('/theatres');
  return response.data.data;
}

export async function fetchInventoryOverview(
  theatreId: string,
): Promise<InventoryOverviewItem[]> {
  const response = await api.get<{ data: InventoryOverviewItem[] }>(
    `/admin/inventory/overview/${theatreId}`,
  );
  return response.data.data;
}

export async function bulkRefillInventory(
  theatreId: string,
  items: { menuItemId: string; quantity: number }[],
): Promise<InventoryOverviewItem[]> {
  const response = await api.put<{ data: InventoryOverviewItem[] }>(
    '/admin/inventory/bulk',
    { theatreId, items },
  );
  return response.data.data;
}

export interface DemographicRow {
  ageGroup: string;
  category: string;
  totalQuantity: number;
  totalSpent: number;
}

export interface DemographicsSummary {
  totalOrders: number;
  totalRevenue: number;
  topCategory: string;
  topAgeGroup: string;
}

export interface DemographicsData {
  breakdown: DemographicRow[];
  summary: DemographicsSummary;
}

export async function fetchDemographics(): Promise<DemographicsData> {
  const response = await api.get<{ data: DemographicsData }>(
    '/analytics/demographics',
  );
  return response.data.data;
}
