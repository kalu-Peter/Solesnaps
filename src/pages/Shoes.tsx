import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import shoe1 from "@/assets/shoe-1.jpg";
import shoe2 from "@/assets/shoe-2.jpg";
import { Filter, Grid, List, Info } from "lucide-react";
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
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sizeFormat, setSizeFormat] = useState<"US" | "UK">("US");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedGender, setSelectedGender] = useState<string>("all");
  const [shoes, setShoes] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);

  // Fallback shoes data for when API is not available
  const fallbackShoes = [
    {
      id: 201,
      name: "Sport Runner Pro",
      description: "High-performance running shoe",
      price: "11500.00",
      stock_quantity: 25,
      brand: "Nike",
      colors: ["Black", "White"],
      sizes: ["8", "9", "10", "11"],
      images: [{ id: 1, image_url: shoe1, alt_text: "Sport Runner Pro", is_primary: true, sort_order: 0 }],
      category_name: "Shoes",
      category_id: 1,
      is_featured: true,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 202,
      name: "Urban Classic",
      description: "Stylish casual shoe",
      price: "10200.00",
      stock_quantity: 30,
      brand: "Adidas",
      colors: ["Brown", "Tan"],
      sizes: ["7", "8", "9", "10"],
      images: [{ id: 2, image_url: shoe2, alt_text: "Urban Classic", is_primary: true, sort_order: 0 }],
      category_name: "Shoes",
      category_id: 1,
      is_featured: true,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 203,
      name: "Air Max Elite",
      description: "Premium athletic shoe",
      price: "16600.00",
      stock_quantity: 20,
      brand: "Nike",
      colors: ["White", "Blue"],
      sizes: ["8", "9", "10", "11", "12"],
      images: [{ id: 3, image_url: shoe1, alt_text: "Air Max Elite", is_primary: true, sort_order: 0 }],
      category_name: "Shoes",
      category_id: 1,
      is_featured: true,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 204,
      name: "Street Walker",
      description: "Urban style sneaker",
      price: "12300.00",
      stock_quantity: 15,
      brand: "Puma",
      colors: ["Black", "Gray"],
      sizes: ["7", "8", "9", "10"],
      images: [{ id: 4, image_url: shoe2, alt_text: "Street Walker", is_primary: true, sort_order: 0 }],
      category_name: "Shoes",
      category_id: 1,
      is_featured: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 205,
      name: "Performance Runner",
      description: "Professional running shoe",
      price: "20500.00",
      stock_quantity: 12,
      brand: "Asics",
      colors: ["Blue", "Yellow"],
      sizes: ["8", "9", "10", "11", "12"],
      images: [{ id: 5, image_url: shoe1, alt_text: "Performance Runner", is_primary: true, sort_order: 0 }],
      category_name: "Shoes",
      category_id: 1,
      is_featured: true,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 206,
      name: "Casual Comfort",
      description: "Everyday comfort shoe",
      price: "8900.00",
      stock_quantity: 35,
      brand: "Sketchers",
      colors: ["Brown", "Black"],
      sizes: ["7", "8", "9", "10", "11"],
      images: [{ id: 6, image_url: shoe2, alt_text: "Casual Comfort", is_primary: true, sort_order: 0 }],
      category_name: "Shoes",
      category_id: 1,
      is_featured: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 207,
      name: "Trail Explorer",
      description: "Outdoor hiking shoe",
      price: "24300.00",
      stock_quantity: 8,
      brand: "Merrill",
      colors: ["Green", "Brown"],
      sizes: ["8", "9", "10", "11", "12"],
      images: [{ id: 7, image_url: shoe1, alt_text: "Trail Explorer", is_primary: true, sort_order: 0 }],
      category_name: "Shoes",
      category_id: 1,
      is_featured: true,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 208,
      name: "City Sprint",
      description: "Urban running shoe",
      price: "12800.00",
      stock_quantity: 18,
      brand: "New Balance",
      colors: ["White", "Red"],
      sizes: ["7", "8", "9", "10", "11"],
      images: [{ id: 8, image_url: shoe2, alt_text: "City Sprint", is_primary: true, sort_order: 0 }],
      category_name: "Shoes",
      category_id: 1,
      is_featured: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  // Handle URL parameters for gender filtering
  useEffect(() => {
    const genderParam = searchParams.get('gender');
    if (genderParam && ['male', 'female', 'unisex'].includes(genderParam)) {
      setSelectedGender(genderParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchShoesAndCategories = async () => {
      try {
        setLoading(true);
        
        // Fetch categories to filter for shoe-related categories
        const categoriesResponse = await productService.getCategories();
        const allCategories = categoriesResponse.data.categories;
        
        // Filter for shoe-related categories (you can adjust this logic)
        const shoeCategories = allCategories.filter(cat => 
          cat.name.toLowerCase().includes('shoe') || 
          cat.name.toLowerCase().includes('sneaker') ||
          cat.name.toLowerCase().includes('boot') ||
          cat.name.toLowerCase().includes('sandal') ||
          cat.name.toLowerCase().includes('slipper')
        );
        
        setCategories(shoeCategories);

        // If we have shoe categories, fetch products from those categories
        if (shoeCategories.length > 0) {
          // For now, we'll fetch all products and filter on frontend
          // In the future, you can modify the API to accept multiple categories
          const productsResponse = await productService.getProducts({ 
            limit: 50,
            sort_by: 'created_at',
            sort_order: 'desc'
          });
          
          // Filter products that belong to shoe categories
          let shoeProducts = productsResponse.data.products.filter(product =>
            shoeCategories.some(cat => cat.id === product.category_id)
          );

          // Apply gender filter if specified
          const genderFilter = searchParams.get('gender');
          if (genderFilter && ['male', 'female', 'unisex'].includes(genderFilter)) {
            shoeProducts = shoeProducts.filter(product => 
              product.gender === genderFilter
            );
          }
          
          setShoes(shoeProducts.length > 0 ? shoeProducts : fallbackShoes as any);
        } else {
          // If no specific shoe categories found, use fallback
          setShoes(fallbackShoes as any);
        }
      } catch (err) {
        console.error('Failed to fetch shoes:', err);
        setError('Failed to load shoes');
        setShoes(fallbackShoes as any);
      } finally {
        setLoading(false);
      }
    };

    fetchShoesAndCategories();
  }, [searchParams]);

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
          <div className="bg-[hsl(var(--sidebar-background))] rounded-lg border border-border p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  Showing {shoes.length} products
                </span>
                <div className="h-4 w-px bg-border"></div>
              </div>

              <div className="flex items-center gap-4">
                <Select defaultValue="featured">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="price-low">
                      Price: Low to High
                    </SelectItem>
                    <SelectItem value="price-high">
                      Price: High to Low
                    </SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            

            {/* Filters Row */}
            

              {/* Gender */}
              <div>
                {/*<h4 className="font-medium text-foreground mb-2 text-sm">Gender</h4>*/}
                <Select 
                  value={selectedGender}
                  onValueChange={(value) => {
                    setSelectedGender(value);
                    if (value === "all") {
                      searchParams.delete('gender');
                    } else {
                      searchParams.set('gender', value);
                    }
                    setSearchParams(searchParams);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genders</SelectItem>
                    <SelectItem value="male">Men's</SelectItem>
                    <SelectItem value="female">Women's</SelectItem>
                    <SelectItem value="unisex">Unisex</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              {/*<div>
                <h4 className="font-medium text-foreground mb-2 text-sm">
                  Price Range
                </h4>
                <div className="px-2">
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={50000}
                    min={0}
                    step={1000}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>KES {priceRange[0].toLocaleString()}</span>
                    <span>KES {priceRange[1].toLocaleString()}</span>
                  </div>
                </div>
              </div>*/}

              {/* Size */}
              <div>
                {/*<h4 className="font-medium text-foreground mb-2 text-sm">Size</h4>*/}
                <div className="space-y-2">
                  <Select
                    value={sizeFormat}
                    onValueChange={(value: "US" | "UK") =>
                      setSizeFormat(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">US Sizes</SelectItem>
                      <SelectItem value="UK">UK Sizes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Size Selection Row */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex flex-wrap gap-2">
                {(sizeFormat === "US"
                  ? ["7", "8", "9", "10", "11", "12"]
                  : ["6", "7", "8", "9", "10", "11"]
                ).map((size) => {
                  const isSelected = selectedSizes.includes(
                    `${sizeFormat}-${size}`
                  );
                  return (
                    <Button
                      key={size}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className="h-8 w-12"
                      onClick={() => {
                        const sizeKey = `${sizeFormat}-${size}`;
                        setSelectedSizes((prev) =>
                          isSelected
                            ? prev.filter((s) => s !== sizeKey)
                            : [...prev, sizeKey]
                        );
                      }}
                    >
                      {size}
                    </Button>
                  );
                })}
              </div>
              {selectedSizes.length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Selected sizes: {selectedSizes
                    .map((size) => size.split("-")[1])
                    .join(", ")}
                </div>
              )}
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className={`grid gap-6 ${
              viewMode === "grid"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1"
            }`}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 bg-muted animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : error && shoes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Unable to load shoes. Please try again later.</p>
            </div>
          ) : (
            <div
              className={`grid gap-6 ${
                viewMode === "grid"
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-1"
              }`}
            >
              {shoes.map((shoe) => (
                <ProductCard 
                  key={shoe.id}
                  id={shoe.id}
                  name={shoe.name}
                  description={shoe.description}
                  price={shoe.price}
                  stock_quantity={shoe.stock_quantity}
                  brand={shoe.brand}
                  colors={typeof shoe.colors === 'string' ? shoe.colors.split(' ') : shoe.colors}
                  sizes={typeof shoe.sizes === 'string' ? shoe.sizes.split(' ') : shoe.sizes}
                  images={Array.isArray(shoe.images) ? shoe.images : []}
                  category_name={shoe.category_name}
                  category_id={shoe.category_id}
                  is_featured={shoe.is_featured}
                  is_active={shoe.is_active}
                  created_at={shoe.created_at}
                  updated_at={shoe.updated_at}
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
    </div>
  );
};

export default Shoes;
