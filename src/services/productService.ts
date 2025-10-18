// API service for products
const API_BASE_URL = '/api';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock_quantity: number;
  brand: string;
  colors?: string[];
  sizes?: string[];
  gender?: string;
  images?: Array<{
    id: number;
    image_url: string;
    alt_text?: string;
    is_primary: boolean;
    sort_order: number;
  }> | string;
  product_images?: Array<{
    id: string;
    url: string;
    alt_text?: string;
    is_primary: boolean;
    sort_order: number;
  }>;
  category?: {
    id: string;
    name: string;
  };
  category_name?: string;
  category_id?: string;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductsResponse {
  message: string;
  data: {
    products: Product[];
    pagination: {
      current_page: number;
      total_pages: number;
      total_products: number;
      per_page: number;
      has_next: boolean;
      has_prev: boolean;
    };
    filters: {
      category?: string;
      brand?: string;
      color?: string;
      size?: string;
      min_price?: string;
      max_price?: string;
      search?: string;
    };
  };
}

export const productService = {
  // Get all products with optional filters
  async getProducts(params?: {
    page?: number;
    limit?: number;
    category?: string;
    brand?: string;
    color?: string;
    size?: string;
    min_price?: number;
    max_price?: number;
    search?: string;
    sort_by?: 'name' | 'price' | 'created_at' | 'rating';
    sort_order?: 'asc' | 'desc';
  }): Promise<ProductsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = `${API_BASE_URL}/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    return response.json();
  },

  // Get featured products
  async getFeaturedProducts(limit?: number): Promise<ProductsResponse> {
    const queryParams = new URLSearchParams();
    if (limit) {
      queryParams.append('limit', limit.toString());
    }

    const url = `${API_BASE_URL}/products/featured${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch featured products: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform the response to match expected format
    return {
      message: data.message,
      data: {
        products: data.data.products,
        pagination: {
          current_page: 1,
          total_pages: 1,
          total_products: data.data.products.length,
          per_page: data.data.products.length,
          has_next: false,
          has_prev: false,
        },
        filters: {},
      },
    };
  },

  // Get single product by ID
  async getProduct(id: number): Promise<{ message: string; data: { product: Product } }> {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch product: ${response.statusText}`);
    }

    return response.json();
  },

  // Get new arrivals (products from last 15 days)
  async getNewArrivals(limit?: number): Promise<{ message: string; data: { products: Product[]; count: number } }> {
    const queryParams = new URLSearchParams();
    if (limit) {
      queryParams.append('limit', limit.toString());
    }

    const url = `${API_BASE_URL}/products/new-arrivals${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch new arrivals: ${response.statusText}`);
    }

    return response.json();
  },

  // Get categories
  async getCategories(): Promise<{ message: string; data: { categories: Array<{ id: string; name: string; description?: string; image_url?: string }> } }> {
    const response = await fetch(`${API_BASE_URL}/products/categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`);
    }

    return response.json();
  },
};