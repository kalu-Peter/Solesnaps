// API service for orders
const API_BASE_URL = '/api';

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_image: string;
  quantity: number;
  price: string;
  size?: string;
  color?: string;
}

export interface Order {
  id: number;
  order_number: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: string;
  created_at: string;
  updated_at: string;
  shipping_address: string;
  payment_method: string;
  tracking_number?: string;
  estimated_delivery?: string;
  items: OrderItem[];
}

export interface OrdersResponse {
  message: string;
  data: {
    orders: Order[];
    total: number;
    page: number;
    limit: number;
  };
}

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Helper function to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

export const orderService = {
  // Get orders for the authenticated user (doesn't require user ID in URL)
  getUserOrders: async (userId: number, params?: {
    status?: string;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }): Promise<OrdersResponse> => {
    const searchParams = new URLSearchParams();
    
    if (params?.status && params.status !== 'all') {
      searchParams.append('status', params.status);
    }
    if (params?.page) {
      searchParams.append('page', params.page.toString());
    }
    if (params?.limit) {
      searchParams.append('limit', params.limit.toString());
    }
    if (params?.sort_by) {
      searchParams.append('sort_by', params.sort_by);
    }
    if (params?.sort_order) {
      searchParams.append('sort_order', params.sort_order);
    }

    const queryString = searchParams.toString();
    
    // Try multiple endpoint patterns that are commonly used
    const endpointsToTry = [
      `${API_BASE_URL}/orders/my-orders${queryString ? `?${queryString}` : ''}`,
      `${API_BASE_URL}/orders${queryString ? `?${queryString}` : ''}`,
      `${API_BASE_URL}/user/orders${queryString ? `?${queryString}` : ''}`,
      `${API_BASE_URL}/users/${userId}/orders${queryString ? `?${queryString}` : ''}`
    ];

    let lastError: Error | null = null;

    for (const url of endpointsToTry) {
      try {
        console.log(`Trying endpoint: ${url}`);
        const response = await fetch(url, {
          method: 'GET',
          headers: getAuthHeaders(),
        });

        if (response.ok) {
          return response.json();
        } else if (response.status !== 404) {
          // If it's not a 404, this might be the correct endpoint but with a different error
          throw new Error(`Failed to fetch orders: ${response.statusText} (${response.status})`);
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.log(`Endpoint ${url} failed:`, lastError.message);
      }
    }

    // If all endpoints failed, throw the last error
    throw lastError || new Error('All order endpoints failed');
  },

  // Get a specific order by ID
  getOrderById: async (orderId: number): Promise<{ message: string; data: { order: Order } }> => {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch order: ${response.statusText}`);
    }

    return response.json();
  },

  // Update order status (for admin use)
  updateOrderStatus: async (orderId: number, status: Order['status']): Promise<{ message: string; data: { order: Order } }> => {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update order status: ${response.statusText}`);
    }

    return response.json();
  },

  // Cancel an order
  cancelOrder: async (orderId: number): Promise<{ message: string; data: { order: Order } }> => {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel order: ${response.statusText}`);
    }

    return response.json();
  },

  // Create a new order
  createOrder: async (orderData: {
    items: Array<{
      product_id: number;
      quantity: number;
      size?: string;
      color?: string;
    }>;
    shipping_address: string;
    payment_method: string;
  }): Promise<{ message: string; data: { order: Order } }> => {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create order: ${response.statusText}`);
    }

    return response.json();
  },

  // Track an order by tracking number
  trackOrder: async (trackingNumber: string): Promise<{ message: string; data: { tracking: any } }> => {
    const response = await fetch(`${API_BASE_URL}/orders/track/${trackingNumber}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to track order: ${response.statusText}`);
    }

    return response.json();
  },

  // Reorder items from a previous order
  reorder: async (orderId: number): Promise<{ message: string; data: { order: Order } }> => {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/reorder`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to reorder: ${response.statusText}`);
    }

    return response.json();
  },
};