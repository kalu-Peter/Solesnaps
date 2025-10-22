import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { CartItem as CartItemType } from "@/types/cart";
import { Minus, Plus, Trash2 } from "lucide-react";

interface CartItemProps {
  item: CartItemType;
  currentPrice?: number;
  loadingPrice?: boolean;
}

export default function CartItem({
  item,
  currentPrice,
  loadingPrice,
}: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();

  const handleQuantityChange = (newQuantity: number) => {
    updateQuantity(item.id, newQuantity);
  };

  // Use current price from API if available, otherwise fallback to cart price
  const displayPrice = currentPrice !== undefined ? currentPrice : item.price;
  const subtotal = displayPrice * item.quantity;

  // Check if price has changed from what's stored in cart
  const priceChanged =
    currentPrice !== undefined && currentPrice !== item.price;

  return (
    <div className="flex gap-4 py-4 border-b border-border last:border-b-0">
      {/* Product Image */}
      <div className="flex-shrink-0">
        <img
          src={item.image}
          alt={item.name}
          className="w-16 h-16 object-cover rounded-md bg-muted"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjEwIiBmaWxsPSIjOTk5IiBkeT0iLjNlbSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SW1hZ2U8L3RleHQ+PC9zdmc+";
          }}
        />
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-foreground truncate">
          {item.name}
        </h4>
        <p className="text-xs text-muted-foreground mt-1">{item.category}</p>

        {/* Size/Color if available */}
        {(item.size || item.color) && (
          <div className="flex gap-2 mt-1">
            {item.size && (
              <span className="text-xs text-muted-foreground">
                Size: {item.size}
              </span>
            )}
            {item.color && (
              <span className="text-xs text-muted-foreground">
                Color: {item.color}
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm font-semibold text-foreground">
            {loadingPrice ? (
              <span className="text-muted-foreground">Loading...</span>
            ) : (
              `Ksh ${subtotal.toFixed(2)}`
            )}
          </span>
          {priceChanged && !loadingPrice && (
            <span className="text-xs text-muted-foreground line-through">
              Ksh {(item.price * item.quantity).toFixed(2)}
            </span>
          )}
          {item.originalPrice && (
            <span className="text-xs text-muted-foreground line-through">
              Ksh {item.originalPrice.toFixed(2)}
            </span>
          )}
          {priceChanged && !loadingPrice && (
            <span className="text-xs text-green-600 dark:text-green-400">
              Price updated
            </span>
          )}
        </div>
      </div>

      {/* Quantity Controls */}
      <div className="flex flex-col items-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={() => removeItem(item.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>

        <div className="flex items-center border border-border rounded-md">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => handleQuantityChange(item.quantity - 1)}
            disabled={item.quantity <= 1}
          >
            <Minus className="h-3 w-3" />
          </Button>

          <span className="px-2 text-sm font-medium min-w-[2rem] text-center">
            {item.quantity}
          </span>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => handleQuantityChange(item.quantity + 1)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
