import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Phone, Truck, CheckCircle, Loader2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { DeliveryLocation } from "@/types/cart";
import { supabaseDb, supabaseAuth, supabase } from "@/lib/supabase";

interface CheckoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  subtotal: number;
  shippingCost: number;
  deliveryLocation: DeliveryLocation;
  cartItems: any[];
  currentPrices: Record<string, number>;
  appliedCoupon?: {
    id: number;
    code: string;
    discount_amount: number;
  };
  couponDiscount: number;
}

type PaymentMethod = "mpesa" | "pay_on_delivery";

interface OrderData {
  user_id: string;
  delivery_location_id: string;
  payment_method: PaymentMethod;
  subtotal_amount: number;
  shipping_amount: number;
  total_amount: number;
  delivery_location: DeliveryLocation;
  order_items: Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
    size?: string | null;
  }>;
}

export default function CheckoutDialog({
  isOpen,
  onClose,
  subtotal,
  shippingCost,
  deliveryLocation,
  cartItems,
  currentPrices,
  appliedCoupon,
  couponDiscount,
}: CheckoutDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mpesa");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const { clearCart } = useCart();
  const { user, token, isAuthenticated } = useAuth();

  const total = subtotal + shippingCost - couponDiscount;

  const createOrder = async () => {
    setIsProcessing(true);
    setOrderError(null);

    if (!user) {
      setOrderError("User not authenticated");
      setIsProcessing(false);
      return;
    }

    try {
      // Get current Supabase user for UUID
      const {
        data: { user: supabaseUser },
      } = await supabaseAuth.getCurrentUser();

      console.log("Current supabase user:", supabaseUser?.id);

      // Check if user exists in public.users table
      let { data: dbUser, error: userError } = await supabase
        ?.from("users")
        .select("id, auth_id")
        .eq("auth_id", supabaseUser?.id)
        .single();

      console.log("Database user lookup:", { dbUser, userError });

      if (userError || !dbUser) {
        console.log("User not found in public.users, creating record...");

        // Create user record in public.users
        const { data: newUser, error: createError } = await supabase
          ?.from("users")
          .insert({
            id: supabaseUser?.id, // Use auth UUID as primary key
            auth_id: supabaseUser?.id,
            email: supabaseUser?.email,
            first_name: supabaseUser?.user_metadata?.first_name || "",
            last_name: supabaseUser?.user_metadata?.last_name || "",
            role: "user",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) {
          console.error("Failed to create user record:", createError);
          throw new Error("Failed to create user record. Please try again.");
        }

        console.log("Created new user record:", newUser);
        dbUser = newUser;
      }

      // Use the UUID from public.users.id (not auth_id)
      const orderData = {
        user_id: dbUser.id,
        delivery_location_id: deliveryLocation.id,
        payment_method: paymentMethod,
        subtotal_amount: subtotal,
        shipping_amount: shippingCost,
        total_amount: total,
        delivery_location: deliveryLocation, // Pass full location for address creation
        order_items: cartItems.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: currentPrices[item.id] || item.price,
          size: item.size || null,
        })),
      };

      const { data: result, error } = await supabaseDb.createOrder(orderData);

      if (error) {
        console.error("Failed to create order:", error);
        console.error("Order data that failed:", orderData);
        throw new Error(
          `Failed to create order: ${error.message || JSON.stringify(error)}`
        );
      }

      console.log("Order created successfully:", result);

      setOrderSuccess(true);
      clearCart(); // Clear the cart after successful order

      // Close dialog after 2 seconds
      setTimeout(() => {
        setOrderSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Order creation failed:", error);
      setOrderError(
        error instanceof Error ? error.message : "Failed to create order"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setOrderError(null);
      setOrderSuccess(false);
      onClose();
    }
  };

  if (orderSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Order Confirmation</DialogTitle>
            <DialogDescription>
              Your order has been successfully placed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold text-center mb-2">
              Order Placed Successfully!
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              Your order has been confirmed and is being processed.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Checkout</DialogTitle>
          <DialogDescription>
            Select your payment method and confirm your order
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <div className="space-y-3">
            <h4 className="font-medium">Order Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>Ksh {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>Ksh {shippingCost.toFixed(2)}</span>
              </div>
              {appliedCoupon && couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({appliedCoupon.code})</span>
                  <span>-Ksh {couponDiscount.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>Ksh {total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="space-y-3">
            <h4 className="font-medium">Delivery Information</h4>
            <div className="text-sm">
              <p className="font-medium">{deliveryLocation.city_name}</p>
              <p className="text-muted-foreground">
                {deliveryLocation.pickup_location}
              </p>
              <p className="text-muted-foreground">
                {deliveryLocation.pickup_phone}
              </p>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <h4 className="font-medium">Payment Method</h4>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(value) =>
                setPaymentMethod(value as PaymentMethod)
              }
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-muted/50">
                <RadioGroupItem value="mpesa" id="mpesa" />
                <Label
                  htmlFor="mpesa"
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <Phone className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="font-medium">M-Pesa</div>
                    <div className="text-xs text-muted-foreground">
                      Pay with M-Pesa mobile money
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-muted/50">
                <RadioGroupItem value="pay_on_delivery" id="pay_on_delivery" />
                <Label
                  htmlFor="pay_on_delivery"
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <Truck className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="font-medium">Pay on Delivery</div>
                    <div className="text-xs text-muted-foreground">
                      Pay cash when your order arrives
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {orderError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{orderError}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button onClick={createOrder} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Place Order
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
