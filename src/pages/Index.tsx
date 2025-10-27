import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import ProductDetails from "@/components/ProductDetails";
import HeroCarousel from "@/components/HeroCarousel";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Package, Shield, Truck } from "lucide-react";
import wowmenImg from "@/assets/wowmen.jpeg";
import uniImg from "@/assets/uni.jpeg";
import ladiesImg from "@/assets/ladies.jpeg";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { productService, Product } from "@/services/productService";

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductDetailsOpen, setIsProductDetailsOpen] = useState(false);
  const navigate = useNavigate();

  const handleGenderFilter = (gender: string) => {
    navigate(`/shoes?gender=${gender}`);
  };

  const handleProductClick = (product: Product) => {
    console.log("DEBUG - Product clicked in Index:", {
      name: product.name,
      hasProductImages: !!product.product_images,
      productImagesCount: product.product_images?.length || 0,
      productImagesRaw: product.product_images,
      hasImages: !!product.images,
      imagesCount: Array.isArray(product.images) ? product.images.length : 0,
      imagesRaw: product.images,
    });
    setSelectedProduct(product);
    setIsProductDetailsOpen(true);
  };

  const handleCloseProductDetails = () => {
    setIsProductDetailsOpen(false);
    setSelectedProduct(null);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Try to fetch featured products first, fallback to all products
        const response = await productService.getFeaturedProducts(8);

        if (response.data.products.length === 0) {
          // If no featured products, get latest products
          const allProductsResponse = await productService.getProducts({
            limit: 8,
            sort_by: "created_at",
            sort_order: "desc",
          });
          console.log(
            "DEBUG - Using all products from API:",
            allProductsResponse.data.products
          );
          setProducts(allProductsResponse.data.products);
        } else {
          console.log(
            "DEBUG - Using featured products from API:",
            response.data.products
          );
          setProducts(response.data.products);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError("Failed to load products");
        setProducts([]); // No fallback products, just empty array
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Carousel */}
      <HeroCarousel onShopNow={() => navigate("/shoes")} />

      {/* Features */}
      <section className="py-8 sm:py-12 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="h-12 w-12 rounded-full bg-black flex items-center justify-center mx-auto sm:mx-0">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Free Shipping</h3>
                <p className="text-sm text-muted-foreground">
                  On orders over KES 5000
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="h-12 w-12 rounded-full bg-black flex items-center justify-center mx-auto sm:mx-0">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Secure Payment
                </h3>
                <p className="text-sm text-muted-foreground">100% protected</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-center sm:text-left sm:col-span-2 md:col-span-1">
              <div className="h-12 w-12 rounded-full bg-black flex items-center justify-center mx-auto sm:mx-0">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Easy Returns</h3>
                <p className="text-sm text-muted-foreground">
                  30-day guarantee
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 sm:mb-12 text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
              Featured Products
            </h2>
          </div>

          {loading ? (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-64 bg-muted animate-pulse rounded-lg"
                ></div>
              ))}
            </div>
          ) : error && products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Unable to load products. Please try again later.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  description={product.description}
                  price={product.price.toString()}
                  stock_quantity={product.stock_quantity}
                  brand={product.brand}
                  colors={Array.isArray(product.colors) ? product.colors : []}
                  sizes={Array.isArray(product.sizes) ? product.sizes : []}
                  images={
                    product.product_images?.map((img) => ({
                      id: parseInt(img.id) || 0,
                      image_url: img.url, // Map 'url' from API to 'image_url' expected by ProductCard
                      alt_text: img.alt_text,
                      is_primary: img.is_primary,
                      sort_order: img.sort_order,
                    })) || []
                  }
                  category_name={product.category_name}
                  category_id={product.category_id}
                  is_featured={product.is_featured}
                  is_active={product.is_active}
                  created_at={product.created_at}
                  updated_at={product.updated_at}
                  gender={product.gender}
                  onProductClick={handleProductClick}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Shop by Gender */}
      <section className="py-12 sm:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="mb-8 sm:mb-12 text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
              Shop by Gender
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Male Shoes */}
            <div
              className="group relative h-64 sm:h-80 overflow-hidden rounded-2xl shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-all duration-300 cursor-pointer sm:col-span-2 md:col-span-1"
              onClick={() => handleGenderFilter("male")}
            >
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${ladiesImg})` }}
              />
              <div className="absolute inset-0 bg-black/30" />
              <div className="relative h-full flex flex-col items-center justify-center text-white p-6 sm:p-8">
                {/* icon removed per request */}
                <h3 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
                  Men's
                </h3>
                <p className="text-white/90 mb-4 sm:mb-6 text-center text-sm sm:text-base">
                  Strong & Stylish
                </p>
                <Button
                  variant="secondary"
                  size="lg"
                  className="group-hover:scale-105 transition-transform text-sm sm:text-base"
                >
                  Shop Men's
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Female Shoes */}
            <div
              className="group relative h-64 sm:h-80 overflow-hidden rounded-2xl shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-all duration-300 cursor-pointer"
              onClick={() => handleGenderFilter("female")}
            >
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${wowmenImg})` }}
              />
              <div className="absolute inset-0 bg-black/30" />
              <div className="relative h-full flex flex-col items-center justify-center text-white p-6 sm:p-8">
                {/* icon removed per request */}
                <h3 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
                  Women's
                </h3>
                <p className="text-white/90 mb-4 sm:mb-6 text-center text-sm sm:text-base">
                  Elegant & Chic
                </p>
                <Button
                  variant="secondary"
                  size="lg"
                  className="group-hover:scale-105 transition-transform text-sm sm:text-base"
                >
                  Shop Women's
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Unisex Shoes */}
            <div
              className="group relative h-64 sm:h-80 overflow-hidden rounded-2xl shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-all duration-300 cursor-pointer"
              onClick={() => handleGenderFilter("unisex")}
            >
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${uniImg})` }}
              />
              <div className="absolute inset-0 bg-black/30" />
              <div className="relative h-full flex flex-col items-center justify-center text-white p-6 sm:p-8">
                {/* icon removed per request */}
                <h3 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
                  Unisex
                </h3>
                <p className="text-white/90 mb-4 sm:mb-6 text-center text-sm sm:text-base">
                  For Everyone
                </p>
                <Button
                  variant="secondary"
                  size="lg"
                  className="group-hover:scale-105 transition-transform text-sm sm:text-base"
                >
                  Shop Unisex
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer is now global via GlobalFooter component */}

      {/* Product Details Modal */}
      {selectedProduct && (
        <ProductDetails
          product={{
            ...selectedProduct,
            price: String(selectedProduct.price), // Convert number to string
            images:
              selectedProduct.images && Array.isArray(selectedProduct.images)
                ? selectedProduct.images.map((img: any) => ({
                    id: img.id || 0,
                    image_url: img.url || img.image_url, // Handle transformed images from ProductCard
                    alt_text: img.alt_text,
                    is_primary: img.is_primary,
                    sort_order: img.sort_order,
                  }))
                : selectedProduct.product_images?.map((img: any) => ({
                    id: parseInt(img.id) || 0,
                    image_url: img.url || img.image_url, // Handle API response
                    alt_text: img.alt_text,
                    is_primary: img.is_primary,
                    sort_order: img.sort_order,
                  })) || [],
          }}
          isOpen={isProductDetailsOpen}
          onClose={handleCloseProductDetails}
        />
      )}
    </div>
  );
};

export default Index;
