import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Sparkles, Clock, Grid, List, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { productService, Product } from "@/services/productService";

const NewArrivals = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [sortedProducts, setSortedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("newest");

  // Function to calculate arrival date display
  const getArrivalDate = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day ago";
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 14) return `${Math.ceil(diffDays / 7)} week${diffDays > 7 ? 's' : ''} ago`;
    return "Recently added";
  };

  // Sort products based on selected criteria
  const sortProducts = (products: Product[], sortCriteria: string): Product[] => {
    const sorted = [...products];
    switch (sortCriteria) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'price-low':
        return sorted.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      case 'price-high':
        return sorted.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
      case 'category':
        return sorted.sort((a, b) => (a.category_name || '').localeCompare(b.category_name || ''));
      default:
        return sorted;
    }
  };

  // Fetch new arrivals from API
  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await productService.getNewArrivals(20);
        setNewProducts(response.data.products);
      } catch (err) {
        console.error('Failed to fetch new arrivals:', err);
        setError('Failed to load new arrivals. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchNewArrivals();
  }, []);

  // Sort products when sortBy or newProducts change
  useEffect(() => {
    setSortedProducts(sortProducts(newProducts, sortBy));
  }, [newProducts, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Page Header */}
      <section className="py-16 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="h-8 w-8 text-primary animate-pulse" />
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                New Arrivals
              </h1>
              <Sparkles className="h-8 w-8 text-accent animate-pulse" />
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Be the first to get your hands on our latest collection. Fresh
              styles, cutting-edge technology, and premium quality.
            </p>
            <div className="mt-6">
              <Badge variant="secondary" className="text-sm px-4 py-2">
                <Clock className="h-4 w-4 mr-2" />
                Updated Daily
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* New Arrivals Highlight */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl p-8 mb-8 border border-border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  Latest Trends
                </h3>
                <p className="text-sm text-muted-foreground">
                  Stay ahead with the newest fashion and tech
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mb-3">
                  <Star className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  Premium Quality
                </h3>
                <p className="text-sm text-muted-foreground">
                  Carefully curated for excellence
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  Limited Time
                </h3>
                <p className="text-sm text-muted-foreground">
                  Get them before they're gone
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* Enhanced Toolbar with Filters */}
          <div className="bg-[hsl(var(--sidebar-background))] rounded-lg border border-border p-4 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  Showing {sortedProducts.length} new products
                </span>
                <Badge variant="outline" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Fresh Stock
                </Badge>
              </div>

              <div className="flex items-center gap-4">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="category">By Category</SelectItem>
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

            {/* Category Filters Row */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
              <Button variant="default" size="sm">
                All Categories
              </Button>
              <Button variant="outline" size="sm">
                Shoes
              </Button>
              <Button variant="outline" size="sm">
                This Week
              </Button>
              <Button variant="outline" size="sm">
                Today
              </Button>
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <Sparkles className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading new arrivals...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="text-red-500 mb-4">⚠️</div>
                <p className="text-muted-foreground">{error}</p>
              </div>
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No New Arrivals</h3>
                <p className="text-muted-foreground">No products have been added in the last 15 days.</p>
              </div>
            </div>
          ) : (
            <div
              className={`grid gap-6 ${
                viewMode === "grid"
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-1"
              }`}
            >
              {sortedProducts.map((product) => (
                <div key={product.id} className="relative">
                  <ProductCard 
                    id={product.id}
                    name={product.name}
                    description={product.description}
                    price={product.price}
                    stock_quantity={product.stock_quantity}
                    brand={product.brand}
                    colors={typeof product.colors === 'string' ? product.colors.split(' ') : product.colors}
                    sizes={typeof product.sizes === 'string' ? product.sizes.split(' ') : product.sizes}
                    images={Array.isArray(product.images) ? product.images : []}
                    category_name={product.category_name}
                    category_id={product.category_id}
                    is_featured={product.is_featured}
                    is_active={product.is_active}
                    created_at={product.created_at}
                    updated_at={product.updated_at}
                  />
                  {/* New Badge Overlay */}
                  <div className="absolute top-3 left-3 z-10">
                    <Badge className="bg-primary text-primary-foreground shadow-lg">
                      <Sparkles className="h-3 w-3 mr-1" />
                      NEW
                    </Badge>
                  </div>
                  {/* Arrival Date */}
                  <div className="absolute top-3 right-3 z-10">
                    <Badge variant="secondary" className="text-xs shadow-lg">
                      <Clock className="h-3 w-3 mr-1" />
                      {getArrivalDate(product.created_at)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Newsletter Signup */}
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl p-8 border border-border max-w-2xl mx-auto">
              <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-foreground mb-3">
                Never Miss New Arrivals
              </h3>
              <p className="text-muted-foreground mb-6">
                Subscribe to get notified when new products arrive. Be the first
                to shop the latest trends.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 rounded-md border border-border bg-background"
                />
                <Button>Subscribe</Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default NewArrivals;
