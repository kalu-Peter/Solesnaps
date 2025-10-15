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
import headphones from "@/assets/headphones.jpg";
import smartwatch from "@/assets/smartwatch.jpg";
import { Filter, Grid, List, Zap } from "lucide-react";
import { useState } from "react";

const Electronics = () => {
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const electronics = [
    {
      id: 101,
      name: "Premium Headphones",
      price: "$159.99",
      category: "Electronics",
      image: headphones,
    },
    {
      id: 102,
      name: "Smart Watch Pro",
      price: "$299.99",
      category: "Electronics",
      image: smartwatch,
    },
    {
      id: 103,
      name: "Wireless Earbuds",
      price: "$89.99",
      category: "Electronics",
      image: headphones,
    },
    {
      id: 104,
      name: "Fitness Tracker",
      price: "$149.99",
      category: "Electronics",
      image: smartwatch,
    },
    {
      id: 105,
      name: "Gaming Headset",
      price: "$199.99",
      category: "Electronics",
      image: headphones,
    },
    {
      id: 106,
      name: "Smart Band",
      price: "$79.99",
      category: "Electronics",
      image: smartwatch,
    },
    {
      id: 107,
      name: "Studio Monitors",
      price: "$349.99",
      category: "Electronics",
      image: headphones,
    },
    {
      id: 108,
      name: "Activity Watch",
      price: "$229.99",
      category: "Electronics",
      image: smartwatch,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Page Header */}
      <section className="py-16 bg-gradient-to-r from-accent/5 to-primary/5">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="h-8 w-8 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Premium Electronics
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Discover cutting-edge technology that enhances your lifestyle. From
            audio gear to wearables, we have it all.
          </p>
        </div>
      </section>

      {/* Filters and Products */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-[hsl(var(--sidebar-background))] rounded-lg border border-border p-6 sticky top-24">
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
                      <SelectItem value="all">All Electronics</SelectItem>
                      <SelectItem value="audio">Audio</SelectItem>
                      <SelectItem value="wearables">Wearables</SelectItem>
                      <SelectItem value="gaming">Gaming</SelectItem>
                      <SelectItem value="accessories">Accessories</SelectItem>
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
                      max={500}
                      min={0}
                      step={10}
                      className="mb-3"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>${priceRange[0]}</span>
                      <span>${priceRange[1]}</span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="mb-6">
                  <h4 className="font-medium text-foreground mb-3">Features</h4>
                  <div className="space-y-2">
                    {[
                      "Wireless",
                      "Noise Cancelling",
                      "Water Resistant",
                      "Fast Charging",
                    ].map((feature) => (
                      <div
                        key={feature}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          id={feature}
                          className="rounded border-border"
                        />
                        <label
                          htmlFor={feature}
                          className="text-sm text-foreground"
                        >
                          {feature}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Brand */}
                <div className="mb-6">
                  <h4 className="font-medium text-foreground mb-3">Brand</h4>
                  <Select defaultValue="all">
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Brands</SelectItem>
                      <SelectItem value="apple">Apple</SelectItem>
                      <SelectItem value="samsung">Samsung</SelectItem>
                      <SelectItem value="sony">Sony</SelectItem>
                      <SelectItem value="bose">Bose</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Rating */}
                <div className="mb-6">
                  <h4 className="font-medium text-foreground mb-3">Rating</h4>
                  <div className="space-y-2">
                    {[5, 4, 3].map((rating) => (
                      <div key={rating} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`rating-${rating}`}
                          className="rounded border-border"
                        />
                        <label
                          htmlFor={`rating-${rating}`}
                          className="text-sm text-foreground flex items-center"
                        >
                          {rating}+ ⭐
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Products Section */}
            <div className="flex-1">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-6 p-4 bg-[hsl(var(--sidebar-background))] rounded-lg border border-border">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    Showing {electronics.length} products
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
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
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

              {/* Featured Banner */}
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-6 mb-8 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Tech Innovation Sale
                    </h3>
                    <p className="text-muted-foreground">
                      Up to 30% off on premium electronics
                    </p>
                  </div>
                  <Button>Shop Sale</Button>
                </div>
              </div>

              {/* Products Grid */}
              <div
                className={`grid gap-6 ${
                  viewMode === "grid"
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                    : "grid-cols-1"
                }`}
              >
                {electronics.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>

              {/* Load More */}
              <div className="text-center mt-12">
                <Button variant="outline" size="lg">
                  Load More Products
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Electronics;
