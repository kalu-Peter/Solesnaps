import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import heroBanner from "@/assets/hero-banner.jpg";
import shoe1 from "@/assets/shoe-1.jpg";
import shoe2 from "@/assets/shoe-2.jpg";
import headphones from "@/assets/headphones.jpg";
import smartwatch from "@/assets/smartwatch.jpg";
import { ArrowRight, Package, Shield, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { productService, Product } from "@/services/productService";

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleGenderFilter = (gender: string) => {
    navigate(`/shoes?gender=${gender}`);
  };

  // Fallback products for when API is not available
  const fallbackProducts = [
    { id: 1, name: "Sport Runner Pro", price: "$89.99", category: "Shoes", image: shoe1 },
    { id: 2, name: "Urban Classic", price: "$79.99", category: "Shoes", image: shoe2 },
  ];

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
            sort_by: 'created_at', 
            sort_order: 'desc' 
          });
          setProducts(allProductsResponse.data.products);
        } else {
          setProducts(response.data.products);
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError('Failed to load products');
        // Use fallback products when API is not available
        setProducts(fallbackProducts as any);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative h-[500px] md:h-[600px] overflow-hidden">
        <div className="absolute inset-0 bg-[var(--gradient-hero)]" />
        <img 
          src={heroBanner} 
          alt="Shop Banner" 
          className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-90"
        />
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-center items-start text-left">
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 max-w-2xl">
            Step Into <span className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] bg-clip-text text-transparent">Style & Tech</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl">
            Discover the perfect blend of fashion and technology. Quality products at unbeatable prices.
          </p>
          <Button size="lg" className="bg-primary hover:bg-accent text-white group">
            Shop Now
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Free Shipping</h3>
                <p className="text-sm text-muted-foreground">On orders over $50</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Secure Payment</h3>
                <p className="text-sm text-muted-foreground">100% protected</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Easy Returns</h3>
                <p className="text-sm text-muted-foreground">30-day guarantee</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Featured Products
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore our curated selection of premium products
            </p>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-80 bg-muted animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : error && products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Unable to load products. Please try again later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Shop by Gender */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Shop by Gender
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Find the perfect shoes designed specifically for you
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Male Shoes */}
            <div 
              className="group relative h-80 overflow-hidden rounded-2xl shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-all duration-300 cursor-pointer"
              onClick={() => handleGenderFilter('male')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-blue-800/90" />
              <img src={shoe1} alt="Men's Shoes" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60" />
              <div className="relative h-full flex flex-col items-center justify-center text-white p-8">
                <div className="text-5xl mb-4">👨</div>
                <h3 className="text-3xl font-bold mb-2">Men's</h3>
                <p className="text-white/90 mb-6 text-center">Strong & Stylish</p>
                <Button variant="secondary" size="lg" className="group-hover:scale-105 transition-transform">
                  Shop Men's
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Female Shoes */}
            <div 
              className="group relative h-80 overflow-hidden rounded-2xl shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-all duration-300 cursor-pointer"
              onClick={() => handleGenderFilter('female')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/90 to-purple-600/90" />
              <img src={shoe2} alt="Women's Shoes" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60" />
              <div className="relative h-full flex flex-col items-center justify-center text-white p-8">
                <div className="text-5xl mb-4">👩</div>
                <h3 className="text-3xl font-bold mb-2">Women's</h3>
                <p className="text-white/90 mb-6 text-center">Elegant & Chic</p>
                <Button variant="secondary" size="lg" className="group-hover:scale-105 transition-transform">
                  Shop Women's
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Unisex Shoes */}
            <div 
              className="group relative h-80 overflow-hidden rounded-2xl shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-all duration-300 cursor-pointer"
              onClick={() => handleGenderFilter('unisex')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/90 to-teal-600/90" />
              <img src={shoe1} alt="Unisex Shoes" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60" />
              <div className="relative h-full flex flex-col items-center justify-center text-white p-8">
                <div className="text-5xl mb-4">👫</div>
                <h3 className="text-3xl font-bold mb-2">Unisex</h3>
                <p className="text-white/90 mb-6 text-center">For Everyone</p>
                <Button variant="secondary" size="lg" className="group-hover:scale-105 transition-transform">
                  Shop Unisex
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4 text-foreground">TechStyle</h3>
              <p className="text-sm text-muted-foreground">
                Your one-stop shop for premium shoes and footwear.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Shop</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Shoes</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">New Arrivals</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Sale</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">FAQs</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Shipping</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Returns</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          
          <Separator className="my-8" />
          
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2025 TechStyle. All rights reserved.</p>
          </div>
        </div>
      </footer>
      </div>
  );
};

export default Index;
