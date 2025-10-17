import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Tag, X, Check } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { couponService, formatCouponValue } from '@/services/couponService';

export default function CouponInput() {
  const [couponCode, setCouponCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { totalPrice, appliedCoupon, applyCoupon, removeCoupon } = useCart();
  const { user } = useAuth();

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setError('Please enter a coupon code');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const response = await couponService.validateCoupon({
        code: couponCode.trim().toUpperCase(),
        order_total: totalPrice,
        user_id: user?.id,
      });

      if (response.valid && response.coupon && response.discount_amount !== undefined) {
        applyCoupon({
          id: response.coupon.id,
          code: response.coupon.code,
          type: response.coupon.type,
          value: response.coupon.value,
          discount_amount: response.discount_amount,
          description: response.coupon.description,
        });
        setCouponCode('');
        setError(null);
      } else {
        setError(response.error_message || 'Invalid coupon code');
      }
    } catch (err) {
      console.error('Error validating coupon:', err);
      setError(err instanceof Error ? err.message : 'Failed to validate coupon');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponCode('');
    setError(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyCoupon();
    }
  };

  if (appliedCoupon) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-green-700 bg-green-100">
                  {appliedCoupon.code}
                </Badge>
                <span className="text-sm font-medium text-green-700">
                  -{appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}%` : `KES ${appliedCoupon.value.toLocaleString()}`} off
                </span>
              </div>
              {appliedCoupon.description && (
                <p className="text-xs text-green-600 mt-1">
                  {appliedCoupon.description}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveCoupon}
            className="text-green-700 hover:text-green-800 hover:bg-green-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Tag className="h-4 w-4 text-muted-foreground" />
        <label className="text-sm font-medium">Have a coupon?</label>
      </div>
      
      <div className="flex gap-2">
        <Input
          placeholder="Enter coupon code"
          value={couponCode}
          onChange={(e) => {
            setCouponCode(e.target.value.toUpperCase());
            setError(null);
          }}
          onKeyPress={handleKeyPress}
          className="flex-1"
          disabled={isValidating}
        />
        <Button
          onClick={handleApplyCoupon}
          disabled={isValidating || !couponCode.trim()}
          size="sm"
        >
          {isValidating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Apply'
          )}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <X className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}