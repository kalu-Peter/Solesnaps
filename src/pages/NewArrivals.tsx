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
import shoe1 from "@/assets/shoe-1.jpg";
import shoe2 from "@/assets/shoe-2.jpg";
import headphones from "@/assets/headphones.jpg";
import smartwatch from "@/assets/smartwatch.jpg";
import { Sparkles, Clock, Grid, List, Star } from "lucide-react";
import { useState } from "react";

const NewArrivals = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const newProducts = [
    {
      id: 301,
      name: "Ultra Boost 2025",
      price: "$199.99",
      category: "Shoes",
      image: shoe1,
      isNew: true,
      arrivalDate: "3 days ago",
    },
    {
      id: 302,
      name: "AirPods Pro Max",
      price: "$449.99",
      category: "Electronics",
      image: headphones,
      isNew: true,
      arrivalDate: "1 week ago",
    },
    {
      id: 303,
      name: "Galaxy Watch Ultra",
      price: "$389.99",
      category: "Electronics",
      image: smartwatch,
      isNew: true,
      arrivalDate: "2 days ago",
    },
    {
      id: 304,
      name: "Street Elite Pro",
      price: "$169.99",
      category: "Shoes",
      image: shoe2,
      isNew: true,
      arrivalDate: "5 days ago",
    },
    {
      id: 305,
      name: "Studio Reference",
      price: "$299.99",
      category: "Electronics",
      image: headphones,
      isNew: true,
      arrivalDate: "1 week ago",
    },
    {
      id: 306,
      name: "Performance Runner X",
      price: "$189.99",
      category: "Shoes",
      image: shoe1,
      isNew: true,
      arrivalDate: "4 days ago",
    },
  ];

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
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-8 p-4 bg-[hsl(var(--sidebar-background))] rounded-lg border border-border">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Showing {newProducts.length} new products
              </span>
              <Badge variant="outline" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                Fresh Stock
              </Badge>
            </div>

            <div className="flex items-center gap-4">
              <Select defaultValue="newest">
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

          {/* Category Filters */}
          <div className="flex flex-wrap gap-3 mb-8 justify-center">
            <Button variant="default" size="sm">
              All Categories
            </Button>
            <Button variant="outline" size="sm">
              Shoes
            </Button>
            <Button variant="outline" size="sm">
              Electronics
            </Button>
            <Button variant="outline" size="sm">
              This Week
            </Button>
            <Button variant="outline" size="sm">
              Today
            </Button>
          </div>

          {/* Products Grid */}
          <div
            className={`grid gap-6 ${
              viewMode === "grid"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1"
            }`}
          >
            {newProducts.map((product) => (
              <div key={product.id} className="relative">
                <ProductCard {...product} />
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
                    {product.arrivalDate}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

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
