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
import { Progress } from "@/components/ui/progress";
import shoe1 from "@/assets/shoe-1.jpg";
import shoe2 from "@/assets/shoe-2.jpg";
import headphones from "@/assets/headphones.jpg";
import smartwatch from "@/assets/smartwatch.jpg";
import { Percent, Flame, Timer, Grid, List, Tag } from "lucide-react";
import { useState, useEffect } from "react";

const Sale = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 14,
    minutes: 32,
    seconds: 45,
  });

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return {
            ...prev,
            days: prev.days - 1,
            hours: 23,
            minutes: 59,
            seconds: 59,
          };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const saleProducts = [
    {
      id: 401,
      name: "Sport Runner Pro",
      price: "$89.99",
      originalPrice: "$129.99",
      discount: "31%",
      category: "Shoes",
      image: shoe1,
      stock: 15,
    },
    {
      id: 402,
      name: "Premium Headphones",
      price: "$99.99",
      originalPrice: "$159.99",
      discount: "38%",
      category: "Electronics",
      image: headphones,
      stock: 8,
    },
    {
      id: 403,
      name: "Smart Watch Pro",
      price: "$199.99",
      originalPrice: "$299.99",
      discount: "33%",
      category: "Electronics",
      image: smartwatch,
      stock: 12,
    },
    {
      id: 404,
      name: "Urban Classic",
      price: "$59.99",
      originalPrice: "$89.99",
      discount: "33%",
      category: "Shoes",
      image: shoe2,
      stock: 22,
    },
    {
      id: 405,
      name: "Gaming Headset",
      price: "$79.99",
      originalPrice: "$119.99",
      discount: "33%",
      category: "Electronics",
      image: headphones,
      stock: 6,
    },
    {
      id: 406,
      name: "Trail Runner",
      price: "$109.99",
      originalPrice: "$159.99",
      discount: "31%",
      category: "Shoes",
      image: shoe1,
      stock: 18,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Page Header with Countdown */}
      <section className="py-16 bg-gradient-to-r from-red-500/10 via-orange-500/5 to-yellow-500/10">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Flame className="h-8 w-8 text-red-500 animate-pulse" />
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                Flash Sale
              </h1>
              <Percent className="h-8 w-8 text-orange-500" />
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Don't miss out on incredible deals! Limited time offers on premium
              shoes and electronics.
            </p>

            {/* Countdown Timer */}
            <div className="bg-card rounded-2xl border border-border p-6 max-w-md mx-auto shadow-lg">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Timer className="h-5 w-5 text-red-500" />
                <span className="font-semibold text-foreground">
                  Sale Ends In:
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-primary/10 rounded-lg p-3">
                  <div className="text-2xl font-bold text-foreground">
                    {timeLeft.days}
                  </div>
                  <div className="text-xs text-muted-foreground">Days</div>
                </div>
                <div className="bg-primary/10 rounded-lg p-3">
                  <div className="text-2xl font-bold text-foreground">
                    {timeLeft.hours}
                  </div>
                  <div className="text-xs text-muted-foreground">Hours</div>
                </div>
                <div className="bg-primary/10 rounded-lg p-3">
                  <div className="text-2xl font-bold text-foreground">
                    {timeLeft.minutes}
                  </div>
                  <div className="text-xs text-muted-foreground">Mins</div>
                </div>
                <div className="bg-primary/10 rounded-lg p-3">
                  <div className="text-2xl font-bold text-foreground">
                    {timeLeft.seconds}
                  </div>
                  <div className="text-xs text-muted-foreground">Secs</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sale Stats */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-lg p-6 text-center border border-border">
              <Percent className="h-8 w-8 text-red-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-foreground mb-1">
                Up to 40% OFF
              </div>
              <div className="text-sm text-muted-foreground">
                Maximum Savings
              </div>
            </div>
            <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-lg p-6 text-center border border-border">
              <Tag className="h-8 w-8 text-orange-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-foreground mb-1">
                100+ Items
              </div>
              <div className="text-sm text-muted-foreground">On Sale Now</div>
            </div>
            <div className="bg-gradient-to-r from-yellow-500/10 to-red-500/10 rounded-lg p-6 text-center border border-border">
              <Flame className="h-8 w-8 text-yellow-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-foreground mb-1">
                Limited Stock
              </div>
              <div className="text-sm text-muted-foreground">Act Fast!</div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-8 p-4 bg-card rounded-lg border border-border">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Showing {saleProducts.length} sale items
              </span>
              <Badge variant="destructive" className="text-xs animate-pulse">
                <Flame className="h-3 w-3 mr-1" />
                Hot Deals
              </Badge>
            </div>

            <div className="flex items-center gap-4">
              <Select defaultValue="discount">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discount">Highest Discount</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="stock">Stock Level</SelectItem>
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
              30%+ Off
            </Button>
            <Button variant="outline" size="sm">
              Low Stock
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
            {saleProducts.map((product) => (
              <div key={product.id} className="relative">
                <ProductCard {...product} />

                {/* Discount Badge */}
                <div className="absolute top-3 left-3 z-10">
                  <Badge className="bg-red-500 text-white shadow-lg animate-pulse">
                    -{product.discount}
                  </Badge>
                </div>

                {/* Original Price Overlay */}
                <div className="absolute top-3 right-3 z-10">
                  <div className="bg-background/90 backdrop-blur rounded-md px-2 py-1 border border-border">
                    <div className="text-xs text-muted-foreground line-through">
                      {product.originalPrice}
                    </div>
                  </div>
                </div>

                {/* Stock Level */}
                <div className="absolute bottom-3 left-3 right-3 z-10">
                  <div className="bg-background/90 backdrop-blur rounded-md p-2 border border-border">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Stock:</span>
                      <span
                        className={`font-medium ${
                          product.stock < 10 ? "text-red-500" : "text-green-500"
                        }`}
                      >
                        {product.stock} left
                      </span>
                    </div>
                    <Progress
                      value={(product.stock / 25) * 100}
                      className="h-1"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sale Banner */}
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-r from-red-500/10 via-orange-500/5 to-yellow-500/10 rounded-2xl p-8 border border-border max-w-4xl mx-auto">
              <Flame className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-3xl font-bold text-foreground mb-3">
                Don't Miss Out!
              </h3>
              <p className="text-muted-foreground mb-6 text-lg">
                These amazing deals won't last long. Shop now and save big on
                premium products.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  <Flame className="h-5 w-5 mr-2" />
                  Shop All Sale Items
                </Button>
                <Button variant="outline" size="lg">
                  <Timer className="h-5 w-5 mr-2" />
                  Set Sale Alert
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Sale;
