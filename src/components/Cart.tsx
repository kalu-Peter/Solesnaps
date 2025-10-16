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
import { useEffect, useState } from "react";
import { fetchDeliveryLocations } from "@/lib/delivery";
import { fetchProductPrices } from "@/lib/products";
import { DeliveryLocation } from "@/types/cart";
import CartItem from "./CartItem";
import { ShoppingBag, ShoppingCart, Trash2, CreditCard } from "lucide-react";

export default function Cart() {
  const {
    items,
    totalItems,
    totalPrice,
    isOpen,
    closeCart,
    clearCart,
    selectedDeliveryLocation,
    setDeliveryLocation,
    shippingCost,
  } = useCart();

  const [deliveryLocations, setDeliveryLocations] = useState<DeliveryLocation[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [currentPrices, setCurrentPrices] = useState<Record<number, number>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);

  useEffect(() => {
    if (isOpen && deliveryLocations.length === 0 && !loadingLocations) {
      setLoadingLocations(true);
      setLocationError(null);
      fetchDeliveryLocations()
        .then((locations) => {
          console.log("Fetched delivery locations:", locations);
          setDeliveryLocations(locations);
        })
        .catch((error) => {
          console.error("Failed to fetch delivery locations:", error);
          setLocationError(`Failed to load delivery locations: ${error.message}`);
        })
        .finally(() => setLoadingLocations(false));
    }
  }, [isOpen, deliveryLocations.length, loadingLocations]);

  // Fetch current prices for cart items
  useEffect(() => {
    if (items.length > 0 && Object.keys(currentPrices).length === 0 && !loadingPrices) {
      setLoadingPrices(true);
      const productIds = items.map(item => item.id);
      
      fetchProductPrices(productIds)
        .then((prices) => {
          console.log("Fetched current prices:", prices);
          setCurrentPrices(prices);
        })
        .catch((error) => {
          console.error("Failed to fetch current prices:", error);
          // Fallback to cart prices if API fails
          const fallbackPrices: Record<number, number> = {};
          items.forEach(item => {
            fallbackPrices[item.id] = item.price;
          });
          setCurrentPrices(fallbackPrices);
        })
        .finally(() => setLoadingPrices(false));
    } else if (items.length === 0) {
      setCurrentPrices({});
    }
  }, [items.length]); // Only depend on items.length to avoid infinite loops

  // Calculate totals using current prices
  const calculateTotalPrice = () => {
    return items.reduce((total, item) => {
      const currentPrice = currentPrices[item.id] || item.price;
      return total + (currentPrice * item.quantity);
    }, 0);
  };

  const calculatedTotalPrice = calculateTotalPrice();

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
                  currentPrice={currentPrices[item.id]}
                  loadingPrice={loadingPrices}
                />
              ))}
            </div>

            {/* Cart Summary */}
            <div className="border-t border-border pt-4 space-y-4">
              {/* Delivery Location Selector */}
              <div>
                <label className="block text-sm font-medium mb-1">Delivery Location</label>
                {loadingLocations ? (
                  <div className="text-xs text-muted-foreground">Loading locations...</div>
                ) : locationError ? (
                  <div className="text-xs text-destructive">{locationError}</div>
                ) : (
                  <select
                    className="w-full border rounded-md px-2 py-1 text-sm"
                    value={selectedDeliveryLocation?.id || ""}
                    onChange={e => {
                      const loc = deliveryLocations.find(l => l.id === Number(e.target.value));
                      if (loc) setDeliveryLocation(loc);
                    }}
                  >
                    <option value="">Select a location...</option>
                    {deliveryLocations.map(loc => (
                      <option key={loc.id} value={loc.id}>
                        {loc.city_name} ({loc.pickup_status === "active" ? "Active" : "Inactive"})
                      </option>
                    ))}
                  </select>
                )}
                {selectedDeliveryLocation && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    <div>Pickup: {selectedDeliveryLocation.pickup_location}</div>
                    <div>Phone: {selectedDeliveryLocation.pickup_phone}</div>
                  </div>
                )}
              </div>
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
                    {loadingPrices ? (
                      <span className="text-muted-foreground">Loading...</span>
                    ) : (
                      `Ksh ${calculatedTotalPrice.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-foreground">
                    {selectedDeliveryLocation
                      ? `Ksh ${Number(shippingCost || 0).toFixed(2)}`
                      : "--"}
                  </span>
                </div>
                {selectedDeliveryLocation && selectedDeliveryLocation.pickup_status !== "active" && (
                  <div className="text-xs text-destructive">This location is not active for delivery.</div>
                )}
              </div>

              <Separator />

              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-foreground">
                  Total
                </span>
                <span className="text-lg font-bold text-primary">
                  {selectedDeliveryLocation ? (
                    loadingPrices ? (
                      <span className="text-muted-foreground">Loading...</span>
                    ) : (
                      `Ksh ${(calculatedTotalPrice + Number(shippingCost || 0)).toFixed(2)}`
                    )
                  ) : (
                    "--"
                  )}
                </span>
              </div>

              {/* Checkout Button */}
              <Button className="w-full" size="lg" disabled={!selectedDeliveryLocation || selectedDeliveryLocation.pickup_status !== "active"}>
                <CreditCard className="h-4 w-4 mr-2" />
                Checkout
              </Button>

              {/* Continue Shopping */}
              <Button variant="outline" className="w-full" onClick={closeCart}>
                Continue Shopping
              </Button>

              {/* No free shipping progress bar, since shipping is based on location */}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
