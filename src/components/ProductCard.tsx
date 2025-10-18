import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { ShoppingCart, Check } from "lucide-react";
import { useState } from "react";

interface ProductCardProps {
  id: number | string;
  name: string;
  description?: string;
  price: string;
  stock_quantity: number;
  brand: string;
  colors?: string[];
  sizes?: string[];
  images?: Array<{
    id: number;
    image_url: string;
    alt_text?: string;
    is_primary: boolean;
    sort_order: number;
  }>;
  category_name?: string;
  category_id?: number | string;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Legacy props for backward compatibility
  image?: string;
  originalPrice?: string;
  category?: string;
}

export default function ProductCard(props: ProductCardProps) {
  const { addItem } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  // Extract and transform props to handle both API and legacy data
  const {
    id,
    name,
    price,
    brand,
    images,
    category_name,
    image: legacyImage,
    originalPrice,
    category: legacyCategory
  } = props;

  // Get the primary image or first available image
  const getImageUrl = () => {
    // If legacy image is provided, use it
    if (legacyImage) return legacyImage;
    
    // If no images array or empty, return placeholder
    if (!images || !Array.isArray(images) || images.length === 0) {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIGR5PSIuM2VtIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
    }
    
    // Find primary image or use first image
    const primaryImage = images.find(img => img.is_primary);
    const imageToUse = primaryImage || images[0];
    
    if (!imageToUse || !imageToUse.image_url) {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIGR5PSIuM2VtIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
    }
    
    const imageUrl = imageToUse.image_url;
    
    // If image URL is already absolute (starts with http), use it as is but fix the port
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      // Replace any localhost port with 8080 (current backend port)
      return imageUrl.replace(/localhost:\d+/, 'localhost:8080');
    }
    
    // If image URL is relative, construct full URL
    if (imageUrl.startsWith('/')) {
      return imageUrl; // Let the proxy handle it
    }
    
    // If it's a relative path without leading slash, add one
    return `/${imageUrl}`;
  };

  const displayImage = getImageUrl();

  // Debug logging for image URLs (can remove later)
  if (process.env.NODE_ENV === 'development') {
    console.log(`Product ${name}:`, {
      hasImages: images && images.length > 0,
      imageCount: images?.length || 0,
      firstImageUrl: images?.[0]?.image_url,
      displayImage
    });
  }

  // Use category_name from API or fallback to legacy category
  const displayCategory = category_name || legacyCategory || brand;

  // Format price to KES currency
  const formatPrice = (priceValue: string | number) => {
    const numericPrice = typeof priceValue === 'string' ? parseFloat(priceValue.replace(/[^0-9.]/g, '')) : priceValue;
    return `KES ${numericPrice.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const displayPrice = formatPrice(price);

  const handleAddToCart = () => {
    // Parse the numeric price for the cart
    const numericPrice = typeof price === 'string' ? parseFloat(price.replace(/[^0-9.]/g, '')) : price;
    const numericOriginalPrice = originalPrice ? parseFloat(originalPrice.replace(/[^0-9.]/g, '')) : undefined;
    
    addItem({
      id: typeof id === 'string' ? parseInt(id.replace(/[^0-9]/g, '')) || Math.random() * 1000000 : id,
      name,
      price: numericPrice,
      originalPrice: numericOriginalPrice,
      image: displayImage,
      category: displayCategory,
    });

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <Card className="group overflow-hidden border-border hover:shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1">
      <CardContent className="p-0">
        <div className="aspect-square overflow-hidden bg-muted">
          <img
            src={displayImage}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-4 space-y-3">
          <p className="text-xs text-muted uppercase tracking-wider">
            {displayCategory}
          </p>
          <h3 className="font-semibold text-lg text-muted-foreground">
            {name}
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-primary">{displayPrice}</span>
              {originalPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  {originalPrice}
                </span>
              )}
            </div>
            <Button
              size="icon"
              className={`rounded-full transition-all duration-300 ${
                isAdded
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-primary hover:bg-accent"
              }`}
              onClick={handleAddToCart}
              disabled={isAdded}
            >
              {isAdded ? (
                <Check className="h-4 w-4" />
              ) : (
                <ShoppingCart className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
