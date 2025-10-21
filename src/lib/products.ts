import { supabaseDb } from './supabase';

export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  stock_quantity: number;
  brand: string;
  category_id: number;
  category_name?: string;
  is_featured: boolean;
  is_active: boolean;
}

export async function fetchProducts(): Promise<Product[]> {
  const { data: products, error } = await supabaseDb.getProducts();
  if (error) {
    console.error('Failed to fetch products:', error.message);
    throw new Error("Failed to fetch products");
  }
  console.log('Products:', products);
  return products || [];
}

export async function fetchProductById(id: number): Promise<Product> {
  const { data: product, error } = await supabaseDb.getProduct(id.toString());
  if (error) {
    console.error('Failed to fetch product:', error.message);
    throw new Error("Failed to fetch product");
  }
  console.log('Product:', product);
  return product;
}

export async function fetchProductPrices(productIds: string[]): Promise<Record<string, number>> {
  if (productIds.length === 0) return {};
  
  try {
    const products = await fetchProducts();
    const priceMap: Record<string, number> = {};
    
    products.forEach(product => {
      if (productIds.includes(product.id)) {
        priceMap[product.id] = Number(product.price);
      }
    });
    
    return priceMap;
  } catch (error) {
    console.error("Failed to fetch product prices:", error);
    return {};
  }
}