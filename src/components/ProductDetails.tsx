import React, { useState, useEffect } from "react";
import { X, Heart, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

interface ProductImage {
  id: number;
  image_url: string;
  alt_text?: string;
  is_primary: boolean;
  sort_order: number;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: string;
  stock_quantity: number;
  category_name?: string;
  brand: string;
  colors?: string[];
  sizes?: string[];
  images?: ProductImage[];
  is_featured: boolean;
  is_active: boolean;
  gender?: string;
}

interface ProductDetailsProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart(); // Changed from addToCart to addItem
  const { toast } = useToast();

  // Get the primary image or first available image (exactly like ProductCard)
  const getImageUrl = () => {
    // If no images array or empty, return placeholder
    if (
      !product.images ||
      !Array.isArray(product.images) ||
      product.images.length === 0
    ) {
      return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIGR5PSIuM2VtIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=";
    }

    // Find primary image or use first image
    const primaryImage = product.images.find((img) => img.is_primary);
    const imageToUse = primaryImage || product.images[0];

    if (!imageToUse || !imageToUse.image_url) {
      return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIGR5PSIuM2VtIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=";
    }

    const imageUrl = imageToUse.image_url;

    // If image URL is already absolute (starts with http), use it as is but fix the port
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      // Replace any localhost port with 8091 (current backend port)
      return imageUrl.replace(/localhost:\d+/, "localhost:8091");
    }

    // If image URL is relative, construct full URL
    if (imageUrl.startsWith("/")) {
      return imageUrl; // Let the proxy handle it
    }

    // If it's a relative path without leading slash, add one
    return `/${imageUrl}`;
  };

  // Get all images with proper URL processing (like ProductCard)
  const getProcessedImages = () => {
    if (
      !product.images ||
      !Array.isArray(product.images) ||
      product.images.length === 0
    ) {
      return [];
    }

    return product.images.map((img) => ({
      id: img.id,
      url: (() => {
        const imageUrl = img.image_url;

        // If image URL is already absolute (starts with http), use it as is but fix the port
        if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
          return imageUrl.replace(/localhost:\d+/, "localhost:8091");
        }

        // If image URL is relative, construct full URL
        if (imageUrl.startsWith("/")) {
          return imageUrl; // Let the proxy handle it
        }

        // If it's a relative path without leading slash, add one
        return `/${imageUrl}`;
      })(),
      alt_text: img.alt_text,
      is_primary: img.is_primary,
      sort_order: img.sort_order,
    }));
  };

  // Helper function to get primary image (like ProductCard)
  const getPrimaryImage = () => {
    const processedImages = getProcessedImages();
    if (processedImages.length === 0) return null;
    return processedImages.find((img) => img.is_primary) || processedImages[0];
  };

  // Helper function to sort images with primary first
  const getSortedImages = () => {
    const processedImages = getProcessedImages();
    if (processedImages.length === 0) return [];

    const primaryImage = processedImages.find((img) => img.is_primary);
    const otherImages = processedImages.filter((img) => !img.is_primary);

    if (primaryImage) {
      return [
        primaryImage,
        ...otherImages.sort((a, b) => a.sort_order - b.sort_order),
      ];
    }

    return processedImages.sort((a, b) => a.sort_order - b.sort_order);
  };

  // Reset selections when product changes
  useEffect(() => {
    setSelectedSize("");
    setSelectedColor("");
    setCurrentImageIndex(0);
    setQuantity(1);
    if (product.colors && product.colors.length > 0) {
      setSelectedColor(product.colors[0]);
    }

    // Debug logging to see what images are available (like ProductCard)
    if (process.env.NODE_ENV === "development") {
      console.log(`ProductDetails ${product.name}:`, {
        hasImages: product.images && product.images.length > 0,
        imageCount: product.images?.length || 0,
        firstImageUrl: product.images?.[0]?.image_url,
        processedImagesCount: getProcessedImages().length,
        primaryImageUrl: getPrimaryImage()?.url,
        sortedImagesCount: getSortedImages().length,
      });
    }
  }, [product]);

  const handleAddToCart = () => {
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast({
        title: "Size Required",
        description: "Please select a size before adding to cart",
        variant: "destructive",
      });
      return;
    }

    const primaryImage = getPrimaryImage();
    const cartItem = {
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      image: primaryImage?.url || "",
      category: product.category_name || "general", // Use category_name from Product interface
      size: selectedSize || undefined,
      color: selectedColor || undefined,
    };

    addItem(cartItem); // Changed from addToCart to addItem

    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart`,
    });
  };

  const nextImage = () => {
    const sortedImages = getSortedImages();
    if (sortedImages.length > 1) {
      setCurrentImageIndex((prev) =>
        prev === sortedImages.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    const sortedImages = getSortedImages();
    if (sortedImages.length > 1) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? sortedImages.length - 1 : prev - 1
      );
    }
  };

  const formatPrice = (price: string) => {
    return `KSh ${parseFloat(price).toLocaleString()}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Product Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
          {/* Images Section */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {(() => {
                const sortedImages = getSortedImages();
                // Debug: Modal render
                if (process.env.NODE_ENV === "development") {
                  console.log("DEBUG - Modal render:", {
                    sortedImagesLength: sortedImages.length,
                    currentImageIndex: currentImageIndex,
                    currentImage: sortedImages[currentImageIndex],
                  });
                }

                return sortedImages.length > 0 ? (
                  <>
                    <img
                      src={sortedImages[currentImageIndex].url}
                      alt={
                        sortedImages[currentImageIndex].alt_text || product.name
                      }
                      className="w-full h-full object-cover"
                      onLoad={() =>
                        console.log(
                          "Image loaded successfully:",
                          sortedImages[currentImageIndex].url
                        )
                      }
                      onError={(e) => {
                        console.log(
                          "Image failed to load:",
                          sortedImages[currentImageIndex].url
                        );
                        (e.target as HTMLImageElement).src =
                          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIGR5PSIuM2VtIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=";
                      }}
                    />

                    {/* Navigation arrows for multiple images */}
                    {sortedImages.length > 1 && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                          onClick={prevImage}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                          onClick={nextImage}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📸</div>
                      <p>No Image Available</p>
                      <p className="text-xs mt-2">
                        Debug:{" "}
                        {JSON.stringify({
                          hasImages: !!product.images,
                          imagesLength: product.images?.length || 0,
                          firstImageUrl: product.images?.[0]?.image_url,
                        })}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Thumbnail Images */}
            {(() => {
              const sortedImages = getSortedImages();
              return (
                sortedImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {sortedImages.map((image, index) => (
                      <button
                        key={image.id}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                          currentImageIndex === index
                            ? "border-blue-500"
                            : "border-gray-200"
                        }`}
                      >
                        <img
                          src={image.url}
                          alt={image.alt_text || `${product.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {/* Show primary badge on first image if it's primary */}
                        {index === 0 && image.is_primary && (
                          <div className="absolute -top-1 -right-1">
                            <span className="bg-blue-500 text-white text-xs px-1 py-0.5 rounded-full text-[10px]">
                              Primary
                            </span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )
              );
            })()}
          </div>

          {/* Product Info Section */}
          <div className="space-y-6">
            {/* Brand and Category */}
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{product.brand}</Badge>
              {product.category_name && (
                <Badge variant="outline">{product.category_name}</Badge>
              )}
              {product.gender && (
                <Badge variant="outline">{product.gender}</Badge>
              )}
            </div>

            {/* Product Name */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
            </div>

            {/* Price */}
            <div className="space-y-1">
              <div className="text-2xl font-bold text-gray-900">
                {formatPrice(product.price)}
              </div>
              <p className="text-sm text-gray-600">
                Sign up to Membership and get 10% off
              </p>
            </div>

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Color
                </h3>
                <div className="flex gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-3 py-1 text-sm border rounded-md ${
                        selectedColor === color
                          ? "border-black bg-black text-white"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900">Size</h3>
                  <button className="text-sm text-blue-600 hover:underline">
                    Size guide
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`p-2 text-sm border rounded-md text-center ${
                        selectedSize === size
                          ? "border-black bg-black text-white"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Quantity
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <span className="px-4 py-1 border rounded text-center min-w-[50px]">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setQuantity(Math.min(product.stock_quantity, quantity + 1))
                  }
                  disabled={quantity >= product.stock_quantity}
                >
                  +
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {product.stock_quantity} items available
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleAddToCart}
                className="w-full bg-black text-white hover:bg-gray-800"
                disabled={product.stock_quantity === 0}
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                {product.stock_quantity === 0 ? "Out of Stock" : "Add to Bag"}
              </Button>

              <Button variant="outline" className="w-full">
                <Heart className="h-4 w-4 mr-2" />
                Add to wishlist
              </Button>
            </div>

            {/* Notice */}
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-600">
                  Please allow additional days for personalised items to be
                  dispatched. Unfortunately, we can't offer returns for players
                  departures or number changes.
                </p>
              </CardContent>
            </Card>

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Description
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Product Features */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Product Details
              </h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Brand: {product.brand}</li>
                {product.category_name && (
                  <li>• Category: {product.category_name}</li>
                )}
                {product.gender && <li>• Gender: {product.gender}</li>}
                {product.colors && product.colors.length > 0 && (
                  <li>• Available Colors: {product.colors.join(", ")}</li>
                )}
                {product.sizes && product.sizes.length > 0 && (
                  <li>• Available Sizes: {product.sizes.join(", ")}</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
