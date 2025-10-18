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
  const [sizeFormat, setSizeFormat] = useState<"US" | "UK">("US");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedGender, setSelectedGender] = useState<string>("all");
  const [shoes, setShoes] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

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
        setError(null);
        
        // Fetch all categories first
        const categoriesResponse = await productService.getCategories();
        const allCategories = categoriesResponse.data.categories;
        
        // Filter for shoe-related categories
        const shoeCategories = allCategories.filter(cat => 
          cat.name.toLowerCase().includes('shoe') || 
          cat.name.toLowerCase().includes('sneaker') ||
          cat.name.toLowerCase().includes('boot') ||
          cat.name.toLowerCase().includes('sandal') ||
          cat.name.toLowerCase().includes('slipper') ||
          cat.name.toLowerCase().includes('footwear')
        );
        
        setCategories(shoeCategories);

        // Fetch all products and then filter
        const productsResponse = await productService.getProducts({ 
          limit: 100,
          sort_by: 'created_at',
          sort_order: 'desc'
        });
        
        let filteredProducts = productsResponse.data.products;

        // Filter by shoe categories if we found any
        if (shoeCategories.length > 0) {
          filteredProducts = filteredProducts.filter(product =>
            shoeCategories.some(cat => cat.id === product.category?.id)
          );
        }

        // Apply gender filter if specified
        const genderFilter = searchParams.get('gender');
        if (genderFilter && ['male', 'female', 'unisex'].includes(genderFilter)) {
          filteredProducts = filteredProducts.filter(product => 
            product.gender === genderFilter
          );
        }

        // Apply category filter if specified
        if (selectedCategory !== 'all') {
          const categoryToFilter = shoeCategories.find(cat => cat.id === selectedCategory);
          if (categoryToFilter) {
            filteredProducts = filteredProducts.filter(product => 
              product.category?.id === categoryToFilter.id
            );
          }
        }
        
        setShoes(filteredProducts);
      } catch (err) {
        console.error('Failed to fetch shoes:', err);
        setError('Failed to load shoes. Please try again later.');
        
        // Try to get any products as fallback
        try {
          const fallbackResponse = await productService.getProducts({ limit: 20 });
          setShoes(fallbackResponse.data.products);
          setError(null); // Clear error if fallback works
        } catch (fallbackErr) {
          console.error('Fallback fetch also failed:', fallbackErr);
          setShoes([]); // Set empty array if everything fails
        }
      } finally {
        setLoading(false);
      }
    };

    fetchShoesAndCategories();
  }, [searchParams, selectedCategory]);

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
          <div className="bg-[hsl(var(--sidebar-background))] rounded-lg border border-border p-4 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/* Left Side - Product Count and Filters */}
              <div className="flex flex-wrap items-center gap-4 flex-1">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  Showing {shoes.length} products
                </span>
                <div className="h-4 w-px bg-border hidden lg:block"></div>
                
                {/* Category Filter */}
                <div className="min-w-[140px]">
                  <Select 
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger className="h-9">
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
                <div className="min-w-[130px]">
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
                    <SelectTrigger className="h-9">
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

                {/* Size Filter */}
                <div className="min-w-[120px]">
                  <Select
                    value={selectedSizes.length > 0 ? `${selectedSizes.length} size${selectedSizes.length > 1 ? 's' : ''}` : "Size"}
                    onValueChange={() => {}} // Handled in content
                  > 
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Size" /> Size
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-3 space-y-3">
                        {/* Size Format Toggle */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">Format:</span>
                          <div className="flex border border-border rounded overflow-hidden">
                            <Button
                              variant={sizeFormat === "US" ? "default" : "ghost"}
                              size="sm"
                              className="h-6 px-3 text-xs rounded-none"
                              onClick={() => setSizeFormat("US")}
                            >
                              US
                            </Button>
                            <Button
                              variant={sizeFormat === "UK" ? "default" : "ghost"}
                              size="sm"
                              className="h-6 px-3 text-xs rounded-none"
                              onClick={() => setSizeFormat("UK")}
                            >
                              UK
                            </Button>
                          </div>
                        </div>
                        
                        {/* Size Grid */}
                        <div className="grid grid-cols-3 gap-1">
                          {(sizeFormat === "US"
                            ? ["7", "8", "9", "10", "11", "12"]
                            : ["6", "7", "8", "9", "10", "11"]
                          ).map((size) => {
                            const isSelected = selectedSizes.includes(`${sizeFormat}-${size}`);
                            return (
                              <Button
                                key={size}
                                variant={isSelected ? "default" : "outline"}
                                size="sm"
                                className="h-8 text-xs"
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
                        
                        {/* Selected Sizes & Clear */}
                        {selectedSizes.length > 0 && (
                          <div className="pt-2 border-t border-border">
                            <div className="text-xs text-muted-foreground mb-2">
                              Selected: {selectedSizes.map((size) => size.split("-")[1]).join(", ")}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => setSelectedSizes([])}
                            >
                              Clear All
                            </Button>
                          </div>
                        )}
                      </div>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Right Side - Sort Control */}
              <div className="flex items-center">
                <Select defaultValue="featured">
                  <SelectTrigger className="w-40 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 bg-muted animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : error && shoes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Unable to load shoes. Please try again later.</p>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            
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
                  images={shoe.product_images?.map(img => ({
                    id: parseInt(img.id) || 0,
                    image_url: img.url, // Map 'url' from API to 'image_url' expected by ProductCard
                    alt_text: img.alt_text,
                    is_primary: img.is_primary,
                    sort_order: img.sort_order
                  })) || []}
                  category_name={shoe.category?.name}
                  category_id={shoe.category?.id}
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
