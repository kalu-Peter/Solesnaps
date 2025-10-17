import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tag, Copy, Check, Gift } from 'lucide-react';
import { couponService, Coupon, formatCouponValue, isCouponActive } from '@/services/couponService';

interface PublicCouponsProps {
  className?: string;
  maxDisplay?: number;
  onCouponCopy?: (code: string) => void;
}

export default function PublicCoupons({ 
  className = '', 
  maxDisplay = 3,
  onCouponCopy 
}: PublicCouponsProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveCoupons();
  }, []);

  const fetchActiveCoupons = async () => {
    try {
      setLoading(true);
      const response = await couponService.getActiveCoupons();
      const activeCoupons = response.data.coupons
        .filter(coupon => isCouponActive(coupon))
        .slice(0, maxDisplay);
      setCoupons(activeCoupons);
    } catch (err) {
      console.error('Failed to fetch active coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      onCouponCopy?.(code);
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy coupon code:', err);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Available Offers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(maxDisplay)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (coupons.length === 0) {
    return null; // Don't show the component if no active coupons
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          Available Offers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {coupons.map((coupon) => (
            <div 
              key={coupon.id}
              className="flex items-center justify-between p-3 border border-dashed border-primary/30 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="font-mono">
                    {coupon.code}
                  </Badge>
                  <span className="font-semibold text-primary">
                    {formatCouponValue(coupon)} OFF
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {coupon.description}
                </p>
                {coupon.minimum_order_amount && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum order: KES {coupon.minimum_order_amount.toLocaleString()}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyCode(coupon.code)}
                className="flex items-center gap-2"
              >
                {copiedCode === coupon.code ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
        
        {coupons.length > 0 && (
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              🎉 Apply these codes at checkout to save money!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}