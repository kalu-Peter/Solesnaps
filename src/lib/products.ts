export interface Product {
  id: number;
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
  const res = await fetch("/api/products");
  if (!res.ok) throw new Error("Failed to fetch products");
  const data = await res.json();
  return data.data.products;
}

export async function fetchProductById(id: number): Promise<Product> {
  const res = await fetch(`/api/products/${id}`);
  if (!res.ok) throw new Error("Failed to fetch product");
  const data = await res.json();
  return data.data.product;
}

export async function fetchProductPrices(productIds: number[]): Promise<Record<number, number>> {
  if (productIds.length === 0) return {};
  
  try {
    const products = await fetchProducts();
    const priceMap: Record<number, number> = {};
    
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