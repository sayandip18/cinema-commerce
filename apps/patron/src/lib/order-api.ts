import { apiClient } from './api-client';

interface OrderItemInput {
  menuItemId: string;
  quantity: number;
}

interface PlaceOrderRequest {
  theatreId: string;
  screenNumber: string;
  seatNumber: string;
  items: OrderItemInput[];
  idempotencyKey?: string;
}

export interface OrderResponse {
  id: string;
  userId: string;
  theatreId: string;
  screenNumber: string;
  seatNumber: string;
  foodCost: number;
  taxes: number;
  total: number;
  status: string;
  createdAt: string;
}

export interface PaymentResponse {
  id: string;
  orderId: string;
  amount: number;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  transactionRef: string | null;
  createdAt: string;
}

export const orderApi = {
  placeOrder: async (req: PlaceOrderRequest): Promise<OrderResponse> => {
    const { data } = await apiClient.post('/orders', req);
    return data.data;
  },

  pay: async (orderId: string): Promise<PaymentResponse> => {
    const { data } = await apiClient.post(`/orders/${orderId}/pay`);
    return data.data;
  },

  getOrder: async (orderId: string): Promise<OrderResponse> => {
    const { data } = await apiClient.get(`/orders/${orderId}`);
    return data.data;
  },
};
