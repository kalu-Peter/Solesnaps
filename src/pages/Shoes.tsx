import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import ProductDetails from "@/components/ProductDetails";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import shoe1 from "@/assets/shoe-1.jpg";
import shoe2 from "@/assets/shoe-2.jpg";
import { Filter, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { productService, Product } from "@/services/productService";

const Shoes = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductDetailsOpen, setIsProductDetailsOpen] = useState(false);
  const [selectedGender, setSelectedGender] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recommended");
  const [shoes, setShoes] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Handle URL parameters for gender filtering
  useEffect(() => {
    const genderParam = searchParams.get("gender");
    if (genderParam && ["male", "female", "unisex"].includes(genderParam)) {
      setSelectedGender(genderParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchShoesAndCategories = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all categories first
        const categoriesResponse = await productService.getCategories();
        const allCategories = categoriesResponse.data.categories;

        // Filter for shoe-related categories
        const shoeCategories = allCategories.filter((cat) => {
          const name = cat.name.toLowerCase();
          return (
            name.includes("shoe") ||
            name.includes("sneaker") ||
            name.includes("boot") ||
            name.includes("sandal") ||
            name.includes("slipper") ||
            name.includes("footwear")
          );
        });

        setCategories(shoeCategories);

        // Fetch all products and then filter
        const productsResponse = await productService.getProducts({
          limit: 100,
          sort_by: "created_at",
          sort_order: "desc",
        });

        let filteredProducts = productsResponse.data.products;

        // Filter by shoe categories if we found any, otherwise show all products
        if (shoeCategories.length > 0) {
          filteredProducts = filteredProducts.filter((product) =>
            shoeCategories.some(
              (cat) =>
                cat.id === (product.categories?.id || product.category?.id)
            )
          );
        } else {
          // If no shoe categories found, show all products for better user experience
        }

        // Apply gender filter if specified
        const genderFilter = searchParams.get("gender");
        if (
          genderFilter &&
          ["male", "female", "unisex"].includes(genderFilter)
        ) {
          filteredProducts = filteredProducts.filter(
            (product) => product.gender === genderFilter
          );
        }

        // Apply category filter if specified
        if (selectedCategory !== "all") {
          const categoryToFilter = shoeCategories.find(
            (cat) => cat.id === selectedCategory
          );
          if (categoryToFilter) {
            filteredProducts = filteredProducts.filter(
              (product) =>
                (product.categories?.id || product.category?.id) ===
                categoryToFilter.id
            );
          }
        }

        // Apply sorting to filtered products
        const sortedProducts = sortProducts(filteredProducts, sortBy);
        setShoes(sortedProducts);
      } catch (err) {
        console.error("Failed to fetch shoes:", err);
        setError("Failed to load shoes. Please try again later.");

        // Try to get any products as fallback
        try {
          const fallbackResponse = await productService.getProducts({
            limit: 20,
          });
          setShoes(fallbackResponse.data.products);
          setError(null); // Clear error if fallback works
        } catch (fallbackErr) {
          console.error("Fallback fetch also failed:", fallbackErr);
          setShoes([]); // Set empty array if everything fails
        }
      } finally {
        setLoading(false);
      }
    };

    fetchShoesAndCategories();
  }, [searchParams, selectedCategory, sortBy]);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsProductDetailsOpen(true);
  };

  const handleCloseProductDetails = () => {
    setIsProductDetailsOpen(false);
    setSelectedProduct(null);
  };

  // Function to sort products based on selected criteria
  const sortProducts = (
    products: Product[],
    sortCriteria: string
  ): Product[] => {
    const sorted = [...products];
    switch (sortCriteria) {
      case "recommended":
        // Show featured products first, then by creation date
        return sorted.sort((a, b) => {
          if (a.is_featured && !b.is_featured) return -1;
          if (!a.is_featured && b.is_featured) return 1;
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        });
      case "price-low":
        return sorted.sort((a, b) => a.price - b.price);
      case "price-high":
        return sorted.sort((a, b) => b.price - a.price);
      default:
        return sorted;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Page Header */}
      <section className="py-16 bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Premium Shoes Collection
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Step into comfort and style with our curated selection of
            high-quality footwear for every occasion.
          </p>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* Filters Toolbar */}
          <div className="bg-[hsl(var(--sidebar-background))] rounded-lg border border-border p-3 sm:p-4 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 sm:gap-4">
              {/* Left Side - Product Count and Filters */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 flex-1">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  Showing {shoes.length} products
                </span>
                <div className="h-4 w-px bg-border hidden lg:block"></div>

                {/* Category Filter */}
                <div className="min-w-[100px] sm:min-w-[140px]">
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Gender Filter */}
                <div className="min-w-[90px] sm:min-w-[130px]">
                  <Select
                    value={selectedGender}
                    onValueChange={(value) => {
                      setSelectedGender(value);
                      if (value === "all") {
                        searchParams.delete("gender");
                      } else {
                        searchParams.set("gender", value);
                      }
                      setSearchParams(searchParams);
                    }}
                  >
                    <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                      <SelectValue placeholder="Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Genders</SelectItem>
                      <SelectItem value="male">Men's</SelectItem>
                      <SelectItem value="female">Women's</SelectItem>
                      <SelectItem value="unisex">Unisex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Right Side - Sort Control */}
              <div className="flex items-center">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32 sm:w-40 h-8 sm:h-9 text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recommended">Recommended</SelectItem>
                    <SelectItem value="price-low">
                      Price: Low to High
                    </SelectItem>
                    <SelectItem value="price-high">
                      Price: High to Low
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-64 bg-muted animate-pulse rounded-lg"
                ></div>
              ))}
            </div>
          ) : error && shoes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Unable to load shoes. Please try again later.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {shoes.map((shoe) => (
                <ProductCard
                  key={shoe.id}
                  id={shoe.id}
                  name={shoe.name}
                  description={shoe.description}
                  price={shoe.price.toString()}
                  stock_quantity={shoe.stock_quantity}
                  brand={shoe.brand}
                  colors={Array.isArray(shoe.colors) ? shoe.colors : []}
                  sizes={Array.isArray(shoe.sizes) ? shoe.sizes : []}
                  images={
                    shoe.product_images?.map((img) => ({
                      id: parseInt(img.id) || 0,
                      image_url: img.url, // Map 'url' from API to 'image_url' expected by ProductCard
                      alt_text: img.alt_text,
                      is_primary: img.is_primary,
                      sort_order: img.sort_order,
                    })) || []
                  }
                  category_name={shoe.categories?.name || shoe.category?.name}
                  category_id={shoe.categories?.id || shoe.category?.id}
                  is_featured={shoe.is_featured}
                  is_active={shoe.is_active}
                  created_at={shoe.created_at}
                  updated_at={shoe.updated_at}
                  onProductClick={handleProductClick}
                />
              ))}
            </div>
          )}

          {/* Load More */}
          {!loading && shoes.length > 0 && (
            <div className="text-center mt-12">
              <Button variant="outline" size="lg">
                Load More Products
              </Button>
            </div>
          )}
        </div>
      </section>

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

export default Shoes;
