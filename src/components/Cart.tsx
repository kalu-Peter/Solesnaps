import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import CartItem from "./CartItem";
import { ShoppingBag, ShoppingCart, Trash2, CreditCard } from "lucide-react";

export default function Cart() {
  const { items, totalItems, totalPrice, isOpen, closeCart, clearCart } =
    useCart();

  const isEmpty = items.length === 0;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="w-full sm:w-[400px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping Cart
            {totalItems > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {totalItems} {totalItems === 1 ? "item" : "items"}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        {isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <ShoppingBag className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Your cart is empty
            </h3>
            <p className="text-muted-foreground mb-6 text-sm">
              Looks like you haven't added anything to your cart yet.
            </p>
            <Button onClick={closeCart} className="w-full">
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto py-4">
              {items.map((item) => (
                <CartItem
                  key={`${item.id}-${item.size || "default"}`}
                  item={item}
                />
              ))}
            </div>

            {/* Cart Summary */}
            <div className="border-t border-border pt-4 space-y-4">
              {/* Clear Cart Button */}
              <div className="flex justify-between items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCart}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Cart
                </Button>
              </div>

              <Separator />

              {/* Subtotal */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-foreground">
                    {totalPrice > 50 ? "Free" : "$5.99"}
                  </span>
                </div>
                {totalPrice > 50 && (
                  <div className="text-xs text-green-600 dark:text-green-400">
                    🎉 You qualified for free shipping!
                  </div>
                )}
              </div>

              <Separator />

              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-foreground">
                  Total
                </span>
                <span className="text-lg font-bold text-primary">
                  ${(totalPrice + (totalPrice > 50 ? 0 : 5.99)).toFixed(2)}
                </span>
              </div>

              {/* Checkout Button */}
              <Button className="w-full" size="lg">
                <CreditCard className="h-4 w-4 mr-2" />
                Checkout
              </Button>

              {/* Continue Shopping */}
              <Button variant="outline" className="w-full" onClick={closeCart}>
                Continue Shopping
              </Button>

              {/* Free Shipping Progress */}
              {totalPrice < 50 && (
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-2">
                    Add ${(50 - totalPrice).toFixed(2)} more for free shipping
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min((totalPrice / 50) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
