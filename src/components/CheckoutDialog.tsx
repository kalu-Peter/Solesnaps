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
import { supabaseDb } from "@/lib/supabase";

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
  delivery_location_id: string;
  payment_method: PaymentMethod;
  subtotal_amount: number;
  shipping_amount: number;
  coupon_id?: number;
  coupon_code?: string;
  discount_amount: number;
  total_amount: number;
  order_items: Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
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
  const { token, isAuthenticated } = useAuth();

  const total = subtotal + shippingCost - couponDiscount;

  const createOrder = async () => {
    setIsProcessing(true);
    setOrderError(null);

    try {
      // Prepare order data
      const orderData: OrderData = {
        delivery_location_id: deliveryLocation.id,
        payment_method: paymentMethod,
        subtotal_amount: subtotal,
        shipping_amount: shippingCost,
        coupon_id: appliedCoupon?.id,
        coupon_code: appliedCoupon?.code,
        discount_amount: couponDiscount,
        total_amount: total,
        order_items: cartItems.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: currentPrices[item.id] || item.price,
          total_price: (currentPrices[item.id] || item.price) * item.quantity,
        })),
      };

      const { data: result, error } = await supabaseDb.createOrder(orderData);

      if (error) {
        console.error("Failed to create order:", error.message);
        throw new Error("Failed to create order");
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
