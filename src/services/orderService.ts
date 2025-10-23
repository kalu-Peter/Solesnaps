// API service for orders
import { supabaseDb } from '../lib/supabase';

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
  // Get orders for the authenticated user
  getUserOrders: async (userId: string, params?: {
    status?: string;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }): Promise<OrdersResponse> => {
    const filters: any = { userId };
    
    if (params?.status && params.status !== 'all') {
      filters.status = params.status;
    }
    if (params?.limit) {
      filters.limit = params.limit;
    }

    console.log('OrderService - filters being sent to supabaseDb:', filters);
    console.log('OrderService - userId being filtered:', userId);

    const { data: orders, error } = await supabaseDb.getOrders(filters);
    
    if (error) {
      console.error('Failed to fetch user orders:', error.message);
      throw new Error(`Failed to fetch user orders: ${error.message}`);
    }

    console.log('User orders:', orders);

    // Transform the orders to match the expected format
    const transformedOrders = orders?.map(order => ({
      ...order,
      items: order.order_items?.map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.products?.name || 'Product name not available',
        product_image: item.products?.product_images?.[0]?.url || '',
        quantity: item.quantity,
        price: item.price || '0',
        size: item.size,
        color: item.color,
      })) || [],
      // Create user info for consistent display
      user_name: order.users ? `${order.users.first_name} ${order.users.last_name}`.trim() : 'Unknown User',
      user_email: order.users?.email || 'No email',
    })) || [];

    return {
      message: 'Orders retrieved successfully',
      data: {
        orders: transformedOrders,
        total: transformedOrders.length,
        page: params?.page || 1,
        limit: params?.limit || 10,
      },
    };
  },

  // Get a specific order by ID
  getOrderById: async (orderId: number): Promise<{ message: string; data: { order: Order } }> => {
    const { data: order, error } = await supabaseDb.getOrder(orderId.toString());
    
    if (error) {
      console.error('Failed to fetch order:', error.message);
      throw new Error(`Failed to fetch order: ${error.message}`);
    }

    console.log('Order:', order);

    return {
      message: 'Order retrieved successfully',
      data: { order }
    };
  },

  // Update order status (for admin use)
  updateOrderStatus: async (orderId: number, status: Order['status']): Promise<{ message: string; data: { order: Order } }> => {
    const { data: order, error } = await supabaseDb.updateOrderStatus(orderId.toString(), status);
    
    if (error) {
      console.error('Failed to update order status:', error.message);
      throw new Error(`Failed to update order status: ${error.message}`);
    }

    console.log('Order status updated:', order);

    return {
      message: 'Order status updated successfully',
      data: { order }
    };
  },

  // Cancel an order
  cancelOrder: async (orderId: number): Promise<{ message: string; data: { order: Order } }> => {
    const { data: order, error } = await supabaseDb.updateOrderStatus(orderId.toString(), 'cancelled');
    
    if (error) {
      console.error('Failed to cancel order:', error.message);
      throw new Error(`Failed to cancel order: ${error.message}`);
    }

    console.log('Order cancelled:', order);

    return {
      message: 'Order cancelled successfully',
      data: { order }
    };
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
    const { data: order, error } = await supabaseDb.createOrder(orderData);
    
    if (error) {
      console.error('Failed to create order:', error.message);
      throw new Error(`Failed to create order: ${error.message}`);
    }

    console.log('Order created:', order);

    return {
      message: 'Order created successfully',
      data: { order }
    };
  },

  // Track an order by tracking number
  trackOrder: async (trackingNumber: string): Promise<{ message: string; data: { tracking: any } }> => {
    // For now, we'll get all orders and find by tracking number
    // This should be implemented properly in the supabaseDb methods
    const { data: orders, error } = await supabaseDb.getOrders();
    
    if (error) {
      console.error('Failed to track order:', error.message);
      throw new Error(`Failed to track order: ${error.message}`);
    }

    const trackedOrder = orders?.find(order => order.tracking_number === trackingNumber);
    
    if (!trackedOrder) {
      throw new Error('Order not found');
    }

    console.log('Tracked order:', trackedOrder);

    return {
      message: 'Order tracked successfully',
      data: { tracking: trackedOrder }
    };
  },

  // Reorder items from a previous order
  reorder: async (orderId: number): Promise<{ message: string; data: { order: Order } }> => {
    // Get the original order
    const { data: originalOrder, error: getError } = await supabaseDb.getOrder(orderId.toString());
    
    if (getError) {
      console.error('Failed to get original order:', getError.message);
      throw new Error(`Failed to get original order: ${getError.message}`);
    }

    // Create a new order with the same items
    const orderData = {
      items: originalOrder.order_items.map((item: any) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
      })),
      shipping_address: originalOrder.shipping_address,
      payment_method: originalOrder.payment_method,
    };

    const { data: newOrder, error: createError } = await supabaseDb.createOrder(orderData);
    
    if (createError) {
      console.error('Failed to reorder:', createError.message);
      throw new Error(`Failed to reorder: ${createError.message}`);
    }

    console.log('Reorder created:', newOrder);

    return {
      message: 'Reorder created successfully',
      data: { order: newOrder }
    };
  },
};