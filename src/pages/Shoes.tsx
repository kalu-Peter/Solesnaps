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
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const Shoes = () => {
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sizeFormat, setSizeFormat] = useState<"US" | "UK">("US");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

  const shoes = [
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

export default Shoes;
