import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { ShoppingCart, Check } from "lucide-react";
import { useState } from "react";

interface ProductCardProps {
  id: number;
  image: string;
  name: string;
  price: string;
  originalPrice?: string;
  category: string;
}

export default function ProductCard({
  id,
  image,
  name,
  price,
  originalPrice,
  category,
}: ProductCardProps) {
  const { addItem } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    addItem({
      id,
      name,
      price,
      originalPrice,
      image,
      category,
    });

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <Card className="group overflow-hidden border-border hover:shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1">
      <CardContent className="p-0">
        <div className="aspect-square overflow-hidden bg-muted">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-4 space-y-3">
          <p className="text-xs text-muted uppercase tracking-wider">
            {category}
          </p>
          <h3 className="font-semibold text-lg text-muted-foreground">
            {name}
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-primary">{price}</span>
              {originalPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  {originalPrice}
                </span>
              )}
            </div>
            <Button
              size="icon"
              className={`rounded-full transition-all duration-300 ${
                isAdded
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-primary hover:bg-accent"
              }`}
              onClick={handleAddToCart}
              disabled={isAdded}
            >
              {isAdded ? (
                <Check className="h-4 w-4" />
              ) : (
                <ShoppingCart className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
