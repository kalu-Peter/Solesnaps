const API_BASE_URL = "/admin";

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
  images?: string[];
}

export interface Order {
  id: number;
  user_id: number;
  order_number: string;
  total_amount: number;
  subtotal_amount?: number;
  shipping_amount?: number;
  status: "pending" | "processing" | "shipped" | "completed" | "cancelled";
  payment_method: string;
  payment_status?: string;
  created_at: string;
  updated_at: string;
  delivery_location_id?: number;
  tracking_number?: string;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  item_count: number;
  items?: OrderItem[];
  shipping_address?: any;
  billing_address?: any;
  notes?: string;
}

export interface OrdersResponse {
  message: string;
  data: {
    orders: Order[];
    pagination: {
      current_page: number;
      total_pages: number;
      total_orders: number;
      per_page: number;
    };
  };
}

export interface OrderDetailResponse {
  message: string;
  data: {
    order: Order;
  };
}

// Get all orders (Admin only)
export const fetchOrders = async (
  token: string,
  params?: {
    page?: number;
    limit?: number;
    status?: string;
    user_id?: number;
    start_date?: string;
    end_date?: string;
  }
): Promise<OrdersResponse> => {
  const searchParams = new URLSearchParams();
  
  if (params?.page) searchParams.append("page", params.page.toString());
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.status && params.status !== "all") searchParams.append("status", params.status);
  if (params?.user_id) searchParams.append("user_id", params.user_id.toString());
  if (params?.start_date) searchParams.append("start_date", params.start_date);
  if (params?.end_date) searchParams.append("end_date", params.end_date);

  const url = `${API_BASE_URL}/orders${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch orders: ${response.statusText}`);
  }

  const result = await response.json();
  
  // Convert string numbers to actual numbers
  if (result.data?.orders) {
    result.data.orders = result.data.orders.map((order: any) => ({
      ...order,
      total_amount: parseFloat(order.total_amount || 0),
      subtotal_amount: order.subtotal_amount ? parseFloat(order.subtotal_amount) : undefined,
      shipping_amount: order.shipping_amount ? parseFloat(order.shipping_amount) : undefined,
    }));
  }

  return result;
};

// Get single order with items (Admin or order owner)
export const fetchOrderById = async (
  token: string,
  orderId: number
): Promise<OrderDetailResponse> => {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch order: ${response.statusText}`);
  }

  const result = await response.json();
  
  // Convert string numbers to actual numbers
  if (result.data?.order) {
    const order = result.data.order;
    result.data.order = {
      ...order,
      total_amount: parseFloat(order.total_amount || 0),
      subtotal_amount: order.subtotal_amount ? parseFloat(order.subtotal_amount) : undefined,
      shipping_amount: order.shipping_amount ? parseFloat(order.shipping_amount) : undefined,
      items: order.items?.map((item: any) => ({
        ...item,
        price: parseFloat(item.price || 0),
      })) || [],
    };
  }

  return result;
};

// Update order status (Admin only)
export const updateOrderStatus = async (
  token: string,
  orderId: number,
  status: string,
  notes?: string
): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status, notes }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update order status: ${response.statusText}`);
  }

  return response.json();
};

// Cancel order
export const cancelOrder = async (
  token: string,
  orderId: number
): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to cancel order: ${response.statusText}`);
  }

  return response.json();
};