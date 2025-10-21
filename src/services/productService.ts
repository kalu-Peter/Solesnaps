// API service for products
import { supabaseDb } from '../lib/supabase';

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
  categories?: {
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
    const { data: products, error } = await supabaseDb.getProducts(params);
    
    if (error) {
      console.error('Failed to fetch products:', error.message);
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    console.log('Products:', products);
    
    return {
      message: 'Products retrieved successfully',
      data: {
        products: products || [],
        pagination: {
          current_page: 1,
          total_pages: 1,
          total_products: products?.length || 0,
          per_page: products?.length || 0,
          has_next: false,
          has_prev: false,
        },
        filters: {
          category: params?.category,
          brand: params?.brand,
          color: params?.color,
          size: params?.size,
          min_price: params?.min_price?.toString(),
          max_price: params?.max_price?.toString(),
          search: params?.search,
        },
      },
    };
  },

  // Get featured products
  async getFeaturedProducts(limit?: number): Promise<ProductsResponse> {
    const { data: products, error } = await supabaseDb.getProducts({ featured: true, limit });
    
    if (error) {
      console.error('Failed to fetch featured products:', error.message);
      throw new Error(`Failed to fetch featured products: ${error.message}`);
    }

    console.log('Featured products:', products);
    
    return {
      message: 'Featured products retrieved successfully',
      data: {
        products: products || [],
        pagination: {
          current_page: 1,
          total_pages: 1,
          total_products: products?.length || 0,
          per_page: products?.length || 0,
          has_next: false,
          has_prev: false,
        },
        filters: {},
      },
    };
  },

  // Get single product by ID
  async getProduct(id: number): Promise<{ message: string; data: { product: Product } }> {
    const { data: product, error } = await supabaseDb.getProduct(id.toString());
    
    if (error) {
      console.error('Failed to fetch product:', error.message);
      throw new Error(`Failed to fetch product: ${error.message}`);
    }

    console.log('Product:', product);

    return {
      message: 'Product retrieved successfully',
      data: { product }
    };
  },

  // Get new arrivals (products from last 15 days)
  async getNewArrivals(limit?: number): Promise<{ message: string; data: { products: Product[]; count: number } }> {
    const { data: products, error } = await supabaseDb.getProducts({ limit });
    
    if (error) {
      console.error('Failed to fetch new arrivals:', error.message);
      throw new Error(`Failed to fetch new arrivals: ${error.message}`);
    }

    console.log('New arrivals:', products);

    return {
      message: 'New arrivals retrieved successfully',
      data: { 
        products: products || [], 
        count: products?.length || 0 
      }
    };
  },

  // Get categories
  async getCategories(): Promise<{ message: string; data: { categories: Array<{ id: string; name: string; description?: string; image_url?: string }> } }> {
    const { data: categories, error } = await supabaseDb.getCategories();
    
    if (error) {
      console.error('Failed to fetch categories:', error.message);
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    console.log('Categories:', categories);

    return {
      message: 'Categories retrieved successfully',
      data: { categories: categories || [] }
    };
  },
};