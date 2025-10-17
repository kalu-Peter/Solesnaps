// API service for coupons
const API_BASE_URL = '/api';

export interface Coupon {
  id: number;
  code: string;
  type: 'percentage' | 'fixed';
  value: number; // percentage (0-100) or fixed amount
  description: string;
  minimum_order_amount?: number;
  maximum_discount_amount?: number;
  usage_limit?: number;
  used_count: number;
  is_active: boolean;
  starts_at: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface CouponValidationResponse {
  valid: boolean;
  coupon?: Coupon;
  discount_amount?: number;
  error_message?: string;
}

export interface ApplyCouponRequest {
  code: string;
  order_total: number;
  user_id?: number;
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

export const couponService = {
  // Validate and apply a coupon
  validateCoupon: async (request: ApplyCouponRequest): Promise<CouponValidationResponse> => {
    // TEMPORARY MOCK IMPLEMENTATION - Replace with real API call when backend is ready
    console.log('Mock coupon validation for:', request);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock coupon database
    const mockCoupons: Coupon[] = [
      {
        id: 1,
        code: 'SAVE20',
        type: 'percentage',
        value: 20,
        description: '20% off your entire order',
        minimum_order_amount: 1000,
        maximum_discount_amount: 5000,
        usage_limit: 100,
        used_count: 15,
        is_active: true,
        starts_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 2,
        code: 'FLAT500',
        type: 'fixed',
        value: 500,
        description: 'KES 500 off your order',
        minimum_order_amount: 2000,
        usage_limit: 50,
        used_count: 8,
        is_active: true,
        starts_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        expires_at: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days from now
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 3,
        code: 'WELCOME10',
        type: 'percentage',
        value: 10,
        description: 'Welcome discount - 10% off',
        minimum_order_amount: 500,
        maximum_discount_amount: 1000,
        usage_limit: 1000,
        used_count: 234,
        is_active: true,
        starts_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];
    
    const coupon = mockCoupons.find(c => c.code === request.code.toUpperCase());
    
    if (!coupon) {
      return {
        valid: false,
        error_message: 'Invalid coupon code'
      };
    }
    
    if (!isCouponActive(coupon)) {
      return {
        valid: false,
        error_message: 'This coupon has expired or is not yet active'
      };
    }
    
    if (coupon.minimum_order_amount && request.order_total < coupon.minimum_order_amount) {
      return {
        valid: false,
        error_message: `Minimum order amount is KES ${coupon.minimum_order_amount.toLocaleString()}`
      };
    }
    
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return {
        valid: false,
        error_message: 'This coupon has reached its usage limit'
      };
    }
    
    const discount = calculateCouponDiscount(coupon, request.order_total);
    
    return {
      valid: true,
      coupon,
      discount_amount: discount
    };
  },

  // Get all active coupons (for admin or public display)
  getActiveCoupons: async (): Promise<{ data: { coupons: Coupon[] } }> => {
    // TEMPORARY MOCK IMPLEMENTATION
    console.log('Mock: Fetching active coupons');
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const mockActiveCoupons: Coupon[] = [
      {
        id: 1,
        code: 'SAVE20',
        type: 'percentage',
        value: 20,
        description: '20% off your entire order',
        minimum_order_amount: 1000,
        maximum_discount_amount: 5000,
        usage_limit: 100,
        used_count: 15,
        is_active: true,
        starts_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 2,
        code: 'FLAT500',
        type: 'fixed',
        value: 500,
        description: 'KES 500 off your order',
        minimum_order_amount: 2000,
        usage_limit: 50,
        used_count: 8,
        is_active: true,
        starts_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        expires_at: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];
    
    return {
      data: {
        coupons: mockActiveCoupons
      }
    };
  },

  // Get coupon by code (public endpoint)
  getCouponByCode: async (code: string): Promise<{ data: { coupon: Coupon } }> => {
    // TEMPORARY MOCK IMPLEMENTATION
    console.log('Mock: Getting coupon by code:', code);
    throw new Error('Mock implementation - endpoint not needed for frontend testing');
  },

  // Admin: Get all coupons
  getAllCoupons: async (params?: {
    page?: number;
    limit?: number;
    is_active?: boolean;
  }): Promise<{ data: { coupons: Coupon[]; total: number; page: number; limit: number } }> => {
    // TEMPORARY MOCK IMPLEMENTATION
    console.log('Mock: Getting all coupons for admin');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockAllCoupons: Coupon[] = [
      {
        id: 1,
        code: 'SAVE20',
        type: 'percentage',
        value: 20,
        description: '20% off your entire order',
        minimum_order_amount: 1000,
        maximum_discount_amount: 5000,
        usage_limit: 100,
        used_count: 15,
        is_active: true,
        starts_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 2,
        code: 'FLAT500',
        type: 'fixed',
        value: 500,
        description: 'KES 500 off your order',
        minimum_order_amount: 2000,
        usage_limit: 50,
        used_count: 8,
        is_active: true,
        starts_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        expires_at: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 3,
        code: 'WELCOME10',
        type: 'percentage',
        value: 10,
        description: 'Welcome discount - 10% off',
        minimum_order_amount: 500,
        maximum_discount_amount: 1000,
        usage_limit: 1000,
        used_count: 234,
        is_active: true,
        starts_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 4,
        code: 'EXPIRED20',
        type: 'percentage',
        value: 20,
        description: 'Expired coupon for testing',
        minimum_order_amount: 1000,
        usage_limit: 50,
        used_count: 45,
        is_active: true,
        starts_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        expires_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // Expired 5 days ago
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];
    
    return {
      data: {
        coupons: mockAllCoupons,
        total: mockAllCoupons.length,
        page: params?.page || 1,
        limit: params?.limit || 10
      }
    };
  },

  // Admin: Create a new coupon
  createCoupon: async (couponData: Omit<Coupon, 'id' | 'used_count' | 'created_at' | 'updated_at'>): Promise<{ data: { coupon: Coupon } }> => {
    // TEMPORARY MOCK IMPLEMENTATION
    console.log('Mock: Creating coupon:', couponData);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newCoupon: Coupon = {
      ...couponData,
      id: Math.floor(Math.random() * 10000),
      used_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    return {
      data: { coupon: newCoupon }
    };
  },

  // Admin: Update a coupon
  updateCoupon: async (id: number, couponData: Partial<Omit<Coupon, 'id' | 'created_at' | 'updated_at'>>): Promise<{ data: { coupon: Coupon } }> => {
    // TEMPORARY MOCK IMPLEMENTATION
    console.log('Mock: Updating coupon:', id, couponData);
    
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Mock updated coupon
    const updatedCoupon: Coupon = {
      id,
      code: couponData.code || 'UPDATED',
      type: couponData.type || 'percentage',
      value: couponData.value || 10,
      description: couponData.description || 'Updated coupon',
      minimum_order_amount: couponData.minimum_order_amount,
      maximum_discount_amount: couponData.maximum_discount_amount,
      usage_limit: couponData.usage_limit,
      used_count: couponData.used_count || 0,
      is_active: couponData.is_active ?? true,
      starts_at: couponData.starts_at || new Date().toISOString(),
      expires_at: couponData.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    return {
      data: { coupon: updatedCoupon }
    };
  },

  // Admin: Delete a coupon
  deleteCoupon: async (id: number): Promise<{ message: string }> => {
    // TEMPORARY MOCK IMPLEMENTATION
    console.log('Mock: Deleting coupon:', id);
    
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return {
      message: 'Coupon deleted successfully'
    };
  },

  // Admin: Get coupon usage statistics
  getCouponStats: async (id: number): Promise<{ data: { stats: any } }> => {
    // TEMPORARY MOCK IMPLEMENTATION
    console.log('Mock: Getting coupon stats for:', id);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      data: {
        stats: {
          total_usage: Math.floor(Math.random() * 100),
          total_savings: Math.floor(Math.random() * 50000),
          average_order_value: Math.floor(Math.random() * 5000) + 1000
        }
      }
    };
  },
};

// Utility functions for coupon calculations
export const calculateCouponDiscount = (coupon: Coupon, orderTotal: number): number => {
  if (!coupon.is_active) return 0;
  
  // Check minimum order amount
  if (coupon.minimum_order_amount && orderTotal < coupon.minimum_order_amount) {
    return 0;
  }

  let discount = 0;
  
  if (coupon.type === 'percentage') {
    discount = (orderTotal * coupon.value) / 100;
  } else if (coupon.type === 'fixed') {
    discount = coupon.value;
  }

  // Apply maximum discount limit
  if (coupon.maximum_discount_amount && discount > coupon.maximum_discount_amount) {
    discount = coupon.maximum_discount_amount;
  }

  // Ensure discount doesn't exceed order total
  return Math.min(discount, orderTotal);
};

export const formatCouponValue = (coupon: Coupon): string => {
  if (coupon.type === 'percentage') {
    return `${coupon.value}%`;
  } else {
    return `KES ${coupon.value.toLocaleString()}`;
  }
};

export const isCouponExpired = (coupon: Coupon): boolean => {
  const now = new Date();
  const expiresAt = new Date(coupon.expires_at);
  return now > expiresAt;
};

export const isCouponActive = (coupon: Coupon): boolean => {
  const now = new Date();
  const startsAt = new Date(coupon.starts_at);
  const expiresAt = new Date(coupon.expires_at);
  
  return coupon.is_active && now >= startsAt && now <= expiresAt;
};