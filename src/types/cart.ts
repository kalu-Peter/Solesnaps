
export interface CartItem {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  quantity: number;
  size?: string;
  color?: string;
}

export interface DeliveryLocation {
  id: number;
  city_name: string;
  shopping_amount: number;
  pickup_location: string;
  pickup_phone: string;
  pickup_status: string;
}

export interface AppliedCoupon {
  id: number;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  discount_amount: number;
  description: string;
}

export interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  appliedCoupon?: AppliedCoupon;
  couponDiscount: number;
  finalTotal: number;
  isOpen: boolean;
  selectedDeliveryLocation?: DeliveryLocation;
  setDeliveryLocation: (location: DeliveryLocation) => void;
  shippingCost: number;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  applyCoupon: (coupon: AppliedCoupon) => void;
  removeCoupon: () => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}