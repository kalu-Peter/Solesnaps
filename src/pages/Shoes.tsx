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
  const [priceRange, setPriceRange] = useState([0, 5000]);
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
      price: "$89.99",
      category: "Shoes",
      image: shoe1,
    },
    {
      id: 202,
      name: "Urban Classic",
      price: "$79.99",
      category: "Shoes",
      image: shoe2,
    },
    {
      id: 203,
      name: "Air Max Elite",
      price: "$129.99",
      category: "Shoes",
      image: shoe1,
    },
    {
      id: 204,
      name: "Street Walker",
      price: "$95.99",
      category: "Shoes",
      image: shoe2,
    },
    {
      id: 205,
      name: "Performance Runner",
      price: "$159.99",
      category: "Shoes",
      image: shoe1,
    },
    {
      id: 206,
      name: "Casual Comfort",
      price: "$69.99",
      category: "Shoes",
      image: shoe2,
    },
    {
      id: 207,
      name: "Trail Explorer",
      price: "$189.99",
      category: "Shoes",
      image: shoe1,
    },
    {
      id: 208,
      name: "City Sprint",
      price: "$99.99",
      category: "Shoes",
      image: shoe2,
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

      {/* Filters and Products */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <div className="lg:w-64 flex-shrink-0">
              <div className=" bg-[hsl(var(--sidebar-background))] rounded-lg border border-border p-6 sticky top-24">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </h3>

                {/* Category */}
                <div className="mb-6">
                  <h4 className="font-medium text-foreground mb-3">Category</h4>
                  <Select defaultValue="all">
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Shoes</SelectItem>
                      <SelectItem value="lifestyle">Lifestyle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Gender */}
                <div className="mb-6">
                  <h4 className="font-medium text-foreground mb-3">Gender</h4>
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
                <div className="mb-6">
                  <h4 className="font-medium text-foreground mb-3">
                    Price Range
                  </h4>
                  <div className="px-2">
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={5000}
                      min={0}
                      step={100}
                      className="mb-3"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>KES {priceRange[0]}</span>
                      <span>KES {priceRange[1]}</span>
                    </div>
                  </div>
                </div>

                {/* Size */}
                <div className="mb-6">
                  <h4 className="font-medium text-foreground mb-3">Size</h4>

                  {/* Size Format Selector */}
                  <div className="mb-3">
                    <Select
                      value={sizeFormat}
                      onValueChange={(value: "US" | "UK") =>
                        setSizeFormat(value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US">US Sizes</SelectItem>
                        <SelectItem value="UK">UK Sizes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Size Grid */}
                  <div className="grid grid-cols-3 gap-2">
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
                          className="h-10"
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

                  {/* Size Conversion Info */}
                  <div className="mt-2 text-xs text-muted-foreground">
                    {sizeFormat === "US" ? "US sizing" : "UK sizing"}
                    {selectedSizes.length > 0 && (
                      <div className="mt-1">
                        Selected:{" "}
                        {selectedSizes
                          .map((size) => size.split("-")[1])
                          .join(", ")}
                      </div>
                    )}
                  </div>

                  {/* Size Conversion Chart */}
                  <Collapsible className="mt-3">
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start p-0 h-auto text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Info className="h-3 w-3 mr-1" />
                        Size Conversion Chart
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <div className="text-xs bg-muted/20 rounded p-2">
                        <div className="grid grid-cols-2 gap-1 font-medium border-b pb-1 mb-1">
                          <span>US</span>
                          <span>UK</span>
                        </div>
                        {[
                          ["7", "6"],
                          ["8", "7"],
                          ["9", "8"],
                          ["10", "9"],
                          ["11", "10"],
                          ["12", "11"],
                        ].map(([us, uk]) => (
                          <div key={us} className="grid grid-cols-2 gap-1">
                            <span>{us}</span>
                            <span>{uk}</span>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </div>
            </div>

            {/* Products Section */}
            <div className="flex-1">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-6 p-4 rounded-lg bg-[hsl(var(--sidebar-background))] border border-border">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    Showing {shoes.length} products
                  </span>
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

                  <div className="flex border border-border rounded-md">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
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
                    <ProductCard key={shoe.id} {...shoe} />
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
          </div>
        </div>
      </section>
    </div>
  );
};

export default Shoes;
